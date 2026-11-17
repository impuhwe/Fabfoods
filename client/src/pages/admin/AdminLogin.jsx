import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { STAFF_ROLES } from '../../lib/roles.js';
import { Field } from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { FullPageSpinner } from '../../components/ui/Spinner.jsx';
import BrandLogo from '../../components/layout/BrandLogo.jsx';

export function AdminLogin() {
  const { user, status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-dvh bg-cream-100">
        <FullPageSpinner label="Checking your session" />
      </div>
    );
  }

  if (status === 'authenticated' && user) {
    return <Navigate to={STAFF_ROLES.includes(user.role) ? '/admin' : '/'} replace />;
  }

  const from = location.state?.from?.pathname;
  const redirectTo = typeof from === 'string' && from.startsWith('/admin') ? from : '/admin';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh bg-cream-100 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-cocoa-950 p-10 text-cream-50 lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute -left-16 bottom-10 h-64 w-64 rounded-full bg-ember-500/20 blur-3xl"
          aria-hidden="true"
        />
        <Link to="/" className="relative inline-flex" aria-label="FAB FOODS home">
          <BrandLogo onDark compact />
        </Link>
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-cream-100/50">
            Staff workspace
          </p>
          <p className="mt-6 max-w-sm font-display text-4xl font-semibold leading-tight">
            Feed your brain. Run the room.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-100/60">
            One secure place for the team to manage the restaurant. Staff accounts are created by an
            administrator, never through public sign-up.
          </p>
        </div>
        <p className="relative text-xs text-cream-100/40">FAB FOODS · Kigali</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded text-sm font-medium text-cocoa-600 hover:text-cocoa-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to site
          </Link>

          <div className="mt-8 rounded-3xl border border-cocoa-900/10 bg-cream-50 p-6 shadow-soft sm:p-8">
            <BrandLogo className="mb-5" compact />
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream-200 text-cocoa-700">
              <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            </span>
            <h1 className="mt-5 font-display text-display-sm font-semibold text-cocoa-950">
              Staff sign in
            </h1>
            <p className="mt-2 text-sm text-cocoa-600">
              Use the account provided by your administrator.
            </p>

            {error ? (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
              >
                {error}
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <Field label="Email" id="admin-email" required>
                <Input
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </Field>

              <Field label="Password" id="admin-password" required>
                <Input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>

              <Button type="submit" className="w-full" loading={loading}>
                Sign in
                {loading ? null : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </Button>
            </form>

            <p className="mt-6 text-xs leading-relaxed text-cocoa-500">
              Access is limited to staff accounts. If you need access, contact the restaurant
              administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
