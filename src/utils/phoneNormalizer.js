export const phoneNormalizer = (input) => {
  if (input === null) return null;
  if (input === undefined) return undefined;
  if (typeof input === 'object' || typeof input === 'function' || typeof input === 'symbol') return input;

  const raw = String(input);
  let phone = raw.replace(/[\s\-().]+/g, '');

  if (phone.startsWith('+9203')) {
    phone = `03${phone.slice(5)}`;
  } else if (phone.startsWith('+92')) {
    phone = `0${phone.slice(3)}`;
  } else if (phone.startsWith('009203')) {
    phone = `03${phone.slice(6)}`;
  } else if (phone.startsWith('0092')) {
    phone = `0${phone.slice(4)}`;
  } else if (phone.startsWith('9203') && phone.length === 13) {
    phone = `03${phone.slice(4)}`;
  } else if (phone.startsWith('92') && phone.length === 12) {
    phone = `0${phone.slice(2)}`;
  } else if (phone.startsWith('3') && phone.length === 10) {
    phone = `0${phone}`;
  } else if (phone.startsWith('03') && phone.length === 11) {
    // Already in target format.
  }

  return /^03[0-9]{9}$/.test(phone) ? phone : input;
};

export const isNormalizedPakistaniMobile = value => /^03[0-9]{9}$/.test(String(value || ''));

export const formatPhone = (value) => {
  const normalized = phoneNormalizer(value);
  if (!isNormalizedPakistaniMobile(normalized)) return value;

  return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
};

export default phoneNormalizer;
