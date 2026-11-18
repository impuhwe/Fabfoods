import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, ShoppingBag, UserRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useCart } from '../../contexts/CartContext.jsx';
import { cn } from '../../lib/cn.js';
import { NAV_LINKS } from '../../lib/site.js';
import IconButton from '../ui/IconButton.jsx';
import Drawer from '../ui/Drawer.jsx';
import BrandLogo from './BrandLogo.jsx';

function Wordmark({ onNavigate }) {
  return (
    <Link
      to="/"
      onClick={onNavigate}
      className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400 focus-visible:ring-offset-4"
      aria-label="FAB FOODS home"
    >
      <BrandLogo compact />
    </Link>
  );
}

export function Header() {
  const { user } = useAuth();
  const { itemCount, openCart } = useCart();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-cocoa-900/10 bg-cream-100/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Wordmark />

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'relative rounded-full px-3.5 py-2 font-display text-[15px] font-semibold tracking-wide transition-colors',
                  isActive ? 'text-cocoa-950' : 'text-cocoa-600 hover:text-cocoa-950',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive ? (
                    <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-ember-500" />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            to={user ? '/account' : '/login'}
            className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-cocoa-700 transition-colors hover:bg-cream-200 sm:inline-flex"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            {user ? user.name.split(' ')[0] : 'Sign in'}
          </Link>

          <button
            type="button"
            onClick={openCart}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-cocoa-700 transition-colors hover:bg-cream-200"
            aria-label={`Open cart with ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            {itemCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember-500 px-1 text-[10px] font-bold tabular-nums text-cocoa-950">
                {itemCount}
              </span>
            ) : null}
          </button>

          <Link
            to="/menu"
            className="ml-1 hidden h-10 items-center rounded-full bg-ember-500 px-5 font-display text-base font-semibold text-cocoa-950 transition-colors hover:bg-ember-400 sm:inline-flex"
          >
            Order now
          </Link>

          <div className="lg:hidden">
            <IconButton label="Open menu" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title="FAB FOODS">
        <nav aria-label="Mobile" className="flex flex-col">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'border-b border-cocoa-900/10 py-4 font-display text-2xl font-semibold',
                  isActive ? 'text-ember-700' : 'text-cocoa-950',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 grid gap-2">
          <Link
            to="/menu"
            onClick={() => setOpen(false)}
            className="inline-flex h-12 items-center justify-center rounded-full bg-ember-500 text-sm font-semibold text-cocoa-950"
          >
            Order now
          </Link>
          <Link
            to={user ? '/account' : '/login'}
            onClick={() => setOpen(false)}
            className="inline-flex h-12 items-center justify-center rounded-full border border-cocoa-900/20 text-sm font-semibold text-cocoa-900"
          >
            {user ? 'Your account' : 'Sign in'}
          </Link>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-cocoa-500">
          Restaurant and coffee house in Kigali. Table requests are reviewed by the restaurant.
        </p>
      </Drawer>
    </header>
  );
}

export default Header;
