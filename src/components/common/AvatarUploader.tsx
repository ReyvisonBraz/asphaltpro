import React, { useState, useRef } from 'react';
import { processAvatarFile, validateImageFile, AVATAR_PRESETS, AvatarPreset } from '../../utils/imageUtils';

interface AvatarUploaderProps {
  id?: string;
  value: string;
  onChange: (newAvatarUrl: string) => void;
  label?: string;
  helperText?: string;
  presets?: AvatarPreset[];
  showPresets?: boolean;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  id = 'avatar-uploader',
  value,
  onChange,
  label = 'Foto de Perfil / Avatar',
  helperText,
  presets = AVATAR_PRESETS,
  showPresets = true
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Arquivo de imagem inválido.');
      return;
    }

    setIsProcessing(true);
    try {
      const compressedDataUrl = await processAvatarFile(file, 256, 0.85);
      onChange(compressedDataUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao processar imagem.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemovePhoto = () => {
    if (presets && presets.length > 0) {
      onChange(presets[0].url);
    } else {
      onChange('');
    }
    setErrorMessage(null);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setCustomUrl('');
      setShowUrlInput(false);
    }
  };

  // Determine whether current value is a locally uploaded image (base64 Data URL) or external link
  const isUploadedImage = value?.startsWith('data:image/');

  return (
    <div id={id} className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={`${id}-file-input`} className="block text-xs font-bold text-[#010102] uppercase tracking-wider">
            {label}
          </label>
          {isUploadedImage && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              Foto do Dispositivo Salva
            </span>
          )}
        </div>
      )}

      {/* Main Container: Avatar Preview + Dropzone / Upload Action */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200">
        {/* Left: Avatar Circular Preview */}
        <div className="relative shrink-0 group">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#835400] ring-4 ring-amber-100 bg-white shadow-xs flex items-center justify-center">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center p-2 text-center text-amber-700">
                <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                <span className="text-[9px] font-bold mt-1">Processando</span>
              </div>
            ) : value ? (
              <img
                src={value}
                alt="Foto de Perfil"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails
                  (e.target as HTMLImageElement).src = presets[0]?.url || '';
                }}
              />
            ) : (
              <span className="material-symbols-outlined text-4xl text-gray-400">person</span>
            )}
          </div>

          {/* Quick Camera Action Overlay button */}
          <button
            type="button"
            id={`${id}-avatar-overlay-btn`}
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#835400] text-white hover:bg-[#684300] flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
            title="Clique para escolher foto do computador ou celular"
            aria-label="Trocar foto de perfil"
          >
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
          </button>
        </div>

        {/* Right: Dropzone & File Pick Options */}
        <div className="flex-1 w-full space-y-2">
          {/* Drop area */}
          <div
            id={`${id}-dropzone`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer select-none ${
              isDragOver
                ? 'border-[#835400] bg-amber-50 scale-[0.99]'
                : 'border-gray-300 bg-white hover:border-[#835400] hover:bg-amber-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              id={`${id}-file-input`}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#835400]">
                <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                <span>Escolher foto do dispositivo ou tirar foto</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Arraste uma imagem aqui ou clique para buscar na galeria / arquivos.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id={`${id}-select-file-btn`}
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-[11px] font-bold text-[#835400] bg-amber-100/70 hover:bg-amber-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">upload</span>
                Carregar Foto
              </button>

              {value && (
                <button
                  type="button"
                  id={`${id}-remove-photo-btn`}
                  onClick={handleRemovePhoto}
                  className="px-2 py-1 text-[11px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Remover foto personalizada"
                >
                  Remover
                </button>
              )}
            </div>

            <button
              type="button"
              id={`${id}-toggle-url-btn`}
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">link</span>
              <span>{showUrlInput ? 'Ocultar URL' : 'Inserir link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Feedback */}
      {errorMessage && (
        <div id={`${id}-error-alert`} className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-red-600 shrink-0">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Optional Preset Avatars Row */}
      {showPresets && presets && presets.length > 0 && (
        <div className="pt-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
            Ou escolha um avatar predefinido:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {presets.map((preset) => {
              const isSelected = value === preset.url;
              return (
                <button
                  type="button"
                  id={`${id}-preset-${preset.id}`}
                  key={preset.id}
                  onClick={() => {
                    onChange(preset.url);
                    setErrorMessage(null);
                  }}
                  className={`w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#835400] ring-2 ring-amber-300 scale-105 shadow-xs'
                      : 'border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-400'
                  }`}
                  title={preset.label}
                  aria-label={`Avatar ${preset.label}`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Optional URL Input Fallback */}
      {showUrlInput && (
        <form onSubmit={handleApplyCustomUrl} className="flex gap-2 pt-1">
          <input
            type="url"
            id={`${id}-url-input`}
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://exemplo.com/sua-foto.jpg"
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 focus:border-[#835400] focus:ring-1 focus:ring-[#835400] outline-none"
          />
          <button
            type="submit"
            id={`${id}-apply-url-btn`}
            className="px-3 py-1.5 bg-gray-800 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Aplicar
          </button>
        </form>
      )}

      {helperText && <p className="text-[11px] text-gray-500">{helperText}</p>}
    </div>
  );
};
