import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardDescription } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Field from '../../components/ui/Field.jsx';
import Select from '../../components/ui/Select.jsx';
import { getApiErrorMessage } from '../../lib/api.js';
import { getAdminCateringRequests } from '../../services/adminApi.js';

const STATUSES = ['', 'new', 'read', 'resolved'];
const EVENT_TYPES = {
  corporate: 'Corporate event',
  private: 'Private celebration',
  wedding: 'Wedding',
  community: 'Community gathering',
  other: 'Other',
};

export function AdminCatering() {
  const [status, setStatus] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminCateringRequests(status ? { status } : {});
      setRequests(result.requests);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Catering requests could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-cocoa-950">Catering requests</h2>
          <CardDescription>
            Guest catering enquiries. Contact details are visible to staff only.
          </CardDescription>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <Card>
        <Field label="Status" className="w-56">
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUSES.map((entry) => (
              <option key={entry} value={entry}>
                {entry ? entry : 'All requests'}
              </option>
            ))}
          </Select>
        </Field>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        <div className="mt-5 overflow-x-auto">
          {loading ? (
            <p className="py-6 text-sm text-cocoa-600">Loading catering requests…</p>
          ) : requests.length === 0 ? (
            <EmptyState
              title="No catering requests"
              description="Guest catering enquiries will appear here."
            />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-cocoa-500">
                <tr>
                  <th className="py-2">Guest</th>
                  <th className="py-2">Event</th>
                  <th className="py-2">Guests</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cocoa-900/10">
                {requests.map((request) => (
                  <tr key={request.id} className="align-top">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-cocoa-950">{request.name}</p>
                      <p className="text-xs text-cocoa-500">{request.email}</p>
                      {request.phone ? (
                        <p className="text-xs text-cocoa-500">{request.phone}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">
                      <p>{EVENT_TYPES[request.eventType] ?? request.eventType}</p>
                      <p className="text-xs text-cocoa-500">
                        {request.location || 'Location pending'}
                      </p>
                    </td>
                    <td className="py-3 pr-4">{request.guestCount}</td>
                    <td className="py-3 pr-4">{request.eventDate || 'Flexible'}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="neutral">{request.status}</Badge>
                    </td>
                    <td className="py-3 text-xs text-cocoa-500">
                      {new Date(request.createdAt).toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

export default AdminCatering;
