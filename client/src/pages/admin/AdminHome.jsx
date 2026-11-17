import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Settings,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../lib/api.js';
import Badge from '../../components/ui/Badge.jsx';
import Card, { CardDescription, CardHeader, CardTitle } from '../../components/ui/Card.jsx';

const SECTIONS = [
  {
    to: '/admin/orders',
    icon: ClipboardList,
    title: 'Orders',
    copy: 'Review incoming orders, update kitchen status and record offline payments.',
  },
  {
    to: '/admin/reservations',
    icon: CalendarDays,
    title: 'Reservations',
    copy: 'Approve or decline table requests and keep the service team informed.',
  },
  {
    to: '/admin/menu-review',
    icon: ClipboardCheck,
    title: 'Menu review',
    copy: 'Resolve PDF review issues, correct menu data and publish verified items.',
    roles: ['manager', 'admin'],
  },
  {
    to: '/admin/settings',
    icon: Settings,
    title: 'Business settings',
    copy: 'Manage contact details, hours, delivery zones, payments and public verification.',
    roles: ['manager', 'admin'],
  },
];

export function AdminHome() {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    let active = true;

    api
      .get('/health/live')
      .then(() => active && setApiStatus('online'))
      .catch(() => active && setApiStatus('offline'));

    return () => {
      active = false;
    };
  }, []);

  const badge =
    apiStatus === 'online'
      ? { variant: 'success', label: 'API online' }
      : apiStatus === 'offline'
        ? { variant: 'danger', label: 'API unreachable' }
        : { variant: 'neutral', label: 'Checking API' };

  const sections = SECTIONS.filter(
    (section) => !section.roles || section.roles.includes(user?.role),
  );

  return (
    <div className="space-y-6">
      <Card className="bg-cocoa-950 text-cream-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cream-100/50">
              Welcome back
            </p>
            <h2 className="mt-2 font-display text-display-sm font-semibold">{user?.name}</h2>
            <p className="mt-2 max-w-xl text-sm text-cream-100/60">
              Orders, reservations and business settings are managed from this workspace.
              Delivery and online payments remain unavailable until they are verified and
              configured.
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

      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle>Operational guardrails</CardTitle>
            <CardDescription>Current safe defaults for the live restaurant site.</CardDescription>
          </div>
          <ShieldCheck className="h-5 w-5 text-cocoa-400" aria-hidden="true" />
        </div>
        <div className="mt-5 grid gap-3 text-sm text-cocoa-600 sm:grid-cols-2">
          <p className="flex items-start gap-2">
            <UtensilsCrossed className="mt-0.5 h-4 w-4 shrink-0 text-cocoa-400" aria-hidden="true" />
            New orders can be paused instantly without taking the menu offline.
          </p>
          <p className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-cocoa-400" aria-hidden="true" />
            Table requests always require explicit staff approval.
          </p>
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cocoa-400" aria-hidden="true" />
            Contact details and opening hours stay hidden until marked approved.
          </p>
          <p className="flex items-start gap-2">
            <Activity className="mt-0.5 h-4 w-4 shrink-0 text-cocoa-400" aria-hidden="true" />
            Delivery and online payments require verified configuration.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default AdminHome;
