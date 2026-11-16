import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'ff_cart_v1';

function readStoredCart() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function selectionKey({ slug, sizeLabel, servingSelections = [], addonSelections = [] }) {
  const serving = servingSelections
    .map((selection) => `${selection.groupName}:${selection.optionName}`)
    .sort()
    .join('|');
  const addons = addonSelections
    .map((selection) => `${selection.groupName}:${selection.optionName}`)
    .sort()
    .join('|');
  return [slug, sizeLabel ?? '', serving, addons].join('::');
}

function lineId() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `line-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((menuItem, selection = {}) => {
    const quantity = selection.quantity ?? 1;
    const key = selectionKey({ slug: menuItem.slug, ...selection });
    const unitPrice = selection.unitPrice ?? menuItem.price;

    setItems((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) =>
          line.key === key ? { ...line, quantity: Math.min(20, line.quantity + quantity) } : line,
        );
      }

      return [
        ...current,
        {
          id: lineId(),
          key,
          slug: menuItem.slug,
          name: menuItem.name,
          category: menuItem.category?.name ?? '',
          image: menuItem.image ?? null,
          quantity,
          unitPrice,
          sizeLabel: selection.sizeLabel ?? null,
          servingSelections: selection.servingSelections ?? [],
          addonSelections: selection.addonSelections ?? [],
          selectionSummary: selection.selectionSummary ?? [],
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity < 1) {
      setItems((current) => current.filter((line) => line.id !== id));
      return;
    }
    setItems((current) =>
      current.map((line) =>
        line.id === id ? { ...line, quantity: Math.min(20, quantity) } : line,
      ),
    );
  }, []);

  const removeItem = useCallback((id) => {
    setItems((current) => current.filter((line) => line.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const itemCount = useMemo(() => items.reduce((total, line) => total + line.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((total, line) => total + line.unitPrice * line.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      isOpen,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      openCart,
      closeCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      isOpen,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      openCart,
      closeCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}

export default CartContext;
