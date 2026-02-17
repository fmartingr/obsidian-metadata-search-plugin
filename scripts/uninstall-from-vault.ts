import { existsSync, lstatSync, rmSync } from 'fs';
import { resolve } from 'path';

const manifest = await Bun.file('manifest.json').json();
const pluginId: string = manifest.id;

const vaultPath = process.argv[2] || process.env.OBSIDIAN_VAULT;

if (!vaultPath) {
  console.error(
    'Usage: bun run scripts/uninstall-from-vault.ts <vault-path>\n' + '  or set OBSIDIAN_VAULT environment variable',
  );
  process.exit(1);
}

const resolvedVault = resolve(vaultPath);
const pluginsDir = resolve(resolvedVault, '.obsidian', 'plugins');
const targetDir = resolve(pluginsDir, pluginId);

if (!existsSync(targetDir)) {
  console.log(`Plugin not installed: ${targetDir} does not exist`);
  process.exit(0);
}

if (lstatSync(targetDir).isSymbolicLink()) {
  console.error(`${targetDir} is a symlink, not a copied install. Use 'vault:uninstall-symlink' instead.`);
  process.exit(1);
}

rmSync(targetDir, { recursive: true });
console.log(`Removed: ${targetDir}`);
