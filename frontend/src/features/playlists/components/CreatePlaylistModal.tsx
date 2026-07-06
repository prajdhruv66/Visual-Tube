import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { playlistSchema, type PlaylistFormValues } from '@/schemas/playlist';
import { getErrorMessage } from '@/services/api/apiClient';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: PlaylistFormValues) => Promise<void>;
  title?: string;
  submitLabel?: string;
  defaultValues?: PlaylistFormValues;
}

export function CreatePlaylistModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Create playlist',
  submitLabel = 'Create',
  defaultValues,
}: CreatePlaylistModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistSchema),
    defaultValues: defaultValues ?? { name: '', description: '' },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async (values: PlaylistFormValues) => {
    try {
      await onSubmit(values);
      handleClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save playlist.'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <Input label="Playlist name" placeholder="My awesome playlist" error={errors.name?.message} {...register('name')} />
        <Textarea label="Description" placeholder="What's this playlist about?" error={errors.description?.message} {...register('description')} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
