import {
  CborMajorType,
  CborMap,
  CborMinorType,
  CborNumber,
  CborSimple,
  CborSimpleType,
  CborValue,
  ReplacedCborValue,
  EIGHT_BYTES_MAX,
  FOUR_BYTES_MAX,
  ONE_BYTE_MAX,
  TOKEN_VALUE_MAX,
  TWO_BYTES_MAX,
  CBOR_SELF_DESCRIBED_TAG,
} from '../cbor-value';
import { EncodingError } from './encoding-error';
import { IS_LITTLE_ENDIAN, resizeUint8Array } from '../util';

const INITIAL_BUFFER_SIZE = 2 * 1_024;
const SAFE_BUFFER_END_OFFSET = 100;

const textEncoder = new TextEncoder();

function encodeMajorType(majorType: CborMajorType): number {
  return majorType << 5;
}

let target = new Uint8Array(INITIAL_BUFFER_SIZE);
let targetView = new DataView(target.buffer);
let bytesOffset = 0;
let mapEntries: [string, CborValue][] = [];

/**
 * A function that can be used to manipulate the input before it is encoded.
 * See {@link encode} for more information.
 * @param value - The value to manipulate.
 * @param key - The current key in a map, or the current stringified index in an array.
 * @returns The manipulated value.
 */
export type Replacer<T = any> = (
  value: CborValue<T>,
  key?: string,
) => ReplacedCborValue<T>;

/**
 * Encodes a value into a CBOR byte array.
 * @param value - The value to encode.
 * @param replacer - A function that can be used to manipulate the input before it is encoded.
 * @returns The encoded value.
 *
 * @example Simple
 * ```ts
 * const value = true;
 * const encoded = encode(value); // returns `Uint8Array [245]` (which is "F5" in hex)
 * ```
 *
 * @example Replacer
 * ```ts
 * const replacer: Replacer = val => (typeof val === 'number' ? val * 2 : val);
 * encode({ a: 1, b: 2 }, replacer); // returns the Uint8Array corresponding to the CBOR encoding of `{ a: 2, b: 4 }`
 * ```
 */
export function encode<T = any>(
  value: CborValue<T>,
  replacer?: Replacer<T>,
): Uint8Array {
  bytesOffset = 0;

  const transformedValue = replacer?.(value) ?? value;
  encodeItem(transformedValue, replacer);

  return target.slice(0, bytesOffset);
}

/**
 * Encodes a value into a CBOR byte array (same as {@link encode}), but prepends the self-described CBOR tag (55799).
 * @param value - The value to encode.
 * @param replacer - A function that can be used to manipulate the input before it is encoded.
 * @returns The encoded value with the self-described CBOR tag.
 *
 * @example
 * ```ts
 * const value = true;
 * const encoded = encodeWithSelfDescribedTag(value); // returns the Uint8Array [217, 217, 247, 245] (which is "D9D9F7F5" in hex)
 * ```
 */
export function encodeWithSelfDescribedTag<T = any>(
  value: CborValue<T>,
  replacer?: Replacer<T>,
): Uint8Array {
  bytesOffset = 0;

  const transformedValue = replacer?.(value) ?? value;
  encodeTag(CBOR_SELF_DESCRIBED_TAG, transformedValue, replacer);

  return target.slice(0, bytesOffset);
}

function encodeItem(item: CborValue, replacer?: Replacer): void {
  if (bytesOffset > target.length - SAFE_BUFFER_END_OFFSET) {
    target = resizeUint8Array(target, target.length * 2);
    targetView = new DataView(target.buffer);
  }

  if (item === false || item === true || item === null || item === undefined) {
    encodeSimple(item);
    return;
  }

  if (typeof item === 'number' || typeof item === 'bigint') {
    encodeNumber(item);
    return;
  }

  if (typeof item === 'string') {
    encodeTextString(item);
    return;
  }

  if (item instanceof Uint8Array) {
    encodeByteString(item);
    return;
  }

  if (item instanceof ArrayBuffer) {
    encodeByteString(new Uint8Array(item));
    return;
  }

  if (Array.isArray(item)) {
    encodeArray(item, replacer);
    return;
  }

  if (typeof item === 'object') {
    encodeMap(item, replacer);
    return;
  }

  throw new EncodingError(`Unsupported type: ${typeof item}`);
}

