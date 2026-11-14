import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "DESIGN.md",
  "public/logo.png",
  "index.html",
  "package.json",
  "tsconfig.json",
  "vite.config.ts",
  "src/main.tsx",
  "src/App.tsx",
  "src/domain.ts",
  "src/storage.ts",
  "src/styles.css",
  "README.md",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(webRoot, file))) {
    throw new Error(`Missing web file: ${file}`);
  }
}

const logoStat = fs.statSync(path.join(webRoot, "public/logo.png"));
if (logoStat.size < 1024) {
  throw new Error("public/logo.png appears empty or invalid");
}

const packageJson = JSON.parse(fs.readFileSync(path.join(webRoot, "package.json"), "utf8"));
if (packageJson.scripts?.dev !== "vite" || !packageJson.scripts?.build?.includes("vite build")) {
  throw new Error("Web package must expose Vite dev/build scripts");
}

const appSource = fs.readFileSync(path.join(webRoot, "src/App.tsx"), "utf8");
const source = ["src/App.tsx", "src/domain.ts", "src/storage.ts", "src/main.tsx", "DESIGN.md"]
  .map((file) => fs.readFileSync(path.join(webRoot, file), "utf8"))
  .join("\n");

const requiredMarkers = [
  "/logo.png",
  "VoltAgent/awesome-design-md",
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
  "STORAGE_KEY",
];

for (const marker of requiredMarkers) {
  if (!source.includes(marker)) {
    throw new Error(`Missing product behavior marker: ${marker}`);
  }
}

for (const prototypeBanner of ["PROTOTYPE · MEMORY ONLY", "VERTICAL SLICE · KHÔNG DATABASE"]) {
  if (appSource.includes(prototypeBanner)) {
    throw new Error(`Prototype banner should be removed from product UI: ${prototypeBanner}`);
  }
}

for (const forbidden of ["DATABASE_URL", "privateKey", "seed phrase", "PRIVATE_KEY"]) {
  if (source.includes(forbidden)) {
    throw new Error(`Forbidden secret/persistence marker: ${forbidden}`);
  }
}

process.stdout.write(
  `Web product structure valid: ${requiredFiles.length} files, DESIGN.md + logo.png verified, Public Website (4 pages + Header/Navbar/Footer), Role Switcher Gate, and Internal Console (Sidebar App Shell) present.\n`,
);
