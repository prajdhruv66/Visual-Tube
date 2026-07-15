import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { uploadVideoSchema, type UploadVideoFormValues } from '@/schemas/video';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { ImageFileInput } from '@/components/media/ImageFileInput';
import { useUploadVideo } from '../hooks/useUploadVideo';
import { getErrorMessage } from '@/services/api/apiClient';
import { FileVideo } from 'lucide-react';

export default function UploadPage() {
  const navigate = useNavigate();
  const uploadMutation = useUploadVideo();
  const [progress, setProgress] = useState(0);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UploadVideoFormValues>({
    resolver: zodResolver(uploadVideoSchema),
    defaultValues: { isPublished: true },
  });

  const onSubmit = async (values: UploadVideoFormValues) => {
    setProgress(0);
    try {
      await uploadMutation.mutateAsync({
        payload: {
          title: values.title,
          description: values.description,
          tags: values.tags,
          isPublished: values.isPublished,
          video: values.video[0],
          thumbnail: values.thumbnail[0],
        },
        onProgress: setProgress,
      });
      toast.success('Video uploaded successfully!');
      navigate('/');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Upload failed. Please try again.'));
    }
  };

  const isUploading = uploadMutation.isPending;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-xl font-semibold text-text-primary">Upload video</h1>
      <p className="mt-1 text-sm text-text-secondary">Fill in the details below and publish your video.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">Video file</span>
          <label
            htmlFor="video"
            className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface text-text-tertiary hover:border-accent hover:text-accent-text"
          >
            <FileVideo className="h-6 w-6" />
            <span className="text-xs">{videoFileName ?? 'Click to select a video file'}</span>
            <input
              id="video"
              type="file"
              accept="video/*"
              className="sr-only"
              {...register('video', {
                onChange: (e) => setVideoFileName(e.target.files?.[0]?.name ?? null),
              })}
            />
          </label>
          {errors.video && <span className="text-xs text-danger">{errors.video.message as string}</span>}
        </div>

        <ImageFileInput label="Thumbnail" shape="wide" error={errors.thumbnail?.message as string} {...register('thumbnail')} />

        <Input label="Title" placeholder="Give your video a title" error={errors.title?.message} {...register('title')} />
        <Textarea
          label="Description"
          placeholder="Tell viewers about your video"
          error={errors.description?.message}
          {...register('description')}
        />
        <Input
          label="Tags"
          placeholder="comma, separated, tags"
          hint="Separate tags with commas"
          error={errors.tags?.message}
          {...register('tags')}
        />

        <Controller
          control={control}
          name="isPublished"
          render={({ field }) => (
            <Toggle checked={field.value} onChange={field.onChange} label={field.value ? 'Public' : 'Private'} />
          )}
        />

        {isUploading && (
          <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-surface-2 border border-border mt-2">
            <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
              <span>{progress === 100 ? 'Processing video on server...' : 'Uploading video file...'}</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
              <div 
                className={`h-full transition-all duration-300 ${progress === 100 ? 'bg-green-500 animate-pulse' : 'bg-accent'}`} 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        )}

        <Button type="submit" isLoading={isUploading} disabled={isUploading} className="mt-2">
          Upload video
        </Button>
      </form>
    </div>
  );
}
