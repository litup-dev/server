import moment from 'moment';

export function getCurrentTimestamp(): string {
    return moment().toISOString();
}

export function getCompactKoreaTimestamp(): string {
    return moment().format('YYYYMMDDHHmmss');
}
