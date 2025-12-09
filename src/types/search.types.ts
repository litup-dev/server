export enum ClubSearchArea {
    SEOUL = 'seoul',
    BUSAN = 'busan',
    OTHER = 'other',
    NEARBY = 'nearby',
}

export enum ClubSortBy {
    REVIEW_COUNT_DESC = '-reviewCount',
    REVIEW_COUNT_ASC = '+reviewCount',
    RECENT_REVIEW = '-reviewCreatedAt',
    OLDEST_REVIEW = '+reviewCreatedAt',
    RATING_DESC = '-rating',
    RATING_ASC = '+rating',
}
