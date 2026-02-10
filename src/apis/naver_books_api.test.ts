import { NaverBooksApi } from './naver_books_api';
import { NaverBookItem } from './models/naver_books_response';

describe('NaverBooksApi', () => {
  describe('constructor validation', () => {
    it('throws ConfigurationError when clientId is empty', () => {
      expect(() => new NaverBooksApi('', 'secret')).toThrow(
        'Please obtain a "Client ID" and "Client Secret" from the Naver Developer Center and configure them in settings.',
      );
    });

    it('throws ConfigurationError when clientSecret is empty', () => {
      expect(() => new NaverBooksApi('id', '')).toThrow(
        'Please obtain a "Client ID" and "Client Secret" from the Naver Developer Center and configure them in settings.',
      );
    });

    it('throws ConfigurationError when both are empty', () => {
      expect(() => new NaverBooksApi('', '')).toThrow('Please obtain a "Client ID"');
    });

    it('does not throw when both clientId and clientSecret are provided', () => {
      expect(() => new NaverBooksApi('id', 'secret')).not.toThrow();
    });
  });

  describe('createBookItem', () => {
    const api = new NaverBooksApi('id', 'secret');

    const naverItem: NaverBookItem = {
      title: 'Cosmos',
      link: 'https://example.com/cosmos',
      image: 'https://example.com/cosmos.jpg',
      author: 'Carl Sagan',
      discount: '15000',
      publisher: 'Science Books',
      pubdate: '19800501',
      isbn: '9780345539434',
      description: 'A personal voyage through space and time.',
    };

    const book = api.createBookItem(naverItem);

    it('maps title', () => {
      expect(book.title).toEqual('Cosmos');
    });

    it('maps author', () => {
      expect(book.author).toEqual('Carl Sagan');
    });

    it('maps publisher', () => {
      expect(book.publisher).toEqual('Science Books');
    });

    it('maps coverUrl from image', () => {
      expect(book.coverUrl).toEqual('https://example.com/cosmos.jpg');
    });

    it('extracts year from pubdate', () => {
      expect(book.publishDate).toEqual('1980');
    });

    it('maps link', () => {
      expect(book.link).toEqual('https://example.com/cosmos');
    });

    it('maps description', () => {
      expect(book.description).toEqual('A personal voyage through space and time.');
    });

    it('maps isbn', () => {
      expect(book.isbn).toEqual('9780345539434');
    });

    it('sets isbn13 when isbn is 13 characters or longer', () => {
      expect(book.isbn13).toEqual('9780345539434');
      expect(book.isbn10).toBeUndefined();
    });

    it('sets isbn10 when isbn is shorter than 13 characters', () => {
      const shortIsbnItem: NaverBookItem = {
        ...naverItem,
        isbn: '0345539435',
      };
      const shortIsbnBook = api.createBookItem(shortIsbnItem);
      expect(shortIsbnBook.isbn10).toEqual('0345539435');
      expect(shortIsbnBook.isbn13).toBeUndefined();
    });

    it('handles empty pubdate', () => {
      const noPubdateItem: NaverBookItem = {
        ...naverItem,
        pubdate: '',
      };
      const noPubdateBook = api.createBookItem(noPubdateItem);
      expect(noPubdateBook.publishDate).toEqual('');
    });
  });
});
