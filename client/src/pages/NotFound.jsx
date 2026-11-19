import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-cream-200 text-cocoa-700">
        <Compass className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-cocoa-500">404</p>
      <h1 className="mt-2 font-display text-display-md font-semibold text-cocoa-950">
        Nothing on this plate.
      </h1>
      <p className="mt-3 text-cocoa-600">
        The page you asked for does not exist yet. The menu and ordering pages arrive in a later
        phase.
      </p>
      <Button asChild variant="order" className="mt-8">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}

export default NotFound;
