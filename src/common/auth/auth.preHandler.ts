import fastifyPlugin from 'fastify-plugin';
import {
    AuthorizationTokenExpiredError,
    AuthorizationTokenInvalidError,
    AuthorizationTokenUnsignedError,
    InvalidTokenError,
    NoAuthorizationInCookieError,
    NotFoundError,
} from '../error';
import { FastifyRequest, FastifyReply } from 'fastify';

export const registerAuthPreHandler = fastifyPlugin(async (fastify) => {
    async function attachUserId(request: FastifyRequest) {
        const publicId = (request.user as any)?.publicId as string | undefined;
        if (!publicId) {
            request.userId = null;
            return;
        }
        const user = await fastify.prisma.user_tb.findFirst({
            where: { public_id: publicId },
            select: { id: true },
        });

        if (!user) {
            throw new NotFoundError('사용자를 찾을 수 없습니다.');
        }

        request.userId = user.id;
    }

    fastify.decorate('requireAuth', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
            if (request.user.type !== 'access') {
                throw new InvalidTokenError();
            }
            await attachUserId(request);
        } catch (err: any) {
            const code = err?.code;
            if (code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
                throw new AuthorizationTokenExpiredError();
            }
            if (code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
                throw new NoAuthorizationInCookieError();
            }
            if (code === 'FST_JWT_NO_AUTHORIZATION_IN_COOKIE') {
                throw new NoAuthorizationInCookieError();
            }
            if (code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
                throw new AuthorizationTokenInvalidError();
            }
            if (code === 'FAST_JWT_MISSING_SIGNATURE') {
                throw new AuthorizationTokenUnsignedError();
            }
            throw err;
        }
    });

    fastify.decorate('optionalAuth', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
            await attachUserId(request);
        } catch (err: any) {
            const code = err?.code;

            if (
                code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' ||
                code === 'FST_JWT_NO_AUTHORIZATION_IN_COOKIE'
            ) {
                request.userId = null;
                return;
            }

            if (code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
                throw new AuthorizationTokenExpiredError();
            }
            if (code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
                throw new AuthorizationTokenInvalidError();
            }
            if (code === 'FAST_JWT_MISSING_SIGNATURE') {
                throw new AuthorizationTokenUnsignedError();
            }

            request.userId = null;
        }
    });
});
