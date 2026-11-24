import { useState } from 'react';
import { Inbox } from 'lucide-react';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card, { CardDescription, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import Checkbox from '../components/ui/Checkbox.jsx';
import Chip from '../components/ui/Chip.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { Field } from '../components/ui/Field.jsx';
import Input from '../components/ui/Input.jsx';
import Modal from '../components/ui/Modal.jsx';
import Price from '../components/ui/Price.jsx';
import Select from '../components/ui/Select.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

function Section({ title, description, children }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold text-cocoa-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-cocoa-600">{description}</p> : null}
      </div>
      <div className="rounded-3xl border border-cocoa-900/10 bg-cream-50 p-6">{children}</div>
    </section>
  );
}

export function DevUiKit() {
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [chip, setChip] = useState('All');

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6">
      <header>
        <Badge variant="warning">Development only</Badge>
        <h1 className="mt-3 font-display text-display-lg font-semibold text-cocoa-950">
          Design system
        </h1>
        <p className="mt-2 max-w-2xl text-cocoa-600">
          Phase 1 primitives. Warm editorial hospitality: cocoa, cream and ember, Fraunces for
          display type and Inter for interface text. Every control is keyboard reachable with a
          visible focus ring.
        </p>
      </header>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Badges and chips">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Neutral</Badge>
          <Badge variant="success" dot>
            Success
          </Badge>
          <Badge variant="warning" dot>
            Needs review
          </Badge>
          <Badge variant="danger" dot>
            Failed
          </Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="ember">Ember</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['All', 'Kitchen', 'Coffee', 'Drinks'].map((item) => (
            <Chip key={item} pressed={chip === item} onClick={() => setChip(item)}>
              {item}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Form controls" description="Labels, hints and errors are wired with ids.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Restaurant name" id="demo-name" hint="Shown on receipts." required>
            <Input defaultValue="FAB FOODS" />
          </Field>
          <Field label="Email" id="demo-email" error="Enter a valid email address.">
            <Input defaultValue="not-an-email" />
          </Field>
          <Field label="Fulfilment" id="demo-select">
            <Select defaultValue="pickup">
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </Select>
          </Field>
          <Field label="Disabled" id="demo-disabled">
            <Input disabled defaultValue="Unavailable" />
          </Field>
        </div>
        <div className="mt-5">
          <Checkbox
            id="demo-checkbox"
            label="Send me order updates"
            description="Only transactional messages in Phase 1."
          />
        </div>
      </Section>

      <Section title="Cards, price and empty states">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card title</CardTitle>
              <CardDescription>A calm surface with a soft shadow.</CardDescription>
            </CardHeader>
            <Price amount={12500} suffix="incl. tax" />
          </Card>
          <EmptyState
            icon={Inbox}
            title="Nothing here yet"
            description="Empty states explain what will appear and what to do next."
            action={<Button size="sm">Take an action</Button>}
          />
        </div>
      </Section>

      <Section title="Loading">
        <div className="flex flex-wrap items-center gap-6">
          <Spinner label="Loading the menu" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-24" />
        </div>
      </Section>

      <Section title="Dialogs and notifications">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Open confirm
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              addToast({
                title: 'Saved',
                description: 'Toast notifications are announced politely.',
                variant: 'success',
              })
            }
          >
            Show toast
          </Button>
        </div>
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Example dialog"
        description="Focus is trapped, Escape closes, and focus returns to the trigger."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Confirm</Button>
          </>
        }
      >
        <p className="text-sm text-cocoa-700">
          Use dialogs for short, focused tasks. Long forms belong on their own page.
        </p>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => new Promise((resolve) => setTimeout(resolve, 500))}
        title="Delete this item?"
        description="This demonstrates a destructive confirmation."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}

export default DevUiKit;
