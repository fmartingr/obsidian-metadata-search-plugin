import { apiGet } from '@utils/api';
import languages from '@utils/languages';
import { MetadataProvider, ProviderRegistration, SearchResult } from '../types';
import { BOOKS_TEMPLATE_PARAMETERS } from './kind';
import { GoogleBooksResponse, VolumeInfo } from './models/google_books_response';
import { Notice, Setting } from 'obsidian';

const SUPPORTED_PARAMETERS = BOOKS_TEMPLATE_PARAMETERS.filter(p => p !== 'localCoverImage');

export class GoogleBooksProvider implements MetadataProvider {
  readonly id = 'google-books';
  readonly name = 'Google Books';
  readonly kind = 'books';

  private static readonly MAX_RESULTS = 40;
  private static readonly PRINT_TYPE = 'books';

  private readonly apiKey: string;
  private readonly localePreference: string;
  private readonly askForLocale: boolean;
  private readonly enableCoverImageEdgeCurl: boolean;

  constructor(private readonly settings: Record<string, string>) {
    this.apiKey = settings.apiKey || '';
    this.localePreference = settings.localePreference || 'default';
    this.askForLocale = settings.askForLocale !== 'false';
    this.enableCoverImageEdgeCurl = settings.enableCoverImageEdgeCurl !== 'false';
  }

  getSupportedParameters(): string[] {
    return SUPPORTED_PARAMETERS;
  }

  getSettingDefinitions() {
    return googleBooksRegistration.settingDefinitions;
  }

  validate(): void {
    // Google Books works without an API key (with rate limits)
  }

  renderSearchOptions(containerEl: HTMLElement, options: Record<string, string>): void {
    // Set default locale
    const defaultLocale = window.moment.locale();
    options.locale = this.localePreference === 'default' ? defaultLocale : this.localePreference;

    if (!this.askForLocale) return;

    new Setting(containerEl).setName('Locale').addDropdown(dropdown => {
      dropdown.addOption(defaultLocale, `${languages[defaultLocale] || defaultLocale}`);
      window.moment.locales().forEach(locale => {
        const localeName = languages[locale];
        if (localeName && locale !== defaultLocale) dropdown.addOption(locale, localeName);
      });
      dropdown.setValue(options.locale).onChange(locale => {
        options.locale = locale;
      });
    });
  }

