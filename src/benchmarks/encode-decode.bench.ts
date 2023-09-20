import { describe } from 'vitest';
import {
  randomNumberArray,
  randomObject,
  randomObjectArray,
  runLibDecodingComparison,
  runLibEncodingComparison,
} from './util';
import { encode } from '../encode';

describe('Maps', () => {
  describe('Map encoding', () => {
    const data = randomObject();

    runLibEncodingComparison(data);
  });

  describe('Array of map encoding', () => {
    const data = randomObjectArray();

    runLibEncodingComparison(data);
  });
});

describe('Number array encoding', () => {
  const data = randomNumberArray();

  runLibEncodingComparison(data);
});

describe('Number array decoding', () => {
  const data = randomNumberArray();
  const cborEncodedData = encode(data);
  const jsonEncodedData = JSON.stringify(data);

  runLibDecodingComparison(cborEncodedData, jsonEncodedData);
});
