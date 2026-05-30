import { describe, expect, it } from 'vitest';
import phoneNormalizer, { formatPhone } from './phoneNormalizer';

describe('phoneNormalizer', () => {
  it.each([
    ['03125575920', '03125575920'],
    ['3125575920', '03125575920'],
    ['+923125575920', '03125575920'],
    ['+9203125575920', '03125575920'],
    ['+92 312 5575920', '03125575920'],
    ['00923445326521', '03445326521'],
    ['009203125575920', '03125575920'],
    ['0312-1231231', '03121231231'],
    ['92 312 5575920', '03125575920'],
    ['9203125575920', '03125575920'],
    ['12312312', '12312312'],
    ['abcdefg', 'abcdefg'],
    ['', ''],
    [null, null],
  ])('normalizes %s to %s', (input, expected) => {
    expect(phoneNormalizer(input)).toBe(expected);
  });

  it('formats valid normalized numbers for display', () => {
    expect(formatPhone('03121231231')).toBe('0312 123 1231');
  });

  it('leaves invalid display values unchanged', () => {
    expect(formatPhone('abcdefg')).toBe('abcdefg');
  });
});
