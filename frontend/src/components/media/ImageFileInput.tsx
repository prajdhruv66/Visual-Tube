import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { ImagePlus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ImageFileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  shape?: 'circle' | 'rect' | 'wide';
  initialPreviewUrl?: string;
}

const shapeClasses = {
  circle: 'h-24 w-24 rounded-full',
  rect: 'h-32 w-32 rounded-lg',
  wide: 'h-32 w-full rounded-lg',
};

export const ImageFileInput = forwardRef<HTMLInputElement, ImageFileInputProps>(
  ({ label, error, shape = 'rect', initialPreviewUrl, onChange, id, ...props }, ref) => {
    const [preview, setPreview] = useState<string | undefined>(initialPreviewUrl);
    const inputId = id ?? props.name;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setPreview(URL.createObjectURL(file));
      onChange?.(e);
    };

    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <label
          htmlFor={inputId}
          className={cn(
            'group relative flex cursor-pointer items-center justify-center overflow-hidden border border-dashed border-border bg-surface text-text-tertiary hover:border-accent hover:text-accent-text',
            shapeClasses[shape]
          )}
        >
          {preview ? (
            <img src={preview} alt={`${label} preview`} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
          <input
            ref={ref}
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleChange}
            {...props}
          />
        </label>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);
ImageFileInput.displayName = 'ImageFileInput';
