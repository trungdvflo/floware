export const TRIM_STRING_TRANSFORMER = ({ value }) => typeof value === 'string' ? value.trim()
    : (value !== null ? value : undefined);