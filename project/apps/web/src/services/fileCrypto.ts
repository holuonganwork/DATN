export const computeFileSha256Hex = async (file: File): Promise<string> => {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Trình duyệt không hỗ trợ Web Crypto API để tính SHA-256 cho tệp tin.");
  }
  const buffer = await file.arrayBuffer();
  const digest = await window.crypto.subtle.digest("SHA-256", buffer);
  const bytes = Array.from(new Uint8Array(digest));
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hex}`;
};
