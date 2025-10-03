export const NUMBER_ONLY_TRANSFORMER = ({ value }) => {
  return +value || undefined;
};