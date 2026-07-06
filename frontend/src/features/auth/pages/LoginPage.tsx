import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { loginSchema, type LoginFormValues } from '@/schemas/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/services/api/apiClient';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const isEmail = values.identifier.includes('@');
      await login({
        email: isEmail ? values.identifier : undefined,
        username: isEmail ? undefined : values.identifier,
        password: values.password,
      });
      toast.success('Welcome back!');
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not log in. Check your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-text-primary">Log in</h1>
      <p className="mt-1 text-sm text-text-secondary">Welcome back to Visual-Tube.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <Input
          label="Email or username"
          placeholder="you@example.com"
          error={errors.identifier?.message}
          {...register('identifier')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-accent-text hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
