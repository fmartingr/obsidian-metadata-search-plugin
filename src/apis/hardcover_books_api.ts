import { Book } from '@models/book.model';
import { apiPost, BaseBooksApiImpl } from './base_api';
import { HardcoverBook, HardcoverBooksResponse, HardcoverSearchResponse } from './models/hardcover_books_response';

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

export class HardcoverBooksApi implements BaseBooksApiImpl {
  constructor(private readonly apiToken: string) {
    if (!apiToken) {
      throw new ConfigurationError('Please obtain an API token from Hardcover.app and configure it in settings.');
    }
  }

  async getByQuery(query: string): Promise<Book[]> {
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

      return books.map(book => this.createBookItem(book));
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }

  createBookItem(item: HardcoverBook): Book {
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
