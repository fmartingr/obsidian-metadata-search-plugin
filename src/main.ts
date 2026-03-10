import { MarkdownView, Notice, Plugin, TFile, requestUrl } from 'obsidian';

import { registry } from '@providers/registry';
import { MetadataKind, MetadataProvider, SearchResult } from '@providers/types';
import { booksKind } from '@providers/books/kind';
import { googleBooksRegistration } from '@providers/books/google';
import { naverBooksRegistration } from '@providers/books/naver';
import { hardcoverBooksRegistration } from '@providers/books/hardcover';
import { gamesKind } from '@providers/games/kind';
import { rawgGamesRegistration } from '@providers/games/rawg';
import { igdbGamesRegistration } from '@providers/games/igdb';

import { SearchModal } from '@views/search_modal';
import { MetadataSuggestModal } from '@views/suggest_modal';
import { CursorJumper } from '@utils/cursor_jumper';
import {
  MetadataSearchSettingTab,
  PluginSettings,
  MetadataKindSettings,
  DEFAULT_SETTINGS,
  DEFAULT_KIND_SETTINGS,
} from '@settings/settings';
import {
  getTemplateContents,
  applyTemplateTransformations,
  useTemplaterPluginInFile,
  executeInlineScriptsTemplates,
} from '@utils/template';
import { replaceVariableSyntax, makeFileName, toStringFrontMatter } from '@utils/utils';

function registerAllProviders() {
  // Register metadata kinds
  registry.registerKind(booksKind);
  registry.registerKind(gamesKind);

  // Register providers
  registry.registerProvider(googleBooksRegistration);
  registry.registerProvider(naverBooksRegistration);
  registry.registerProvider(hardcoverBooksRegistration);
  registry.registerProvider(rawgGamesRegistration);
  registry.registerProvider(igdbGamesRegistration);
}

export default class MetadataSearchPlugin extends Plugin {
  settings: PluginSettings;

  async onload() {
    await this.loadSettings();

    // Register all kinds and providers
    registerAllProviders();

    // Ensure default kind settings exist for all registered kinds
    this.ensureKindDefaults();

    // For each registered kind, set up commands and ribbon icons
    for (const kind of registry.getKinds()) {
      const kindSettings = this.getKindSettings(kind.id);
      if (!kindSettings.enabled) continue;

      this.addRibbonIcon(kind.icon, `Create new ${kind.name.toLowerCase()} note`, () => this.createNewNote(kind.id));

      this.addCommand({
        id: `create-${kind.id}-note`,
        name: `Create new ${kind.name.toLowerCase()} note`,
        callback: () => this.createNewNote(kind.id),
      });

      this.addCommand({
        id: `insert-${kind.id}-metadata`,
        name: `Insert ${kind.name.toLowerCase()} metadata`,
        callback: () => this.insertMetadata(kind.id),
      });
    }

    // Settings tab
    this.addSettingTab(new MetadataSearchSettingTab(this.app, this));

    console.log(`Metadata Search: version ${this.manifest.version} (requires obsidian ${this.manifest.minAppVersion})`);
  }

  showNotice(message: unknown) {
    try {
      new Notice(message?.toString());
    } catch {
      // eslint-disable
    }
  }

  getKindSettings(kindId: string): MetadataKindSettings {
    if (!this.settings.kinds[kindId]) {
      const providers = registry.getProvidersForKind(kindId);
      this.settings.kinds[kindId] = {
        ...DEFAULT_KIND_SETTINGS,
        selectedProvider: providers[0]?.id || '',
        providerSettings: {},
      };
    }
    return this.settings.kinds[kindId];
  }

  private ensureKindDefaults(): void {
    for (const kind of registry.getKinds()) {
      this.getKindSettings(kind.id);
    }
  }

  private createProviderForKind(kindId: string): MetadataProvider {
    const kindSettings = this.getKindSettings(kindId);
    const providerId = kindSettings.selectedProvider;
    if (!providerId) {
      throw new Error(`No provider selected for ${kindId}.`);
    }
    const providerSettings = kindSettings.providerSettings[providerId] || {};
    const provider = registry.createProvider(providerId, providerSettings);
    provider.validate();
    return provider;
  }

  private getKind(kindId: string): MetadataKind {
    const kind = registry.getKind(kindId);
    if (!kind) {
      throw new Error(`Metadata kind '${kindId}' not found.`);
    }
    return kind;
  }

