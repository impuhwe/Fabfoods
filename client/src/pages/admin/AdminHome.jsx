import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Mail,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { can, PERMISSIONS } from '../../lib/permissions.js';
import { formatRwf } from '../../lib/format.js';
import Badge from '../../components/ui/Badge.jsx';
import Card, { CardDescription, CardHeader, CardTitle } from '../../components/ui/Card.jsx';

const SECTIONS = [
  {
    to: '/admin/orders',
    icon: ClipboardList,
    title: 'Orders',
    copy: 'Review new orders, update status and record offline payments.',
    permission: PERMISSIONS.ORDERS_VIEW,
  },
  {
    to: '/admin/reservations',
    icon: CalendarDays,
    title: 'Reservations',
    copy: 'Approve or decline table requests.',
    permission: PERMISSIONS.RESERVATIONS_VIEW,
  },
  {
    to: '/admin/menu-review',
    icon: ClipboardCheck,
    title: 'Menu review',
    copy: 'Review source issues and publish verified items.',
    permission: PERMISSIONS.MENU_VIEW,
  },
  {
    to: '/admin/staff',
    icon: Users,
    title: 'Staff',
    copy: 'Create staff accounts and manage roles.',
    permission: PERMISSIONS.STAFF_VIEW,
  },
  {
    to: '/admin/emails',
    icon: Mail,
    title: 'Email outbox',
    copy: 'Review queued emails and retry failed deliveries.',
    permission: PERMISSIONS.EMAILS_VIEW,
  },
  {
    to: '/admin/audit',
    icon: ScrollText,
    title: 'Audit log',
    copy: 'Review administrative actions.',
    permission: PERMISSIONS.AUDIT_VIEW,
  },
  {
    to: '/admin/settings',
    icon: Settings,
    title: 'Business settings',
    copy: 'Manage contact details, hours, delivery, payments and verification.',
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
];

const STAT_CARDS = [
  { key: 'activeOrders', label: 'Active orders' },
  { key: 'ordersToday', label: 'Orders today' },
  { key: 'pendingReservations', label: 'Pending tables' },
  { key: 'publishedMenuItems', label: 'Published items' },
  { key: 'menuItemsAwaitingReview', label: 'Awaiting review' },
];

export function AdminHome() {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState('checking');
  const [stats, setStats] = useState(null);
  const canViewStats = can(user, PERMISSIONS.DASHBOARD_STATS_VIEW);

  useEffect(() => {
    let active = true;

    api
      .get('/health/live')
      .then(() => active && setApiStatus('online'))
      .catch(() => active && setApiStatus('offline'));

    if (canViewStats) {
      api
        .get('/admin/dashboard')
        .then(({ data }) => active && setStats(data.data))
        .catch(() => active && setStats(null));
    }

    return () => {
      active = false;
    };
  }, [canViewStats]);

  const badge =
    apiStatus === 'online'
      ? { variant: 'success', label: 'Systems online' }
      : apiStatus === 'offline'
        ? { variant: 'danger', label: 'Systems unreachable' }
        : { variant: 'neutral', label: 'Checking systems' };

  const sections = SECTIONS.filter((section) => can(user, section.permission));

  return (
    <div className="space-y-6">
      <Card className="!bg-cocoa-950 text-cream-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cream-100/80">
              FAB FOODS operations
            </p>
            <h2 className="mt-2 font-display text-display-sm font-semibold">{user?.name}</h2>
            <p className="mt-2 max-w-xl text-sm text-cream-100/80">
              Delivery and online payments stay unavailable until they are verified and configured.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="ember" className="capitalize">
              {user?.role}
            </Badge>
            <Badge variant={badge.variant} dot>
              {badge.label}
            </Badge>
          </div>
        </div>
      </Card>

      {canViewStats ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Today&apos;s numbers</CardTitle>
              <CardDescription>Current FAB FOODS counts.</CardDescription>
            </div>
            {stats ? (
              <Badge variant="neutral">Paid revenue {formatRwf(stats.summary.paidRevenue)}</Badge>
            ) : null}
          </div>
          {stats ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {STAT_CARDS.map((stat) => (
                <div key={stat.key} className="rounded-2xl bg-cream-100 p-4">
                  <p className="text-2xl font-semibold text-cocoa-950">
                    {stats.summary[stat.key] ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-cocoa-600">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-cocoa-500">Statistics are unavailable right now.</p>
          )}

          {stats?.recentActivity?.length ? (
            <div className="mt-5 border-t border-cocoa-900/10 pt-4">
              <p className="text-sm font-semibold text-cocoa-800">Recent activity</p>
              <ul className="mt-2 space-y-2 text-sm text-cocoa-600">
                {stats.recentActivity.slice(0, 4).map((event) => (
                  <li key={event.id}>
                    <span className="font-medium text-cocoa-800">
                      {event.actorEmail ?? 'System'}
                    </span>{' '}
                    {event.summary}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sections.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-2xl border border-cocoa-900/10 bg-white p-5 transition-colors hover:border-ember-500/40 hover:bg-cream-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cream-200 text-cocoa-700">
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <CardHeader className="mt-4 mb-0">
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription>{item.copy}</CardDescription>
            </CardHeader>
          </Link>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Service rules</CardTitle>
            <CardDescription>Current FAB FOODS service rules.</CardDescription>
          </div>
          <ShieldCheck className="h-5 w-5 text-cocoa-400" aria-hidden="true" />
        </div>
        <div className="mt-5 grid gap-3 text-sm text-cocoa-600 sm:grid-cols-2">
          <p className="flex items-start gap-2">
            <UtensilsCrossed
              className="mt-0.5 h-4 w-4 shrink-0 text-cocoa-400"
              aria-hidden="true"
            />
            Pause new orders without hiding the menu.
          </p>
          <p className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-cocoa-400" aria-hidden="true" />
            Table requests need staff approval.
          </p>
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cocoa-400" aria-hidden="true" />
            Contact details and hours stay hidden until approved.
          </p>
          <p className="flex items-start gap-2">
            <Activity className="mt-0.5 h-4 w-4 shrink-0 text-cocoa-400" aria-hidden="true" />
            Delivery and online payments need verified setup.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default AdminHome;
