import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button.jsx';
import Checkbox from './Checkbox.jsx';
import Chip from './Chip.jsx';
import EmptyState from './EmptyState.jsx';
import { Field } from './Field.jsx';
import Input from './Input.jsx';
import Modal from './Modal.jsx';
import Price from './Price.jsx';
import Skeleton from './Skeleton.jsx';

describe('Button', () => {
  it('exposes loading state and prevents interaction', () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('supports rendering a child link without nesting interactive elements', () => {
    render(
      <Button asChild>
        <a href="/menu">View menu</a>
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'View menu' });
    expect(link).toHaveAttribute('href', '/menu');
    expect(link.className).toContain('rounded-full');
  });

  it('uses white text for filled variants without changing the background classes', () => {
    render(
      <>
        <Button variant="order">Order now</Button>
        <Button variant="danger">Delete now</Button>
      </>,
    );

    const order = screen.getByRole('button', { name: 'Order now' });
    const danger = screen.getByRole('button', { name: 'Delete now' });
    expect(order.className).toContain('text-white');
    expect(order.className).toContain('bg-ember-500');
    expect(danger.className).toContain('text-white');
    expect(danger.className).toContain('bg-danger');
    expect(order.className).not.toContain('text-cocoa-950');
    expect(danger.className).not.toContain('text-cream-50');
  });

  it('keeps every other order variant class identical to the primary variant', () => {
    render(
      <>
        <Button>Primary action</Button>
        <Button variant="order">Order action</Button>
      </>,
    );

    const primary = screen.getByRole('button', { name: 'Primary action' });
    const order = screen.getByRole('button', { name: 'Order action' });
    expect(primary.className).toContain('text-white');
    const ignoringTextColor = (element) =>
      element.className.split(' ').filter((name) => !/^text-/.test(name));

    expect(ignoringTextColor(order)).toEqual(ignoringTextColor(primary));
    expect(
      order.className
        .split(' ')
        .filter((name) => /^(hover|focus|active|disabled):text-/.test(name)),
    ).toEqual([]);
  });
});

describe('Field', () => {
  it('associates label, hint and error with the control', () => {
    render(
      <Field label="Email" id="email" hint="We never share it." error="Enter a valid email.">
        <Input type="email" />
      </Field>,
    );

    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-hint email-error');
    expect(screen.getByText('Enter a valid email.')).toHaveAttribute('role', 'alert');
  });
});

describe('Chip and Checkbox', () => {
  it('announces pressed state for filter chips', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Chip pressed onClick={onClick}>
        Coffee
      </Chip>,
    );

    const chip = screen.getByRole('button', { name: 'Coffee', pressed: true });
    await user.click(chip);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('toggles via its accessible label', async () => {
    const user = userEvent.setup();

    render(<Checkbox id="updates" label="Send me updates" />);
    const checkbox = screen.getByRole('checkbox', { name: 'Send me updates' });

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});

describe('Modal', () => {
  it('labels the dialog and closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal open onClose={onClose} title="Confirm order" description="One last check.">
        <p>Body content</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Confirm order' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});

describe('display helpers', () => {
  it('formats currency with grouped digits', () => {
    render(<Price amount={12500} />);
    expect(screen.getByText(/12,500/)).toBeInTheDocument();
  });

  it('renders an empty state with a clear action', () => {
    render(
      <EmptyState
        title="No orders yet"
        description="New orders will appear here."
        action={<Button size="sm">Refresh</Button>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'No orders yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });

  it('hides skeletons from assistive technology', () => {
    const { container } = render(<Skeleton className="h-10" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
