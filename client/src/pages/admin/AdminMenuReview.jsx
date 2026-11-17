import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw, Save, ShieldAlert } from 'lucide-react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Checkbox from '../../components/ui/Checkbox.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Field from '../../components/ui/Field.jsx';
import Input, { inputClasses } from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import { cn } from '../../lib/cn.js';
import { formatDate, formatRwf } from '../../lib/format.js';
import {
  archiveAdminMenuItem,
  getAdminMenuCategories,
  getAdminMenuItems,
  getAdminReviewIssues,
  resolveAdminReviewIssue,
  restoreAdminMenuItem,
  updateAdminMenuItem,
  verifyAdminMenuItem,
} from '../../services/adminApi.js';

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'needs-review', label: 'Needs review' },
  { value: 'verified', label: 'Verified' },
  { value: 'archived', label: 'Archived' },
  { value: 'non-orderable', label: 'Unresolved issues' },
];

function prettyLabel(value) {
  return String(value ?? '')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toDraft(item) {
  return {
    name: item.name,
    description: item.description ?? '',
    price: String(item.price),
    categorySlug: item.category?.slug ?? '',
    isAvailable: Boolean(item.isAvailable),
    isFeatured: Boolean(item.isFeatured),
    displayOrder: String(item.displayOrder ?? 0),
    sizeOptions: JSON.stringify(item.sizeOptions ?? [], null, 2),
    servingOptions: JSON.stringify(item.servingOptions ?? [], null, 2),
    addonGroups: JSON.stringify(item.addonGroups ?? [], null, 2),
    note: '',
  };
}

function parseOptions(text, label) {
  if (!text.trim()) return [];
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error(`${label} must be a JSON array`);
  return parsed;
}

function itemBadges(item) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {item.verified ? (
        <Badge variant="success">Verified</Badge>
      ) : (
        <Badge variant="warning">Unverified</Badge>
      )}
      {item.isArchived ? <Badge variant="danger">Archived</Badge> : null}
      {item.hasUnresolvedBlockingIssues ? (
        <Badge variant="danger">Unresolved issue</Badge>
      ) : null}
      {!item.isAvailable && !item.isArchived ? <Badge variant="neutral">Unavailable</Badge> : null}
    </div>
  );
}

