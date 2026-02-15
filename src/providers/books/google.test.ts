import { SearchResult } from '@providers/types';
import { GoogleBooksProvider } from './google';
import { Type, VolumeInfo } from './models/google_books_response';

describe('GoogleBooksProvider', () => {
  describe('createResultItem via search result mapping', () => {
    const volumeInfo: VolumeInfo = {
      title: 'Flow',
      subtitle: 'The Psychology of Optimal Experience',
      authors: ['Mihaly Csikszentmihalyi'],
      publisher: 'Harper Collins',
      publishedDate: '2009-10-13',
      description: 'The bestselling classic...',
      industryIdentifiers: [
        { type: Type.Isbn10, identifier: '0061876720' },
        { type: Type.Isbn13, identifier: '9780061876721' },
      ],
      readingModes: { text: true, image: false },
      pageCount: 336,
      printType: 'BOOK',
      categories: ['Psychology / Creative Ability', 'Psychology / Applied Psychology'],
      maturityRating: 'NOT_MATURE',
      allowAnonLogging: true,
      contentVersion: '1.4.3.0.preview.2',
      panelizationSummary: { containsEpubBubbles: false, containsImageBubbles: false },
      imageLinks: {
        smallThumbnail:
          'http://books.google.com/books/content?id=QVjPsd1UukEC&printsec=frontcover&img=1&zoom=5&edge=curl&imgtk=AFLRE71&source=gbs_api',
        thumbnail:
          'http://books.google.com/books/content?id=QVjPsd1UukEC&printsec=frontcover&img=1&zoom=1&edge=curl&imgtk=AFLRE71&source=gbs_api',
      },
      language: 'en',
      previewLink: 'http://books.google.fr/books?id=QVjPsd1UukEC&hl=&source=gbs_api',
      infoLink: 'https://play.google.com/store/books/details?id=QVjPsd1UukEC&source=gbs_api',
      canonicalVolumeLink: 'https://play.google.com/store/books/details?id=QVjPsd1UukEC',
    };

    const provider = new GoogleBooksProvider({});
    // Access private method for testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: SearchResult = (provider as any).createResultItem(volumeInfo);

    it('maps title', () => {
      expect(result.title).toEqual(volumeInfo.title);
    });

    it('maps subtitle', () => {
      expect(result.subtitle).toEqual(volumeInfo.subtitle);
    });

    it('maps author', () => {
      expect(result.author).toEqual('Mihaly Csikszentmihalyi');
    });

    it('maps category', () => {
      expect(result.category).toEqual('Psychology / Creative Ability, Psychology / Applied Psychology');
    });

    it('maps publisher', () => {
      expect(result.publisher).toEqual(volumeInfo.publisher);
    });

    it('maps publishDate', () => {
      expect(result.publishDate).toEqual(volumeInfo.publishedDate);
    });

    it('maps totalPage', () => {
      expect(result.totalPage).toEqual(volumeInfo.pageCount);
    });

    it('maps coverUrl with zoom=6', () => {
      const coverUrl = new URL(result.coverUrl as string);
      expect(coverUrl.searchParams.get('zoom')).toEqual('6');
    });

    it('maps isbn10', () => {
      expect(result.isbn10).toEqual('0061876720');
    });

    it('maps isbn13', () => {
      expect(result.isbn13).toEqual('9780061876721');
    });

    it('maps link', () => {
      expect(result.link).toEqual(volumeInfo.canonicalVolumeLink);
    });

    it('always removes edge curl from cover URLs', () => {
      expect(result.coverUrl).not.toContain('edge=curl');
      expect(result.coverSmallUrl).not.toContain('edge=curl');
      expect(result.coverMediumUrl).not.toContain('edge=curl');
    });
  });

  describe('validate', () => {
    it('does not throw (Google works without API key)', () => {
      const provider = new GoogleBooksProvider({});
      expect(() => provider.validate()).not.toThrow();
    });
  });

  describe('getSupportedParameters', () => {
    it('returns an array of parameter names', () => {
      const provider = new GoogleBooksProvider({});
      expect(provider.getSupportedParameters().length).toBeGreaterThan(0);
      expect(provider.getSupportedParameters()).toContain('title');
      expect(provider.getSupportedParameters()).toContain('author');
    });
  });

  describe('convertImageURLSize', () => {
    it('changes zoom without affecting other parameters', () => {
      const baseUrl =
        'http://books.google.com/books/content?id=QVjPsd1UukEC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api';
      const result = GoogleBooksProvider.convertImageURLSize(baseUrl, 5);
      const resultUrl = new URL(result);
      expect(resultUrl.searchParams.get('zoom')).toEqual('5');
      expect(resultUrl.searchParams.get('id')).toEqual('QVjPsd1UukEC');
    });
  });
});
