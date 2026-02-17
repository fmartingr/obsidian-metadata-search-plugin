import { existsSync, lstatSync, readlinkSync, symlinkSync, unlinkSync } from 'fs';
import { resolve } from 'path';

const manifest = await Bun.file('manifest.json').json();
const pluginId: string = manifest.id;

const vaultPath = process.argv[2] || process.env.OBSIDIAN_VAULT;

if (!vaultPath) {
  console.error(
    'Usage: bun run scripts/symlink-to-vault.ts <vault-path>\n' + '  or set OBSIDIAN_VAULT environment variable',
  );
  process.exit(1);
}

const resolvedVault = resolve(vaultPath);
const pluginsDir = resolve(resolvedVault, '.obsidian', 'plugins');
const targetDir = resolve(pluginsDir, pluginId);
const distDir = resolve(import.meta.dir, '..', 'dist');

if (!existsSync(pluginsDir)) {
  console.error(`Plugins directory not found: ${pluginsDir}`);
  process.exit(1);
}

if (!existsSync(distDir)) {
  console.error(`dist/ not found. Run 'bun run build' first.`);
  process.exit(1);
}

if (existsSync(targetDir)) {
  const isSymlink = lstatSync(targetDir).isSymbolicLink();
  if (isSymlink) {
    const current = readlinkSync(targetDir);
    if (current === distDir) {
      console.log(`Already linked: ${targetDir} -> ${distDir}`);
      process.exit(0);
    }
    unlinkSync(targetDir);
  } else {
    console.error(`${targetDir} already exists and is not a symlink. Remove it manually to proceed.`);
    process.exit(1);
  }
}

symlinkSync(distDir, targetDir, 'dir');
console.log(`Linked: ${targetDir} -> ${distDir}`);
