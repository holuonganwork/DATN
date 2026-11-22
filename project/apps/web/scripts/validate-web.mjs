import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function collectFilesByExt(dirPath, extensions) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFilesByExt(fullPath, extensions));
    } else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

const requiredDirs = [
  "src/domain",
  "src/services",
  "src/components",
  "src/pages",
  "src/features",
  "src/styles",
];

for (const dir of requiredDirs) {
  const dirPath = path.join(webRoot, dir);
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    throw new Error(`Missing web directory: ${dir}`);
  }
}

const requiredFiles = [
  "DESIGN.md",
  "public/logo.svg",
  "index.html",
  "package.json",
  "tsconfig.json",
  "vite.config.ts",
  "src/main.tsx",
  "src/App.tsx",
  "src/domain/index.ts",
  "src/services/index.ts",
  "src/styles/index.css",
  "README.md",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(webRoot, file))) {
    throw new Error(`Missing web file: ${file}`);
  }
}

for (const legacyFile of ["src/domain.ts", "src/storage.ts", "src/styles.css"]) {
  if (fs.existsSync(path.join(webRoot, legacyFile))) {
    throw new Error(`Legacy monolith file must be removed after modular refactor: ${legacyFile}`);
  }
}

const logoPath = path.join(webRoot, "public/logo.svg");
const logoStat = fs.statSync(logoPath);
if (logoStat.size < 512) {
  throw new Error("public/logo.svg appears empty or invalid");
}

if (fs.existsSync(path.join(webRoot, "public/logo.png"))) {
  throw new Error("Legacy public/logo.png must be removed after upgrading to public/logo.svg");
}

const logoSvgSource = fs.readFileSync(logoPath, "utf8");
for (const svgMarker of ['<svg', 'viewBox="0 0 128 128"', "#075985", "#0284C7", "#38BDF8"]) {
  if (!logoSvgSource.includes(svgMarker)) {
    throw new Error(`Missing Azure 3-Layer Isometric Monolith SVG marker in public/logo.svg: ${svgMarker}`);
  }
}

const indexHtmlSource = fs.readFileSync(path.join(webRoot, "index.html"), "utf8");
if (!indexHtmlSource.includes("/logo.svg") || indexHtmlSource.includes("/logo.png")) {
  throw new Error("index.html must reference /logo.svg and not /logo.png");
}

const packageJson = JSON.parse(fs.readFileSync(path.join(webRoot, "package.json"), "utf8"));
if (packageJson.scripts?.dev !== "vite" || !packageJson.scripts?.build?.includes("vite build")) {
  throw new Error("Web package must expose Vite dev/build scripts");
}

const runtimeFiles = collectFilesByExt(path.join(webRoot, "src"), new Set([".ts", ".tsx"]));
const cssFiles = collectFilesByExt(path.join(webRoot, "src/styles"), new Set([".css"]));

if (runtimeFiles.length < 15) {
  throw new Error(`Expected modular TS/TSX files under src/, found only ${runtimeFiles.length}`);
}
if (cssFiles.length < 5) {
  throw new Error(`Expected modular CSS files under src/styles/, found only ${cssFiles.length}`);
}

const runtimeSource = runtimeFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const cssSource = cssFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const designDocSource = fs.readFileSync(path.join(webRoot, "DESIGN.md"), "utf8");
const source = `${runtimeSource}\n${designDocSource}`;

const requiredMarkers = [
  "/logo.svg",
  "VoltAgent/awesome-design-md",
  "ACADEMIC AZURE DESIGN · CERTCHAIN",
  "site-header",
  "site-nav",
  "site-footer",
  "app-sidebar",
  "PublicHomeView",
  "PublicVerifierView",
  "PublicDirectoryView",
  "PublicStandardsView",
  "RoleSwitcherGateView",
  "ConsoleOverviewView",
  "IssuerPortal",
  "SystemAdminPortal",
  "AuditTrailPortal",
  "CONFIRMED",
  "verifyCredential",
  "verifyCredentialPackage",
  "revokeCredential",
  "reissueCredential",
  "authorizeOrganizationWallet",
  "buildMerkleTree",
  "toast-popup-viewport",
  "toast-popup-card",
  "STORAGE_KEY",
  "certchain.product.state.v2",
];

for (const marker of requiredMarkers) {
  if (!source.includes(marker)) {
    throw new Error(`Missing product behavior marker: ${marker}`);
  }
}

const requiredThemeTokens = [
  "#0284c7",
  "#075985",
  "#f0f9ff",
  "#bae6fd",
  "--brand-deep",
  "--brand-sidebar-bg",
  "--radius-pill",
  "--radius-btn",
];

for (const token of requiredThemeTokens) {
  if (!cssSource.includes(token)) {
    throw new Error(`Missing Bright Marine Azure theme token in src/styles: ${token}`);
  }
}

if (
  cssSource.includes('[data-theme="dark"]') ||
  runtimeSource.includes("toggleTheme") ||
  runtimeSource.includes("theme-toggle-btn")
) {
  throw new Error("Dark mode markers must not exist in light-only web UI");
}

if (runtimeSource.includes("system-bar") || cssSource.includes(".system-bar")) {
  throw new Error("Top .system-bar must not exist in Public Website UI");
}

const forbiddenMockAndPrototypeMarkers = [
  "PROTOTYPE · MEMORY ONLY",
  "VERTICAL SLICE · KHÔNG DATABASE",
  "BKHN-ACADEMY",
  "FPT-JETKING",
  "VNSEC-LAB",
  "CERT-7K4P-001",
  "Nguyễn Minh An",
  "syncLegacyMirrors",
  "Khôi phục dữ liệu mẫu",
  "Khôi phục mẫu",
  "Mẫu PDF gốc",
  "Mẫu PDF bị sửa",
  "Thử sửa điểm số trong JSON",
];

for (const marker of forbiddenMockAndPrototypeMarkers) {
  if (runtimeSource.includes(marker)) {
    throw new Error(`Forbidden mock/seed/fallback marker found in frontend runtime: ${marker}`);
  }
}

for (const forbidden of ["DATABASE_URL", "privateKey", "seed phrase", "PRIVATE_KEY"]) {
  if (source.includes(forbidden)) {
    throw new Error(`Forbidden secret/persistence marker: ${forbidden}`);
  }
}

if (runtimeSource.includes("/logo.png")) {
  throw new Error("Legacy /logo.png reference must not remain in src/");
}

process.stdout.write(
  `Web product structure valid: ${requiredFiles.length} anchors, ${runtimeFiles.length} TS/TSX files, ${cssFiles.length} CSS files, DESIGN.md + logo.svg verified, zero mock/seed/fallback data confirmed, and 3-mode architecture present.\n`,
);
