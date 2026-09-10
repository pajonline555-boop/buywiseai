import { VisionProductAnalysis, VisualProfile } from './types';

export function combineMultiAngleAnalyses(analyses: VisionProductAnalysis[]): VisionProductAnalysis {
  if (!analyses || analyses.length === 0) {
    throw new Error('At least one VisionProductAnalysis is required for multi-angle combination.');
  }

  if (analyses.length === 1) {
    return analyses[0];
  }

  // Find primary analysis with highest brand/model confidence
  const sortedByConfidence = [...analyses].sort((a, b) => {
    const confA = (a.confidence?.brand || 0) + (a.confidence?.model || 0) + (a.confidence?.overall || 0);
    const confB = (b.confidence?.brand || 0) + (b.confidence?.model || 0) + (b.confidence?.overall || 0);
    return confB - confA;
  });

  const primary = sortedByConfidence[0];

  // Helper deduplicators
  const mergeArrays = (fn: (a: VisionProductAnalysis) => string[] | undefined): string[] => {
    const set = new Set<string>();
    analyses.forEach((a) => {
      const arr = fn(a);
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (typeof item === 'string' && item.trim()) {
            set.add(item.trim());
          }
        });
      }
    });
    return Array.from(set);
  };

  const colors = mergeArrays((a) => a.colors);
  const materials = mergeArrays((a) => a.materials);
  const styles = mergeArrays((a) => a.styles);
  const visibleFeatures = mergeArrays((a) => a.visibleFeatures);
  const visibleText = mergeArrays((a) => a.visibleText);
  const searchQueries = mergeArrays((a) => a.searchQueries);

  // Merge Visual Profiles
  const colorPalette = mergeArrays((a) => a.visualProfile?.colorPalette);
  const dominantColors = mergeArrays((a) => a.visualProfile?.dominantColors);
  const designElements = mergeArrays((a) => a.visualProfile?.designElements);
  const distinctiveFeatures = mergeArrays((a) => a.visualProfile?.distinctiveFeatures);

  const visualProfile: VisualProfile = {
    silhouette: primary.visualProfile?.silhouette || analyses.find((a) => a.visualProfile?.silhouette)?.visualProfile?.silhouette || null,
    shape: primary.visualProfile?.shape || analyses.find((a) => a.visualProfile?.shape)?.visualProfile?.shape || null,
    pattern: primary.visualProfile?.pattern || analyses.find((a) => a.visualProfile?.pattern)?.visualProfile?.pattern || null,
    texture: primary.visualProfile?.texture || analyses.find((a) => a.visualProfile?.texture)?.visualProfile?.texture || null,
    colorPalette: colorPalette.length > 0 ? colorPalette : primary.colors,
    dominantColors: dominantColors.length > 0 ? dominantColors : primary.colors.slice(0, 2),
    designElements,
    logoPlacement: primary.visualProfile?.logoPlacement || analyses.find((a) => a.visualProfile?.logoPlacement)?.visualProfile?.logoPlacement || null,
    distinctiveFeatures,
  };

  // Combined Confidence
  const overallConf = Math.min(
    0.98,
    parseFloat(
      (
        analyses.reduce((acc, curr) => acc + (curr.confidence?.overall || 0.8), 0) / analyses.length +
        0.05
      ).toFixed(2)
    )
  );

  return {
    category: primary.category,
    subcategory: primary.subcategory,
    brand: primary.brand,
    model: primary.model,
    productName: primary.productName || `${primary.brand || ''} ${primary.subcategory || primary.category || ''}`.trim(),
    gender: primary.gender,
    colors,
    materials,
    styles,
    visibleFeatures,
    visualProfile,
    observedAttributes: Object.assign({}, ...analyses.map((a) => a.observedAttributes || {})),
    inferredAttributes: Object.assign({}, ...analyses.map((a) => a.inferredAttributes || {})),
    visibleText,
    confidence: {
      category: primary.confidence?.category || 0.9,
      brand: primary.confidence?.brand || null,
      model: primary.confidence?.model || null,
      overall: overallConf,
    },
    searchQueries: searchQueries.length > 0 ? searchQueries : primary.searchQueries,
  };
}
