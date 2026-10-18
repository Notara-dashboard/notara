export const maxUploadBytes = 20 * 1024 * 1024;
export const uploadTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "text/csv",
];
export const safeFilename = (name: string) =>
  name.replace(/[\x00-\x1f/\\]/g, "_").slice(0, 200) || "document";
export function validFile(bytes: Uint8Array, type: string) {
  const header = new TextDecoder().decode(bytes.slice(0, 8));
  return (
    bytes.length > 0 &&
    bytes.length <= maxUploadBytes &&
    uploadTypes.includes(type) &&
    (type === "application/pdf"
      ? header.startsWith("%PDF-")
      : type === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : type === "image/png"
          ? bytes
              .slice(0, 8)
              .every((n, i) => n === [137, 80, 78, 71, 13, 10, 26, 10][i]) &&
            bytes.length >= 8
          : !bytes.includes(0))
  );
}
