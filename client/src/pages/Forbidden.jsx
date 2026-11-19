import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

export function Forbidden() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
        <ShieldX className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-cocoa-500">403</p>
      <h1 className="mt-2 font-display text-display-md font-semibold text-cocoa-950">
        This area is for staff.
      </h1>
      <p className="mt-3 text-cocoa-600">
        Your account does not have permission to open this page. If that seems wrong, contact the
        administrator.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="order">
          <Link to="/">Back to site</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/admin/login">Sign in with another account</Link>
        </Button>
      </div>
    </div>
  );
}

export default Forbidden;
