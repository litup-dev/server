export const PrivacyLevel = {
    PUBLIC: 'public',
    FRIENDS: 'friends',
    PRIVATE: 'private',
} as const;

export type PrivacyLevelType = (typeof PrivacyLevel)[keyof typeof PrivacyLevel];