function encodeArray(items: CborValue[], replacer?: Replacer): void {
  encodeHeader(CborMajorType.Array, items.length);

  items.forEach((item, i) => {
    encodeItem(replacer?.(item, i.toString()) ?? item, replacer);
  });
}

function encodeMap(map: CborMap, replacer?: Replacer): void {
  mapEntries = Object.entries(map);

  encodeHeader(CborMajorType.Map, mapEntries.length);

  mapEntries.forEach(([key, value]) => {
    encodeTextString(key);
    encodeItem(replacer?.(value, key) ?? value, replacer);
  });
}

function encodeHeader(majorType: CborMajorType, value: CborNumber): void {
  if (value <= TOKEN_VALUE_MAX) {
    targetView.setUint8(
      bytesOffset++,
      encodeMajorType(majorType) | Number(value),
    );
    return;
  }

  if (value <= ONE_BYTE_MAX) {
    targetView.setUint8(
      bytesOffset++,
      encodeMajorType(majorType) | CborMinorType.OneByte,
    );
    targetView.setUint8(bytesOffset, Number(value));
    bytesOffset += 1;
    return;
  }

  if (value <= TWO_BYTES_MAX) {
    targetView.setUint8(
      bytesOffset++,
      encodeMajorType(majorType) | CborMinorType.TwoBytes,
    );
    targetView.setUint16(bytesOffset, Number(value), IS_LITTLE_ENDIAN);
    bytesOffset += 2;
    return;
  }

  if (value <= FOUR_BYTES_MAX) {
    targetView.setUint8(
      bytesOffset++,
      encodeMajorType(majorType) | CborMinorType.FourBytes,
    );
    targetView.setUint32(bytesOffset, Number(value), IS_LITTLE_ENDIAN);
    bytesOffset += 4;
    return;
  }

  if (value <= EIGHT_BYTES_MAX) {
    targetView.setUint8(
      bytesOffset++,
      encodeMajorType(majorType) | CborMinorType.EightBytes,
    );
    targetView.setBigUint64(bytesOffset, BigInt(value), IS_LITTLE_ENDIAN);
    bytesOffset += 8;
    return;
  }

  throw new EncodingError(`Value too large to encode: ${value}`);
}

function encodeSimple(value: CborSimple): void {
  encodeHeader(CborMajorType.Simple, mapSimple(value));
}

function mapSimple(value: CborSimple): CborSimpleType {
  if (value === false) {
    return CborSimpleType.False;
  }

  if (value === true) {
    return CborSimpleType.True;
  }

  if (value === null) {
    return CborSimpleType.Null;
  }

  if (value === undefined) {
    return CborSimpleType.Undefined;
  }

  throw new EncodingError(`Unrecognized simple value: ${value.toString()}`);
}

function encodeBytes(majorType: CborMajorType, value: Uint8Array): void {
  encodeHeader(majorType, value.length);

  if (bytesOffset > target.length - value.length) {
    target = resizeUint8Array(target, target.length + value.length);
    targetView = new DataView(target.buffer);
  }
  target.set(value, bytesOffset);
  bytesOffset += value.length;
}

function encodeInteger(majorType: CborMajorType, value: CborNumber): void {
  encodeHeader(majorType, value);
}

function encodeUnsignedInteger(value: CborNumber): void {
  encodeInteger(CborMajorType.UnsignedInteger, value);
}

function encodeNegativeInteger(value: CborNumber): void {
  encodeInteger(
    CborMajorType.NegativeInteger,
    typeof value === 'bigint' ? -1n - value : -1 - value,
  );
}

function encodeNumber(value: CborNumber): void {
  value >= 0 ? encodeUnsignedInteger(value) : encodeNegativeInteger(value);
}

function encodeTextString(value: string): void {
  encodeBytes(CborMajorType.TextString, textEncoder.encode(value));
}

function encodeByteString(value: Uint8Array): void {
  encodeBytes(CborMajorType.ByteString, value);
}

function encodeTag(tag: number, value: CborValue, replacer?: Replacer): void {
  encodeHeader(CborMajorType.Tag, tag);
  encodeItem(value, replacer);
}
