import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { videoApi } from '@/services/api/videoApi';
import { editVideoSchema, type EditVideoFormValues } from '@/schemas/video';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { ImageFileInput } from '@/components/media/ImageFileInput';
import { Modal } from '@/components/ui/Modal';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { getErrorMessage } from '@/services/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import {
  useDeleteVideo,
  useTogglePublish,
  useUpdateThumbnail,
  useUpdateVideoDetails,
} from '../hooks/useVideoManagement';

export default function EditVideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);

  const videoQuery = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => videoApi.getById(videoId as string),
    enabled: !!videoId,
  });

  const updateDetails = useUpdateVideoDetails(videoId ?? '');
  const updateThumbnail = useUpdateThumbnail(videoId ?? '');
  const togglePublish = useTogglePublish(videoId ?? '');
  const deleteVideo = useDeleteVideo();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditVideoFormValues>({ resolver: zodResolver(editVideoSchema) });

  useEffect(() => {
    if (videoQuery.data) {
      reset({
        title: videoQuery.data.title,
        description: videoQuery.data.description,
        tags: videoQuery.data.tags?.join(', ') ?? '',
      });
    }
  }, [videoQuery.data, reset]);

  if (videoQuery.isLoading) return <FullPageSpinner />;
  if (videoQuery.isError || !videoQuery.data)
    return (
      <ErrorState message={getErrorMessage(videoQuery.error, 'Video not found.')} onRetry={() => videoQuery.refetch()} />
    );

  const video = videoQuery.data;
  const ownerId = typeof video.owner === 'string' ? video.owner : video.owner._id;

  // Videos can only be edited or deleted by their owner. This mirrors a
  // backend-enforced rule; we also guard here so a direct URL visit can't
  // even render the edit form for someone else's video.
  if (user?._id !== ownerId) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="You can't edit this video"
        description="Only the owner of a video can update its details or delete it."
      />
    );
  }

  const onSubmit = async (values: EditVideoFormValues) => {
    try {
      await updateDetails.mutateAsync(values);
      toast.success('Video details saved.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save changes.'));
    }
  };

  const onThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await updateThumbnail.mutateAsync({ file, onProgress: setThumbnailProgress });
      toast.success('Thumbnail updated.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update thumbnail.'));
    } finally {
      setThumbnailProgress(0);
    }
  };

  const onTogglePublish = async (nextValue: boolean) => {
    try {
      await togglePublish.mutateAsync(nextValue);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update publish status.'));
    }
  };

  const onDelete = async () => {
    if (!videoId) return;
    try {
      await deleteVideo.mutateAsync(videoId);
      toast.success('Video deleted.');
      navigate('/');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete video.'));
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-xl font-semibold text-text-primary">Edit video</h1>
      <p className="mt-1 text-sm text-text-secondary">Update your video's details or manage its visibility.</p>

      <div className="mt-6 flex flex-col gap-2">
        <span className="text-sm font-medium text-text-secondary">Thumbnail</span>
        <ImageFileInput
          label=""
          shape="wide"
          initialPreviewUrl={video.thumbnail}
          onChange={onThumbnailChange}
        />
        {updateThumbnail.isPending && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
            <div className="h-full bg-accent transition-all" style={{ width: `${thumbnailProgress}%` }} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5">
        <Input label="Title" error={errors.title?.message} {...register('title')} />
        <Textarea label="Description" error={errors.description?.message} {...register('description')} />
        <Input label="Tags" hint="Separate tags with commas" error={errors.tags?.message} {...register('tags')} />

        <Toggle
          checked={video.isPublished}
          onChange={onTogglePublish}
          label={video.isPublished ? 'Public' : 'Private'}
          disabled={togglePublish.isPending}
        />

        <div className="flex items-center justify-between border-t border-border pt-5">
          <Button type="button" variant="danger" onClick={() => setIsDeleteOpen(true)}>
            Delete video
          </Button>
          <Button type="submit" isLoading={isSubmitting || updateDetails.isPending}>
            Save changes
          </Button>
        </div>
      </form>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete this video?">
        <p className="text-sm text-text-secondary">
          This will permanently delete &ldquo;{video.title}&rdquo;. This action can&apos;t be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={deleteVideo.isPending} onClick={onDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
