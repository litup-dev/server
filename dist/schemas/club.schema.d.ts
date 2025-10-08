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
                pattern: string;
                maxLength: number;
            };
            description: {
                type: string;
            };
        };
    };
    response: {};
};
export declare const updateClubSchema: {
    params: {
        type: string;
        required: string[];
        properties: {
            id: {
                type: string;
            };
        };
    };
    body: {
        type: string;
        properties: {
            name: {
                type: string;
                maxLength: number;
            };
            phone: {
                type: string;
                maxLength: number;
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
//# sourceMappingURL=club.schema.d.ts.map