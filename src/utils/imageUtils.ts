/**
 * Utility functions for client-side image processing, compression, and avatar formatting.
 * Allows users to upload profile pictures from device/camera without requiring external links.
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates whether a file is an image and within reasonable file size limits.
 */
export const validateImageFile = (
  file: File,
  maxSizeBytes: number = 10 * 1024 * 1024 // 10MB limit before compression
): ImageValidationResult => {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado.' };
  }

  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Formato inválido. Por favor, selecione um arquivo de imagem (JPG, PNG, WEBP, etc.).'
    };
  }

  if (file.size > maxSizeBytes) {
    const sizeMb = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `A imagem excede o tamanho máximo permitido de ${sizeMb}MB.`
    };
  }

  return { valid: true };
};

export interface AvatarPreset {
  id: string;
  url: string;
  label: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: '1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7LkHlJKY7QjurPQFmQAzY7wrUoQvzbkf96mcEvjVg4yWEewc9S01rdk5-KwEfqKsLoY_Ui6xuWB3CJxdksTsQsmZhoXuFwLBuRIGqnG9nvnagE4qFD2RBIaHW3ub0GXDb_0xHACM5AkJKCEQYF7ksj-FlERm_EH2mzPxoalt1JfT364i_D3AEKOgsj7oic4VGcn6Gzw92ljQdO41U8AwbhqqSugM464BKj51SwUv_pd0kM9lCg7cpOw', label: 'Diretoria' },
  { id: '2', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', label: 'Financeiro' },
  { id: '3', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80', label: 'Engenharia' },
  { id: '4', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', label: 'Operador' },
  { id: '5', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', label: 'Supervisão' },
  { id: '6', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', label: 'Balança' }
];

/**
 * Processes an uploaded image file into a square-cropped, compressed Base64 Data URL.
 * Resizes the image to targetSize x targetSize (default: 256x256) using an HTML5 canvas.
 * Keeps output storage size minimal (~15KB - 30KB) for seamless offline persistence
 * in localStorage / IndexedDB and Firestore without needing external image hosting.
 */
export const processAvatarFile = (
  file: File,
  targetSize: number = 256,
  quality: number = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return reject(new Error(validation.error));
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo de imagem do dispositivo.'));
    };

    reader.onload = (event) => {
      const resultDataUrl = event.target?.result as string;
      if (!resultDataUrl) {
        return reject(new Error('Não foi possível ler a imagem.'));
      }

      const img = new Image();

      img.onerror = () => {
        reject(new Error('Falha ao decodificar a imagem selecionada.'));
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            // Fallback to original data URL if canvas 2D context is unavailable
            return resolve(resultDataUrl);
          }

          // Enable smooth scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Square center crop calculation
          const minSide = Math.min(img.width, img.height);
          const cropX = (img.width - minSide) / 2;
          const cropY = (img.height - minSide) / 2;

          // Draw cropped & resized square image
          ctx.drawImage(
            img,
            cropX,
            cropY,
            minSide,
            minSide,
            0,
            0,
            targetSize,
            targetSize
          );

          // Output as JPEG for high compatibility and lightweight size
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          // If canvas fails (e.g. security sandbox), fallback gracefully to data URL
          resolve(resultDataUrl);
        }
      };

      img.src = resultDataUrl;
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Processes an image file maintaining aspect ratio within maxWidth and maxHeight bounds.
 * Compresses to JPEG/WebP to guarantee document payloads remain well below Firestore's 1MB limit.
 */
export const processGeneralImageFile = (
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1600,
  quality: number = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return reject(new Error(validation.error));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem do dispositivo.'));

    reader.onload = (event) => {
      const resultDataUrl = event.target?.result as string;
      if (!resultDataUrl) {
        return reject(new Error('Não foi possível ler a imagem.'));
      }

      // If SVG, keep raw data URL as vector
      if (file.type === 'image/svg+xml') {
        return resolve(resultDataUrl);
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao decodificar a imagem selecionada.'));

      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Scale down if dimensions exceed bounds
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            return resolve(resultDataUrl);
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (err) {
          resolve(resultDataUrl);
        }
      };

      img.src = resultDataUrl;
    };

    reader.readAsDataURL(file);
  });
};
