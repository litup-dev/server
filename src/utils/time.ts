import moment from 'moment';

export function getCurrentTimestamp(): string {
    return moment().toISOString();
}

console.log(getCurrentTimestamp());

export function getCompactKoreaTimestamp(): string {
    return moment().format('YYYYMMDDHHmmss');
}
