import { bench } from 'vitest';
import * as cborX from 'cbor-x';
// import { CborSerializer } from 'simple-cbor';
import borc from 'borc';
import { encode } from '../encode';
import { decode } from '../decode';
import { CborValue } from '../cbor-value';

export function runLibEncodingComparison(data: CborValue): void {
  // const simpleCbor = CborSerializer.withDefaultEncoders(true);

  bench('CBOR', () => {
    encode(data);
  });

  bench('CBOR-X', () => {
    cborX.encode(data);
  });

  // bench('Simple CBOR', () => {
  //   simpleCbor.serialize(data);
  // });

  bench('BORC', () => {
    borc.encode(data);
  });

  bench('JSON', () => {
    JSON.stringify(data);
  });
}

export function runLibDecodingComparison(
  cborBytes: Uint8Array,
  jsonString: string
): void {
  bench('CBOR', () => {
    decode(cborBytes);
  });

  bench('CBOR-X', () => {
    cborX.decode(cborBytes);
  });

  bench('BORC', () => {
    borc.decode(cborBytes);
  });

  bench('JSON', () => {
    JSON.stringify(jsonString);
  });
}

const ARRAY_SIZE = 100;
const OBJ_SIZE = 50;
const MAX_NUMBER = Number.MAX_SAFE_INTEGER;

export function randomObject(): CborValue {
  const entries = randomArray(
    () => [String(randomNumber()), randomNumber()],
    OBJ_SIZE
  );

  return Object.fromEntries(entries);
}

export function randomObjectArray(): CborValue[] {
  return randomArray(() => randomObject());
}

export function randomNumberArray(): CborValue[] {
  return randomArray(() => randomNumber());
}

function randomNumber(): number {
  return Math.floor(Math.random() * MAX_NUMBER);
}

function randomArray<T extends CborValue>(
  generator: () => T,
  length = ARRAY_SIZE
): T[] {
  return Array.from({ length }, generator);
}
