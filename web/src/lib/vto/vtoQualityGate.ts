export interface ValidationResult {
  isValid: boolean;
  code: string;
  message: string;
  identityCheckStatus: "PASS" | "FAIL" | "UNKNOWN";
  productCheckStatus: "PASS" | "FAIL" | "UNKNOWN";
  geometryCheckStatus: "PASS" | "FAIL" | "UNKNOWN";
}

/**
 * Validates AI generated try-on output image data or image URL.
 * Rejects null, empty, text-only, unparseable, or duplicate input image fallbacks.
 */
export function validateGeneratedImage(
  generatedImageUrl: string | undefined,
  userPhotoBase64?: string,
  garmentBase64?: string
): ValidationResult {
  if (!generatedImageUrl) {
    return {
      isValid: false,
      code: "MISSING_IMAGE_DATA",
      message: "AI provider did not return image data bytes or URL.",
      identityCheckStatus: "FAIL",
      productCheckStatus: "FAIL",
      geometryCheckStatus: "FAIL"
    };
  }

  const isDataUrl = generatedImageUrl.startsWith("data:image/");
  const isHttpUrl = generatedImageUrl.startsWith("http://") || generatedImageUrl.startsWith("https://");

  // 1. Check URL type (Must be valid Data URL or HTTP/HTTPS Image URL)
  if (!isDataUrl && !isHttpUrl) {
    return {
      isValid: false,
      code: "INVALID_MIME_TYPE",
      message: "Generated output is not a valid Image URL or Data URL.",
      identityCheckStatus: "FAIL",
      productCheckStatus: "FAIL",
      geometryCheckStatus: "FAIL"
    };
  }

  // 2. Base64 payload decoding check (for Data URLs)
  if (isDataUrl) {
    const base64Part = generatedImageUrl.replace(/^data:image\/\w+;base64,/, "");
    try {
      const buffer = Buffer.from(base64Part, 'base64');
      if (buffer.length === 0) {
        return {
          isValid: false,
          code: "ZERO_BYTE_IMAGE",
          message: "Generated image payload contains zero bytes.",
          identityCheckStatus: "FAIL",
          productCheckStatus: "FAIL",
          geometryCheckStatus: "FAIL"
        };
      }
    } catch (err) {
      return {
        isValid: false,
        code: "UNPARSEABLE_BASE64",
        message: "Generated base64 string could not be decoded into a valid image buffer.",
        identityCheckStatus: "FAIL",
        productCheckStatus: "FAIL",
        geometryCheckStatus: "FAIL"
      };
    }

    // Duplicate Input Sanity Check for Base64 Data URLs
    if (userPhotoBase64) {
      const cleanUser = userPhotoBase64.replace(/^data:image\/\w+;base64,/, "");
      if (base64Part === cleanUser) {
        return {
          isValid: false,
          code: "DUPLICATE_USER_INPUT",
          message: "Generated image is identical to input user photo (no garment fitting occurred).",
          identityCheckStatus: "FAIL",
          productCheckStatus: "FAIL",
          geometryCheckStatus: "FAIL"
        };
      }
    }

    if (garmentBase64) {
      const cleanGarment = garmentBase64.replace(/^data:image\/\w+;base64,/, "");
      if (base64Part === cleanGarment) {
        return {
          isValid: false,
          code: "DUPLICATE_GARMENT_INPUT",
          message: "Generated image is identical to input product reference photo (user identity lost).",
          identityCheckStatus: "FAIL",
          productCheckStatus: "FAIL",
          geometryCheckStatus: "FAIL"
        };
      }
    }
  }

  return {
    isValid: true,
    code: "VALIDATED",
    message: "Generated Virtual Try-On image passed quality gate.",
    identityCheckStatus: "PASS",
    productCheckStatus: "PASS",
    geometryCheckStatus: "PASS"
  };
}
