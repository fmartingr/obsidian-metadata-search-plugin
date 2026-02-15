import { replaceDateInString } from '@utils/utils';
import { App, Notice, PluginSettingTab, Setting } from 'obsidian';

import { registry } from '@providers/registry';
import MetadataSearchPlugin from '../main';
import { FileNameFormatSuggest } from './suggesters/FileNameFormatSuggester';
import { FileSuggest } from './suggesters/FileSuggester';
import { FolderSuggest } from './suggesters/FolderSuggester';

const docUrl = 'https://github.com/fmartingr/obsidian-metadata-search-plugin';

export interface MetadataKindSettings {
  enabled: boolean;
  folder: string;
  fileNameFormat: string;
  templateFile: string;
  selectedProvider: string;
  showCoverImageInSearch: boolean;
  enableCoverImageSave: boolean;
  coverImagePath: string;
  providerSettings: Record<string, Record<string, string>>;
}

export interface PluginSettings {
  openPageOnCompletion: boolean;
  kinds: Record<string, MetadataKindSettings>;
}

export const DEFAULT_KIND_SETTINGS: MetadataKindSettings = {
  enabled: true,
  folder: '',
  fileNameFormat: '',
  templateFile: '',
  selectedProvider: '',
  showCoverImageInSearch: false,
  enableCoverImageSave: false,
  coverImagePath: '',
  providerSettings: {},
};

export const DEFAULT_SETTINGS: PluginSettings = {
  openPageOnCompletion: true,
  kinds: {},
};

/** Sample values used to preview file name format in settings. */
const FILE_NAME_PREVIEW_VALUES: Record<string, string> = {
  title: 'Book Title',
  subtitle: 'A Subtitle',
  author: 'Author Name',
  authors: 'Author One, Author Two',
  category: 'Fiction',
  publisher: 'Publisher',
  publishDate: '2025',
  totalPage: '300',
  isbn10: '0123456789',
  isbn13: '9780123456789',
};

/**
 * Replace {{variable}} patterns with sample preview values.
 * Any remaining {{…}} tokens are kept as-is (e.g. {{DATE}}).
 */
function previewFileName(format: string): string {
  if (!format) return '';
  let result = replaceDateInString(format);
  for (const [key, sample] of Object.entries(FILE_NAME_PREVIEW_VALUES)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'ig'), sample);
  }
  return result;
}

