import { createHash } from 'node:crypto';
import env from '../config/env.js';
import { badRequest, serviceUnavailable } from '../utils/errors.js';

const SIGNATURE_PARAMETERS = ['folder', 'public_id', 'timestamp'];

function configuredValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requireConfiguration() {
  const { cloudName, apiKey, apiSecret, uploadFolder } = env.cloudinary;

  if (!cloudName || !apiKey || !apiSecret || !uploadFolder) {
    throw serviceUnavailable(
      'Cloudinary image management is not configured',
      'CLOUDINARY_NOT_CONFIGURED',
    );
  }

  return { cloudName, apiKey, apiSecret, uploadFolder };
}

function sha1Signature(parameters, apiSecret) {
  const source = parameters
    .filter(([key, value]) => SIGNATURE_PARAMETERS.includes(key) && value !== '')
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return createHash('sha1').update(`${source}${apiSecret}`).digest('hex');
}

export function cloudinaryStatus() {
  return {
    configured: env.cloudinary.configured,
    cloudName: env.cloudinary.cloudName,
    folder: env.cloudinary.uploadFolder,
  };
}

export function isManagedMenuPublicId(publicId) {
  const value = configuredValue(publicId);
  const prefix = `${env.cloudinary.uploadFolder}/`;
  return (
    value.startsWith(prefix) &&
    value.length > prefix.length &&
    !value.includes('..') &&
    !value.includes('?') &&
    !value.includes('#') &&
    /^[A-Za-z0-9/_-]+$/.test(value)
  );
}

export function assertManagedMenuPublicId(publicId) {
  if (!isManagedMenuPublicId(publicId)) {
    throw badRequest('Image public ID is not part of the FAB FOODS menu upload folder');
  }
  return configuredValue(publicId);
}

export function createMenuImageUploadSignature() {
  const { cloudName, apiKey, apiSecret, uploadFolder } = requireConfiguration();
  const timestamp = Math.floor(Date.now() / 1000);

  return {
    cloudName,
    apiKey,
    timestamp,
    folder: uploadFolder,
    signature: sha1Signature(
      [
        ['folder', uploadFolder],
        ['timestamp', String(timestamp)],
      ],
      apiSecret,
    ),
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  };
}

export async function deleteCloudinaryImage(publicId) {
  const { cloudName, apiKey, apiSecret } = requireConfiguration();
  const id = assertManagedMenuPublicId(publicId);
  const timestamp = Math.floor(Date.now() / 1000);
  const body = new URLSearchParams({
    api_key: apiKey,
    public_id: id,
    signature: sha1Signature(
      [
        ['public_id', id],
        ['timestamp', String(timestamp)],
      ],
      apiSecret,
    ),
    timestamp: String(timestamp),
  });

  let result;
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    result = await response.json();
    if (!response.ok) throw new Error(`Cloudinary returned HTTP ${response.status}`);
  } catch (error) {
    throw serviceUnavailable(
      `Cloudinary image deletion failed: ${error.message}`,
      'CLOUDINARY_DELETE_FAILED',
    );
  }

  if (result.result !== 'ok' && result.result !== 'not found') {
    throw serviceUnavailable(
      `Cloudinary image deletion failed: ${result.result || 'unknown result'}`,
      'CLOUDINARY_DELETE_FAILED',
    );
  }

  return {
    publicId: result.public_id ?? id,
    deleted: result.result === 'ok',
  };
}
