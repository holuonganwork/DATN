import type { CredentialPackage } from "../domain";

export const downloadCredentialPackageJson = (
  code: string,
  pkg: CredentialPackage,
): void => {
  if (typeof document === "undefined") return;
  const content = JSON.stringify(pkg, null, 2);
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${code.toLowerCase()}-package.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