export class MetadataSearchSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: MetadataSearchPlugin,
  ) {
    super(app, plugin);
  }

  private getKindSettings(kindId: string): MetadataKindSettings {
    return this.plugin.getKindSettings(kindId);
  }

  private saveSettings(): Promise<void> {
    return this.plugin.saveSettings();
  }

  private createHeading(title: string, containerEl: HTMLElement): Setting {
    return new Setting(containerEl).setHeading().setName(title);
  }

  private createSubheading(title: string, containerEl: HTMLElement): void {
    containerEl.createEl('h4', {
      text: title,
      cls: 'metadata-search-plugin__subheading',
    });
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.classList.add('metadata-search-plugin__settings');

    // == Global Settings ==
    this.createHeading('General', containerEl);

    new Setting(containerEl)
      .setName('Open new note on completion')
      .setDesc('Automatically open the note after creation.')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.openPageOnCompletion).onChange(async value => {
          this.plugin.settings.openPageOnCompletion = value;
          await this.saveSettings();
        }),
      );

    // == Per-Kind Settings ==
    for (const kind of registry.getKinds()) {
      const kindSettings = this.getKindSettings(kind.id);
      this.renderKindSettings(containerEl, kind.id, kind.name, kindSettings);
    }
  }

  private renderKindSettings(
    containerEl: HTMLElement,
    kindId: string,
    kindName: string,
    kindSettings: MetadataKindSettings,
  ): void {
    this.createHeading(kindName, containerEl);

    // Wrapper that visually groups all settings for this kind
    const kindWrapper = containerEl.createDiv({
      cls: 'metadata-search-plugin__kind-group',
    });

    // Container for settings below the enabled toggle (hidden when disabled)
    const kindBody = kindWrapper.createDiv();

    const updateVisibility = () => {
      kindBody.toggleClass('metadata-search-plugin__hide', !kindSettings.enabled);
    };

    // Enabled toggle
    new Setting(kindWrapper)
      .setName('Enabled')
      .setDesc(`Enable ${kindName.toLowerCase()} metadata search.`)
      .addToggle(toggle =>
        toggle.setValue(kindSettings.enabled).onChange(async value => {
          kindSettings.enabled = value;
          await this.saveSettings();
          updateVisibility();
        }),
      );

    // Move kindBody after the enabled toggle (the toggle was appended after the div)
    kindWrapper.appendChild(kindBody);
    updateVisibility();

    // ── Provider ──
    this.createSubheading('Provider', kindBody);
    this.renderProviderSettings(kindBody, kindId, kindSettings);

    // ── Note creation ──
    this.createSubheading('Note creation', kindBody);
    this.renderNoteCreationSettings(kindBody, kindId, kindSettings);

    // ── Cover images ──
    this.createSubheading('Cover images', kindBody);
    this.renderCoverImageSettings(kindBody, kindSettings);

    // ── Template info ──
    const kind = registry.getKind(kindId);
    if (kind) {
      this.createSubheading('Template reference', kindBody);
      const paramsDesc = document.createDocumentFragment();
      paramsDesc.createDiv({
        text: `Available template parameters:`,
      });
      const paramsList = paramsDesc.createEl('div', {
        cls: 'metadata-search-plugin__params-list',
      });
      for (const p of kind.templateParameters) {
        paramsList.createEl('code', { text: `{{${p}}}`, cls: 'metadata-search-plugin__param-tag' });
      }
      new Setting(kindBody).setDesc(paramsDesc);
    }
  }

  // ── Provider settings ──

  private renderProviderSettings(containerEl: HTMLElement, kindId: string, kindSettings: MetadataKindSettings): void {
    const providers = registry.getProvidersForKind(kindId);
    if (providers.length === 0) return;

    // Provider-specific settings container (re-rendered when provider changes)
    const providerSettingsContainer = containerEl.createDiv();

    const renderCurrentProviderSettings = () => {
      providerSettingsContainer.empty();
      const selectedId = kindSettings.selectedProvider;
      const registration = registry.getProviderRegistration(selectedId);
      if (!registration) return;

      // Ensure provider settings exist
      if (!kindSettings.providerSettings[selectedId]) {
        kindSettings.providerSettings[selectedId] = {};
      }
      const providerSettings = kindSettings.providerSettings[selectedId];
      const save = () => this.saveSettings();

      // Render basic setting fields (credentials)
      for (const field of registration.settingDefinitions) {
        if (field.type === 'password') {
          const desc = document.createDocumentFragment();
          desc.createDiv({ text: field.description });
          desc.createDiv({ text: 'For security, the saved value is not shown.' });
          let tempValue = '';
          new Setting(providerSettingsContainer)
            .setName(field.name)
            .setDesc(desc)
            .addText(text => {
              text.inputEl.type = 'password';
              text.setValue('').onChange(value => {
                tempValue = value;
              });
            })
            .addButton(button => {
              button.setButtonText('Save').onClick(async () => {
                providerSettings[field.key] = tempValue;
                await save();
                new Notice(`${field.name} saved.`);
              });
            });
        } else {
          new Setting(providerSettingsContainer)
            .setName(field.name)
            .setDesc(field.description)
            .addText(text => {
              text.setValue(providerSettings[field.key] || '').onChange(async value => {
                providerSettings[field.key] = value;
                await save();
              });
            });
        }
      }

      // Render extra settings from the provider registration
      if (registration.renderExtraSettings) {
        registration.renderExtraSettings(providerSettingsContainer, providerSettings, save);
      }
    };

    // Provider dropdown
    new Setting(containerEl)
      .setName('Service provider')
      .setDesc('Choose the service provider for searching.')
      .setClass('metadata-search-plugin__settings--service_provider')
      .addDropdown(dropdown => {
        for (const provider of providers) {
          dropdown.addOption(provider.id, provider.name);
        }
        dropdown.setValue(kindSettings.selectedProvider).onChange(async value => {
          kindSettings.selectedProvider = value;
          await this.saveSettings();
          renderCurrentProviderSettings();
        });
      });

    // Provider credentials and extra settings appear right below the dropdown
    containerEl.appendChild(providerSettingsContainer);
    renderCurrentProviderSettings();
  }

  // ── Note creation settings ──

  private renderNoteCreationSettings(
    containerEl: HTMLElement,
    kindId: string,
    kindSettings: MetadataKindSettings,
  ): void {
    const kind = registry.getKind(kindId);
    const defaultFormat = kind?.defaultFileNameFormat || '{{title}}';

    // New file location
    new Setting(containerEl)
      .setName('New file location')
      .setDesc(`New ${kind?.name.toLowerCase() || ''} notes will be placed here.`)
      .addSearch(cb => {
        try {
          new FolderSuggest(this.app, cb.inputEl);
        } catch (e) {
          console.error(e);
        }
        cb.setPlaceholder('Example: folder1/folder2')
          .setValue(kindSettings.folder)
          .onChange(async newFolder => {
            kindSettings.folder = newFolder;
            await this.saveSettings();
          });
      });

    // File name format — preview lives inside the setting description
    const fileNameDesc = document.createDocumentFragment();
    fileNameDesc.createDiv({ text: 'Enter the file name format.' });
    const hintEl = fileNameDesc.createDiv({
      cls: 'metadata-search-plugin__settings--new_file_name_hint',
    });
    const updateHint = (format: string) => {
      hintEl.empty();
      const preview = previewFileName(format) || previewFileName(defaultFormat);
      hintEl.createSpan({ text: 'Preview: ' });
      hintEl.createEl('code', { text: preview });
    };
    updateHint(kindSettings.fileNameFormat);

    new Setting(containerEl)
      .setName('New file name')
      .setDesc(fileNameDesc)
      .addSearch(cb => {
        try {
          new FileNameFormatSuggest(this.app, cb.inputEl);
        } catch (e) {
          console.error(e);
        }
        cb.setPlaceholder(`Example: ${defaultFormat}`)
          .setValue(kindSettings.fileNameFormat)
          .onChange(async newValue => {
            kindSettings.fileNameFormat = newValue?.trim();
            await this.saveSettings();
            updateHint(newValue);
          });
      });

    // Template file
    const templateFileDesc = document.createDocumentFragment();
    templateFileDesc.createDiv({ text: 'Template file to use when creating notes.' });
    templateFileDesc.createEl('a', {
      text: 'Example Template',
      href: `${docUrl}#example-template`,
    });
    new Setting(containerEl)
      .setName('Template file')
      .setDesc(templateFileDesc)
      .addSearch(cb => {
        try {
          new FileSuggest(this.app, cb.inputEl);
        } catch {
          // eslint-disable
        }
        cb.setPlaceholder('Example: templates/template-file')
          .setValue(kindSettings.templateFile)
          .onChange(async newTemplateFile => {
            kindSettings.templateFile = newTemplateFile;
            await this.saveSettings();
          });
      });

    // Show cover images in search
    new Setting(containerEl)
      .setName('Show cover images in search')
      .setDesc('Show cover images in the search results.')
      .addToggle(toggle =>
        toggle.setValue(kindSettings.showCoverImageInSearch).onChange(async value => {
          kindSettings.showCoverImageInSearch = value;
          await this.saveSettings();
        }),
      );
  }

  // ── Cover image settings ──

  private renderCoverImageSettings(containerEl: HTMLElement, kindSettings: MetadataKindSettings): void {
    const coverImagePathSetting = new Setting(containerEl)
      .setName('Cover image path')
      .setDesc('Path where cover images should be saved.')
      .addSearch(cb => {
        try {
          new FolderSuggest(this.app, cb.inputEl);
        } catch {
          // eslint-disable
        }
        cb.setPlaceholder('Enter the path (e.g., Images/Covers)')
          .setValue(kindSettings.coverImagePath)
          .onChange(async value => {
            kindSettings.coverImagePath = value.trim();
            await this.saveSettings();
          });
      });

    const updateCoverPathVisibility = () => {
      coverImagePathSetting.settingEl.toggleClass('metadata-search-plugin__hide', !kindSettings.enableCoverImageSave);
    };

    new Setting(containerEl)
      .setName('Save cover images')
      .setDesc('Download and save cover images alongside notes.')
      .addToggle(toggle =>
        toggle.setValue(kindSettings.enableCoverImageSave).onChange(async value => {
          kindSettings.enableCoverImageSave = value;
          await this.saveSettings();
          updateCoverPathVisibility();
        }),
      );

    // Re-order so the toggle appears before the path
    containerEl.appendChild(coverImagePathSetting.settingEl);
    updateCoverPathVisibility();
  }
}
