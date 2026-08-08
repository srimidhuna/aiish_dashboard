import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nbsCentre: z.string().min(1, 'Out Reach Service / NBS Centre is required'),
});

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', nbsCentre: '' },
  });

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      setError('');
      await login(data.email, data.password, data.nbsCentre);
      navigate('/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-lg border border-border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">AIISH NHSMS</h1>
          <p className="text-muted-foreground text-sm">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register('email')}
              autoComplete="off"
              className="w-full p-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1">{errors.email.message as string}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              autoComplete="new-password"
              className="w-full p-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
            />
            {errors.password && (
              <p className="text-destructive text-xs mt-1">{errors.password.message as string}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Out Reach Service / NBS Centre *</label>
            <input
              {...register('nbsCentre')}
              className="w-full p-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
            />
            {errors.nbsCentre && (
              <p className="text-destructive text-xs mt-1">{errors.nbsCentre.message as string}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
