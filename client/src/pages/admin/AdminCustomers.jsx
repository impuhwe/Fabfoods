import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardDescription, CardTitle } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../lib/api.js';
import { can, PERMISSIONS } from '../../lib/permissions.js';
import {
  getAdminCustomer,
  getAdminCustomers,
  setAdminCustomerStatus,
} from '../../services/adminApi.js';

export function AdminCustomers() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminCustomers(search ? { search } : {});
      setCustomers(result.customers);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Customers could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function openCustomer(id) {
    try {
      const detail = await getAdminCustomer(id);
      setSelected(detail);
    } catch (detailError) {
      addToast({
        title: getApiErrorMessage(detailError, 'Customer details could not be loaded.'),
        variant: 'danger',
      });
    }
  }

  async function changeStatus(status) {
    if (!selected) return;
    try {
      const customer = await setAdminCustomerStatus(selected.customer.id, status);
      setSelected((current) => ({ ...current, customer }));
      setCustomers((current) =>
        current.map((entry) => (entry.id === customer.id ? customer : entry)),
      );
      addToast({ title: `Customer account ${status}`, variant: 'success' });
    } catch (statusError) {
      addToast({
        title: getApiErrorMessage(statusError, 'The account could not be updated.'),
        variant: 'danger',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-cocoa-950">Customers</h2>
          <CardDescription>
            View customer activity without exposing account credentials.
          </CardDescription>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Search" className="min-w-64 flex-1">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email or phone"
            />
          </Field>
          <Button onClick={load} disabled={loading}>
            Search
          </Button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-cocoa-500">
              <tr>
                <th className="py-2">Customer</th>
                <th className="py-2">Contact</th>
                <th className="py-2">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cocoa-900/10">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="py-3 font-medium text-cocoa-900">{customer.name}</td>
                  <td className="py-3 text-cocoa-600">{customer.email}</td>
                  <td className="py-3">
                    <Badge variant={customer.status === 'active' ? 'success' : 'danger'}>
                      {customer.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="secondary" onClick={() => openCustomer(customer.id)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && customers.length === 0 ? (
            <EmptyState title="No customers found" description="Try another search." />
          ) : null}
        </div>
      </Card>

      {selected ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{selected.customer.name}</CardTitle>
              <CardDescription>{selected.customer.email}</CardDescription>
            </div>
            {can(user, PERMISSIONS.CUSTOMERS_ACCOUNT_MANAGE) ? (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => changeStatus('active')}
                  disabled={selected.customer.status === 'active'}
                >
                  Reactivate
                </Button>
                <Button
                  variant="danger"
                  onClick={() => changeStatus('suspended')}
                  disabled={selected.customer.status === 'suspended'}
                >
                  Suspend
                </Button>
              </div>
            ) : null}
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-cocoa-800">Recent orders</p>
              <ul className="mt-2 space-y-2 text-sm text-cocoa-600">
                {selected.activity.orders.map((order) => (
                  <li key={order.orderNumber}>
                    {order.orderNumber} — {order.status} — {order.total} {order.currency}
                  </li>
                ))}
                {selected.activity.orders.length === 0 ? <li>No orders yet.</li> : null}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-cocoa-800">Recent reservations</p>
              <ul className="mt-2 space-y-2 text-sm text-cocoa-600">
                {selected.activity.reservations.map((reservation) => (
                  <li key={reservation.reference}>
                    {reservation.reference} — {reservation.date} {reservation.time} —{' '}
                    {reservation.status}
                  </li>
                ))}
                {selected.activity.reservations.length === 0 ? <li>No reservations yet.</li> : null}
              </ul>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export default AdminCustomers;
