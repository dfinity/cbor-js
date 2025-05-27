export type CborValue<T = any> = ReplacedCborValue<T> | T;

export type ReplacedCborValue<T = any> =
  | CborNumber
  | string
  | ArrayBuffer
  | Uint8Array
  | CborValue<T>[]
  | CborMap<T>
  | CborSimple;

/**
 * The tag number `55799`, the self-described tag for CBOR.
 * The serialization of this tag's head is `0xd9d9f7`.
 * @see {@link https://www.rfc-editor.org/rfc/rfc8949.html#section-3.4.6}
 */
export const CBOR_SELF_DESCRIBED_TAG = 55799;

export type CborNumber = number | bigint;

export const CBOR_STOP_CODE = Symbol('CBOR_STOP_CODE');

export type CborSimple = boolean | null | undefined | typeof CBOR_STOP_CODE;

export enum CborSimpleType {
  False = 0x14,
  True = 0x15,
  Null = 0x16,
  Undefined = 0x17,
  Break = 0x1f,
}

export type CborMap<T = any> =
  | {
      [key: string]: CborValue<T>;
    }
  | {
      [key: string | number]: CborValue<T>;
    }
  | {
      [key: string | symbol]: CborValue<T>;
    }
  | {
      [key: string | number | symbol]: CborValue<T>;
    };

export enum CborMajorType {
  UnsignedInteger = 0,
  NegativeInteger = 1,
  ByteString = 2,
  TextString = 3,
  Array = 4,
  Map = 5,
  Tag = 6,
  Simple = 7,
}

export const TOKEN_VALUE_MAX = 0x17;
export const ONE_BYTE_MAX = 0xff;
export const TWO_BYTES_MAX = 0xffff;
export const FOUR_BYTES_MAX = 0xffffffff;
/**
 * The maximum value that can be encoded in 8 bytes: `18446744073709551615n`.
 */
export const EIGHT_BYTES_MAX = BigInt('0xffffffffffffffff');

export enum CborMinorType {
  Value = 23,
  OneByte = 24,
  TwoBytes = 25,
  FourBytes = 26,
  EightBytes = 27,
  Indefinite = 31,
}

export enum CborTag {
  DATE_TIME_STRING = 0,
  UNIX_TIMESTAMP = 1,
  UNSIGNED_BIGNUM = 2,
  NEGATIVE_BIGNUM = 3,
}
