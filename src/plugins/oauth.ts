import {
    HOST,
    PORT,
    API_PREFIX,
    KAKAO_CLIENT_SECRET,
    KAKAO_CLIENT_ID,
} from './../common/constants';
import oauth2 from '@fastify/oauth2';
import { FastifyInstance } from 'fastify';

export async function registerOauth(fastify: FastifyInstance) {
    await fastify.register(oauth2, {
        name: 'kakaoOAuth2',
        scope: ['account_email'],
        credentials: {
            client: {
                id: KAKAO_CLIENT_ID!,
                secret: KAKAO_CLIENT_SECRET!,
            },
            auth: {
                authorizeHost: 'https://kauth.kakao.com',
                authorizePath: '/oauth/authorize',
                tokenHost: 'https://kauth.kakao.com',
                tokenPath: '/oauth/token',
            },
        },
        startRedirectPath: `${API_PREFIX}/auth/kakao`,
        callbackUri: `http://${HOST}:${PORT}${API_PREFIX}/auth/kakao/callback`,
        callbackUriParams: {
            response_type: 'code',
        },
        tokenRequestParams: {
            client_id: KAKAO_CLIENT_ID,
            client_secret: KAKAO_CLIENT_SECRET,
        },
    });
}
