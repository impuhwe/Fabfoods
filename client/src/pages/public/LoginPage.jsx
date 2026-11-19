import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import AuthShell from '../../components/public/AuthShell.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { loginFormSchema } from '../../lib/validation.js';

export function LoginPage() {
  const { login, isAuthenticated, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState('');
  const from = location.state?.from?.pathname ?? '/account';
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  usePageMeta({
    title: 'Sign in',
    description:
      'Sign in to your FAB FOODS account to view reservations and keep your details handy.',
  });

  if (status !== 'loading' && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(values) {
    setSubmitError('');
    try {
      await login(values.email, values.password);
      navigate(from, { replace: true });
    } catch (error) {
      setSubmitError(error.message);
    }
  }

  return (
    <AuthShell
      eyebrow="Your account"
      title="Welcome back."
      description="Sign in to view your table requests and keep your contact details ready."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-semibold text-cocoa-950 underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Email" required error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Password" required error={errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...register('password')} />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-cocoa-600 underline">
            Forgot your password?
          </Link>
        </div>
        {submitError ? (
          <p role="alert" className="rounded-lg bg-danger/5 p-3 text-sm font-medium text-danger">
            {submitError}
          </p>
        ) : null}
        <Button type="submit" variant="order" size="lg" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export default LoginPage;
