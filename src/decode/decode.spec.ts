import { it, describe, expect } from 'vitest';
import { decode, Reviver } from './decode';
import { CborValue } from '../cbor-value';

function hexArrayToBytes(hexArray: string[]): Uint8Array {
  return new Uint8Array(hexArray.map(byte => parseInt(byte, 16)));
}

function hexStringToBytes(hexString: string): Uint8Array {
  const hexArray = hexString.match(/.{1,2}/g) || [];

  return hexArrayToBytes(hexArray);
}

describe('decode', () => {
  it.each<{ bytes: string; expected: CborValue }>([
    // ###### SIMPLE ######

    { bytes: 'F4', expected: false }, // false
    { bytes: 'D9D9F7F4', expected: false }, // self-described false
    { bytes: 'F5', expected: true }, // true
    { bytes: 'D9D9F7F5', expected: true }, // self-described true
    { bytes: 'F6', expected: null }, // null
    { bytes: 'D9D9F7F6', expected: null }, // self-described null
    { bytes: 'F7', expected: undefined }, // undefined
    { bytes: 'D9D9F7F7', expected: undefined }, // self-described undefined

    // ###### ARRAYS ######

    { bytes: '80', expected: [] }, // empty array
    { bytes: 'D9D9F780', expected: [] }, // self-described empty array
    { bytes: '9FFF', expected: [] }, // indeterminate length empty array
    { bytes: 'D9D9F79FFF', expected: [] }, // self-described indeterminate length empty array

    { bytes: '83010203', expected: [1, 2, 3] }, // array of numbers
    { bytes: 'D9D9F783010203', expected: [1, 2, 3] }, // self-described array of numbers
    { bytes: '9F010203FF', expected: [1, 2, 3] }, // indeterminate length array of numbers
    { bytes: 'D9D9F79F010203FF', expected: [1, 2, 3] }, // self-described indeterminate length array of numbers

    { bytes: '826161A161626163', expected: ['a', { b: 'c' }] }, // array of strings and objects
    { bytes: 'D9D9F7826161A161626163', expected: ['a', { b: 'c' }] }, // self-described array of strings and objects
    { bytes: '9F6161A161626163FF', expected: ['a', { b: 'c' }] }, // indeterminate length array of strings and objects
    { bytes: 'D9D9F79F6161A161626163FF', expected: ['a', { b: 'c' }] }, // self-described indeterminate length array of strings and objects

    { bytes: '8301820203820405', expected: [1, [2, 3], [4, 5]] }, // nested arrays
    { bytes: 'D9D9F78301820203820405', expected: [1, [2, 3], [4, 5]] }, // self-described nested arrays
    { bytes: '9F01820203820405FF', expected: [1, [2, 3], [4, 5]] }, // indeterminate length nested arrays
    { bytes: 'D9D9F79F01820203820405FF', expected: [1, [2, 3], [4, 5]] }, // self-described indeterminate length nested arrays

    { bytes: '8561616162616361646165', expected: ['a', 'b', 'c', 'd', 'e'] }, // array of strings
    {
      // self-described array of strings
      bytes: 'D9D9F78561616162616361646165',
      expected: ['a', 'b', 'c', 'd', 'e'],
    },
    { bytes: '9F61616162616361646165FF', expected: ['a', 'b', 'c', 'd', 'e'] }, // indeterminate length array of strings
    {
      // self-described indeterminate length array of strings
      bytes: 'D9D9F79F61616162616361646165FF',
      expected: ['a', 'b', 'c', 'd', 'e'],
    },

    {
      // kitchen sink array
      bytes: '89016161F7A261610161326162F48301616203F5F6836161026163',
      expected: [
        1,
        'a',
        undefined,
        { a: 1, '2': 'b' },
        false,
        [1, 'b', 3],
        true,
        null,
        ['a', 2, 'c'],
      ],
    },
    {
      // self-described kitchen sink array
      bytes: 'D9D9F789016161F7A261610161326162F48301616203F5F6836161026163',
      expected: [
        1,
        'a',
        undefined,
        { a: 1, '2': 'b' },
        false,
        [1, 'b', 3],
        true,
        null,
        ['a', 2, 'c'],
      ],
    },
    {
      // indeterminate length kitchen sink array
      bytes: '9F016161F7A261610161326162F48301616203F5F6836161026163FF',
      expected: [
        1,
        'a',
        undefined,
        { a: 1, '2': 'b' },
        false,
        [1, 'b', 3],
        true,
        null,
        ['a', 2, 'c'],
      ],
    },
    {
      // self-described indeterminate length kitchen sink array
      bytes: 'D9D9F79F016161F7A261610161326162F48301616203F5F6836161026163FF',
      expected: [
        1,
        'a',
        undefined,
        { a: 1, '2': 'b' },
        false,
        [1, 'b', 3],
        true,
        null,
        ['a', 2, 'c'],
      ],
    },

    {
      // array of big ints
      bytes: '831B00FFFFFFFFFFFFFF1B01000000000000001BFFFFFFFFFFFFFFFF',
      expected: [
        BigInt('72057594037927935'),
        BigInt('72057594037927936'),
        BigInt('18446744073709551615'),
      ],
    },
    {
      // self-described array of big ints
      bytes: 'D9D9F7831B00FFFFFFFFFFFFFF1B01000000000000001BFFFFFFFFFFFFFFFF',
      expected: [
        BigInt('72057594037927935'),
        BigInt('72057594037927936'),
        BigInt('18446744073709551615'),
      ],
    },
    {
      // indeterminate length array of big ints
      bytes: '9F1B00FFFFFFFFFFFFFF1B01000000000000001BFFFFFFFFFFFFFFFFFF',
      expected: [
        BigInt('72057594037927935'),
        BigInt('72057594037927936'),
        BigInt('18446744073709551615'),
      ],
    },
    {
      // self-described indeterminate length array of big ints
      bytes: 'D9D9F79F1B00FFFFFFFFFFFFFF1B01000000000000001BFFFFFFFFFFFFFFFFFF',
      expected: [
        BigInt('72057594037927935'),
        BigInt('72057594037927936'),
        BigInt('18446744073709551615'),
      ],
    },

    {
      // large array of numbers
      bytes: '98190102030405060708090A0B0C0D0E0F101112131415161718181819',
      expected: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25,
      ],
    },
    {
      // self-described large array of numbers
      bytes: 'D9D9F798190102030405060708090A0B0C0D0E0F101112131415161718181819',
      expected: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25,
      ],
    },
    {
      // indeterminate length large array of numbers
      bytes: '9F0102030405060708090A0B0C0D0E0F101112131415161718181819FF',
      expected: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25,
      ],
    },
    {
      // self-described indeterminate length large array of numbers
      bytes: 'D9D9F79F0102030405060708090A0B0C0D0E0F101112131415161718181819FF',
      expected: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25,
      ],
    },

    {
      // one byte length array
      bytes: `9818${new Array(24).fill('6161').join('')}`,
      expected: new Array(24).fill('a'),
    },
    {
      // self-described one byte length array
      bytes: `D9D9F79818${new Array(24).fill('6161').join('')}`,
      expected: new Array(24).fill('a'),
    },
    {
      // indeterminate length one byte array
      bytes: `9F${new Array(24).fill('6161').join('')}FF`,
      expected: new Array(24).fill('a'),
    },
    {
      // self-described indeterminate length one byte array
      bytes: `D9D9F79F${new Array(24).fill('6161').join('')}FF`,
      expected: new Array(24).fill('a'),
    },

    {
      // self-described two byte length array
      bytes: `990100${new Array(256).fill('6161').join('')}`,
      expected: new Array(256).fill('a'),
    },
    {
      // self-described two byte length array
      bytes: `D9D9F7990100${new Array(256).fill('6161').join('')}`,
      expected: new Array(256).fill('a'),
    },
    {
      // indeterminate length two byte array
      bytes: `9F${new Array(256).fill('6161').join('')}FF`,
      expected: new Array(256).fill('a'),
    },
    {
      // self-described indeterminate length two byte array
      bytes: `D9D9F79F${new Array(256).fill('6161').join('')}FF`,
      expected: new Array(256).fill('a'),
    },

    {
      // self-described three byte length array
      bytes: `9A00010000${new Array(65_536).fill('6161').join('')}`,
      expected: new Array(65_536).fill('a'),
    },
    {
      // tself-described three byte length array
      bytes: `D9D9F79A00010000${new Array(65_536).fill('6161').join('')}`,
      expected: new Array(65_536).fill('a'),
    },
    {
      // indeterminate length three byte array
      bytes: `9F${new Array(65_536).fill('6161').join('')}FF`,
      expected: new Array(65_536).fill('a'),
    },
    {
      // self-described indeterminate length three byte array
      bytes: `D9D9F79F${new Array(65_536).fill('6161').join('')}FF`,
      expected: new Array(65_536).fill('a'),
    },

    // ###### MAPS ######

    { bytes: 'A0', expected: {} }, // empty map
    { bytes: 'D9D9F7A0', expected: {} }, // self-described empty map
    { bytes: 'BFFF', expected: {} }, // indeterminate length empty map
    { bytes: 'D9D9F7BFFF', expected: {} }, // self-described indeterminate length empty map

    { bytes: 'A2613102613304', expected: { 1: 2, 3: 4 } }, // map of numbers
    { bytes: 'D9D9F7A2613102613304', expected: { 1: 2, 3: 4 } }, // self-described map of numbers
    { bytes: 'BF613102613304FF', expected: { 1: 2, 3: 4 } }, // indeterminate length map of numbers
    { bytes: 'D9D9F7BF613102613304FF', expected: { 1: 2, 3: 4 } }, // self-described indeterminate length map of numbers

    { bytes: 'A26161016162820203', expected: { a: 1, b: [2, 3] } }, // map of numbers and arrays
    { bytes: 'D9D9F7A26161016162820203', expected: { a: 1, b: [2, 3] } }, // self-described map of numbers and arrays
    { bytes: 'BF6161016162820203FF', expected: { a: 1, b: [2, 3] } }, // indeterminate length map of numbers and arrays
    { bytes: 'D9D9F7BF6161016162820203FF', expected: { a: 1, b: [2, 3] } }, // self-described indeterminate length map of numbers and arrays

    {
      // large map of strings
      bytes: 'A56161614161626142616361436164614461656145',
      expected: { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' },
    },
    {
      // self-described large map of strings
      bytes: 'D9D9F7A56161614161626142616361436164614461656145',
      expected: { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' },
    },
    {
      // indeterminate length large map of strings
      bytes: 'BF6161614161626142616361436164614461656145FF',
      expected: { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' },
    },
    {
      // self-described indeterminate length large map of strings
      bytes: 'D9D9F7BF6161614161626142616361436164614461656145FF',
      expected: { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' },
    },

    // ###### STRINGS ######

    { bytes: '60', expected: '' }, // empty string
    { bytes: 'D9D9F760', expected: '' }, // self-described empty string
    { bytes: '6161', expected: 'a' }, // string of one byte
    { bytes: 'D9D9F76161', expected: 'a' }, // self-described string of one byte
    { bytes: '6449455446', expected: 'IETF' }, // string of four bytes
    { bytes: 'D9D9F76449455446', expected: 'IETF' }, // self-described string of four bytes
    { bytes: '62225C', expected: '"\\' }, // string with escaped characters
    { bytes: 'D9D9F762225C', expected: '"\\' }, // self-described string with escaped characters
    { bytes: '62C3BC', expected: '\u00fc' }, // string with unicode character
    { bytes: 'D9D9F762C3BC', expected: '\u00fc' }, // self-described string with unicode character
    { bytes: '64F0908591', expected: '\ud800\udd51' }, // string with surrogate pair
    { bytes: 'D9D9F764F0908591', expected: '\ud800\udd51' }, // self-described string with surrogate pair
    { bytes: '6C48656C6C6F20576F726C6421', expected: 'Hello World!' }, // string with ASCII characters
    { bytes: 'D9D9F76C48656C6C6F20576F726C6421', expected: 'Hello World!' }, // self-described string with ASCII characters
    {
      // datetime
      bytes: '74323031332D30332D32315432303A30343A30305A',
      expected: '2013-03-21T20:04:00Z',
    },
    {
      // self-described datetime
      bytes: 'D9D9F774323031332D30332D32315432303A30343A30305A',
      expected: '2013-03-21T20:04:00Z',
    },
    {
      // website URL
      bytes: '76687474703A2F2F7777772E6578616D706C652E636F6D',
      expected: 'http://www.example.com',
    },
    {
      // self-described website URL
      bytes: 'D9D9F776687474703A2F2F7777772E6578616D706C652E636F6D',
      expected: 'http://www.example.com',
    },
    {
      // one byte length string
      bytes: `7818${new Array(24).fill('61').join('')}`,
      expected: new Array(24).fill('a').join(''),
    },
    {
      // self-described one byte length string
      bytes: `D9D9F77818${new Array(24).fill('61').join('')}`,
      expected: new Array(24).fill('a').join(''),
    },
    {
      // two byte length string
      bytes: `790100${new Array(256).fill('61').join('')}`,
      expected: new Array(256).fill('a').join(''),
    },
    {
      // self-described two byte length string
      bytes: `D9D9F7790100${new Array(256).fill('61').join('')}`,
      expected: new Array(256).fill('a').join(''),
    },
    {
      // three byte length string
      bytes: `7A00010000${new Array(65_536).fill('61').join('')}`,
      expected: new Array(65_536).fill('a').join(''),
    },
    {
      // self-described three byte length string
      bytes: `D9D9F77A00010000${new Array(65_536).fill('61').join('')}`,
      expected: new Array(65_536).fill('a').join(''),
    },
    {
      // four byte length string
      bytes: `7A01000000${new Array(16_777_216).fill('61').join('')}`,
      expected: new Array(16_777_216).fill('a').join(''),
    },
    {
      // self-described four byte length string
      bytes: `D9D9F77A01000000${new Array(16_777_216).fill('61').join('')}`,
      expected: new Array(16_777_216).fill('a').join(''),
    },

    // ###### POSITIVE INTEGERS ######

    { bytes: '01', expected: 1 }, // largest value in 1 bit
    { bytes: 'D9D9F701', expected: 1 }, // self-described largest value in 1 bit
    { bytes: '03', expected: 3 }, // largest value in 2 bits
    { bytes: 'D9D9F703', expected: 3 }, // self-described largest value in 2 bits
    { bytes: '07', expected: 7 }, // largest value in 3 bits
    { bytes: 'D9D9F707', expected: 7 }, // self-described largest value in 3 bits
    { bytes: '0F', expected: 15 }, // largest value in 4 bits
    { bytes: 'D9D9F70F', expected: 15 }, // self-described largest value in 4 bits
    { bytes: '17', expected: 23 }, // largest value in first CBOR byte
    { bytes: 'D9D9F717', expected: 23 }, // self-described largest value in first CBOR byte
    { bytes: '1818', expected: 24 }, // smallest value in two CBOR bytes
    { bytes: 'D9D9F71818', expected: 24 }, // self-described smallest value in two CBOR bytes
    { bytes: '181F', expected: 31 }, // largest value in 5 bits
    { bytes: 'D9D9F7181F', expected: 31 }, // self-described largest value in 5 bits
    { bytes: '183F', expected: 63 }, // largest value in 6 bits
    { bytes: 'D9D9F7183F', expected: 63 }, // self-described largest value in 6 bits
    { bytes: '187F', expected: 127 }, // largest value in 7 bits
    { bytes: 'D9D9F7187F', expected: 127 }, // self-described largest value in 7 bits
    { bytes: '18FF', expected: 255 }, // largest value in one byte
    { bytes: 'D9D9F718FF', expected: 255 }, // self-described largest value in one byte
    { bytes: '190100', expected: 256 }, // smallest value in two bytes
    { bytes: 'D9D9F7190100', expected: 256 }, // self-described smallest value in two bytes
    { bytes: '19FFFF', expected: 65_535 }, // largest value in two bytes
    { bytes: 'D9D9F719FFFF', expected: 65_535 }, // self-described largest value in two bytes
    { bytes: '1A00010000', expected: 65_536 }, // smallest value in three bytes
    { bytes: 'D9D9F71A00010000', expected: 65_536 }, // self-described smallest value in three bytes
    { bytes: '1A00FFFFFF', expected: 16_777_215 }, // largest value in three bytes
    { bytes: 'D9D9F71A00FFFFFF', expected: 16_777_215 }, // self-described largest value in three bytes
    { bytes: '1A01000000', expected: 16_777_216 }, // smallest value in four bytes
    { bytes: 'D9D9F71A01000000', expected: 16_777_216 }, // self-described smallest value in four bytes
    { bytes: '1AFFFFFFFF', expected: 4_294_967_295 }, // largest value in four bytes
    { bytes: 'D9D9F71AFFFFFFFF', expected: 4_294_967_295 }, // self-described largest value in four bytes
    { bytes: '1B0000000100000000', expected: 4_294_967_296n }, // smallest value in five bytes
    { bytes: 'D9D9F71B0000000100000000', expected: 4_294_967_296n }, // self-described smallest value in five bytes
    { bytes: '1B000000FFFFFFFFFF', expected: 1_099_511_627_775n }, // largest value in five bytes
    { bytes: 'D9D9F71B000000FFFFFFFFFF', expected: 1_099_511_627_775n }, // self-described largest value in five bytes
    { bytes: '1B0000010000000000', expected: 1_099_511_627_776n }, // smallest values in six bytes
    { bytes: 'D9D9F71B0000010000000000', expected: 1_099_511_627_776n }, // self-described smallest values in six bytes
    { bytes: '1B0000FFFFFFFFFFFF', expected: 281_474_976_710_655n }, // largest values in six bytes
    { bytes: 'D9D9F71B0000FFFFFFFFFFFF', expected: 281_474_976_710_655n }, // self-described largest values in six bytes
    { bytes: '1B0001000000000000', expected: 281_474_976_710_656n }, // smallest values in seven bytes
    { bytes: 'D9D9F71B0001000000000000', expected: 281_474_976_710_656n }, // self-described smallest values in seven bytes
    { bytes: '1B00FFFFFFFFFFFFFF', expected: 72_057_594_037_927_935n }, // largest values in seven bytes
    { bytes: 'D9D9F71B00FFFFFFFFFFFFFF', expected: 72_057_594_037_927_935n }, // self-described largest values in seven bytes
    { bytes: '1B0100000000000000', expected: 72_057_594_037_927_936n }, // smallest values in eight bytes
    { bytes: 'D9D9F71B0100000000000000', expected: 72_057_594_037_927_936n }, // self-described smallest values in eight bytes
    { bytes: '1BFFFFFFFFFFFFFFFF', expected: 18_446_744_073_709_551_615n }, // largest values in eight bytes
    {
      // self-described largest values in eight bytes
      bytes: 'D9D9F71BFFFFFFFFFFFFFFFF',
      expected: 18_446_744_073_709_551_615n,
    },

    // ###### NEGATIVE INTEGERS ######

    { bytes: '21', expected: -2 }, // largest value in 1 bit
    { bytes: 'D9D9F721', expected: -2 }, // self-described largest value in 1 bit
    { bytes: '23', expected: -4 }, // largest value in 2 bits
    { bytes: 'D9D9F723', expected: -4 }, // self-described largest value in 2 bits
    { bytes: '27', expected: -8 }, // largest value in 3 bits
    { bytes: 'D9D9F727', expected: -8 }, // self-described largest value in 3 bits
    { bytes: '2F', expected: -16 }, // largest value in 4 bits
    { bytes: 'D9D9F72F', expected: -16 }, // self-described largest value in 4 bits
    { bytes: '37', expected: -24 }, // largest value in first CBOR byte
    { bytes: 'D9D9F737', expected: -24 }, // self-described largest value in first CBOR byte
    { bytes: '3818', expected: -25 }, // smallest value in two CBOR bytes
    { bytes: 'D9D9F73818', expected: -25 }, // self-described smallest value in two CBOR bytes
    { bytes: '381F', expected: -32 }, // largest value in 5 bits
    { bytes: 'D9D9F7381F', expected: -32 }, // self-described largest value in 5 bits
    { bytes: '383F', expected: -64 }, // largest value in 6 bits
    { bytes: 'D9D9F7383F', expected: -64 }, // self-described largest value in 6 bits
    { bytes: '387F', expected: -128 }, // largest value in 7 bits
    { bytes: 'D9D9F7387F', expected: -128 }, // self-described largest value in 7 bits
    { bytes: '38FF', expected: -256 }, // largest value in one byte
    { bytes: 'D9D9F738FF', expected: -256 }, // self-described largest value in one byte
    { bytes: '390100', expected: -257 }, // smallest value in two bytes
    { bytes: 'D9D9F7390100', expected: -257 }, // self-described smallest value in two bytes
    { bytes: '39FFFF', expected: -65_536 }, // largest value in two bytes
    { bytes: 'D9D9F739FFFF', expected: -65_536 }, // self-described largest value in two bytes
    { bytes: '3A00010000', expected: -65_537 }, // smallest value in three bytes
    { bytes: 'D9D9F73A00010000', expected: -65_537 }, // self-described smallest value in three bytes
    { bytes: '3A00FFFFFF', expected: -16_777_216 }, // largest value in three bytes
    { bytes: 'D9D9F73A00FFFFFF', expected: -16_777_216 }, // self-described largest value in three bytes
    { bytes: '3A01000000', expected: -16_777_217 }, // smallest value in four bytes
    { bytes: 'D9D9F73A01000000', expected: -16_777_217 }, // self-described smallest value in four bytes
    { bytes: '3AFFFFFFFF', expected: -4_294_967_296 }, // largest value in four bytes
    { bytes: 'D9D9F73AFFFFFFFF', expected: -4_294_967_296 }, // self-described largest value in four bytes
    { bytes: '3B0000000100000000', expected: -4_294_967_297n }, // smallest value in five bytes
    { bytes: 'D9D9F73B0000000100000000', expected: -4_294_967_297n }, // self-described smallest value in five bytes
    { bytes: '3B000000FFFFFFFFFF', expected: -1_099_511_627_776n }, // largest value in five bytes
    { bytes: 'D9D9F73B000000FFFFFFFFFF', expected: -1_099_511_627_776n }, // self-described largest value in five bytes
    { bytes: '3B0000010000000000', expected: -1_099_511_627_777n }, // smallest values in six bytes
    { bytes: 'D9D9F73B0000010000000000', expected: -1_099_511_627_777n }, // self-described smallest values in six bytes
    { bytes: '3B0000FFFFFFFFFFFF', expected: -281_474_976_710_656n }, // largest values in six bytes
    { bytes: 'D9D9F73B0000FFFFFFFFFFFF', expected: -281_474_976_710_656n }, // self-described largest values in six bytes
    { bytes: '3B0001000000000000', expected: -281_474_976_710_657n }, // smallest values in seven bytes
    { bytes: 'D9D9F73B0001000000000000', expected: -281_474_976_710_657n }, // self-described smallest values in seven bytes
    { bytes: '3B00FFFFFFFFFFFFFF', expected: -72_057_594_037_927_936n }, // largest values in seven bytes
    { bytes: 'D9D9F73B00FFFFFFFFFFFFFF', expected: -72_057_594_037_927_936n }, // self-described largest values in seven bytes
    { bytes: '3B0100000000000000', expected: -72_057_594_037_927_937n }, // smallest values in eight bytes
    { bytes: 'D9D9F73B0100000000000000', expected: -72_057_594_037_927_937n }, // self-described smallest values in eight bytes
    { bytes: '3BFFFFFFFFFFFFFFFF', expected: -18_446_744_073_709_551_616n }, // largest values in eight bytes
    {
      // self-described largest values in eight bytes
      bytes: 'D9D9F73BFFFFFFFFFFFFFFFF',
      expected: -18_446_744_073_709_551_616n,
    },
  ])('should decode item %#', ({ bytes, expected }) => {
    const result = decode(hexStringToBytes(bytes));

    expect(result).toEqual(expected);
  });

  describe('decode with reviver', () => {
    it('should handle objects', () => {
      const bytes = 'A2616101616202'; // { "a": 1, "b": 2 }
      const reviver: Reviver = value =>
        typeof value === 'number' ? value * 2 : value;
      const result = decode(hexStringToBytes(bytes), reviver);

      expect(result).toEqual({ a: 2, b: 4 });
    });

    it('should handle self-described objects', () => {
      const bytes = 'D9D9F7A2616101616202'; // { "a": 1, "b": 2 }
      const reviver: Reviver = value =>
        typeof value === 'number' ? value * 2 : value;
      const result = decode(hexStringToBytes(bytes), reviver);

      expect(result).toEqual({ a: 2, b: 4 });
    });

    it('should handle null and undefined values', () => {
      const bytes = 'A26161F66162F7'; // { "a": null, "b": undefined }
      const reviver: Reviver = value => (value === null ? 'null' : value);
      const result = decode(hexStringToBytes(bytes), reviver);

      expect(result).toEqual({ a: 'null', b: undefined });
    });

    it('should handle self-described null and undefined values', () => {
      const bytes = 'D9D9F7A26161F66162F7'; // { "a": null, "b": undefined }
      const reviver: Reviver = value => (value === null ? 'null' : value);
      const result = decode(hexStringToBytes(bytes), reviver);

      expect(result).toEqual({ a: 'null', b: undefined });
    });

    it('should handle nested objects', () => {
      const bytes = 'A16161A1616203'; // { "a": { "b": 3 } }
      const reviver: Reviver = (value, key) =>
        value !== undefined && key === 'b' ? (value as number) + 1 : value;
      const result = decode(hexStringToBytes(bytes), reviver);

      expect(result).toEqual({ a: { b: 4 } });
    });

    it('should handle self-described nested objects', () => {
      const bytes = 'D9D9F7A16161A1616203'; // { "a": { "b": 3 } }
      const reviver: Reviver = (value, key) =>
        value !== undefined && key === 'b' ? (value as number) + 1 : value;
      const result = decode(hexStringToBytes(bytes), reviver);

      expect(result).toEqual({ a: { b: 4 } });
    });

    it('should handle arrays', () => {
      const bytes = '83010203'; // [1, 2, 3]
      const reviver: Reviver = value =>
        Array.isArray(value) ? value.map(v => (v as number) * 2) : value;
      const result = decode(hexStringToBytes(bytes), reviver);

      expect(result).toEqual([2, 4, 6]);
    });

    it('should handle self-described arrays', () => {
      const bytes = 'D9D9F783010203'; // [1, 2, 3]
      const reviver: Reviver = value =>
        Array.isArray(value) ? value.map(v => (v as number) * 2) : value;
      const result = decode(hexStringToBytes(bytes), reviver);

      expect(result).toEqual([2, 4, 6]);
    });

    it('should handle objects with booleans', () => {
      const bytes = 'A26161F46162F5'; // { "a": false, "b": true }
      const reviver: Reviver = value =>
        typeof value === 'boolean' ? !value : value;
      const result = decode(hexStringToBytes(bytes), reviver);

      expect(result).toEqual({ a: true, b: false });
    });

    it('should handle self-described objects with booleans', () => {
      const bytes = 'D9D9F7A26161F46162F5'; // { "a": false, "b": true }
      const reviver: Reviver = value =>
        typeof value === 'boolean' ? !value : value;
      const result = decode(hexStringToBytes(bytes), reviver);

      expect(result).toEqual({ a: true, b: false });
    });
  });

  it('should decode concurrently', async () => {
    const values = [
      'A2616101616202', // { "a": 1, "b": 2 }
      'A2616303616404', // { "c": 3, "d": 4 }
      'A2616505616606', // { "e": 5, "f": 6 }
    ];

    const results = await Promise.all(
      values.map(value => decode(hexStringToBytes(value))),
    );

    expect(results[0]).toEqual({ a: 1, b: 2 });
    expect(results[1]).toEqual({ c: 3, d: 4 });
    expect(results[2]).toEqual({ e: 5, f: 6 });
  });
});
