import { HardcoverBooksApi } from './hardcover_books_api';
import { HardcoverBook } from './models/hardcover_books_response';

describe('HardcoverBooksApi', () => {
  describe('constructor validation', () => {
    it('throws ConfigurationError when apiToken is empty', () => {
      expect(() => new HardcoverBooksApi('')).toThrow(
        'Please obtain an API token from Hardcover.app and configure it in settings.',
      );
    });

    it('does not throw when apiToken is provided', () => {
      expect(() => new HardcoverBooksApi('test-token')).not.toThrow();
    });
  });

  describe('createBookItem', () => {
    const api = new HardcoverBooksApi('test-token');

    const hardcoverItem: HardcoverBook = {
      id: 123,
      title: 'Cosmos',
      subtitle: 'A Personal Voyage',
      description: 'A personal voyage through space and time.',
      pages: 365,
      release_date: '1980-05-01',
      slug: 'cosmos',
      image: { url: 'https://example.com/cosmos.jpg' },
      contributions: [{ author: { name: 'Carl Sagan' } }],
      cached_tags: { Subject: ['Science', 'Astronomy'] },
      isbn_13: '9780345539434',
      isbn_10: '0345539435',
    };

    const book = api.createBookItem(hardcoverItem);

    it('maps title', () => {
      expect(book.title).toEqual('Cosmos');
    });

    it('maps subtitle', () => {
      expect(book.subtitle).toEqual('A Personal Voyage');
    });

    it('maps author from contributions', () => {
      expect(book.author).toEqual('Carl Sagan');
    });

    it('maps authors array from contributions', () => {
      expect(book.authors).toEqual(['Carl Sagan']);
    });

    it('joins multiple authors with comma', () => {
      const multiAuthorItem: HardcoverBook = {
        ...hardcoverItem,
        contributions: [{ author: { name: 'Author One' } }, { author: { name: 'Author Two' } }],
      };
      const multiAuthorBook = api.createBookItem(multiAuthorItem);
      expect(multiAuthorBook.author).toEqual('Author One, Author Two');
      expect(multiAuthorBook.authors).toEqual(['Author One', 'Author Two']);
    });

    it('maps coverUrl from image', () => {
      expect(book.coverUrl).toEqual('https://example.com/cosmos.jpg');
    });

    it('maps all cover size URLs from image', () => {
      expect(book.coverSmallUrl).toEqual('https://example.com/cosmos.jpg');
      expect(book.coverMediumUrl).toEqual('https://example.com/cosmos.jpg');
      expect(book.coverLargeUrl).toEqual('https://example.com/cosmos.jpg');
    });

    it('maps publishDate from release_date', () => {
      expect(book.publishDate).toEqual('1980-05-01');
    });

    it('maps totalPage from pages', () => {
      expect(book.totalPage).toEqual(365);
    });

    it('maps description', () => {
      expect(book.description).toEqual('A personal voyage through space and time.');
    });

    it('maps link from slug', () => {
      expect(book.link).toEqual('https://hardcover.app/books/cosmos');
    });

    it('maps isbn13', () => {
      expect(book.isbn13).toEqual('9780345539434');
    });

    it('maps isbn10', () => {
      expect(book.isbn10).toEqual('0345539435');
    });

    it('maps categories from cached_tags Subject', () => {
      expect(book.categories).toEqual(['Science', 'Astronomy']);
      expect(book.category).toEqual('Science, Astronomy');
    });

    it('handles missing optional fields', () => {
      const minimalItem: HardcoverBook = {
        id: 456,
        title: 'Minimal Book',
        contributions: [],
      };
      const minimalBook = api.createBookItem(minimalItem);
      expect(minimalBook.title).toEqual('Minimal Book');
      expect(minimalBook.subtitle).toEqual('');
      expect(minimalBook.author).toEqual('');
      expect(minimalBook.authors).toEqual([]);
      expect(minimalBook.coverUrl).toEqual('');
      expect(minimalBook.publishDate).toEqual('');
      expect(minimalBook.totalPage).toEqual('');
      expect(minimalBook.description).toEqual('');
      expect(minimalBook.link).toEqual('');
      expect(minimalBook.isbn13).toEqual('');
      expect(minimalBook.isbn10).toEqual('');
      expect(minimalBook.categories).toEqual([]);
      expect(minimalBook.category).toEqual('');
    });

    it('handles missing image object', () => {
      const noImageItem: HardcoverBook = {
        ...hardcoverItem,
        image: undefined,
      };
      const noImageBook = api.createBookItem(noImageItem);
      expect(noImageBook.coverUrl).toEqual('');
    });

    it('handles missing slug', () => {
      const noSlugItem: HardcoverBook = {
        ...hardcoverItem,
        slug: undefined,
      };
      const noSlugBook = api.createBookItem(noSlugItem);
      expect(noSlugBook.link).toEqual('');
    });
  });
});
