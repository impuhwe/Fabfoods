const formatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

export function formatRwf(amount) {
  const value = typeof amount === 'number' && !Number.isNaN(amount) ? amount : 0;
  return `RWF ${formatter.format(value)}`;
}

export function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-RW', {
    dateStyle: 'medium',
  }).format(new Date(value));
}
