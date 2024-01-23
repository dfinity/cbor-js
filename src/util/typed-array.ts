export function resizeUint8Array(
  array: Uint8Array,
  newSize: number
): Uint8Array {
  const newArray = new Uint8Array(newSize);
  newArray.set(array);
  return newArray;
}