export function AdminMenuReview() {
  const [filters, setFilters] = useState({ search: '', category: '', status: '' });
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [issues, setIssues] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState(null);
  const [issueNotes, setIssueNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const [itemResult, categoryList, issueList] = await Promise.all([
        getAdminMenuItems(params),
        getAdminMenuCategories(),
        getAdminReviewIssues(),
      ]);
      setItems(itemResult.items);
      setCategories(categoryList);
      setIssues(issueList);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );
  const unresolvedIssues = useMemo(
    () => issues.filter((issue) => issue.status !== 'resolved'),
    [issues],
  );

  function selectItem(item) {
    setSelectedId(item.id);
    setDraft(toDraft(item));
    setNotice('');
    setError('');
  }

  function updateDraft(field, value) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function requestConfirm(config) {
    setNotice('');
    setError('');
    setConfirm(config);
  }

  async function handleConfirm() {
    if (!confirm) return;
    try {
      await confirm.action();
    } catch (confirmError) {
      setError(confirmError.message);
    } finally {
      setConfirm(null);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!selectedItem || !draft) return;

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        name: draft.name,
        description: draft.description,
        price: Number(draft.price),
        categorySlug: draft.categorySlug || undefined,
        isAvailable: draft.isAvailable,
        isFeatured: draft.isFeatured,
        displayOrder: Number(draft.displayOrder),
        sizeOptions: parseOptions(draft.sizeOptions, 'sizeOptions'),
        servingOptions: parseOptions(draft.servingOptions, 'servingOptions'),
        addonGroups: parseOptions(draft.addonGroups, 'addonGroups'),
        note: draft.note,
      };
      const updated = await updateAdminMenuItem(selectedItem.id, payload);
      setDraft(toDraft(updated));
      setNotice('Menu item saved. Staff review is still required before publishing.');
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  function requestVerification() {
    if (!selectedItem) return;
    requestConfirm({
      title: `Verify and publish ${selectedItem.name}?`,
      description:
        'This marks the item as staff-verified, makes it available to customers and records who published it. Review issues remain until separately resolved.',
      confirmLabel: 'Verify & publish',
      action: async () => {
        const updated = await verifyAdminMenuItem(selectedItem.id, { note: draft?.note ?? '' });
        setDraft(toDraft(updated));
        setNotice(`${updated.name} is verified and published.`);
        await load();
      },
    });
  }

  function requestArchive() {
    if (!selectedItem) return;
    requestConfirm({
      title: `Archive ${selectedItem.name}?`,
      description:
        'Archiving removes the item from the public menu and disables ordering. You can restore it later.',
      confirmLabel: 'Archive item',
      destructive: true,
      action: async () => {
        const updated = await archiveAdminMenuItem(selectedItem.id);
        setDraft(toDraft(updated));
        setNotice(`${updated.name} has been archived.`);
        await load();
      },
    });
  }

  async function handleRestore() {
    if (!selectedItem) return;
    setBusy(true);
    setError('');
    try {
      const updated = await restoreAdminMenuItem(selectedItem.id);
      setDraft(toDraft(updated));
      setNotice(`${updated.name} has been restored. Verify it before publishing.`);
      await load();
    } catch (restoreError) {
      setError(restoreError.message);
    } finally {
      setBusy(false);
    }
  }

  function requestResolve(issue) {
    const resolution = (issueNotes[issue.id] ?? '').trim();
    if (!resolution) {
      setError('Enter a resolution note before resolving this issue.');
      return;
    }
    requestConfirm({
      title: `Resolve ${issue.issueId}?`,
      description:
        'This closes the issue, records the resolution note and recalculates which menu items are blocked. The action is recorded in the audit history.',
      confirmLabel: 'Resolve issue',
      action: async () => {
        await resolveAdminReviewIssue(issue.id, { status: 'resolved', resolution });
        setIssueNotes((current) => ({ ...current, [issue.id]: '' }));
        setNotice(`${issue.issueId} has been resolved.`);
        await load();
      },
    });
  }

  async function markInProgress(issue) {
    setBusy(true);
    setError('');
    try {
      await resolveAdminReviewIssue(issue.id, { status: 'in-progress', resolution: '' });
      setNotice(`${issue.issueId} is marked in progress.`);
      await load();
    } catch (issueError) {
      setError(issueError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cocoa-500">
            Manager / Admin
          </p>
          <h2 className="mt-1 font-display text-display-sm font-semibold text-cocoa-950">
            Menu review
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cocoa-600">
            Resolve the 24 PDF review issues, correct menu records and publish items only after
            staff verification. Every action is recorded.
          </p>
        </div>
        <Badge variant={unresolvedIssues.length ? 'warning' : 'success'} dot>
          {unresolvedIssues.length} unresolved issue{unresolvedIssues.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
        >
          <span className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </span>
          <button type="button" onClick={() => setError('')} className="text-xs underline">
            Dismiss
          </button>
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm font-medium text-success"
        >
          <span className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {notice}
          </span>
          <button type="button" onClick={() => setNotice('')} className="text-xs underline">
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Search">
          <Input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Name, slug or description"
          />
        </Field>
        <Field label="Category">
          <Select
            value={filters.category}
            onChange={(event) =>
              setFilters((current) => ({ ...current, category: event.target.value }))
            }
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({ ...current, status: event.target.value }))
            }
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl border border-cocoa-900/10 bg-white">
          <div className="border-b border-cocoa-900/10 px-5 py-4">
            <p className="font-display text-lg font-semibold text-cocoa-950">Menu items</p>
            <p className="mt-1 text-xs text-cocoa-500">
              {loading ? 'Loading…' : `${items.length} item${items.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="max-h-[620px] divide-y divide-cocoa-900/10 overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectItem(item)}
                className={cn(
                  'block w-full px-5 py-4 text-left transition-colors',
                  selectedId === item.id ? 'bg-ember-500/10' : 'hover:bg-cream-50',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-cocoa-950">{item.name}</p>
                    <p className="mt-1 text-xs text-cocoa-500">
                      {item.category?.name ?? 'Uncategorised'} · {formatRwf(item.price)}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-cocoa-500">p.{item.sourcePage ?? '—'}</span>
                </div>
                {itemBadges(item)}
              </button>
            ))}
            {!loading && !items.length ? (
              <p className="px-5 py-8 text-sm text-cocoa-500">No items match these filters.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-cocoa-900/10 bg-white p-5 sm:p-6">
          {!selectedItem || !draft ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
              <ShieldAlert className="h-8 w-8 text-cocoa-300" aria-hidden="true" />
              <p className="mt-4 font-display text-xl font-semibold text-cocoa-950">
                Select a menu item
              </p>
              <p className="mt-2 max-w-sm text-sm text-cocoa-500">
                Choose an item from the list to review its source data, edit fields, resolve issues
                and publish it.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cocoa-500">
                    {selectedItem.dataSource} · page {selectedItem.sourcePage ?? '—'}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-semibold text-cocoa-950">
                    {selectedItem.name}
                  </h3>
                  <p className="mt-1 text-xs text-cocoa-500">Slug: {selectedItem.slug}</p>
                  {itemBadges(selectedItem)}
                </div>
                <div className="text-right text-xs text-cocoa-500">
                  {selectedItem.verifiedAt ? (
                    <p>Verified {formatDate(selectedItem.verifiedAt)}</p>
                  ) : (
                    <p>Not yet verified</p>
                  )}
                  <p>Updated {formatDate(selectedItem.updatedAt)}</p>
                </div>
              </div>

              {selectedItem.reviewNote ? (
                <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-cocoa-700">
                  <span className="font-semibold">Source note:</span> {selectedItem.reviewNote}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required>
                  <Input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} />
                </Field>
                <Field label="Price (RWF)" required>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={draft.price}
                    onChange={(event) => updateDraft('price', event.target.value)}
                  />
                </Field>
              </div>

              <Field label="Category">
                <Select
                  value={draft.categorySlug}
                  onChange={(event) => updateDraft('categorySlug', event.target.value)}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Description">
                <textarea
                  rows={3}
                  className={inputClasses}
                  value={draft.description}
                  onChange={(event) => updateDraft('description', event.target.value)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display order">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={draft.displayOrder}
                    onChange={(event) => updateDraft('displayOrder', event.target.value)}
                  />
                </Field>
                <div className="space-y-3 pt-6">
                  <Checkbox
                    label="Available"
                    description="Availability still requires staff verification."
                    checked={draft.isAvailable}
                    onChange={(event) => updateDraft('isAvailable', event.target.checked)}
                  />
                  <Checkbox
                    label="Featured"
                    checked={draft.isFeatured}
                    onChange={(event) => updateDraft('isFeatured', event.target.checked)}
                  />
                </div>
              </div>

              {[
                ['sizeOptions', 'Size options'],
                ['servingOptions', 'Serving options'],
                ['addonGroups', 'Add-on groups'],
              ].map(([field, label]) => (
                <Field
                  key={field}
                  label={`${label} (JSON)`}
                  hint="Use a JSON array. Server validation applies before anything is saved."
                >
                  <textarea
                    rows={4}
                    spellCheck="false"
                    className={cn(inputClasses, 'font-mono text-xs')}
                    value={draft[field]}
                    onChange={(event) => updateDraft(field, event.target.value)}
                  />
                </Field>
              ))}

              <Field label="Review note" hint="Added to the item's source note when you save or publish.">
                <Input
                  value={draft.note}
                  onChange={(event) => updateDraft('note', event.target.value)}
                  placeholder="What did you confirm?"
                />
              </Field>

              <div className="flex flex-wrap gap-3 border-t border-cocoa-900/10 pt-5">
                <Button type="submit" loading={busy}>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Save changes
                </Button>
                {selectedItem.verified ? (
                  <Button type="button" variant="secondary" onClick={requestArchive} disabled={busy}>
                    Archive item
                  </Button>
                ) : (
                  <Button type="button" onClick={requestVerification} disabled={busy}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Verify & publish
                  </Button>
                )}
                {selectedItem.isArchived ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRestore}
                    disabled={busy}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Restore item
                  </Button>
                ) : null}
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-cocoa-900/10 bg-white">
        <div className="border-b border-cocoa-900/10 px-5 py-4">
          <p className="font-display text-lg font-semibold text-cocoa-950">Review issues</p>
          <p className="mt-1 text-xs text-cocoa-500">
            Source issues from the authoritative PDF manifest. Resolving one updates blocked items.
          </p>
        </div>
        <div className="divide-y divide-cocoa-900/10">
          {issues.map((issue) => (
            <div key={issue.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-cocoa-950">{issue.issueId}</p>
                    <Badge
                      variant={
                        issue.status === 'resolved'
                          ? 'success'
                          : issue.status === 'in-progress'
                            ? 'info'
                            : 'warning'
                      }
                    >
                      {prettyLabel(issue.status)}
                    </Badge>
                    {issue.blocking ? <Badge variant="danger">Blocking</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-cocoa-700">{issue.issue}</p>
                  <p className="mt-1 text-xs text-cocoa-500">
                    {issue.item} · {issue.sourcePdf} p.{issue.sourcePage}
                  </p>
                  <p className="mt-1 text-xs text-cocoa-500">
                    Affected: {issue.affectedSlugs.length
                      ? issue.affectedSlugs.join(', ')
                      : issue.affectedCategorySlugs.join(', ') || 'none'}
                  </p>
                  {issue.resolution ? (
                    <p className="mt-2 text-sm text-success">Resolved: {issue.resolution}</p>
                  ) : null}
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-72">
                  {issue.status !== 'resolved' ? (
                    <Input
                      value={issueNotes[issue.id] ?? ''}
                      onChange={(event) =>
                        setIssueNotes((current) => ({ ...current, [issue.id]: event.target.value }))
                      }
                      placeholder="Resolution note"
                      aria-label={`Resolution note for ${issue.issueId}`}
                    />
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {issue.status !== 'resolved' ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => requestResolve(issue)}
                          disabled={busy}
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => markInProgress(issue)}
                          disabled={busy}
                        >
                          In progress
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => markInProgress(issue)}
                        disabled={busy}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirm}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        confirmLabel={confirm?.confirmLabel ?? 'Confirm'}
        destructive={Boolean(confirm?.destructive)}
      />
    </div>
  );
}

export default AdminMenuReview;
