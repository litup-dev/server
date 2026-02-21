import { NODE_ENV } from '@/common/constants';

export default function getCookieOptions() {
    return {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'lax' as const,
        signed: true,
    };
}
