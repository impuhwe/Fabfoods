import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import AuthShell from '../../components/public/AuthShell.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';

export function ForgotPasswordPage() {
  usePageMeta({
    title: 'Password reset',
    description:
      'Password reset is not available yet because transactional email is not connected.',
  });

  return (
    <AuthShell
      eyebrow="Password reset"
      title="Email reset is not connected yet."
      description="The site can create and sign in accounts, but it cannot send password reset emails until the restaurant's email service is configured."
      footer={
        <Link to="/login" className="font-semibold text-cocoa-950 underline">
          Back to sign in
        </Link>
      }
    >
      <div className="rounded-2xl border border-warning/25 bg-warning/5 p-5 text-sm leading-relaxed text-cocoa-700">
        <KeyRound className="h-5 w-5 text-warning" aria-hidden="true" />
        <p className="mt-3 font-semibold text-cocoa-900">No reset has been sent.</p>
        <p className="mt-1">
          We are not showing a form that would pretend to send an email. Once email delivery is
          connected, password reset will be enabled here.
        </p>
      </div>
      <Button asChild variant="secondary" className="mt-5 w-full">
        <Link to="/contact">Contact the restaurant</Link>
      </Button>
    </AuthShell>
  );
}

export default ForgotPasswordPage;
