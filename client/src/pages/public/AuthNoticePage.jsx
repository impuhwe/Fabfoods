import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import AuthShell from '../../components/public/AuthShell.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';

export function AuthNoticePage({ eyebrow, title, description, note }) {
  usePageMeta({ title, description });

  return (
    <AuthShell
      eyebrow={eyebrow}
      title={title}
      description={description}
      footer={
        <Link to="/login" className="font-semibold text-cocoa-950 underline">
          Back to sign in
        </Link>
      }
    >
      <div className="rounded-2xl border border-cocoa-900/10 bg-cream-50 p-5 text-sm leading-relaxed text-cocoa-700">
        <MailCheck className="h-5 w-5 text-cocoa-500" aria-hidden="true" />
        <p className="mt-3">{note}</p>
      </div>
      <Button asChild variant="secondary" className="mt-5 w-full">
        <Link to="/contact">Contact the restaurant</Link>
      </Button>
    </AuthShell>
  );
}

export default AuthNoticePage;
