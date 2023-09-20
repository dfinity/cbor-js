export class EncodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SerializationError';
  }
}
