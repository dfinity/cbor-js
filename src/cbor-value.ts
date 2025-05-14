export type CborValue<T = any> = ReplacedCborValue<T> | T;

export type ReplacedCborValue<T = any> =
  | CborNumber
  | string
  | ArrayBuffer
  | Uint8Array
  | CborValue<T>[]
  | CborMap<T>
  | CborSimple;

export const CBOR_SELF_DESCRIBED_TAG = 55799;

export type CborNumber = number | bigint;

export type CborSimple = boolean | null | undefined;

export enum CborSimpleType {
  False = 0x14,
  True = 0x15,
  Null = 0x16,
  Undefined = 0x17,
  Break = 0x1F,
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
export const EIGHT_BYTES_MAX = 0xffffffffffffffffn;

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
