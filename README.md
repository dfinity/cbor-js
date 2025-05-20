# CBOR encoder/decoder

[![Test](https://github.com/dfinity/cbor-js/actions/workflows/test.yml/badge.svg)](https://github.com/dfinity/cbor-js/actions/workflows/test.yml)
[![Lint](https://github.com/dfinity/cbor-js/actions/workflows/lint.yml/badge.svg)](https://github.com/dfinity/cbor-js/actions/workflows/lint.yml)

## Not implemented

- Custom replacer.
  - The encoder currently has a restricted type that it will accept (see `./src/cbor-value.ts`). We should allow for easy conversion of custom types.
- Custom tag encoding/decoding.
  - Custom tags allow for encoding and decoding of custom types.
  - We currently don't use this custom tags (although we probably should).
  - Since we don't directly encode developer provided data (that's encoded by Candid) then we can safely say we don't need the feature.
- Unit tests for text/byte strings with a length that does not fit in four bytes or less.
  - The "length" of the text string can be encoded with up to 8 bytes, which means the largest possible string length is `18,446,744,073,709,551,615`. The tests cover a string length that's encoded up to four 4 bytes, longer than this and the tests became extremely slow.
  - The largest number in 4 bytes is `2,147,483,647` which would represent the length of an ~2gb string, which is not possible to fit into a single IC message anyway.
- Indeterminite length encoding for text and byte strings
  - To encode a string length longer than the previously mentioned 8 byte limit, a string can be encoded with an "indeterminate" length.
  - Similar to the previous point, this would be impractical for the IC due to message limits.

## Contributing

Check out the [contribution guidelines](./.github/CONTRIBUTING.md).

### Setup

- Install [pnpm](https://pnpm.io/)
- Install [commitizen](https://commitizen-tools.github.io/commitizen/)
- Install [pre-commit](https://pre-commit.com/)
- Install dependencies:
  ```bash
  pnpm install
  ```

### Running tests

```bash
pnpm test
```

### Formatting

```bash
pnpm format
```
