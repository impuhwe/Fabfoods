import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, KeyRound } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import BrandLogo from '../../components/layout/BrandLogo.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { getApiErrorMessage } from '../../lib/api.js';
import { invitationAcceptFormSchema } from '../../lib/validation.js';
import { acceptAdminInvitation } from '../../services/publicApi.js';

function readToken(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return params.get('invitation') ?? params.get('token') ?? '';
}

export function AcceptInvitation() {
  const location = useLocation();
  const token = useMemo(() => readToken(location.hash), [location.hash]);
  const [accepted, setAccepted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(invitationAcceptFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  usePageMeta({ title: 'Accept administrator invitation' });

  async function onSubmit(values) {
    setSubmitError('');
    if (!token) {
      setSubmitError('This invitation link is missing its token. Request a new invitation.');
      return;
    }
    try {
      await acceptAdminInvitation({ token, password: values.password });
      setAccepted(true);
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'The invitation could not be accepted. Please try again.'),
      );
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream-100 px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-cocoa-900/10 bg-white p-7 shadow-soft sm:p-9">
        <Link to="/" className="inline-flex" aria-label="FAB FOODS home">
          <BrandLogo />
        </Link>

        {accepted ? (
          <div className="mt-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-semibold text-cocoa-950">
              Administrator access is ready.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-cocoa-600">
              Your password has been set. Sign in with your email to continue.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/admin/login">Go to staff sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <span className="mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-ember-500/10 text-ember-700">
              <KeyRound className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-semibold text-cocoa-950">
              Set your password
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-cocoa-600">
              Choose a password of at least 12 characters with an uppercase letter, a lowercase
              letter and a number. This link can be used once.
            </p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Field label="New password" required error={errors.password?.message}>
                <Input type="password" autoComplete="new-password" {...register('password')} />
              </Field>
              <Field label="Confirm password" required error={errors.confirmPassword?.message}>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                />
              </Field>

              {!token ? (
                <p role="alert" className="text-sm text-danger">
                  This invitation link is missing its token. Request a new invitation.
                </p>
              ) : null}
              {submitError ? (
                <p role="alert" className="rounded-lg bg-danger/5 p-3 text-sm text-danger">
                  {submitError}
                </p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!token}
                loading={isSubmitting}
              >
                Set password and accept
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

export default AcceptInvitation;
