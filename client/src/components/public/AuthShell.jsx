import { Link } from 'react-router-dom';
import { HERO_IMAGE } from '../../lib/imagery.js';

export function AuthShell({ eyebrow, title, description, children, footer }) {
  return (
    <section className="grid min-h-[calc(100dvh-72px)] lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-cocoa-950 text-cream-50 lg:block">
        <img
          src={HERO_IMAGE}
          alt="Warm restaurant dining room with timber tables"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa-950/90 via-cocoa-950/40 to-cocoa-950/20" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link to="/" className="font-display text-xl font-semibold tracking-tight">
            FAB FOODS
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ember-300">
              Feed your brain
            </p>
            <p className="mt-4 max-w-sm font-display text-3xl font-semibold leading-tight">
              A table, a coffee and a little room to think.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-cream-100 px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="font-display text-lg font-semibold text-cocoa-950 lg:hidden">
            FAB FOODS
          </Link>
          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-ember-700 lg:mt-0">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-display text-display-md font-semibold text-cocoa-950">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-cocoa-600">{description}</p>
          <div className="mt-7">{children}</div>
          {footer ? <div className="mt-6 text-sm text-cocoa-600">{footer}</div> : null}
        </div>
      </div>
    </section>
  );
}

export default AuthShell;
