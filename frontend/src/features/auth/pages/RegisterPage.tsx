import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { registerSchema, type RegisterFormValues } from '@/schemas/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageFileInput } from '@/components/media/ImageFileInput';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/services/api/apiClient';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await registerUser(
        {
          fullname: values.fullname,
          username: values.username,
          email: values.email,
          password: values.password,
          avatar: values.avatar[0],
          coverImage: values.coverImage?.[0],
        },
        setProgress
      );
      toast.success('Account created! Welcome to Visual-Tube.');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create your account.'));
    } finally {
      setIsSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-text-primary">Create your account</h1>
      <p className="mt-1 text-sm text-text-secondary">Join Visual-Tube in a minute.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <div className="flex gap-4">
          <ImageFileInput
            label="Avatar"
            shape="circle"
            error={errors.avatar?.message as string | undefined}
            {...register('avatar')}
          />
          <ImageFileInput
            label="Cover image"
            shape="rect"
            error={errors.coverImage?.message as string | undefined}
            {...register('coverImage')}
          />
        </div>

        <Input label="Full name" placeholder="Jane Doe" error={errors.fullname?.message} {...register('fullname')} />
        <Input label="Username" placeholder="janedoe" error={errors.username?.message} {...register('username')} />
        <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        {isSubmitting && progress > 0 && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
            <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent-text hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
