import React, { useRef, useState } from 'react';
import { PlusIcon } from './icons';

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onImageSelect(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label className="text-sm font-medium text-[var(--color-text-secondary)]">品牌标志 (可选)</label>
      <div className="mt-1 flex items-center space-x-3">
        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] flex items-center justify-center backdrop-blur-sm">
          {preview ? (
            <img src={preview} alt="品牌标志预览" className="w-full h-full rounded-full object-contain" />
          ) : (
            <PlusIcon className="w-7 h-7 text-[var(--color-text-subtle)]" />
          )}
        </div>
        <button
          type="button"
          onClick={handleClick}
          className="px-3 py-1.5 border border-[var(--color-border-input)] rounded-md shadow-sm text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-primary)] hover:bg-[var(--color-surface-secondary)]"
        >
          {preview ? '更换' : '上传'}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp, image/svg+xml"
          className="hidden"
        />
      </div>
    </div>
  );
};