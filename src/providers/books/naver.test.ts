import { NaverBooksProvider } from './naver';
import { NaverBookItem } from './models/naver_books_response';

describe('NaverBooksProvider', () => {
  describe('validate', () => {
    it('throws when clientId is missing', () => {
      const provider = new NaverBooksProvider({ clientId: '', clientSecret: 'secret' });
      expect(() => provider.validate()).toThrow('Client ID');
    });

    it('throws when clientSecret is missing', () => {
      const provider = new NaverBooksProvider({ clientId: 'id', clientSecret: '' });
      expect(() => provider.validate()).toThrow('Client Secret');
    });

    it('does not throw when both are provided', () => {
      const provider = new NaverBooksProvider({ clientId: 'id', clientSecret: 'secret' });
      expect(() => provider.validate()).not.toThrow();
    });
  });

  describe('createResultItem', () => {
    const provider = new NaverBooksProvider({ clientId: 'id', clientSecret: 'secret' });

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

    const result = provider.createResultItem(naverItem);

    it('maps title', () => {
      expect(result.title).toEqual('Cosmos');
    });

    it('maps author', () => {
      expect(result.author).toEqual('Carl Sagan');
    });

    it('maps publisher', () => {
      expect(result.publisher).toEqual('Science Books');
    });

    it('maps coverUrl from image', () => {
      expect(result.coverUrl).toEqual('https://example.com/cosmos.jpg');
    });

    it('extracts year from pubdate', () => {
      expect(result.publishDate).toEqual('1980');
    });

    it('maps link', () => {
      expect(result.link).toEqual('https://example.com/cosmos');
    });

    it('maps description', () => {
      expect(result.description).toEqual('A personal voyage through space and time.');
    });

    it('maps isbn', () => {
      expect(result.isbn).toEqual('9780345539434');
    });

    it('sets isbn13 when isbn is 13+ characters', () => {
      expect(result.isbn13).toEqual('9780345539434');
      expect(result.isbn10).toBeUndefined();
    });

    it('sets isbn10 when isbn is shorter than 13 characters', () => {
      const shortIsbnItem: NaverBookItem = { ...naverItem, isbn: '0345539435' };
      const shortResult = provider.createResultItem(shortIsbnItem);
      expect(shortResult.isbn10).toEqual('0345539435');
      expect(shortResult.isbn13).toBeUndefined();
    });

    it('handles empty pubdate', () => {
      const noPubdateItem: NaverBookItem = { ...naverItem, pubdate: '' };
      const noPubdateResult = provider.createResultItem(noPubdateItem);
      expect(noPubdateResult.publishDate).toEqual('');
    });
  });

  describe('getSupportedParameters', () => {
    it('includes expected book fields', () => {
      const provider = new NaverBooksProvider({ clientId: 'id', clientSecret: 'secret' });
      expect(provider.getSupportedParameters()).toContain('title');
      expect(provider.getSupportedParameters()).toContain('author');
      expect(provider.getSupportedParameters()).toContain('isbn');
    });
  });
});
