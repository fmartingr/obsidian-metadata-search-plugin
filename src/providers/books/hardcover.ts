import { apiPost } from '@utils/api';
import { MetadataProvider, ProviderRegistration, SearchResult } from '../types';
import { HardcoverBook, HardcoverBooksResponse, HardcoverSearchResponse } from './models/hardcover_books_response';
import { Notice, Setting } from 'obsidian';

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

const HARDCOVER_API_URL = 'https://api.hardcover.app/v1/graphql';

const SEARCH_QUERY = `
query SearchBooks($query: String!) {
  search(query: $query, query_type: "books", per_page: 20) {
    ids
  }
}`;

const BOOKS_QUERY = `
query GetBooks($ids: [Int!]!) {
  books(where: { id: { _in: $ids } }, limit: 20) {
    id
    title
    subtitle
    description
    pages
    release_date
    slug
    image { url }
    contributions { author { name } }
    cached_tags
    isbn_13
    isbn_10
  }
}`;

const SUPPORTED_PARAMETERS = [
  'title',
  'subtitle',
  'author',
  'authors',
  'category',
  'categories',
  'publisher',
  'publishDate',
  'totalPage',
  'coverUrl',
  'coverSmallUrl',
  'coverMediumUrl',
  'coverLargeUrl',
  'description',
  'link',
  'isbn13',
  'isbn10',
];

export class HardcoverBooksProvider implements MetadataProvider {
  readonly id = 'hardcover-books';
  readonly name = 'Hardcover';
  readonly kind = 'books';

  private readonly apiToken: string;

  constructor(settings: Record<string, string>) {
    this.apiToken = settings.apiToken || '';
  }

  getSupportedParameters(): string[] {
    return SUPPORTED_PARAMETERS;
  }

  getSettingDefinitions() {
    return hardcoverBooksRegistration.settingDefinitions;
  }

  validate(): void {
    if (!this.apiToken) {
      throw new ConfigurationError('Please obtain an API token from Hardcover.app and configure it in settings.');
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    this.validate();
    try {
      const headers = { Authorization: `Bearer ${this.apiToken}` };

      const searchResult = await apiPost<HardcoverSearchResponse>(
        HARDCOVER_API_URL,
        { query: SEARCH_QUERY, variables: { query } },
        headers,
      );

      const ids = searchResult?.data?.search?.ids;
      if (!ids?.length) {
        return [];
      }

      const booksResult = await apiPost<HardcoverBooksResponse>(
        HARDCOVER_API_URL,
        { query: BOOKS_QUERY, variables: { ids } },
        headers,
      );

      const books = booksResult?.data?.books;
      if (!books?.length) {
        return [];
      }

      return books.map(book => this.createResultItem(book));
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }

  createResultItem(item: HardcoverBook): SearchResult {
    const authors = item.contributions?.map(c => c.author.name) ?? [];
    const coverUrl = item.image?.url ?? '';
    const categories = this.extractCategories(item.cached_tags);

    return {
      title: item.title ?? '',
      subtitle: item.subtitle ?? '',
      author: authors.length > 1 ? authors.join(', ') : (authors[0] ?? ''),
      authors,
      category: categories.length > 1 ? categories.join(', ') : (categories[0] ?? ''),
      categories,
      publisher: '',
      publishDate: item.release_date ?? '',
      totalPage: item.pages ?? '',
      coverUrl,
      coverSmallUrl: coverUrl,
      coverMediumUrl: coverUrl,
      coverLargeUrl: coverUrl,
      description: item.description ?? '',
      link: item.slug ? `https://hardcover.app/books/${item.slug}` : '',
      previewLink: '',
      isbn13: item.isbn_13 ?? '',
      isbn10: item.isbn_10 ?? '',
    };
  }

  private extractCategories(cachedTags?: Record<string, unknown>): string[] {
    if (!cachedTags) return [];
    const subjects = cachedTags['Subject'] ?? cachedTags['subjects'] ?? cachedTags['subject'];
    if (Array.isArray(subjects)) {
      return subjects.filter((s): s is string => typeof s === 'string');
    }
    return [];
  }
}

export const hardcoverBooksRegistration: ProviderRegistration = {
  id: 'hardcover-books',
  name: 'Hardcover',
  kind: 'books',
  settingDefinitions: [
    {
      key: 'apiToken',
      name: 'API Token',
      description: 'Hardcover.app API token.',
      type: 'password',
    },
  ],
  factory: (settings: Record<string, string>) => new HardcoverBooksProvider(settings),
  renderExtraSettings: (containerEl: HTMLElement, settings: Record<string, string>, save: () => Promise<void>) => {
    void save; // settings are saved via the main field definitions
    new Setting(containerEl)
      .setName('Connection check')
      .setDesc('Verify API token validity against the Hardcover API.')
      .addButton(btn => {
        btn.setButtonText('Test Connection').onClick(async () => {
          const token = settings.apiToken;
          if (!token) {
            new Notice('No API token set.');
            return;
          }
          try {
            await apiPost<{ data: { me: { id: number } } }>(
              HARDCOVER_API_URL,
              { query: '{ me { id } }' },
              { Authorization: `Bearer ${token}` },
            );
            new Notice('Hardcover API connection successful.');
          } catch {
            new Notice('Hardcover API connection failed. Please check your token.');
          }
        });
      });
  },
};
