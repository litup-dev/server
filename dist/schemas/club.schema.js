export const createClubSchema = {
    body: {
        type: 'object',
        required: ['name'],
        properties: {
            name: {
                type: 'string',
                minLength: 1,
                maxLength: 20
            },
            phone: {
                type: 'string',
                maxLength: 15
            },
            address: {
                type: 'string',
                maxLength: 50
            },
            description: {
                type: 'string'
            },
            capacity: {
                type: 'number',
                minimum: 1
            }
        }
    }
};
export const updateClubSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: {
                type: 'string',
                pattern: '^[0-9]+$'
            }
        }
    },
    body: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                minLength: 1,
                maxLength: 20
            },
            phone: {
                type: 'string',
                maxLength: 15
            },
            address: {
                type: 'string',
                maxLength: 50
            },
            description: {
                type: 'string'
            },
            capacity: {
                type: 'number',
                minimum: 1
            }
        }
    }
};
export const getClubSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: {
                type: 'string',
                pattern: '^[0-9]+$'
            }
        }
    }
};
export const getClubsSchema = {
    querystring: {
        type: 'object',
        properties: {
            offset: {
                type: 'number',
                minimum: 0,
                default: 0
            },
            limit: {
                type: 'number',
                minimum: 1,
                maximum: 100,
                default: 20
            }
        }
    }
};
export const toggleFavoriteSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: {
                type: 'string',
                pattern: '^[0-9]+$'
            }
        }
    }
};
//# sourceMappingURL=club.schema.js.map