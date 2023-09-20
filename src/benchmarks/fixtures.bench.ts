import { describe } from 'vitest';
import { runLibEncodingComparison } from './util';

describe('example-twitter', () => {
  const data = require('./fixtures/example-twitter.json');

  runLibEncodingComparison(data);
});

describe('example', () => {
  const data = require('./fixtures/example.json');

  runLibEncodingComparison(data);
});

describe('example2', () => {
  const data = require('./fixtures/example2.json');

  runLibEncodingComparison(data);
});

describe('example3', () => {
  const data = require('./fixtures/example3.json');

  runLibEncodingComparison(data);
});

describe('example4', () => {
  const data = require('./fixtures/example4.json');

  runLibEncodingComparison(data);
});

describe('example5', () => {
  const data = require('./fixtures/example5.json');

  runLibEncodingComparison(data);
});

describe('floats', () => {
  const data = require('./fixtures/floats.json');

  runLibEncodingComparison(data);
});

describe('sample-large', () => {
  const data = require('./fixtures/sample-large.json');

  runLibEncodingComparison(data);
});

describe('strings2', () => {
  const data = require('./fixtures/strings2.json');

  runLibEncodingComparison(data);
});
