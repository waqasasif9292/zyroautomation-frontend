const firstValue = value => Array.isArray(value) ? value[0] : value;
const arrayValue = value => (Array.isArray(value) ? value : [value])
  .map(item => String(item || '').trim())
  .filter(Boolean);

export const readFilterQuery = (query, defaults) => {
  const values = { ...defaults };

  Object.keys(defaults).forEach((key) => {
    const defaultValue = defaults[key];
    const value = Array.isArray(defaultValue) ? arrayValue(query[key]) : firstValue(query[key]);
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

    if (Array.isArray(value)) {
      if (!value.length) return;
      query[key] = value.map(item => String(item));
      return;
    }

    if (value === null || value === undefined || value === '') return;
    if (key === 'page' && Number(value) <= 1) return;
    if (String(value) === String(defaultValue)) return;

    query[key] = String(value);
  });

  return query;
};
