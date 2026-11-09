import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const distDirectory = fileURLToPath(new URL("../dist/", import.meta.url));
const html = await readFile(resolve(distDirectory, "index.html"), "utf8");
const assets = Array.from(
  html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g),
  (match) => match[1],
).filter((asset) => asset !== undefined);
const budgets = new Map([
  [".js", 180 * 1024],
  [".css", 30 * 1024],
]);
const totals = new Map([...budgets.keys()].map((extension) => [extension, 0]));

for (const asset of assets) {
  const assetUrl = new URL(asset, "https://bundle.invalid");
  if (!assetUrl.pathname.startsWith("/assets/")) {
    throw new Error(`Aset entry berada di luar /assets/: ${asset}`);
  }
  const filePath = resolve(
    distDirectory,
    `.${decodeURIComponent(assetUrl.pathname)}`,
  );
  const fileRelativePath = relative(distDirectory, filePath);
  if (fileRelativePath.startsWith(`..${sep}`) || fileRelativePath === "..") {
    throw new Error(`Path aset keluar dari direktori build: ${asset}`);
  }

  const extension = filePath.slice(filePath.lastIndexOf("."));
  const budget = budgets.get(extension);
  if (budget === undefined) {
    continue;
  }
  const compressedBytes = gzipSync(await readFile(filePath), {
    level: 9,
  }).byteLength;
  totals.set(extension, (totals.get(extension) ?? 0) + compressedBytes);
}

for (const [extension, budget] of budgets) {
  const total = totals.get(extension) ?? 0;
  const status = total <= budget ? "LULUS" : "GAGAL";
  process.stdout.write(
    `${extension.slice(1).toUpperCase()} awal (gzip): ${(total / 1024).toFixed(2)} KiB / ${(budget / 1024).toFixed(0)} KiB — ${status}\n`,
  );
  if (total > budget) {
    process.exitCode = 1;
  }
}
