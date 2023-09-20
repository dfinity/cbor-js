export class DecodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecodingError';
  }
}
