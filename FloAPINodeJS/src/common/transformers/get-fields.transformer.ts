export const GET_FIELDS_TRANSFORMER = ({ value }) =>
    typeof value === 'string' ? value.split(',').map(v => v.trim())
    : (value !== null ? value : undefined);