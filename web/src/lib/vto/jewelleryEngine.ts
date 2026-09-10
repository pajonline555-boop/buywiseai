import { JewelleryAnchorType, VtoLandmarks, VtoPoint2D } from './types';

export interface JewelleryAnchorResult {
  anchorType: JewelleryAnchorType;
  primaryAnchor: VtoPoint2D;
  secondaryAnchor?: VtoPoint2D;
  rotationDegrees: number;
  scaleFactor: number;
  positionDescription: string;
}

export function calculateJewelleryAnchors(
  title: string,
  landmarks?: VtoLandmarks
): JewelleryAnchorResult {
  const lowerTitle = title.toLowerCase();

  let anchorType: JewelleryAnchorType = "necklace";
  if (lowerTitle.includes("earring") || lowerTitle.includes("jhumka") || lowerTitle.includes("stud")) {
    anchorType = "earrings";
  } else if (lowerTitle.includes("tikka") || lowerTitle.includes("matha") || lowerTitle.includes("head")) {
    anchorType = "maang_tikka";
  } else if (lowerTitle.includes("bangle") || lowerTitle.includes("bracelet") || lowerTitle.includes("kada")) {
    anchorType = "bangles";
  } else if (lowerTitle.includes("nose") || lowerTitle.includes("nath")) {
    anchorType = "nose_ring";
  } else if (lowerTitle.includes("ring") && !lowerTitle.includes("earring")) {
    anchorType = "ring";
  }

  const primaryAnchor = landmarks?.neckBase || { x: 50, y: 32 };
  const secondaryAnchor = landmarks?.chinBottom || { x: 50, y: 29 };

  switch (anchorType) {
    case "earrings":
      return {
        anchorType,
        primaryAnchor: landmarks?.leftEar || { x: 42, y: 22 },
        secondaryAnchor: landmarks?.rightEar || { x: 58, y: 22 },
        rotationDegrees: 0,
        scaleFactor: 1.0,
        positionDescription: "Anchored to left and right earlobe anatomy."
      };

    case "maang_tikka":
      return {
        anchorType,
        primaryAnchor: landmarks?.foreheadCenter || { x: 50, y: 14 },
        secondaryAnchor: landmarks?.noseTip || { x: 50, y: 23 },
        rotationDegrees: 0,
        scaleFactor: 0.9,
        positionDescription: "Anchored to forehead centerline and hair parting."
      };

    case "nose_ring":
      return {
        anchorType,
        primaryAnchor: landmarks?.noseTip || { x: 48, y: 24 },
        rotationDegrees: -5,
        scaleFactor: 0.8,
        positionDescription: "Anchored to left nostril anatomy."
      };

    case "bangles":
      return {
        anchorType,
        primaryAnchor: landmarks?.leftWrist || { x: 28, y: 62 },
        secondaryAnchor: landmarks?.rightWrist || { x: 72, y: 62 },
        rotationDegrees: 15,
        scaleFactor: 1.0,
        positionDescription: "Anchored around wrist circumference."
      };

    default:
      return {
        anchorType: "necklace",
        primaryAnchor,
        secondaryAnchor,
        rotationDegrees: 0,
        scaleFactor: 1.1,
        positionDescription: "Anchored around collarbone and neck base curve."
      };
  }
}
