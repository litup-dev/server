export declare const createClubSchema: {
    body: {
        type: string;
        required: string[];
        properties: {
            name: {
                type: string;
                minLength: number;
                maxLength: number;
            };
            phone: {
                type: string;
                maxLength: number;
            };
            address: {
                type: string;
                maxLength: number;
            };
            description: {
                type: string;
            };
            capacity: {
                type: string;
                minimum: number;
            };
        };
    };
};
export declare const updateClubSchema: {
    params: {
        type: string;
        required: string[];
        properties: {
            id: {
                type: string;
                pattern: string;
            };
        };
    };
    body: {
        type: string;
        properties: {
            name: {
                type: string;
                minLength: number;
                maxLength: number;
            };
            phone: {
                type: string;
                maxLength: number;
            };
            address: {
                type: string;
                maxLength: number;
            };
            description: {
                type: string;
            };
            capacity: {
                type: string;
                minimum: number;
            };
        };
    };
};
export declare const getClubSchema: {
    params: {
        type: string;
        required: string[];
        properties: {
            id: {
                type: string;
                pattern: string;
            };
        };
    };
};
export declare const getClubsSchema: {
    querystring: {
        type: string;
        properties: {
            offset: {
                type: string;
                minimum: number;
                default: number;
            };
            limit: {
                type: string;
                minimum: number;
                maximum: number;
                default: number;
            };
        };
    };
};
export declare const toggleFavoriteSchema: {
    params: {
        type: string;
        required: string[];
        properties: {
            id: {
                type: string;
                pattern: string;
            };
        };
    };
};
//# sourceMappingURL=club.schema.d.ts.map