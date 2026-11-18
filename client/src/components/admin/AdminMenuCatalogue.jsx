import { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Checkbox from '../../components/ui/Checkbox.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getApiErrorMessage } from '../../lib/api.js';
import { can, PERMISSIONS } from '../../lib/permissions.js';
import {
  createAdminMenuCategory,
  createAdminMenuItem,
  updateAdminMenuCategory,
} from '../../services/adminApi.js';

const CATEGORY_KINDS = ['food', 'drink', 'dessert'];

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EMPTY_ITEM = {
  name: '',
  slug: '',
  categorySlug: '',
  price: '',
  description: '',
  includedItems: '',
  displayOrder: '0',
  note: '',
};

function emptyCategory() {
  return {
    name: '',
    slug: '',
    kind: 'food',
    description: '',
    displayOrder: '0',
    isVisible: true,
  };
}

export function AdminMenuCatalogue({ categories, onChanged }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const canCreateItem = can(user, PERMISSIONS.MENU_ITEMS_CREATE);
  const canManageCategories = can(user, PERMISSIONS.MENU_CATEGORIES_MANAGE);
  const [item, setItem] = useState({ ...EMPTY_ITEM });
  const [category, setCategory] = useState(emptyCategory);
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function patchItem(patch) {
    setItem((current) => ({ ...current, ...patch }));
  }

  function patchCategory(patch) {
    setCategory((current) => ({ ...current, ...patch }));
  }

  function selectCategory(id) {
    setEditingCategoryId(id);
    if (!id) {
      setCategory(emptyCategory());
      return;
    }
    const selected = categories.find((entry) => entry.id === id);
    if (!selected) return;
    setCategory({
      name: selected.name,
      slug: selected.slug,
      kind: selected.kind,
      description: selected.description ?? '',
      displayOrder: String(selected.displayOrder ?? 0),
      isVisible: Boolean(selected.isVisible),
    });
  }

  async function saveItem(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await createAdminMenuItem({
        name: item.name,
        slug: item.slug || slugify(item.name),
        categorySlug: item.categorySlug,
        price: Number(item.price),
        description: item.description,
        includedItems: item.includedItems
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean),
        displayOrder: Number(item.displayOrder || 0),
        note: item.note,
      });
      setItem({ ...EMPTY_ITEM });
      addToast({ title: 'Menu item created as unverified', variant: 'success' });
      await onChanged();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'The menu item could not be created.'));
    } finally {
      setBusy(false);
    }
  }

  async function saveCategory(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        name: category.name,
        slug: category.slug || slugify(category.name),
        kind: category.kind,
        description: category.description,
        displayOrder: Number(category.displayOrder || 0),
        isVisible: category.isVisible,
      };
      if (editingCategoryId) {
        delete payload.slug;
        await updateAdminMenuCategory(editingCategoryId, payload);
        addToast({ title: 'Category updated', variant: 'success' });
      } else {
        await createAdminMenuCategory(payload);
        addToast({ title: 'Category created', variant: 'success' });
      }
      setEditingCategoryId('');
      setCategory(emptyCategory());
      await onChanged();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'The category could not be saved.'));
    } finally {
      setBusy(false);
    }
  }

  if (!canCreateItem && !canManageCategories) return null;

  return (
    <section className="rounded-2xl border border-cocoa-900/10 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-cocoa-950">Menu catalogue</h3>
          <p className="mt-1 text-sm text-cocoa-600">
            New records stay unverified and unavailable until staff review is complete.
          </p>
        </div>
        <Badge variant="neutral">Manager / Admin</Badge>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-danger/5 p-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {canCreateItem ? (
          <form className="space-y-3" onSubmit={saveItem}>
            <p className="font-semibold text-cocoa-900">Create menu item</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" required>
                <Input
                  value={item.name}
                  onChange={(event) => patchItem({ name: event.target.value })}
                />
              </Field>
              <Field label="Slug" hint="Leave blank to generate.">
                <Input
                  value={item.slug}
                  onChange={(event) => patchItem({ slug: event.target.value })}
                />
              </Field>
              <Field label="Category" required>
                <Select
                  value={item.categorySlug}
                  onChange={(event) => patchItem({ categorySlug: event.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories.map((entry) => (
                    <option key={entry.id} value={entry.slug}>
                      {entry.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Price (RWF)" required>
                <Input
                  type="number"
                  min="0"
                  value={item.price}
                  onChange={(event) => patchItem({ price: event.target.value })}
                />
              </Field>
              <Field label="Display order">
                <Input
                  type="number"
                  min="0"
                  value={item.displayOrder}
                  onChange={(event) => patchItem({ displayOrder: event.target.value })}
                />
              </Field>
              <Field label="Included items" hint="Comma-separated.">
                <Input
                  value={item.includedItems}
                  onChange={(event) => patchItem({ includedItems: event.target.value })}
                />
              </Field>
            </div>
            <Field label="Description">
              <Input
                value={item.description}
                onChange={(event) => patchItem({ description: event.target.value })}
              />
            </Field>
            <Field label="Source note">
              <Input
                value={item.note}
                onChange={(event) => patchItem({ note: event.target.value })}
              />
            </Field>
            <Button type="submit" disabled={busy}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create item
            </Button>
          </form>
        ) : null}

        {canManageCategories ? (
          <form className="space-y-3" onSubmit={saveCategory}>
            <p className="font-semibold text-cocoa-900">Create or edit category</p>
            <Field label="Existing category">
              <Select
                value={editingCategoryId}
                onChange={(event) => selectCategory(event.target.value)}
              >
                <option value="">New category</option>
                {categories.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" required>
                <Input
                  value={category.name}
                  onChange={(event) => patchCategory({ name: event.target.value })}
                />
              </Field>
              <Field
                label="Slug"
                hint={
                  editingCategoryId ? 'Fixed for existing categories.' : 'Leave blank to generate.'
                }
              >
                <Input
                  value={category.slug}
                  disabled={Boolean(editingCategoryId)}
                  onChange={(event) => patchCategory({ slug: event.target.value })}
                />
              </Field>
              <Field label="Kind">
                <Select
                  value={category.kind}
                  onChange={(event) => patchCategory({ kind: event.target.value })}
                >
                  {CATEGORY_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Display order">
                <Input
                  type="number"
                  min="0"
                  value={category.displayOrder}
                  onChange={(event) => patchCategory({ displayOrder: event.target.value })}
                />
              </Field>
            </div>
            <Field label="Description">
              <Input
                value={category.description}
                onChange={(event) => patchCategory({ description: event.target.value })}
              />
            </Field>
            <Checkbox
              id="category-visible"
              label="Visible on the public menu"
              checked={category.isVisible}
              onChange={(event) => patchCategory({ isVisible: event.target.checked })}
            />
            <Button type="submit" disabled={busy}>
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              {editingCategoryId ? 'Save category' : 'Create category'}
            </Button>
          </form>
        ) : null}
      </div>
    </section>
  );
}

export default AdminMenuCatalogue;
