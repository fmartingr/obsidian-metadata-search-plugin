import { MetadataProvider, SearchResult } from '@providers/types';
import { ButtonComponent, Modal, Notice, Setting, TextComponent } from 'obsidian';
import MetadataSearchPlugin from '@src/main';

export class SearchModal extends Modal {
  private readonly SEARCH_BUTTON_TEXT = 'Search';
  private readonly REQUESTING_BUTTON_TEXT = 'Requesting...';
  private isBusy = false;
  private okBtnRef?: ButtonComponent;
  private options: Record<string, string> = {};

  constructor(
    private plugin: MetadataSearchPlugin,
    private provider: MetadataProvider,
    private query: string,
    private callback: (error: Error | null, result?: SearchResult[]) => void,
  ) {
    super(plugin.app);
  }

  setBusy(busy: boolean): void {
    this.isBusy = busy;
    this.okBtnRef?.setDisabled(busy).setButtonText(busy ? this.REQUESTING_BUTTON_TEXT : this.SEARCH_BUTTON_TEXT);
  }

  async performSearch(): Promise<void> {
    if (!this.query) return void new Notice('No query entered.');
    if (this.isBusy) return;

    this.setBusy(true);
    try {
      const searchResults = await this.provider.search(this.query, this.options);
      if (!searchResults?.length) return void new Notice(`No results found for "${this.query}"`);
      this.callback(null, searchResults);
    } catch (err) {
      this.callback(err as Error);
    } finally {
      this.setBusy(false);
      this.close();
    }
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: `Search ${this.provider.name}` });

    // Let the provider render custom search options (e.g., locale picker)
    if (this.provider.renderSearchOptions) {
      this.provider.renderSearchOptions(contentEl, this.options);
    }

    contentEl.createDiv({ cls: 'metadata-search-plugin__search-modal--input' }, el => {
      new TextComponent(el)
        .setValue(this.query)
        .setPlaceholder('Search by keyword or identifier')
        .onChange(value => (this.query = value))
        .inputEl.addEventListener('keydown', event => {
          if (event.key === 'Enter' && !event.isComposing) this.performSearch();
        });
    });

    new Setting(this.contentEl).addButton(btn => {
      this.okBtnRef = btn
        .setButtonText(this.SEARCH_BUTTON_TEXT)
        .setCta()
        .onClick(() => this.performSearch());
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
