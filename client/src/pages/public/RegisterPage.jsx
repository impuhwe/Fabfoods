import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import AuthShell from '../../components/public/AuthShell.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { registerFormSchema } from '../../lib/validation.js';

export function RegisterPage() {
  const { register: createAccount, isAuthenticated, status } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  usePageMeta({
    title: 'Create an account',
    description: 'Create a FAB FOODS account to manage table requests and your contact details.',
  });

  if (status !== 'loading' && isAuthenticated) {
    return <Navigate to="/account" replace />;
  }

  async function onSubmit(values) {
    setSubmitError('');
    try {
      await createAccount({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
      });
      navigate('/account', { replace: true });
    } catch (error) {
      setSubmitError(error.message);
    }
  }

  return (
    <AuthShell
      eyebrow="Create an account"
      title="Keep your table requests together."
      description="An account is optional for a table request, but it keeps your details and reservation history in one place."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-cocoa-950 underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Full name" required error={errors.name?.message}>
          <Input autoComplete="name" {...register('name')} />
        </Field>
        <Field label="Email" required error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Phone" error={errors.phone?.message} hint="Optional">
          <Input type="tel" autoComplete="tel" {...register('phone')} />
        </Field>
        <Field
          label="Password"
          required
          error={errors.password?.message}
          hint="At least 12 characters with upper and lower case letters and a number."
        >
          <Input type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        <Field label="Confirm password" required error={errors.confirmPassword?.message}>
          <Input type="password" autoComplete="new-password" {...register('confirmPassword')} />
        </Field>
        {submitError ? (
          <p role="alert" className="rounded-lg bg-danger/5 p-3 text-sm font-medium text-danger">
            {submitError}
          </p>
        ) : null}
        <Button type="submit" variant="order" size="lg" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

export default RegisterPage;
