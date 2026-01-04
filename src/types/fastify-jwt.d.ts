import '@fastify/jwt';
import { JwtPayload } from './jwt';

type AccessTokenPayload = {
    userId: number;
    type: 'access';
};

type RefreshTokenPayload = {
    userId: number;
    type: 'refresh';
    jti: string;
};

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: AccessTokenPayload | RefreshTokenPayload;
        user: AccessTokenPayload | RefreshTokenPayload;
    }
}
