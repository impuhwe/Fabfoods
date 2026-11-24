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
import {
  createAdminInvitation,
  getAdminInvitations,
  revokeAdminInvitation,
} from '../../services/adminApi.js';

const EMPTY_FORM = { name: '', email: '', phone: '' };
const STATUSES = ['', 'pending', 'accepted', 'expired', 'revoked'];

export function AdminInvitations() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [status, setStatus] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canCreate = can(user, PERMISSIONS.STAFF_CREATE);
  const canRevoke = can(user, PERMISSIONS.STAFF_UPDATE);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminInvitations(status ? { status } : {});
      setInvitations(result.invitations);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Invitations could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function createInvitation(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await createAdminInvitation(form);
      setNotice(
        result.emailSent
          ? 'The invitation was emailed. One-time links are never shown here.'
          : 'The invitation was created, but the email provider did not confirm delivery.',
      );
      setForm(EMPTY_FORM);
      addToast({
        title: result.emailSent ? 'Invitation emailed' : 'Invitation created',
        variant: 'success',
      });
      await load();
    } catch (createError) {
      setError(getApiErrorMessage(createError, 'The invitation could not be created.'));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(invitation) {
    setBusy(true);
    setError('');
    try {
      await revokeAdminInvitation(invitation.id, { reason: 'Revoked from admin panel' });
      addToast({ title: 'Invitation revoked', variant: 'success' });
      await load();
    } catch (revokeError) {
      setError(getApiErrorMessage(revokeError, 'The invitation could not be revoked.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-cocoa-950">
            Administrator invitations
          </h2>
          <CardDescription>
            Invite another administrator by email. Links expire after 72 hours and work once.
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
          <CardTitle>Invite an administrator</CardTitle>
          <CardDescription>
            Invitations are sent by the configured email provider. One-time links are never shown,
            stored or shared here.
          </CardDescription>
          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={createInvitation}>
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
            <Field label="Phone" hint="Optional">
              <Input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </Field>
            <div className="flex items-end">
              <Button type="submit" disabled={busy}>
                Send invitation
              </Button>
            </div>
          </form>
          {notice ? (
            <div className="mt-4 rounded-lg border border-success/25 bg-success/5 p-3 text-xs text-cocoa-700">
              <p className="font-semibold">Invitation recorded.</p>
              <p className="mt-1">{notice}</p>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <Field label="Status" className="w-56">
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUSES.map((entry) => (
              <option key={entry} value={entry}>
                {entry ? entry : 'All invitations'}
              </option>
            ))}
          </Select>
        </Field>

        <div className="mt-5">
          {loading ? (
            <p className="py-6 text-sm text-cocoa-600">Loading invitations…</p>
          ) : invitations.length === 0 ? (
            <EmptyState
              title="No invitations"
              description="Administrator invitations will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-cocoa-500">
                  <tr>
                    <th className="py-2">Invitee</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Expires</th>
                    <th className="py-2">Sent by</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-cocoa-900/10">
                  {invitations.map((invitation) => (
                    <tr key={invitation.id} className="align-top">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-cocoa-950">{invitation.name}</p>
                        <p className="text-xs text-cocoa-500">{invitation.email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="neutral">{invitation.status}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-xs text-cocoa-600">
                        {new Date(invitation.expiresAt).toLocaleString('en-GB')}
                      </td>
                      <td className="py-3 pr-4 text-xs text-cocoa-500">
                        {invitation.createdByEmail}
                      </td>
                      <td className="py-3 text-right">
                        {canRevoke && ['pending', 'expired'].includes(invitation.status) ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => revoke(invitation)}
                          >
                            Revoke
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default AdminInvitations;
