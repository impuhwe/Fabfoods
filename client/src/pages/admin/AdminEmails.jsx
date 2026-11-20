import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardDescription } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Field from '../../components/ui/Field.jsx';
import Select from '../../components/ui/Select.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../lib/api.js';
import { can, PERMISSIONS } from '../../lib/permissions.js';
import { getAdminEmails, processAdminEmails, retryAdminEmail } from '../../services/adminApi.js';

const STATUSES = ['', 'queued', 'sending', 'sent', 'failed', 'cancelled'];

export function AdminEmails() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [status, setStatus] = useState('queued');
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminEmails(status ? { status } : {});
      setEmails(result.emails);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Email outbox could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function process() {
    setBusy(true);
    try {
      const result = await processAdminEmails();
      addToast({ title: `Processed ${result.processed ?? 0} messages`, variant: 'success' });
      await load();
    } catch (processError) {
      addToast({
        title: getApiErrorMessage(processError, 'Outbox could not be processed.'),
        variant: 'danger',
      });
    } finally {
      setBusy(false);
    }
  }

  async function retry(id) {
    setBusy(true);
    try {
      await retryAdminEmail(id);
      addToast({ title: 'Delivery queued again', variant: 'success' });
      await load();
    } catch (retryError) {
      addToast({
        title: getApiErrorMessage(retryError, 'Delivery could not be retried.'),
        variant: 'danger',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-cocoa-950">Email outbox</h2>
          <CardDescription>Review queued emails and retry failed deliveries.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
          {can(user, PERMISSIONS.EMAILS_PROCESS) ? (
            <Button onClick={process} disabled={busy}>
              Process outbox
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <Field label="Status" className="w-56">
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUSES.map((entry) => (
              <option key={entry} value={entry}>
                {entry ? entry : 'All messages'}
              </option>
            ))}
          </Select>
        </Field>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-cocoa-500">
              <tr>
                <th className="py-2">Recipient</th>
                <th className="py-2">Template</th>
                <th className="py-2">Status</th>
                <th className="py-2">Attempts</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cocoa-900/10">
              {emails.map((email) => (
                <tr key={email.id}>
                  <td className="py-3 text-cocoa-800">{email.to}</td>
                  <td className="py-3 text-cocoa-600">{email.template}</td>
                  <td className="py-3">
                    <Badge variant={email.status === 'failed' ? 'danger' : 'neutral'}>
                      {email.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-cocoa-600">
                    {email.attempts}/{email.maxAttempts}
                  </td>
                  <td className="py-3 text-right">
                    {can(user, PERMISSIONS.EMAILS_RETRY) && email.status === 'failed' ? (
                      <Button variant="secondary" onClick={() => retry(email.id)} disabled={busy}>
                        Retry
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && emails.length === 0 ? (
            <EmptyState title="No messages found" description="Try another status filter." />
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export default AdminEmails;
