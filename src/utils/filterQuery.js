const firstValue = value => Array.isArray(value) ? value[0] : value;

export const readFilterQuery = (query, defaults) => {
  const values = { ...defaults };

  Object.keys(defaults).forEach((key) => {
    const value = firstValue(query[key]);
    if (value !== undefined) {
      values[key] = key === 'page' ? Number.parseInt(value, 10) || 1 : value;
    }
  });

  return values;
};

export const buildFilterQuery = (values, defaults) => {
  const query = {};

  Object.keys(defaults).forEach((key) => {
    const value = values[key];
    const defaultValue = defaults[key];

    if (value === null || value === undefined || value === '') return;
    if (key === 'page' && Number(value) <= 1) return;
    if (String(value) === String(defaultValue)) return;

    query[key] = String(value);
  });

  return query;
};
