import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { updateAccountSchema, type UpdateAccountFormValues } from '@/schemas/profile';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageFileInput } from '@/components/media/ImageFileInput';
import { useUpdateAccount, useUpdateAvatar, useUpdateCoverImage } from '../hooks/useProfileSettings';
import { getErrorMessage } from '@/services/api/apiClient';

export default function ProfileSettingsPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const updateAccount = useUpdateAccount();
  const updateAvatar = useUpdateAvatar();
  const updateCoverImage = useUpdateCoverImage();

  const [avatarProgress, setAvatarProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateAccountFormValues>({
    resolver: zodResolver(updateAccountSchema),
    defaultValues: { fullname: user?.fullname ?? '', email: user?.email ?? '' },
  });

  const onSubmit = async (values: UpdateAccountFormValues) => {
    try {
      const updated = await updateAccount.mutateAsync(values);
      setUser(updated);
      toast.success('Account details updated.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update account details.'));
    }
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const updated = await updateAvatar.mutateAsync({ file, onProgress: setAvatarProgress });
      setUser(updated);
      toast.success('Avatar updated.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update avatar.'));
    } finally {
      setAvatarProgress(0);
    }
  };

  const onCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const updated = await updateCoverImage.mutateAsync({ file, onProgress: setCoverProgress });
      setUser(updated);
      toast.success('Cover image updated.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update cover image.'));
    } finally {
      setCoverProgress(0);
    }
  };

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-xl font-semibold text-text-primary">Profile Settings</h1>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col gap-2">
          <ImageFileInput label="Avatar" shape="circle" initialPreviewUrl={user.avatar} onChange={onAvatarChange} />
          {updateAvatar.isPending && (
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full bg-accent transition-all" style={{ width: `${avatarProgress}%` }} />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <ImageFileInput label="Cover image" shape="wide" initialPreviewUrl={user.coverImage} onChange={onCoverChange} />
          {updateCoverImage.isPending && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div className="h-full bg-accent transition-all" style={{ width: `${coverProgress}%` }} />
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-5 border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-text-primary">Account details</h2>
        <Input label="Full name" error={errors.fullname?.message} {...register('fullname')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Username" value={user.username} disabled hint="Username cannot be changed." />
        <div>
          <Button type="submit" isLoading={isSubmitting || updateAccount.isPending}>
            Save changes
          </Button>
        </div>
      </form>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Log out</h2>
          <p className="text-xs text-text-secondary">You'll need to log in again to access your account.</p>
        </div>
        <Button variant="danger" onClick={onLogout}>
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </div>
    </div>
  );
}
