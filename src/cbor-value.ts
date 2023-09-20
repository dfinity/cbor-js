export type CborValue =
  | CborNumber
  | string
  | Uint8Array
  | CborValue[]
  | CborMap
  | CborSimple;

export type CborNumber = number | bigint;

export type CborSimple = boolean | null | undefined;

export enum CborSimpleType {
  False = 0x14,
  True = 0x15,
  Null = 0x16,
  Undefined = 0x17,
}

export type CborMap = {
  [key: string | number | symbol]: CborValue;
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
