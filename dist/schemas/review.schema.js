export const createReviewSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', pattern: '^[0-9]+$' }
        }
    },
    body: {
        type: 'object',
        required: ['rating'],
        properties: {
            rating: {
                type: 'number',
                minimum: 0,
                maximum: 5
            },
            content: {
                type: 'string',
                maxLength: 500
            },
            keywords: {
                type: 'array',
                items: { type: 'number' }
            }
        }
    }
};
export const updateReviewSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', pattern: '^[0-9]+$' }
        }
    },
    body: {
        type: 'object',
        properties: {
            rating: {
                type: 'number',
                minimum: 0,
                maximum: 5
            },
            content: {
                type: 'string',
                maxLength: 500
            },
            keywords: {
                type: 'array',
                items: { type: 'number' }
            }
        }
    }
};
export const getReviewSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', pattern: '^[0-9]+$' }
        }
    }
};
export const getReviewsSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', pattern: '^[0-9]+$' }
        }
    },
    querystring: {
        type: 'object',
        properties: {
            offset: { type: 'number', minimum: 0, default: 0 },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 10 }
        }
    }
};
//# sourceMappingURL=review.schema.js.map