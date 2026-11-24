import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardDescription, CardTitle } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../lib/api.js';
import { can, PERMISSIONS } from '../../lib/permissions.js';
import { createAdminStaff, getAdminStaff, updateAdminStaff } from '../../services/adminApi.js';

const EMPTY_FORM = { name: '', email: '', phone: '', role: 'staff' };

export function AdminStaff() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canCreate = can(user, PERMISSIONS.STAFF_CREATE);
  const canAssignRole = can(user, PERMISSIONS.STAFF_ROLES_ASSIGN);
  const canUpdateStatus = can(user, PERMISSIONS.STAFF_STATUS_UPDATE);
  const canEdit = can(user, PERMISSIONS.STAFF_UPDATE);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminStaff();
      setStaff(result.staff);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Staff accounts could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createAccount(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setTemporaryPassword('');
    try {
      const result = await createAdminStaff(form);
      setTemporaryPassword(result.temporaryPassword);
      setForm(EMPTY_FORM);
      await load();
      addToast({ title: 'Staff account created', variant: 'success' });
    } catch (createError) {
      setError(getApiErrorMessage(createError, 'The staff account could not be created.'));
    } finally {
      setBusy(false);
    }
  }

  async function updateAccount(account, patch) {
    setBusy(true);
    setError('');
    try {
      const updated = await updateAdminStaff(account.id, patch);
      setStaff((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      addToast({ title: 'Staff account updated', variant: 'success' });
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, 'The staff account could not be updated.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-cocoa-950">Staff</h2>
          <CardDescription>
            Manage staff access. Passwords and secrets are never shown here.
          </CardDescription>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {canCreate ? (
        <Card>
          <CardTitle>Create staff account</CardTitle>
          <CardDescription>
            The account must change its temporary password at first sign-in.
          </CardDescription>
          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={createAccount}>
            <Field label="Name">
              <Input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </Field>
            <Field label="Role">
              <Select
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator</option>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Button type="submit" disabled={busy}>
                Create account
              </Button>
            </div>
          </form>
          {temporaryPassword ? (
            <div className="mt-4 rounded-2xl bg-cream-100 p-4 text-sm text-cocoa-700">
              <p className="font-semibold">Temporary password — shown once</p>
              <code className="mt-2 block break-all">{temporaryPassword}</code>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-cocoa-500">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Role</th>
                <th className="py-2">Status</th>
                <th className="py-2">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cocoa-900/10">
              {staff.map((account) => (
                <tr key={account.id}>
                  <td className="py-3 font-medium text-cocoa-900">{account.name}</td>
                  <td className="py-3">
                    {canAssignRole && canEdit && account.id !== user?.id ? (
                      <Select
                        value={account.role}
                        disabled={busy}
                        onChange={(event) => updateAccount(account, { role: event.target.value })}
                      >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Administrator</option>
                      </Select>
                    ) : (
                      <Badge variant="neutral" className="capitalize">
                        {account.role}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3">
                    {canUpdateStatus && canEdit && account.id !== user?.id ? (
                      <Select
                        value={account.status}
                        disabled={busy}
                        onChange={(event) => updateAccount(account, { status: event.target.value })}
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </Select>
                    ) : (
                      <Badge variant={account.status === 'active' ? 'success' : 'danger'}>
                        {account.status}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 text-cocoa-600">{account.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && staff.length === 0 ? (
            <EmptyState title="No staff accounts" description="Create one above." />
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export default AdminStaff;
