import { assertObjectId } from './errorHandler.js';

export function validateObjectId(param = 'id', label = 'identifier') {
  return (req, _res, next) => {
    try {
      assertObjectId(req.params[param], label);
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export default validateObjectId;
