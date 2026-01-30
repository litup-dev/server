import {
    HOST,
    PORT,
    API_PREFIX,
    KAKAO_CLIENT_SECRET,
    KAKAO_CLIENT_ID,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    NODE_ENV,
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
        callbackUri:
            NODE_ENV === 'production'
                ? `https://api.litup.kr${API_PREFIX}/auth/kakao/callback`
                : `http://220.93.50.45:${PORT}${API_PREFIX}/auth/kakao/callback`,
        callbackUriParams: {
            response_type: 'code',
        },
        tokenRequestParams: {
            client_id: KAKAO_CLIENT_ID,
            client_secret: KAKAO_CLIENT_SECRET,
        },
    });

    await fastify.register(oauth2, {
        name: 'googleOAuth2',
        scope: ['email', 'profile'],
        credentials: {
            client: {
                id: GOOGLE_CLIENT_ID!,
                secret: GOOGLE_CLIENT_SECRET!,
            },
            auth: {
                authorizeHost: 'https://accounts.google.com',
                authorizePath: '/o/oauth2/auth',
                tokenHost: 'https://www.googleapis.com',
                tokenPath: '/oauth2/v4/token',
            },
        },
        startRedirectPath: `${API_PREFIX}/auth/google`,
        callbackUri:
            NODE_ENV === 'production'
                ? `https://api.litup.kr${API_PREFIX}/auth/google/callback`
                : `http://220.93.50.45:${PORT}${API_PREFIX}/auth/google/callback`,
        callbackUriParams: {
            response_type: 'code',
        },
    });
}
