import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Expand } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { GALLERY_IMAGES, HERO_IMAGE } from '../../lib/imagery.js';

export function GalleryPage() {
  const [selected, setSelected] = useState(null);

  usePageMeta({
    title: 'Gallery',
    description: 'Representative food and drink photography used for menu reference.',
    image: HERO_IMAGE,
  });

  return (
    <>
      <section className="border-b border-cocoa-900/10 bg-cream-50">
        <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ember-700">
            Gallery
          </p>
          <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <h1 className="font-display text-display-lg font-semibold text-cocoa-950">
                A closer look.
              </h1>
              <p className="mt-3 text-base leading-relaxed text-cocoa-600">
                These are representative stock photographs used for menu reference.
              </p>
            </div>
            <Button asChild variant="order">
              <Link to="/reservations">
                Request a table
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="grid auto-rows-[220px] grid-cols-2 gap-4 sm:auto-rows-[280px] lg:grid-cols-4">
          {GALLERY_IMAGES.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setSelected(image)}
              className={`group relative overflow-hidden rounded-xl bg-cream-200 text-left ${
                image.ratio === 'portrait' ? 'row-span-2' : ''
              } ${index === 0 ? 'col-span-2' : ''}`}
            >
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-cocoa-950/0 transition-colors group-hover:bg-cocoa-950/20" />
              <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-cream-50/90 text-cocoa-900 opacity-0 transition-opacity group-hover:opacity-100">
                <Expand className="h-4 w-4" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs text-cocoa-500">
          Food images are representative stock photography used for menu reference.
        </p>
      </section>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Gallery preview"
        description={selected?.alt}
        size="xl"
      >
        {selected ? (
          <img
            src={selected.src}
            alt={selected.alt}
            className="max-h-[70vh] w-full rounded-xl object-contain"
          />
        ) : null}
      </Modal>
    </>
  );
}

export default GalleryPage;
