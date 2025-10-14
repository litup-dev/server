import createError from '@fastify/error';

export const NotFoundError = createError('NOT_FOUND', '%s', 404);
export const ConflictError = createError('CONFLICT', '%s', 409);
export const BadRequestError = createError('BAD_REQUEST', '%s', 400);
export const ForbiddenError = createError('FORBIDDEN', '%s', 403);
export const UnauthorizedError = createError('UNAUTHORIZED', '%s', 401);
