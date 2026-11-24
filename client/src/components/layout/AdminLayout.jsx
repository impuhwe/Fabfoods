import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  ScrollText,
  Settings,
  UserPlus,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { can, PERMISSIONS } from '../../lib/permissions.js';
import { cn } from '../../lib/cn.js';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import Drawer from '../ui/Drawer.jsx';
import IconButton from '../ui/IconButton.jsx';
import BrandLogo from './BrandLogo.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  {
    to: '/admin/orders',
    label: 'Orders',
    icon: ClipboardList,
    permission: PERMISSIONS.ORDERS_VIEW,
  },
  {
    to: '/admin/reservations',
    label: 'Reservations',
    icon: CalendarDays,
    permission: PERMISSIONS.RESERVATIONS_VIEW,
  },
  {
    to: '/admin/menu-review',
    label: 'Menu review',
    icon: ClipboardCheck,
    permission: PERMISSIONS.MENU_VIEW,
  },
  {
    to: '/admin/staff',
    label: 'Staff',
    icon: Users,
    permission: PERMISSIONS.STAFF_VIEW,
  },
  {
    to: '/admin/invitations',
    label: 'Invitations',
    icon: UserPlus,
    permission: PERMISSIONS.STAFF_VIEW,
  },
  {
    to: '/admin/emails',
    label: 'Email outbox',
    icon: Mail,
    permission: PERMISSIONS.EMAILS_VIEW,
  },
  {
    to: '/admin/catering',
    label: 'Catering',
    icon: UtensilsCrossed,
    permission: PERMISSIONS.EMAILS_VIEW,
  },
  {
    to: '/admin/audit',
    label: 'Audit log',
    icon: ScrollText,
    permission: PERMISSIONS.AUDIT_VIEW,
  },
  {
    to: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
];

const TITLES = {
  '/admin': 'Dashboard',
  '/admin/orders': 'Orders',
  '/admin/reservations': 'Reservations',
  '/admin/menu-review': 'Menu review',
  '/admin/staff': 'Staff',
  '/admin/invitations': 'Administrator invitations',
  '/admin/emails': 'Email outbox',
  '/admin/catering': 'Catering requests',
  '/admin/audit': 'Audit log',
  '/admin/settings': 'Settings',
};

function SidebarContent({ onNavigate, onLogout, loggingOut }) {
  const { user } = useAuth();
  const items = NAV.filter((item) => !item.permission || can(user, item.permission));

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-7">
        <Link to="/" onClick={onNavigate} className="inline-flex" aria-label="FAB FOODS home">
          <BrandLogo onDark compact />
        </Link>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cream-100/50">
          Operations
        </p>
      </div>

      <nav aria-label="Admin" className="flex-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-cream-100/10 text-cream-50'
                  : 'text-cream-100/60 hover:bg-cream-100/5 hover:text-cream-50',
              )
            }
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-4 border-t border-cream-100/10 p-4">
        <div>
          <p className="truncate text-sm font-medium text-cream-50">{user?.name}</p>
          <p className="truncate text-xs text-cream-100/50">{user?.email}</p>
          <div className="mt-2">
            <Badge variant="ember" className="capitalize">
              {user?.role}
            </Badge>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            onLogout();
          }}
          disabled={loggingOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-cream-100/70 transition-colors hover:bg-cream-100/5 hover:text-cream-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {loggingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const title = TITLES[location.pathname] ?? 'Operations';

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      addToast({ title: 'Signed out', variant: 'success' });
    } catch (error) {
      addToast({
        title: 'Sign-out incomplete',
        description: error.message,
        variant: 'error',
      });
    } finally {
      setLoggingOut(false);
      navigate('/admin/login', { replace: true });
    }
  }

  return (
    <div className="min-h-dvh bg-cream-100">
      <a href="#admin-main" className="skip-link">
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-cocoa-950 lg:block">
        <SidebarContent onLogout={handleLogout} loggingOut={loggingOut} />
      </aside>

      <div className="lg:pl-64">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-cocoa-900/10 bg-cream-50 px-4 sm:px-6 lg:hidden">
          <BrandLogo compact />
          <IconButton label="Open admin menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </header>

        <main id="admin-main" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cocoa-500">
                Operations
              </p>
              <h1 className="mt-1 font-display text-display-sm font-semibold text-cocoa-950">
                {title}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to site
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                loading={loggingOut}
                aria-label="Log out of the admin dashboard"
              >
                {loggingOut ? null : <LogOut className="h-4 w-4" aria-hidden="true" />}
                Logout
              </Button>
            </div>
          </div>
          <Outlet />
        </main>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title="Admin menu" side="left">
        <div className="-mx-5 -my-5 h-[calc(100%+2.5rem)] bg-cocoa-950">
          <SidebarContent
            onNavigate={() => setOpen(false)}
            onLogout={handleLogout}
            loggingOut={loggingOut}
          />
        </div>
      </Drawer>
    </div>
  );
}

export default AdminLayout;
