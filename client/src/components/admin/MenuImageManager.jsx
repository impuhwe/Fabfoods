import { useState } from 'react';
import { AlertTriangle, ImagePlus, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import Input from '../ui/Input.jsx';
import ResolvedImage from '../public/MenuImage.jsx';
import { HERO_IMAGE } from '../../lib/imagery.js';
import { getAdminMenuUploadSignature, uploadAdminMenuImage } from '../../services/adminApi.js';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

export function MenuImageManager({ itemName, image, gallery = [], onChange, enabled, disabled }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const hasImage = Boolean(image?.url);

  async function handleUpload(event, index) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError('Choose a JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Images must be 5 MB or smaller.');
      return;
    }

    setBusy(true);
    try {
      const signature = await getAdminMenuUploadSignature();
      const uploaded = await uploadAdminMenuImage(file, signature);
      if (index === undefined) {
        onChange({ image: uploaded });
      } else {
        const nextGallery = [...gallery];
        nextGallery[index] = uploaded;
        onChange({ gallery: nextGallery });
      }
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setBusy(false);
    }
  }

  function handleRemove(index) {
    if (index === undefined) {
      onChange({ image: null });
      return;
    }
    onChange({ gallery: gallery.filter((_, position) => position !== index) });
  }

  return (
    <div className="space-y-4 rounded-xl border border-cocoa-900/10 bg-cream-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-cocoa-950">Photographs</p>
          <p className="mt-1 text-xs text-cocoa-500">
            Upload a photo, then save the item to attach it.
          </p>
        </div>
        <Badge variant={hasImage ? 'success' : 'warning'} dot>
          {hasImage ? 'Primary photo set' : 'Photo missing'}
        </Badge>
      </div>

      {enabled ? null : (
        <p className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 text-xs text-cocoa-700">
          Photo storage is not configured. Existing photos remain available; uploads and removals
          are disabled.
        </p>
      )}

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs font-medium text-danger"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row">
        <ResolvedImage
          src={image?.url}
          fallback={HERO_IMAGE}
          alt={
            image?.alt ||
            (itemName ? `Photo for ${itemName}` : 'Menu item photo')
          }
          className="h-32 w-full rounded-xl object-cover sm:w-44"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cocoa-500">
              Primary image
            </p>
            <p className="break-all text-xs text-cocoa-600">
              {image?.publicId
                ? 'Managed photo'
                : hasImage
                  ? 'Local menu asset'
                  : 'No image attached'}
            </p>
          </div>
          <Field label="Alt text">
            <Input
              value={image?.alt ?? ''}
              onChange={(event) =>
                onChange({ image: { ...(image ?? {}), alt: event.target.value } })
              }
              placeholder={`Photo for ${itemName ?? 'dish'}`}
              disabled={disabled || busy || !hasImage}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <label
              className={
                'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-cocoa-900/20 px-4 text-sm font-semibold text-cocoa-900 transition-colors hover:bg-cream-200 ' +
                (disabled || busy || !enabled ? 'pointer-events-none opacity-50' : '')
              }
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => handleUpload(event)}
                disabled={disabled || busy || !enabled}
              />
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              {hasImage ? 'Replace' : 'Upload'}
            </label>
            {hasImage ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleRemove()}
                disabled={disabled || busy || !enabled}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-cocoa-900/10 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-cocoa-800">
            Gallery <span className="font-normal text-cocoa-500">({gallery.length}/5)</span>
          </p>
          <label
            className={
              'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-cocoa-900/20 px-4 text-sm font-semibold text-cocoa-900 transition-colors hover:bg-cream-200 ' +
              (disabled || busy || !enabled || gallery.length >= 5
                ? 'pointer-events-none opacity-50'
                : '')
            }
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => handleUpload(event, gallery.length)}
              disabled={disabled || busy || !enabled || gallery.length >= 5}
            />
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            Add image
          </label>
        </div>
        {gallery.length ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {gallery.map((entry, index) => (
              <div key={`${entry.publicId || entry.url}-${index}`} className="group relative">
                <ResolvedImage
                  src={entry.url}
                  fallback={HERO_IMAGE}
                  alt={entry.alt || `${itemName ?? 'Dish'} gallery image ${index + 1}`}
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  aria-label={`Remove gallery image ${index + 1}`}
                  className="absolute right-1 top-1 rounded-full bg-cocoa-950/75 p-1 text-cream-50 transition-opacity focus:opacity-100 group-hover:opacity-100 sm:opacity-0"
                  disabled={disabled || busy || !enabled}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-cocoa-500">No gallery images attached.</p>
        )}
      </div>
    </div>
  );
}

export default MenuImageManager;
