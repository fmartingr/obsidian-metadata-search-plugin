import { HardcoverBooksProvider } from './hardcover';
import { HardcoverBook } from './models/hardcover_books_response';

describe('HardcoverBooksProvider', () => {
  describe('validate', () => {
    it('throws when apiToken is empty', () => {
      const provider = new HardcoverBooksProvider({ apiToken: '' });
      expect(() => provider.validate()).toThrow('API token');
    });

    it('does not throw when apiToken is provided', () => {
      const provider = new HardcoverBooksProvider({ apiToken: 'test-token' });
      expect(() => provider.validate()).not.toThrow();
    });
  });

  describe('createResultItem', () => {
    const provider = new HardcoverBooksProvider({ apiToken: 'test-token' });

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

    const result = provider.createResultItem(hardcoverItem);

    it('maps title', () => {
      expect(result.title).toEqual('Cosmos');
    });

    it('maps subtitle', () => {
      expect(result.subtitle).toEqual('A Personal Voyage');
    });

    it('maps author from contributions', () => {
      expect(result.author).toEqual('Carl Sagan');
    });

    it('maps authors array', () => {
      expect(result.authors).toEqual(['Carl Sagan']);
    });

    it('joins multiple authors', () => {
      const multiAuthorItem: HardcoverBook = {
        ...hardcoverItem,
        contributions: [{ author: { name: 'Author One' } }, { author: { name: 'Author Two' } }],
      };
      const multiResult = provider.createResultItem(multiAuthorItem);
      expect(multiResult.author).toEqual('Author One, Author Two');
      expect(multiResult.authors).toEqual(['Author One', 'Author Two']);
    });

    it('maps coverUrl', () => {
      expect(result.coverUrl).toEqual('https://example.com/cosmos.jpg');
    });

    it('maps publishDate', () => {
      expect(result.publishDate).toEqual('1980-05-01');
    });

    it('maps totalPage', () => {
      expect(result.totalPage).toEqual(365);
    });

    it('maps description', () => {
      expect(result.description).toEqual('A personal voyage through space and time.');
    });

    it('maps link from slug', () => {
      expect(result.link).toEqual('https://hardcover.app/books/cosmos');
    });

    it('maps isbn13', () => {
      expect(result.isbn13).toEqual('9780345539434');
    });

    it('maps isbn10', () => {
      expect(result.isbn10).toEqual('0345539435');
    });

    it('maps categories from cached_tags', () => {
      expect(result.categories).toEqual(['Science', 'Astronomy']);
      expect(result.category).toEqual('Science, Astronomy');
    });

    it('handles missing optional fields', () => {
      const minimalItem: HardcoverBook = {
        id: 456,
        title: 'Minimal Book',
        contributions: [],
      };
      const minimalResult = provider.createResultItem(minimalItem);
      expect(minimalResult.title).toEqual('Minimal Book');
      expect(minimalResult.subtitle).toEqual('');
      expect(minimalResult.author).toEqual('');
      expect(minimalResult.authors).toEqual([]);
      expect(minimalResult.coverUrl).toEqual('');
      expect(minimalResult.publishDate).toEqual('');
      expect(minimalResult.totalPage).toEqual('');
      expect(minimalResult.description).toEqual('');
      expect(minimalResult.link).toEqual('');
      expect(minimalResult.isbn13).toEqual('');
      expect(minimalResult.isbn10).toEqual('');
      expect(minimalResult.categories).toEqual([]);
      expect(minimalResult.category).toEqual('');
    });
  });

  describe('getSupportedParameters', () => {
    it('includes expected book fields', () => {
      const provider = new HardcoverBooksProvider({ apiToken: 'test-token' });
      const params = provider.getSupportedParameters();
      expect(params).toContain('title');
      expect(params).toContain('author');
      expect(params).toContain('isbn13');
    });
  });
});
