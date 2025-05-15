import {
  CborMajorType,
  CborMap,
  CborMinorType,
  CborNumber,
  CborSimple,
  CborSimpleType,
  CborValue,
} from '../cbor-value';
import { IS_LITTLE_ENDIAN, isNil } from '../util';
import { DecodingError } from './decoding-error';

function decodeMajorType(firstByte: number): CborMajorType {
  return (firstByte & 0b1110_0000) >> 5;
}

function decodeInfo(firstByte: number): number {
  return firstByte & 0b0001_1111;
}

let cborBytes = new Uint8Array();
let dataView = new DataView(cborBytes.buffer);
let bytesOffset = 0;

export type Reviver<K extends CborValue = CborValue> = (
  value: K,
  key?: K extends CborValue ? string : keyof K,
) => [K] extends [never] ? CborValue : K;

export function decode<T extends CborValue = CborValue>(
  input: Uint8Array,
  reviver?: Reviver<T>,
): T {
  cborBytes = input;
  dataView = new DataView(cborBytes.buffer);
  bytesOffset = 0;

  const decodedItem = decodeItem(reviver as Reviver | undefined) as T;
  return (reviver?.(decodedItem as T) ?? decodedItem) as T;
}

function decodeItem(reviver?: Reviver): CborValue {
  const [majorType, info] = decodeNextByte();

  switch (majorType) {
    case CborMajorType.UnsignedInteger:
      return decodeUnsignedInteger(info);

    case CborMajorType.NegativeInteger:
      return decodeNegativeInteger(info);

    case CborMajorType.ByteString:
      return decodeByteString(info);

    case CborMajorType.TextString:
      return decodeTextString(info);

    case CborMajorType.Array:
      return decodeArray(info, reviver);

    case CborMajorType.Map:
      return decodeMap(info, reviver);

    // custom tags purposefully not implemented
    // case CborMajorType.Tag:
    //   return decodeTag(info);

    case CborMajorType.Simple:
      return decodeSimple(info);
  }

  throw new DecodingError('Unsupported major type');
}

function decodeNextByte(): [CborMajorType, number] {
  const firstByte = cborBytes.at(bytesOffset);
  if (isNil(firstByte)) {
    throw new DecodingError('Provided CBOR data is empty');
  }

  const majorType = decodeMajorType(firstByte);
  const info = decodeInfo(firstByte);

  bytesOffset++;
  return [majorType, info];
}

function decodeArray(info: number, reviver?: Reviver): CborValue[] {
  const arrayLength = decodeUnsignedInteger(info);

  const values = new Array<CborValue>(arrayLength);
  for (let i = 0; i < arrayLength; i++) {
    const decodedItem = decodeItem(reviver);
    values[i] = reviver?.(decodedItem) ?? decodedItem;
  }

  return values;
}

function decodeSimple(info: number): CborSimple {
  switch (info) {
    case CborSimpleType.False: {
      return false;
    }
    case CborSimpleType.True: {
      return true;
    }
    case CborSimpleType.Null: {
      return null;
    }
    case CborSimpleType.Undefined: {
      return undefined;
    }
  }

  throw new DecodingError(`Unrecognized simple type: ${info.toString(2)}`);
}

function decodeMap(info: number, reviver?: Reviver): CborMap {
  const mapLength = decodeUnsignedInteger(info);

  const map: CborMap = {};
  for (let i = 0; i < mapLength; i++) {
    const [majorType, info] = decodeNextByte();

    if (majorType !== CborMajorType.TextString) {
      throw new DecodingError('Map keys must be text strings');
    }

    const key = decodeTextString(info);
    const decodedItem = decodeItem(reviver);
    map[key] = reviver?.(decodedItem, key) ?? decodedItem;
  }

  return map;
}

function decodeUnsignedInteger(info: number): CborNumber {
  if (info <= CborMinorType.Value) {
    return info;
  }

  dataView = new DataView(cborBytes.buffer, bytesOffset);
  switch (info) {
    case CborMinorType.OneByte:
      bytesOffset++;
      return dataView.getUint8(0);

    case CborMinorType.TwoBytes:
      bytesOffset += 2;
      return dataView.getUint16(0, IS_LITTLE_ENDIAN);

    case CborMinorType.FourBytes:
      bytesOffset += 4;
      return dataView.getUint32(0, IS_LITTLE_ENDIAN);

    case CborMinorType.EightBytes:
      bytesOffset += 8;
      return dataView.getBigUint64(0, IS_LITTLE_ENDIAN);

    default:
      throw new DecodingError(`Unsupported integer info: ${info.toString(2)}`);
  }
}

function decodeNegativeInteger(info: number): CborNumber {
  const value = decodeUnsignedInteger(info);
  const negativeValue = typeof value === 'number' ? -1 - value : -1n - value;

  return negativeValue;
}

function decodeByteString(info: number): Uint8Array {
  const byteLength = decodeUnsignedInteger(info);
  if (byteLength > Number.MAX_SAFE_INTEGER) {
    throw new DecodingError('Byte length is too large');
  }

  const safeByteLength = Number(byteLength);
  bytesOffset += safeByteLength;
  return cborBytes.subarray(bytesOffset - safeByteLength, bytesOffset);
}

function decodeTextString(info: number): string {
  const bytes = decodeByteString(info);

  return new TextDecoder().decode(bytes);
}
