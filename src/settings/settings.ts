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

  private createHeader(title: string, containerEl: HTMLElement): Setting {
    const header = document.createDocumentFragment();
    header.createEl('h2', { text: title });
    return new Setting(containerEl).setHeading().setName(header);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.classList.add('metadata-search-plugin__settings');

    // == Global Settings ==
    this.createHeader('General Settings', containerEl);

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
    this.createHeader(kindName, containerEl);

    // Enabled toggle
    new Setting(containerEl)
      .setName('Enabled')
      .setDesc(`Enable ${kindName.toLowerCase()} metadata search.`)
      .addToggle(toggle =>
        toggle.setValue(kindSettings.enabled).onChange(async value => {
          kindSettings.enabled = value;
          await this.saveSettings();
        }),
      );

    // New file location
    new Setting(containerEl)
      .setName('New file location')
      .setDesc(`New ${kindName.toLowerCase()} notes will be placed here.`)
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

    // File name format
    const kind = registry.getKind(kindId);
    const defaultFormat = kind?.defaultFileNameFormat || '{{title}}';
    const newFileNameHint = document.createDocumentFragment().createEl('code', {
      text: replaceDateInString(kindSettings.fileNameFormat) || defaultFormat,
    });
    new Setting(containerEl)
      .setClass('metadata-search-plugin__settings--new_file_name')
      .setName('New file name')
      .setDesc('Enter the file name format.')
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
            newFileNameHint.innerHTML = replaceDateInString(newValue) || defaultFormat;
          });
      });
    containerEl
      .createEl('div', {
        cls: ['setting-item-description', 'metadata-search-plugin__settings--new_file_name_hint'],
      })
      .append(newFileNameHint);

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

    // Enable cover image save
    new Setting(containerEl)
      .setName('Save cover images')
      .setDesc('Download and save cover images alongside notes.')
      .addToggle(toggle =>
        toggle.setValue(kindSettings.enableCoverImageSave).onChange(async value => {
          kindSettings.enableCoverImageSave = value;
          await this.saveSettings();
        }),
      );

    // Cover image path
    new Setting(containerEl)
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

    // Provider selection
    this.renderProviderSettings(containerEl, kindId, kindSettings);

    // Template parameters info
    if (kind) {
      const paramsDesc = document.createDocumentFragment();
      paramsDesc.createDiv({
        text: `Available template parameters: ${kind.templateParameters.map(p => `{{${p}}}`).join(', ')}`,
        cls: 'setting-item-description',
      });
      new Setting(containerEl).setName('Template parameters').setDesc(paramsDesc);
    }
  }

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

      // Render basic setting fields
      for (const field of registration.settingDefinitions) {
        if (field.type === 'password') {
          // Password fields: don't show current value, use save button
          const desc = document.createDocumentFragment();
          desc.createDiv({ text: field.description });
          desc.createDiv({
            text: 'For security, the saved value is not shown.',
          });
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
          // Text fields: auto-save on change
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
      .setName('Provider')
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

    renderCurrentProviderSettings();
  }
}
