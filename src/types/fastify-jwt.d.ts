import '@fastify/jwt';
import { JwtPayload } from './jwt';

type AccessTokenPayload = {
    publicId: string;
    type: 'access';
};

type RefreshTokenPayload = {
    publicId: string;
    type: 'refresh';
    jti: string;
};

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: AccessTokenPayload | RefreshTokenPayload;
        user: AccessTokenPayload | RefreshTokenPayload;
    }
}
