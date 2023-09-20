import {
  CborMajorType,
  CborMap,
  CborMinorType,
  CborNumber,
  CborSimple,
  CborSimpleType,
  CborValue,
  EIGHT_BYTES_MAX,
  FOUR_BYTES_MAX,
  ONE_BYTE_MAX,
  TOKEN_VALUE_MAX,
  TWO_BYTES_MAX,
} from '../cbor-value';
import { EncodingError } from './encoding-error';
import { IS_LITTLE_ENDIAN, resizeUint8Array } from '../util';

const INITIAL_BUFFER_SIZE = 2 * 1_024;
const SAFE_BUFFER_END_OFFSET = 100;

function encodeMajorType(majorType: CborMajorType): number {
  return majorType << 5;
}

let target = new Uint8Array(INITIAL_BUFFER_SIZE);
let targetView = new DataView(target.buffer);
let bytesOffset = 0;
let mapEntries: [string, CborValue][] = [];

export function encode(value: CborValue): Uint8Array {
  bytesOffset = 0;
  encodeItem(value);
  return target.subarray(0, bytesOffset);
}

function encodeItem(item: CborValue): void {
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

  if (Array.isArray(item)) {
    encodeArray(item);
    return;
  }

  if (typeof item === 'object') {
    encodeMap(item);
    return;
  }

  throw new EncodingError(`Unsupported type: ${typeof item}`);
}

function encodeArray(items: CborValue[]): void {
  encodeHeader(CborMajorType.Array, items.length);

  items.forEach((item) => {
    encodeItem(item);
  });
}

function encodeMap(map: CborMap): void {
  mapEntries = Object.entries(map);

  encodeHeader(CborMajorType.Map, mapEntries.length);

  mapEntries.forEach(([key, value]) => {
    encodeItem(key);
    encodeItem(value);
  });
}

function encodeHeader(majorType: CborMajorType, value: CborNumber): void {
  if (value <= TOKEN_VALUE_MAX) {
    targetView.setUint8(
      bytesOffset++,
      encodeMajorType(majorType) | Number(value)
    );
    return;
  }

  if (value <= ONE_BYTE_MAX) {
    targetView.setUint8(
      bytesOffset++,
      encodeMajorType(majorType) | CborMinorType.OneByte
    );
    targetView.setUint8(bytesOffset, Number(value));
    bytesOffset += 1;
    return;
  }

  if (value <= TWO_BYTES_MAX) {
    targetView.setUint8(
      bytesOffset++,
      encodeMajorType(majorType) | CborMinorType.TwoBytes
    );
    targetView.setUint16(bytesOffset, Number(value), IS_LITTLE_ENDIAN);
    bytesOffset += 2;
    return;
  }

  if (value <= FOUR_BYTES_MAX) {
    targetView.setUint8(
      bytesOffset++,
      encodeMajorType(majorType) | CborMinorType.FourBytes
    );
    targetView.setUint32(bytesOffset, Number(value), IS_LITTLE_ENDIAN);
    bytesOffset += 4;
    return;
  }

  if (value <= EIGHT_BYTES_MAX) {
    targetView.setUint8(
      bytesOffset++,
      encodeMajorType(majorType) | CborMinorType.EightBytes
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

  throw new EncodingError(`Unrecognized simple value: ${value}`);
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
    typeof value === 'bigint' ? -1n - value : -1 - value
  );
}

function encodeNumber(value: CborNumber): void {
  value >= 0 ? encodeUnsignedInteger(value) : encodeNegativeInteger(value);
}

function encodeTextString(value: string): void {
  encodeBytes(CborMajorType.TextString, new TextEncoder().encode(value));
}

function encodeByteString(value: Uint8Array): void {
  encodeBytes(CborMajorType.ByteString, value);
}
