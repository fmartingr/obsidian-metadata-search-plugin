import { apiGet } from '@utils/api';
import { MetadataProvider, ProviderRegistration, SearchResult } from '../types';
import { NaverBookItem, NaverBooksResponse } from './models/naver_books_response';

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

const SUPPORTED_PARAMETERS = [
  'title',
  'author',
  'publisher',
  'coverUrl',
  'publishDate',
  'link',
  'description',
  'isbn',
  'isbn10',
  'isbn13',
];

export class NaverBooksProvider implements MetadataProvider {
  readonly id = 'naver-books';
  readonly name = 'Naver Books';
  readonly kind = 'books';

  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(settings: Record<string, string>) {
    this.clientId = settings.clientId || '';
    this.clientSecret = settings.clientSecret || '';
  }

  getSupportedParameters(): string[] {
    return SUPPORTED_PARAMETERS;
  }

  getSettingDefinitions() {
    return naverBooksRegistration.settingDefinitions;
  }

  validate(): void {
    if (!this.clientId || !this.clientSecret) {
      throw new ConfigurationError(
        'Please obtain a "Client ID" and "Client Secret" from the Naver Developer Center and configure them in settings.',
      );
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    this.validate();
    try {
      const params = {
        query,
        display: 50,
        sort: 'sim',
      };
      const header = {
        'X-Naver-Client-Id': this.clientId,
        'X-Naver-Client-Secret': this.clientSecret,
      };
      const searchResults = await apiGet<NaverBooksResponse>(
        'https://openapi.naver.com/v1/search/book.json',
        params,
        header,
      );
      if (!searchResults?.total) {
        return [];
      }
      return searchResults.items.map(item => this.createResultItem(item));
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }

  createResultItem(item: NaverBookItem): SearchResult {
    return {
      title: item.title,
      author: item.author,
      publisher: item.publisher,
      coverUrl: item.image,
      publishDate: item.pubdate?.slice(0, 4) || '',
      link: item.link,
      description: item.description,
      isbn: item.isbn,
      ...(item.isbn?.length >= 13 ? { isbn13: item.isbn } : { isbn10: item.isbn }),
    };
  }
}

export const naverBooksRegistration: ProviderRegistration = {
  id: 'naver-books',
  name: 'Naver Books',
  kind: 'books',
  settingDefinitions: [
    {
      key: 'clientId',
      name: 'Client ID',
      description: 'Naver Developer Center Client ID.',
      type: 'text',
    },
    {
      key: 'clientSecret',
      name: 'Client Secret',
      description: 'Naver Developer Center Client Secret.',
      type: 'password',
    },
  ],
  factory: (settings: Record<string, string>) => new NaverBooksProvider(settings),
};
