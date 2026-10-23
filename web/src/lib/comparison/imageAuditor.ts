import { StoreOffer } from '../retailers/types';

export interface ImageAuditFinding {
  imageUrl: string;
  affectedOfferIds: string[];
  productTitles: string[];
  brands: string[];
  isLegitimateVariant: boolean;
  actionTaken: 'KEPT_LEGITIMATE_VARIANT' | 'FLAGGED_AND_ISOLATED';
}

export interface ImageAuditReport {
  totalOffersAudited: number;
  duplicateImageCount: number;
  findings: ImageAuditFinding[];
}

/**
 * Audits a collection of StoreOffers for duplicate image URLs across DIFFERENT products.
 * While color/size variants of the SAME product may legitimately share an image,
 * distinct products (e.g. Puma Flyer Runner vs Asian Wonder-13) MUST NEVER share an image.
 */
export function auditAndIsolateDuplicateImages(offers: StoreOffer[]): {
  sanitizedOffers: StoreOffer[];
  report: ImageAuditReport;
} {
  const imageToOffersMap = new Map<string, StoreOffer[]>();

  // Group offers by non-empty imageUrl
  offers.forEach((offer) => {
    if (offer.imageUrl && offer.imageUrl.trim() !== '') {
      const cleanUrl = offer.imageUrl.trim();
      const existing = imageToOffersMap.get(cleanUrl) || [];
      existing.push(offer);
      imageToOffersMap.set(cleanUrl, existing);
    }
  });

  const findings: ImageAuditFinding[] = [];
  const sanitizedOffers: StoreOffer[] = [...offers];

  imageToOffersMap.forEach((matchedOffers, url) => {
    if (matchedOffers.length > 1) {
      // Check if these offers represent the same brand & model (legitimate shared variant image)
      const uniqueBrands = new Set(
        matchedOffers.map((o) => (o.brand || o.title.split(' ')[0] || '').toLowerCase())
      );

      const isLegitimateVariant = uniqueBrands.size === 1;

      if (!isLegitimateVariant) {
        // DEFECT DETECTED: Unrelated products sharing identical image URL!
        findings.push({
          imageUrl: url,
          affectedOfferIds: matchedOffers.map((o) => o.id),
          productTitles: matchedOffers.map((o) => o.title),
          brands: Array.from(uniqueBrands),
          isLegitimateVariant: false,
          actionTaken: 'FLAGGED_AND_ISOLATED',
        });

        // Keep image on first offer only; replace subsequent unrelated offers with neutral placeholder
        matchedOffers.slice(1).forEach((duplicateOffer) => {
          const idx = sanitizedOffers.findIndex((o) => o.id === duplicateOffer.id);
          if (idx >= 0) {
            sanitizedOffers[idx] = {
              ...sanitizedOffers[idx],
              imageUrl: undefined, // Neutralized to prevent fraudulent presentation
              imageProvenance: {
                url: '',
                isGenuineProductImage: false,
                isFallback: true,
                safeHash: 'neutral_placeholder_isolated',
              },
            };
          }
        });
      } else {
        findings.push({
          imageUrl: url,
          affectedOfferIds: matchedOffers.map((o) => o.id),
          productTitles: matchedOffers.map((o) => o.title),
          brands: Array.from(uniqueBrands),
          isLegitimateVariant: true,
          actionTaken: 'KEPT_LEGITIMATE_VARIANT',
        });
      }
    }
  });

  return {
    sanitizedOffers,
    report: {
      totalOffersAudited: offers.length,
      duplicateImageCount: findings.filter((f) => !f.isLegitimateVariant).length,
      findings,
    },
  };
}
