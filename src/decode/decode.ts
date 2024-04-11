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

type Matcher<T> = (value: T) => boolean;
type DecoderFunc<T> = (value: Uint8Array) => T;
type Decoder<T> = {
  tag: number;
  matcher: Matcher<T>;
  decoder: DecoderFunc<T>;
};

/**
 * Options decoding a CBOR value
 * @template T - Types to extend the CBOR decoded values
 * @property decoders - An array of custom decoders for specific types. Decoders must return a value of type T.
 * The first element of the tuple is the CBOR tag, the second element is the decoder function.
 */
export type DecodeOptions<T> = {
  decoders?: Decoder<T>[];
};

export function decode<T = never>(
  input: Uint8Array,
  options?: DecodeOptions<T>
): CborValue | T {
  cborBytes = input;
  dataView = new DataView(cborBytes.buffer);
  bytesOffset = 0;

  return decodeItem(options?.decoders);
}

function decodeItem<T>(decoders?: DecodeOptions<T>['decoders']): T {
  const [majorType, info] = decodeNextByte();
  majorType;

  switch (majorType) {
    case CborMajorType.UnsignedInteger:
      return decodeUnsignedInteger(info) as T;

    case CborMajorType.NegativeInteger:
      return decodeNegativeInteger(info) as T;

    case CborMajorType.ByteString:
      return decodeByteString(info) as T;

    case CborMajorType.TextString:
      return decodeTextString(info) as T;

    case CborMajorType.Array:
      return decodeArray(info) as T;

    case CborMajorType.Map:
      return decodeMap(info) as T;

    // case CborMajorType.Tag:
    //   return decodeTag(info) as T;

    case CborMajorType.Simple:
      return decodeSimple(info) as T;
  }

  if (decoders) {
    for (const { tag, matcher, decoder } of decoders) {
      tag;
      if (tag === majorType) {
        if (matcher(info as T)) {
          return decoder(cborBytes.subarray(bytesOffset)) as T;
        }
      }
    }
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

function decodeArray(info: number): CborValue[] {
  const arrayLength = decodeUnsignedInteger(info);

  const values = new Array<CborValue>(arrayLength);
  for (let i = 0; i < arrayLength; i++) {
    values[i] = decodeItem();
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

function decodeMap(info: number): CborMap {
  const mapLength = decodeUnsignedInteger(info);

  const map: CborMap = {};
  for (let i = 0; i < mapLength; i++) {
    const [majorType, info] = decodeNextByte();

    if (majorType !== CborMajorType.TextString) {
      throw new DecodingError('Map keys must be text strings');
    }

    const key = decodeTextString(info);
    map[key] = decodeItem();
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
