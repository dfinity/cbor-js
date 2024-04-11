import { it, describe, expect } from 'vitest';
import { decode } from './decode';
import { CborValue } from '../cbor-value';
import { Principal } from '@dfinity/principal';

export function hexArrayToArrayBuffer(hexArray: string[]): ArrayBuffer {
  const uint8Array = new Uint8Array(hexArray.map((byte) => parseInt(byte, 16)));

  return uint8Array.buffer;
}

export function hexStringToArrayBuffer(hexString: string): ArrayBuffer {
  const hexArray = hexString.match(/.{1,2}/g) || [];

  return hexArrayToArrayBuffer(hexArray);
}

describe('decode', () => {
  it.each<{ bytes: string; expected: CborValue }>([
    // ###### SIMPLE ######

    { bytes: 'F4', expected: false },
    { bytes: 'F5', expected: true },
    { bytes: 'F6', expected: null },
    { bytes: 'F7', expected: undefined },

    // ###### ARRAYS ######

    { bytes: '80', expected: [] },
    { bytes: '83010203', expected: [1, 2, 3] },
    { bytes: '826161A161626163', expected: ['a', { b: 'c' }] },
    { bytes: '8301820203820405', expected: [1, [2, 3], [4, 5]] },
    { bytes: '8561616162616361646165', expected: ['a', 'b', 'c', 'd', 'e'] },
    {
      bytes: '831B00FFFFFFFFFFFFFF1B01000000000000001BFFFFFFFFFFFFFFFF',
      expected: [
        BigInt('72057594037927935'),
        BigInt('72057594037927936'),
        BigInt('18446744073709551615'),
      ],
    },
    {
      bytes: '98190102030405060708090A0B0C0D0E0F101112131415161718181819',
      expected: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25,
      ],
    },
    {
      // one byte length
      bytes: `9818${new Array(24).fill('6161').join('')}`,
      expected: new Array(24).fill('a'),
    },
    {
      // two byte length
      bytes: `990100${new Array(256).fill('6161').join('')}`,
      expected: new Array(256).fill('a'),
    },
    {
      // three byte length
      bytes: `9A00010000${new Array(65_536).fill('6161').join('')}`,
      expected: new Array(65_536).fill('a'),
    },

    // ###### MAPS ######

    { bytes: 'A0', expected: {} },
    { bytes: 'A2613102613304', expected: { 1: 2, 3: 4 } },
    { bytes: 'A26161016162820203', expected: { a: 1, b: [2, 3] } },
    {
      bytes: 'A56161614161626142616361436164614461656145',
      expected: { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' },
    },

    // ###### STRINGS ######

    { bytes: '60', expected: '' },
    { bytes: '6161', expected: 'a' },
    { bytes: '6449455446', expected: 'IETF' },
    { bytes: '62225C', expected: '"\\' },
    { bytes: '62C3BC', expected: '\u00fc' },
    { bytes: '64F0908591', expected: '\ud800\udd51' },
    { bytes: '6C48656C6C6F20576F726C6421', expected: 'Hello World!' },
    {
      bytes: '74323031332D30332D32315432303A30343A30305A',
      expected: '2013-03-21T20:04:00Z',
    },
    {
      bytes: '76687474703A2F2F7777772E6578616D706C652E636F6D',
      expected: 'http://www.example.com',
    },
    {
      // one byte length
      bytes: `7818${new Array(24).fill('61').join('')}`,
      expected: new Array(24).fill('a').join(''),
    },
    {
      // two byte length
      bytes: `790100${new Array(256).fill('61').join('')}`,
      expected: new Array(256).fill('a').join(''),
    },
    {
      // three byte length
      bytes: `7A00010000${new Array(65_536).fill('61').join('')}`,
      expected: new Array(65_536).fill('a').join(''),
    },
    {
      // four byte length
      bytes: `7A01000000${new Array(16_777_216).fill('61').join('')}`,
      expected: new Array(16_777_216).fill('a').join(''),
    },

    // ###### POSITIVE INTEGERS ######

    { bytes: '01', expected: 1 }, // largest value in 1 bit
    { bytes: '03', expected: 3 }, // largest value in 2 bits
    { bytes: '07', expected: 7 }, // largest value in 3 bits
    { bytes: '0F', expected: 15 }, // largest value in 4 bits
    { bytes: '17', expected: 23 }, // largest value in first CBOR byte
    { bytes: '1818', expected: 24 }, // smallest value in two CBOR bytes
    { bytes: '181F', expected: 31 }, // largest value in 5 bits
    { bytes: '183F', expected: 63 }, // largest value in 6 bits
    { bytes: '187F', expected: 127 }, // largest value in 7 bits
    { bytes: '18FF', expected: 255 }, // largest value in one byte
    { bytes: '190100', expected: 256 }, // smallest value in two bytes
    { bytes: '19FFFF', expected: 65_535 }, // largest value in two bytes
    { bytes: '1A00010000', expected: 65_536 }, // smallest value in three bytes
    { bytes: '1A00FFFFFF', expected: 16_777_215 }, // largest value in three bytes
    { bytes: '1A01000000', expected: 16_777_216 }, // smallest value in four bytes
    { bytes: '1AFFFFFFFF', expected: 4_294_967_295 }, // largest value in four bytes
    { bytes: '1B0000000100000000', expected: 4_294_967_296n }, // smallest value in five bytes
    { bytes: '1B000000FFFFFFFFFF', expected: 1_099_511_627_775n }, // largest value in five bytes
    { bytes: '1B0000010000000000', expected: 1_099_511_627_776n }, // smallest values in six bytes
    { bytes: '1B0000FFFFFFFFFFFF', expected: 281_474_976_710_655n }, // largest values in six bytes
    { bytes: '1B0001000000000000', expected: 281_474_976_710_656n }, // smallest values in seven bytes
    { bytes: '1B00FFFFFFFFFFFFFF', expected: 72_057_594_037_927_935n }, // largest values in seven bytes
    { bytes: '1B0100000000000000', expected: 72_057_594_037_927_936n }, // smallest values in eight bytes
    { bytes: '1BFFFFFFFFFFFFFFFF', expected: 18_446_744_073_709_551_615n }, // largest values in eight bytes

    // ###### NEGATIVE INTEGERS ######

    { bytes: '21', expected: -2 }, // largest value in 1 bit
    { bytes: '23', expected: -4 }, // largest value in 2 bits
    { bytes: '27', expected: -8 }, // largest value in 3 bits
    { bytes: '2F', expected: -16 }, // largest value in 4 bits
    { bytes: '37', expected: -24 }, // largest value in first CBOR byte
    { bytes: '3818', expected: -25 }, // smallest value in two CBOR bytes
    { bytes: '381F', expected: -32 }, // largest value in 5 bits
    { bytes: '383F', expected: -64 }, // largest value in 6 bits
    { bytes: '387F', expected: -128 }, // largest value in 7 bits
    { bytes: '38FF', expected: -256 }, // largest value in one byte
    { bytes: '390100', expected: -257 }, // smallest value in two bytes
    { bytes: '39FFFF', expected: -65_536 }, // largest value in two bytes
    { bytes: '3A00010000', expected: -65_537 }, // smallest value in three bytes
    { bytes: '3A00FFFFFF', expected: -16_777_216 }, // largest value in three bytes
    { bytes: '3A01000000', expected: -16_777_217 }, // smallest value in four bytes
    { bytes: '3AFFFFFFFF', expected: -4_294_967_296 }, // largest value in four bytes
    { bytes: '3B0000000100000000', expected: -4_294_967_297n }, // smallest value in five bytes
    { bytes: '3B000000FFFFFFFFFF', expected: -1_099_511_627_776n }, // largest value in five bytes
    { bytes: '3B0000010000000000', expected: -1_099_511_627_777n }, // smallest values in six bytes
    { bytes: '3B0000FFFFFFFFFFFF', expected: -281_474_976_710_656n }, // largest values in six bytes
    { bytes: '3B0001000000000000', expected: -281_474_976_710_657n }, // smallest values in seven bytes
    { bytes: '3B00FFFFFFFFFFFFFF', expected: -72_057_594_037_927_936n }, // largest values in seven bytes
    { bytes: '3B0100000000000000', expected: -72_057_594_037_927_937n }, // smallest values in eight bytes
    { bytes: '3BFFFFFFFFFFFFFFFF', expected: -18_446_744_073_709_551_616n }, // largest values in eight bytes
  ])('should decode item %#', ({ bytes, expected }) => {
    const bytesArray = new Uint8Array(hexStringToArrayBuffer(bytes));
    const result = decode(bytesArray);

    expect(result).toEqual(expected);
  });
  it.only('asdf', () => {
    decode<Principal>(
      new Uint8Array(hexStringToArrayBuffer('d9d9f74a00000000000000000101')),
      {
        decoders: [
          {
            tag: 6,
            matcher: () => true,
            decoder: (value: Uint8Array) => Principal.fromUint8Array(value),
          },
        ],
      }
    )?.toString(); //?
  });
});


