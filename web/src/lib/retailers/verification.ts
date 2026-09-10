import { StoreOffer, VerificationStatus } from './types';

export function verifyOfferStatus(offer: StoreOffer): {
  verificationStatus: VerificationStatus;
  staleVerification: boolean;
  priceVerifiedAt: string;
  sellerVerified: boolean;
} {
  const checkedAtTime = new Date(offer.checkedAt).getTime();
  const now = Date.now();
  const ageInHours = (now - checkedAtTime) / (1000 * 60 * 60);

  const priceVerifiedAt = offer.checkedAt || new Date().toISOString();

  if (offer.sourceType === 'mock') {
    return {
      verificationStatus: 'unverified',
      staleVerification: false,
      priceVerifiedAt,
      sellerVerified: false,
    };
  }

  if (offer.sourceType === 'api' || offer.sourceType === 'affiliate') {
    if (ageInHours <= 24) {
      return {
        verificationStatus: 'verified_live',
        staleVerification: false,
        priceVerifiedAt,
        sellerVerified: true,
      };
    } else {
      return {
        verificationStatus: 'verification_stale',
        staleVerification: true,
        priceVerifiedAt,
        sellerVerified: true,
      };
    }
  }

  return {
    verificationStatus: 'unverified',
    staleVerification: false,
    priceVerifiedAt,
    sellerVerified: false,
  };
}
