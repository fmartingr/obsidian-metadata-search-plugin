import { existsSync, lstatSync, readlinkSync, unlinkSync } from 'fs';
import { resolve } from 'path';

const manifest = await Bun.file('manifest.json').json();
const pluginId: string = manifest.id;

const vaultPath = process.argv[2] || process.env.OBSIDIAN_VAULT;

if (!vaultPath) {
  console.error(
    'Usage: bun run scripts/unlink-from-vault.ts <vault-path>\n' + '  or set OBSIDIAN_VAULT environment variable',
  );
  process.exit(1);
}

const resolvedVault = resolve(vaultPath);
const pluginsDir = resolve(resolvedVault, '.obsidian', 'plugins');
const targetDir = resolve(pluginsDir, pluginId);
const distDir = resolve(import.meta.dir, '..', 'dist');

if (!existsSync(targetDir)) {
  console.log(`Plugin not installed: ${targetDir} does not exist`);
  process.exit(0);
}

const stat = lstatSync(targetDir);

if (!stat.isSymbolicLink()) {
  console.error(`${targetDir} is not a symlink. Refusing to remove for safety.`);
  process.exit(1);
}

const linkTarget = readlinkSync(targetDir);
if (linkTarget !== distDir) {
  console.error(`${targetDir} points to ${linkTarget}, not ${distDir}. Refusing to remove for safety.`);
  process.exit(1);
}

unlinkSync(targetDir);
console.log(`Removed symlink: ${targetDir}`);
