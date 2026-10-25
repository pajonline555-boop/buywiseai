import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export interface ImageUploadValidationResult {
  valid: boolean;
  error?: string;
}

export const MAX_PARTNER_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Validates partner product image file size, MIME type, and extension.
 */
export function validatePartnerImageFile(file: File): ImageUploadValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Size validation
  if (file.size > MAX_PARTNER_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 5.0 MB.` 
    };
  }

  // MIME type validation
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type "${file.type}". Only JPEG, PNG, and WebP images are permitted.` 
    };
  }

  // Extension validation
  const lowerName = file.name.toLowerCase();
  const hasValidExt = ALLOWED_IMAGE_EXTENSIONS.some(ext => lowerName.endsWith(ext));
  if (!hasValidExt) {
    return { 
      valid: false, 
      error: `Invalid file extension in "${file.name}". Must end with .jpg, .jpeg, .png, or .webp.` 
    };
  }

  return { valid: true };
}

/**
 * Uploads a partner product image binary blob to Firebase Storage.
 * Enforces controlled path: partner-uploads/{partnerId}/{timestamp}_{filename}
 */
export async function uploadPartnerProductImage(
  file: File,
  partnerId: string,
  options?: {
    onProgress?: (percent: number) => void;
    published?: boolean;
    status?: string;
  }
): Promise<{ success: boolean; downloadUrl?: string; storagePath?: string; error?: string }> {
  if (!partnerId || partnerId.trim().length === 0) {
    return { success: false, error: 'Authentication error: Missing authorized partner ID.' };
  }

  const validation = validatePartnerImageFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Sanitize file name: remove spaces, path traversals, special chars
  const cleanBaseName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.+/g, '.');
  const storagePath = `partner-uploads/${partnerId}/${Date.now()}_${cleanBaseName}`;

  if (!storage) {
    // Offline / Mock fallback environment notice
    console.warn('Firebase Storage not initialized, falling back to data URL for testing');
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          success: true,
          downloadUrl: reader.result as string,
          storagePath
        });
      };
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read file locally.' });
      };
      reader.readAsDataURL(file);
    });
  }

  try {
    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: file.type,
      customMetadata: {
        partnerId,
        status: options?.status || 'PENDING_REVIEW',
        published: options?.published === true ? 'true' : 'false',
        visibility: options?.published === true ? 'public' : 'private',
        uploadedAt: new Date().toISOString()
      }
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    return new Promise((resolve) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (options?.onProgress && snapshot.totalBytes > 0) {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            options.onProgress(percent);
          }
        },
        (error) => {
          console.error('Firebase Storage upload error:', error);
          resolve({
            success: false,
            error: error.message || 'Firebase Storage upload failed.'
          });
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              success: true,
              downloadUrl,
              storagePath
            });
          } catch (urlErr: any) {
            resolve({
              success: false,
              error: 'Uploaded successfully, but failed to retrieve public download URL.'
            });
          }
        }
      );
    });
  } catch (err: any) {
    console.error('Upload invocation error:', err);
    return {
      success: false,
      error: err.message || 'Unexpected error during upload.'
    };
  }
}

/**
 * Deletes an uploaded partner product image from Firebase Storage.
 */
export async function deletePartnerProductImage(storagePath: string): Promise<boolean> {
  if (!storage || !storagePath) return false;
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    return true;
  } catch (err) {
    console.warn('Failed to delete image from Firebase Storage:', err);
    return false;
  }
}
