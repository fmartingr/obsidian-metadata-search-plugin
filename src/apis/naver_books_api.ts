import { Book } from '@models/book.model';
import { apiGet, BaseBooksApiImpl } from './base_api';
import { NaverBookItem, NaverBooksResponse } from './models/naver_books_response';

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function validateSettings(clientId: string, clientSecret: string): void {
  if (!clientId || !clientSecret) {
    throw new ConfigurationError(
      'Please obtain a "Client ID" and "Client Secret" from the Naver Developer Center and configure them in settings.',
    );
  }
}

export class NaverBooksApi implements BaseBooksApiImpl {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {
    validateSettings(clientId, clientSecret);
  }

  async getByQuery(query: string) {
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
      return searchResults.items.map(this.createBookItem);
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }

  createBookItem(item: NaverBookItem) {
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
    } as Book;
  }
}
