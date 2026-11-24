import { randomUUID } from 'node:crypto';

const INBOUND_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function requestId(req, res, next) {
  const inbound = req.get('x-request-id');
  req.id = inbound && INBOUND_ID.test(inbound) ? inbound : randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

export default requestId;