  async search(query: string, options?: Record<string, string>): Promise<SearchResult[]> {
    try {
      const params = this.buildSearchParams(query, options);
      const searchResults = await apiGet<GoogleBooksResponse>('https://www.googleapis.com/books/v1/volumes', params);
      if (!searchResults?.totalItems) return [];
      return searchResults.items.map(({ volumeInfo }) => this.createResultItem(volumeInfo));
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }

  private buildSearchParams(query: string, options?: Record<string, string>): Record<string, string | number> {
    const locale = options?.locale || this.localePreference;
    const params: Record<string, string | number> = {
      q: query,
      maxResults: GoogleBooksProvider.MAX_RESULTS,
      printType: GoogleBooksProvider.PRINT_TYPE,
      langRestrict: locale === 'default' ? window.moment.locale() : locale,
    };
    if (this.apiKey) {
      params['key'] = this.apiKey;
    }
    return params;
  }

  private createResultItem(item: VolumeInfo): SearchResult {
    const images = item.imageLinks;
    const baseUrl = images?.thumbnail ?? '';
    const isbns = this.extractISBNs(item.industryIdentifiers);

    return {
      title: item.title ?? '',
      subtitle: item.subtitle ?? '',
      author: this.formatList(item.authors),
      authors: item.authors ?? [],
      category: this.formatList(item.categories),
      categories: item.categories ?? [],
      publisher: item.publisher ?? '',
      publishDate: item.publishedDate ?? '',
      totalPage: item.pageCount ?? '',
      coverUrl: this.setCoverImageEdgeCurl(
        images?.extraLarge ?? (baseUrl ? GoogleBooksProvider.convertImageURLSize(baseUrl, 6) : ''),
      ),
      coverSmallUrl: this.setCoverImageEdgeCurl(images?.smallThumbnail ?? ''),
      coverMediumUrl: this.setCoverImageEdgeCurl(images?.thumbnail ?? ''),
      coverLargeUrl: this.setCoverImageEdgeCurl(images?.extraLarge ?? images?.large ?? ''),
      description: item.description ?? '',
      link: item.canonicalVolumeLink || item.infoLink || '',
      previewLink: item.previewLink ?? '',
      ...isbns,
    };
  }

  private extractISBNs(industryIdentifiers: VolumeInfo['industryIdentifiers']): Record<string, string> {
    return (
      industryIdentifiers?.reduce(
        (result, item) => {
          const isbnType = item.type === 'ISBN_10' ? 'isbn10' : 'isbn13';
          result[isbnType] = item.identifier.trim();
          return result;
        },
        {} as Record<string, string>,
      ) ?? {}
    );
  }

  public formatList(list?: string[]): string {
    return list && list.length > 1 ? list.map(item => item.trim()).join(', ') : (list?.[0] ?? '');
  }

  private setCoverImageEdgeCurl(url: string): string {
    if (!url) return url;
    try {
      const urlObj = new URL(url);
      urlObj.protocol = 'https:';
      if (!this.enableCoverImageEdgeCurl) {
        urlObj.searchParams.delete('edge');
      }
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  static convertImageURLSize(url: string, zoom: number): string {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('zoom', String(zoom));
      return urlObj.toString();
    } catch {
      return url;
    }
  }
}

export const googleBooksRegistration: ProviderRegistration = {
  id: 'google-books',
  name: 'Google Books',
  kind: 'books',
  settingDefinitions: [
    {
      key: 'apiKey',
      name: 'API Key',
      description: 'Google Books API key. Optional but recommended to avoid rate limits.',
      type: 'password',
    },
  ],
  factory: (settings: Record<string, string>) => new GoogleBooksProvider(settings),
  renderExtraSettings: (containerEl: HTMLElement, settings: Record<string, string>, save: () => Promise<void>) => {
    // Preferred locale dropdown
    const defaultLocale = window.moment.locale();
    new Setting(containerEl)
      .setName('Preferred locale')
      .setDesc('Default locale for book searches.')
      .addDropdown(dropdown => {
        dropdown.addOption(defaultLocale, `${languages[defaultLocale] || defaultLocale} (Default)`);
        window.moment.locales().forEach(locale => {
          const localeName = languages[locale];
          if (localeName && locale !== defaultLocale) dropdown.addOption(locale, localeName);
        });
        const current = settings.localePreference || 'default';
        dropdown.setValue(current === 'default' ? defaultLocale : current).onChange(async value => {
          settings.localePreference = value;
          await save();
        });
      });

    // Ask for locale toggle
    new Setting(containerEl)
      .setName('Ask for locale')
      .setDesc('Show locale picker in search modal.')
      .addToggle(toggle => {
        toggle.setValue(settings.askForLocale !== 'false').onChange(async value => {
          settings.askForLocale = String(value);
          await save();
        });
      });

    // Edge curl toggle
    new Setting(containerEl)
      .setName('Cover image edge curl')
      .setDesc('Show page curl effect in Google Books cover images.')
      .addToggle(toggle => {
        toggle.setValue(settings.enableCoverImageEdgeCurl !== 'false').onChange(async value => {
          settings.enableCoverImageEdgeCurl = String(value);
          await save();
        });
      });

    // API key status check
    new Setting(containerEl)
      .setName('API key status')
      .setDesc('Check whether an API key is saved.')
      .addButton(btn => {
        btn.setButtonText('Check').onClick(() => {
          new Notice(settings.apiKey ? 'API key exists.' : 'No API key set.');
        });
      });
  },
};
