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
                pattern: '^[0-9-]+$',
                maxLength: 15
            },
            description: { type: 'string' },
        }
    },
    response: {}
};
export const updateClubSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string' }
        }
    },
    body: {
        type: 'object',
        properties: {
            name: { type: 'string', maxLength: 20 },
            phone: { type: 'string', maxLength: 15 },
        }
    }
};
export const getClubSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', pattern: '^[0-9]+$' }
        }
    }
};
//# sourceMappingURL=club.schema.js.map