  // Search flow: open search modal → get results
  async searchMetadata(provider: MetadataProvider, query?: string): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      new SearchModal(this, provider, query || '', (error, results) => {
        return error ? reject(error) : resolve(results);
      }).open();
    });
  }

  // Suggest flow: show results → pick one
  async suggestResult(
    kind: MetadataKind,
    kindSettings: MetadataKindSettings,
    results: SearchResult[],
  ): Promise<SearchResult> {
    return new Promise((resolve, reject) => {
      new MetadataSuggestModal(this.app, kind, kindSettings.showCoverImageInSearch, results, (error, selected) => {
        return error ? reject(error) : resolve(selected);
      }).open();
    });
  }

  async getRenderedContents(
    result: SearchResult,
    kindSettings: MetadataKindSettings,
    kind: MetadataKind,
  ): Promise<string> {
    const { templateFile } = kindSettings;

    if (templateFile) {
      const templateContents = await getTemplateContents(this.app, templateFile);
      const transformed = applyTemplateTransformations(templateContents);
      const replaced = replaceVariableSyntax(result, transformed);
      return executeInlineScriptsTemplates(result, replaced);
    }

    // Default: generate YAML frontmatter using only the kind's default fields
    const filtered: Record<string, unknown> = {};
    for (const entry of kind.defaultFrontmatterFields) {
      if (typeof entry === 'string') {
        if (result[entry] !== undefined && result[entry] !== '') {
          filtered[entry] = result[entry];
        }
      } else {
        filtered[entry.key] = result[entry.key] ?? entry.defaultValue;
      }
    }
    const frontmatter = toStringFrontMatter(filtered);
    return frontmatter ? `---\n${frontmatter}\n---\n` : '';
  }

  async downloadAndSaveImage(imageName: string, directory: string, imageUrl: string): Promise<string> {
    try {
      const response = await requestUrl({
        url: imageUrl,
        method: 'GET',
        headers: { Accept: 'image/*' },
      });

      if (response.status !== 200) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const imageData = response.arrayBuffer;
      const filePath = `${directory}/${imageName}`;
      await this.app.vault.adapter.writeBinary(filePath, imageData);
      return filePath;
    } catch (error) {
      console.error('Error downloading or saving image:', error);
      return '';
    }
  }

  async insertMetadata(kindId: string): Promise<void> {
    try {
      const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!markdownView) {
        console.warn('Can not find an active markdown view');
        return;
      }

      const kind = this.getKind(kindId);
      const kindSettings = this.getKindSettings(kindId);
      const provider = this.createProviderForKind(kindId);

      const results = await this.searchMetadata(provider, markdownView.file.basename);
      const selected = await this.suggestResult(kind, kindSettings, results);

      if (!markdownView.editor) {
        console.warn('Can not find editor from the active markdown view');
        return;
      }

      // Handle cover image saving
      await this.saveCoverImageIfEnabled(selected, kindSettings, kind);

      const renderedContents = await this.getRenderedContents(selected, kindSettings, kind);
      markdownView.editor.replaceRange(renderedContents, { line: 0, ch: 0 });
    } catch (err) {
      console.warn(err);
      this.showNotice(err);
    }
  }

  async createNewNote(kindId: string): Promise<void> {
    try {
      const kind = this.getKind(kindId);
      const kindSettings = this.getKindSettings(kindId);
      const provider = this.createProviderForKind(kindId);

      const results = await this.searchMetadata(provider);
      const selected = await this.suggestResult(kind, kindSettings, results);

      // Handle cover image saving
      await this.saveCoverImageIfEnabled(selected, kindSettings, kind);

      const renderedContents = await this.getRenderedContents(selected, kindSettings, kind);

      const fileNameFormat = kindSettings.fileNameFormat || kind.defaultFileNameFormat;
      const fileName = makeFileName(selected, fileNameFormat);
      const filePath = kindSettings.folder ? `${kindSettings.folder}/${fileName}` : fileName;
      const targetFile = await this.app.vault.create(filePath, renderedContents);

      // Templater plugin support
      await useTemplaterPluginInFile(this.app, targetFile);
      await this.openNewNote(targetFile);
    } catch (err) {
      console.warn(err);
      this.showNotice(err);
    }
  }

  private async saveCoverImageIfEnabled(
    result: SearchResult,
    kindSettings: MetadataKindSettings,
    kind: MetadataKind,
  ): Promise<void> {
    if (!kindSettings.enableCoverImageSave) return;

    const coverUrl = result.coverUrl as string;
    if (!coverUrl) return;

    const fileNameFormat = kindSettings.fileNameFormat || kind.defaultFileNameFormat;
    const imageName = makeFileName(result, fileNameFormat, 'jpg');
    const savedPath = await this.downloadAndSaveImage(imageName, kindSettings.coverImagePath, coverUrl);
    if (savedPath) {
      result.localCoverImage = savedPath;
    }
  }

  async openNewNote(targetFile: TFile) {
    if (!this.settings.openPageOnCompletion) return;

    const activeLeaf = this.app.workspace.getLeaf();
    if (!activeLeaf) {
      console.warn('No active leaf');
      return;
    }

    await activeLeaf.openFile(targetFile, { state: { mode: 'source' } });
    activeLeaf.setEphemeralState({ rename: 'all' });
    await new CursorJumper(this.app).jumpToNextCursorLocation();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    // Ensure kinds object exists
    if (!this.settings.kinds) {
      this.settings.kinds = {};
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
