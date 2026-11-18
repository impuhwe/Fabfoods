import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card, { CardDescription } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import { getApiErrorMessage } from '../../lib/api.js';
import { getAdminAuditLogs } from '../../services/adminApi.js';

function formatWhen(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (action) params.action = action;
      if (targetType) params.targetType = targetType;
      const result = await getAdminAuditLogs(params);
      setLogs(result.logs);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Audit log could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-cocoa-950">Audit log</h2>
          <CardDescription>Sensitive administrative operations are recorded here.</CardDescription>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Action" className="min-w-56 flex-1">
            <Input
              value={action}
              onChange={(event) => setAction(event.target.value)}
              placeholder="staff.create"
            />
          </Field>
          <Field label="Target type" className="min-w-56 flex-1">
            <Input
              value={targetType}
              onChange={(event) => setTargetType(event.target.value)}
              placeholder="staffUser"
            />
          </Field>
          <Button onClick={load} disabled={loading}>
            Filter
          </Button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-cocoa-500">
              <tr>
                <th className="py-2">When</th>
                <th className="py-2">Actor</th>
                <th className="py-2">Action</th>
                <th className="py-2">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cocoa-900/10">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 text-cocoa-600">{formatWhen(log.createdAt)}</td>
                  <td className="py-3 text-cocoa-800">{log.actorEmail ?? 'System'}</td>
                  <td className="py-3">
                    <code className="text-xs">{log.action}</code>
                  </td>
                  <td className="py-3 text-cocoa-600">{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && logs.length === 0 ? (
            <EmptyState title="No audit entries" description="Try a different filter." />
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export default AdminAuditLog;
