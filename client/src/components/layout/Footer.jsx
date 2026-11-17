import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import BrandLogo from './BrandLogo.jsx';
import { NAV_LINKS, SITE } from '../../lib/site.js';

export function Footer() {
  return (
    <footer className="mt-20 bg-cocoa-950 text-cream-50">
      <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center" aria-label="FAB FOODS home">
              <BrandLogo onDark />
            </Link>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-ember-300">
              {SITE.slogan}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-100/60">
              A restaurant and coffee house in Kigali. Breakfast, generous plates, coffee and cold
              drinks.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cream-100/65">
              Explore
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-cream-100/75 transition-colors hover:text-cream-50"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cream-100/65">
              Account
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  to="/account"
                  className="text-cream-100/75 transition-colors hover:text-cream-50"
                >
                  Your account
                </Link>
              </li>
              <li>
                <Link
                  to="/cart"
                  className="text-cream-100/75 transition-colors hover:text-cream-50"
                >
                  Your order
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-cream-100/75 transition-colors hover:text-cream-50"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/login"
                  className="text-cream-100/50 transition-colors hover:text-cream-50"
                >
                  Staff sign in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cream-100/65">
              Visit
            </p>
            <p className="mt-4 text-sm text-cream-100/75">{SITE.city}</p>
            <p className="mt-2 text-xs leading-relaxed text-cream-100/65">
              Address, phone, email and opening hours are being confirmed. They will be published
              only after owner approval.
            </p>
            <Link
              to="/contact"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ember-300 hover:text-ember-200"
            >
              Send a message
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-cream-100/10 pt-5 text-xs text-cream-100/40 sm:flex-row">
          <p>© {new Date().getFullYear()} FAB FOODS. All rights reserved.</p>
          <p>Temporary editorial imagery used until restaurant photography is supplied.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
