export declare const createReviewSchema: {
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
        required: string[];
        properties: {
            rating: {
                type: string;
                minimum: number;
                maximum: number;
            };
            content: {
                type: string;
                maxLength: number;
            };
            keywords: {
                type: string;
                items: {
                    type: string;
                };
            };
        };
    };
};
export declare const updateReviewSchema: {
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
            rating: {
                type: string;
                minimum: number;
                maximum: number;
            };
            content: {
                type: string;
                maxLength: number;
            };
            keywords: {
                type: string;
                items: {
                    type: string;
                };
            };
        };
    };
};
export declare const getReviewSchema: {
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
export declare const getReviewsSchema: {
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
//# sourceMappingURL=review.schema.d.ts.map