export function toMediaDto(value) {
  if (!value || typeof value !== 'object') return { url: '', publicId: '', alt: '' };

  return {
    url: typeof value.url === 'string' ? value.url : '',
    publicId: typeof value.publicId === 'string' ? value.publicId : '',
    alt: typeof value.alt === 'string' ? value.alt : '',
  };
}

export function hasMedia(value) {
  return toMediaDto(value).url.length > 0;
}
