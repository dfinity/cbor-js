import { it, describe, expect } from 'vitest';
import { encode, Replacer } from './encode';
import { CborValue } from '../cbor-value';

function bytesToHexArray(arrayBuffer: Uint8Array): string[] {
  return Array.from(arrayBuffer).map((byte) =>
    byte.toString(16).padStart(2, '0').toUpperCase()
  );
}

function bytesToHexString(arrayBuffer: Uint8Array): string {
  return bytesToHexArray(arrayBuffer).join('');
}

describe('encode', () => {
  it.each<{ value: CborValue; expected: string }>([
    // ###### SIMPLE ######

    { value: false, expected: 'F4' },
    { value: true, expected: 'F5' },
    { value: null, expected: 'F6' },
    { value: undefined, expected: 'F7' },

    // ###### ARRAYS ######

    { value: [], expected: '80' },
    { value: [1, 2, 3], expected: '83010203' },
    { value: ['a', { b: 'c' }], expected: '826161A161626163' },
    { value: [1, [2, 3], [4, 5]], expected: '8301820203820405' },
    { value: ['a', 'b', 'c', 'd', 'e'], expected: '8561616162616361646165' },
    {
      value: [
        BigInt('72057594037927935'),
        BigInt('72057594037927936'),
        BigInt('18446744073709551615'),
      ],
      expected: '831B00FFFFFFFFFFFFFF1B01000000000000001BFFFFFFFFFFFFFFFF',
    },
    {
      value: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25,
      ],
      expected: '98190102030405060708090A0B0C0D0E0F101112131415161718181819',
    },
    {
      // one byte length
      value: new Array(24).fill('a'),
      expected: `9818${new Array(24).fill('6161').join('')}`,
    },
    {
      // two byte length
      value: new Array(256).fill('a'),
      expected: `990100${new Array(256).fill('6161').join('')}`,
    },
    {
      // three byte length
      value: new Array(65_536).fill('a'),
      expected: `9A00010000${new Array(65_536).fill('6161').join('')}`,
    },

    // ###### MAPS ######

    { value: {}, expected: 'A0' },
    { value: { 1: 2, 3: 4 }, expected: 'A2613102613304' },
    { value: { a: 1, b: [2, 3] }, expected: 'A26161016162820203' },
    {
      value: { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' },
      expected: 'A56161614161626142616361436164614461656145',
    },

    // ###### STRINGS ######

    { value: '', expected: '60' },
    { value: 'a', expected: '6161' },
    { value: 'IETF', expected: '6449455446' },
    { value: '"\\', expected: '62225C' },
    { value: '\u00fc', expected: '62C3BC' },
    { value: '\ud800\udd51', expected: '64F0908591' },
    { value: 'Hello World!', expected: '6C48656C6C6F20576F726C6421' },
    {
      value: '2013-03-21T20:04:00Z',
      expected: '74323031332D30332D32315432303A30343A30305A',
    },
    {
      value: 'http://www.example.com',
      expected: '76687474703A2F2F7777772E6578616D706C652E636F6D',
    },
    {
      // one byte length
      value: new Array(24).fill('a').join(''),
      expected: `7818${new Array(24).fill('61').join('')}`,
    },
    {
      // two byte length
      value: new Array(256).fill('a').join(''),
      expected: `790100${new Array(256).fill('61').join('')}`,
    },
    {
      // three byte length
      value: new Array(65_536).fill('a').join(''),
      expected: `7A00010000${new Array(65_536).fill('61').join('')}`,
    },
    {
      // four byte length
      value: new Array(16_777_216).fill('a').join(''),
      expected: `7A01000000${new Array(16_777_216).fill('61').join('')}`,
    },

    // ###### POSITIVE NUMBERS ######

    { value: 1, expected: '01' }, // largest value in 1 bit
    { value: 3, expected: '03' }, // largest value in 2 bits
    { value: 7, expected: '07' }, // largest value in 3 bits
    { value: 15, expected: '0F' }, // largest value in 4 bits
    { value: 23, expected: '17' }, // largest value in first CBOR byte
    { value: 24, expected: '1818' }, // smallest value in two CBOR bytes
    { value: 31, expected: '181F' }, // largest value in 5 bits
    { value: 63, expected: '183F' }, // largest value in 6 bits
    { value: 127, expected: '187F' }, // largest value in 7 bits
    { value: 255, expected: '18FF' }, // largest value in one byte
    { value: 256, expected: '190100' }, // smallest value in two bytes
    { value: 65_535, expected: '19FFFF' }, // largest value in two bytes
    { value: 65_536, expected: '1A00010000' }, // smallest value in three bytes
    { value: 16_777_215, expected: '1A00FFFFFF' }, // largest value in three bytes
    { value: 16_777_216, expected: '1A01000000' }, // smallest value in four bytes
    { value: 4_294_967_295, expected: '1AFFFFFFFF' }, // largest value in four bytes
    { value: 4_294_967_296, expected: '1B0000000100000000' }, // smallest value in five bytes
    { value: 1_099_511_627_775, expected: '1B000000FFFFFFFFFF' }, // largest value in five bytes
    { value: 1_099_511_627_776, expected: '1B0000010000000000' }, // smallest values in six bytes
    { value: 281_474_976_710_655, expected: '1B0000FFFFFFFFFFFF' }, // largest values in six bytes
    { value: 281_474_976_710_656, expected: '1B0001000000000000' }, // smallest values in seven bytes
    { value: 72_057_594_037_927_935n, expected: '1B00FFFFFFFFFFFFFF' }, // largest values in seven bytes
    { value: 72_057_594_037_927_936n, expected: '1B0100000000000000' }, // smallest values in eight bytes
    { value: 18_446_744_073_709_551_615n, expected: '1BFFFFFFFFFFFFFFFF' }, // largest values in eight bytes

    // ###### NEGATIVE NUMBERS ######

    { value: -2, expected: '21' }, // largest value in 1 bit
    { value: -4, expected: '23' }, // largest value in 2 bits
    { value: -8, expected: '27' }, // largest value in 3 bits
    { value: -16, expected: '2F' }, // largest value in 4 bits
    { value: -24, expected: '37' }, // largest value in first CBOR byte
    { value: -25, expected: '3818' }, // smallest value in two CBOR bytes
    { value: -32, expected: '381F' }, // largest value in 5 bits
    { value: -64, expected: '383F' }, // largest value in 6 bits
    { value: -128, expected: '387F' }, // largest value in 7 bits
    { value: -256, expected: '38FF' }, // largest value in one byte
    { value: -257, expected: '390100' }, // smallest value in two bytes
    { value: -65_536, expected: '39FFFF' }, // largest value in two bytes
    { value: -65_537, expected: '3A00010000' }, // smallest value in three bytes
    { value: -16_777_216, expected: '3A00FFFFFF' }, // largest value in three bytes
    { value: -16_777_217, expected: '3A01000000' }, // smallest value in four bytes
    { value: -4_294_967_296, expected: '3AFFFFFFFF' }, // largest value in four bytes
    { value: -4_294_967_297, expected: '3B0000000100000000' }, // smallest value in five bytes
    { value: -1_099_511_627_776, expected: '3B000000FFFFFFFFFF' }, // largest value in five bytes
    { value: -1_099_511_627_777, expected: '3B0000010000000000' }, // smallest values in six bytes
    { value: -281_474_976_710_656, expected: '3B0000FFFFFFFFFFFF' }, // largest values in six bytes
    { value: -281_474_976_710_657, expected: '3B0001000000000000' }, // smallest values in seven bytes
    { value: -72_057_594_037_927_936n, expected: '3B00FFFFFFFFFFFFFF' }, // largest values in seven bytes
    { value: -72_057_594_037_927_937n, expected: '3B0100000000000000' }, // smallest values in eight bytes
    { value: -18_446_744_073_709_551_616n, expected: '3BFFFFFFFFFFFFFFFF' }, // largest values in eight bytes
  ])('should encode item %#', ({ value, expected }) => {
    const result = encode(value);

    expect(bytesToHexString(result)).toEqual(expected);
  });

  it('should throw if a positive value cannot fit within 8 bytes', () => {
    const value = 18_446_744_073_709_551_616n;
    const error = 'Value too large to encode: 18446744073709551616';

    expect(() => encode(value)).toThrow(error);
  });

  it('should throw if a negative value cannot fit within 8 bytes', () => {
    const value = -18_446_744_073_709_551_617n;
    const error = 'Value too large to encode: 18446744073709551616';

    expect(() => encode(value)).toThrow(error);
  });

  describe('encode with replacer', () => {
    it('should handle objects', () => {
      const value = { a: 1, b: 2 };
      const replacer: Replacer = (value) =>
        typeof value === 'number' ? value * 2 : value;
      const result = encode(value, replacer);

      expect(bytesToHexString(result)).toEqual('A2616102616204'); // { "a": 2, "b": 4 }
    });

    it('should handle null and undefined values', () => {
      const value = { a: null, b: undefined };
      const replacer: Replacer = (value) => (value === null ? 'null' : value);
      const result = encode(value, replacer);

      expect(bytesToHexString(result)).toEqual('A26161646E756C6C6162F7'); // { "a": "null", "b": undefined }
    });

    it('should handle nested objects', () => {
      const value = { a: { b: 3 } };
      const replacer: Replacer = (value, key) =>
        key === 'b' && typeof value === 'number' ? value + 1 : value;
      const result = encode(value, replacer);

      expect(bytesToHexString(result)).toEqual('A16161A1616204'); // { "a": { "b": 4 } }
    });

    it('should handle arrays', () => {
      const value = [1, 2, 3];
      const replacer: Replacer = (value) =>
        Array.isArray(value)
          ? value.map((v) => (typeof v === 'number' ? v * 2 : v))
          : value;
      const result = encode(value, replacer);

      expect(bytesToHexString(result)).toEqual('83020406'); // [2, 4, 6]
    });

    it('should handle objects with booleans', () => {
      const value = { a: false, b: true };
      const replacer: Replacer = (value) =>
        typeof value === 'boolean' ? !value : value;
      const result = encode(value, replacer);

      expect(bytesToHexString(result)).toEqual('A26161F56162F4'); // { "a": true, "b": false }
    });
  });

  it('should handle parallel encode calls correctly', async () => {
    const values = [
      { a: 1, b: 2 },
      { c: 3, d: 4 },
      { e: 5, f: 6 },
    ];

    const results = await Promise.all(values.map((value) => encode(value)));

    expect(bytesToHexString(results[0])).toEqual('A2616101616202'); // { "a": 1, "b": 2 }
    expect(bytesToHexString(results[1])).toEqual('A2616303616404'); // { "c": 3, "d": 4 }
    expect(bytesToHexString(results[2])).toEqual('A2616505616606'); // { "e": 5, "f": 6 }
  });
});
