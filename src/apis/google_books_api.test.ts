import { Book } from '@models/book.model';
import { GoogleBooksApi } from './google_books_api';
import { Type, VolumeInfo } from './models/google_books_response';

describe('Book creation', () => {
  const volumeInfo: VolumeInfo = {
    title: 'Flow',
    subtitle: 'The Psychology of Optimal Experience',
    authors: ['Mihaly Csikszentmihalyi'],
    publisher: 'Harper Collins',
    publishedDate: '2009-10-13',
    description:
      '\u003cp\u003e“Csikszentmihalyi arrives at an insight that many of us can intuitively grasp, despite our insistent (and culturally supported) denial of this truth. That is, it is not what happens to us that determines our happiness, but the manner in which we make sense of that reality. . . . The manner in which Csikszentmihalyi integrates research on consciousness, personal psychology and spirituality is illuminating.” —Los Angeles Times Book Review\u003c/p\u003e\u003cp\u003eThe bestselling classic that holds the key to unlocking meaning, creativity, peak performance, and true happiness. \u003c/p\u003e\u003cp\u003eLegendary psychologist Mihaly Csikszentmihalyi\'s famous investigations of "optimal experience" have revealed that what makes an experience genuinely satisfying is a state of consciousness called flow. During flow, people typically experience deep enjoyment, creativity, and a total involvement with life. In this new edition of his groundbreaking classic work, Csikszentmihalyi ("the leading researcher into ‘flow states’" —Newsweek) demonstrates the ways this positive state can be controlled, not just left to chance. Flow: The Psychology of Optimal Experience teaches how, by ordering the information that enters our consciousness, we can discover true happiness, unlock our potential, and greatly improve the quality of our lives.\u003c/p\u003e',
    industryIdentifiers: [
      {
        type: Type.Isbn10,
        identifier: '0061876720',
      },
      {
        type: Type.Isbn13,
        identifier: '9780061876721',
      },
    ],
    readingModes: {
      text: true,
      image: false,
    },
    pageCount: 336,
    printType: 'BOOK',
    categories: ['Psychology / Creative Ability', 'Psychology / Applied Psychology', 'Psychology / Personality'],
    averageRating: 4,
    ratingsCount: 1404,
    maturityRating: 'NOT_MATURE',
    allowAnonLogging: true,
    contentVersion: '1.4.3.0.preview.2',
    panelizationSummary: {
      containsEpubBubbles: false,
      containsImageBubbles: false,
    },
    imageLinks: {
      smallThumbnail:
        'http://books.google.com/books/content?id=QVjPsd1UukEC&printsec=frontcover&img=1&zoom=5&edge=curl&imgtk=AFLRE71MowoDIZtesyLc6kiXVlnvQznYNgPj7fIAedD1BNhyuPtLC5i3QuDwZKM_5Q-FZXaf0tMfBx2ijWUBEcVqPmYkK6ApHUMJVxsIlEP2maBsJJHIU2_De5ioR5KVAF0za48f39aA&source=gbs_api',
      thumbnail:
        'http://books.google.com/books/content?id=QVjPsd1UukEC&printsec=frontcover&img=1&zoom=1&edge=curl&imgtk=AFLRE71SvX9ABv9Ensxle-fchWlnS8UEYiU3Symajbi_0pbwhrZFP3ahRLKcK_RjWJP9pRMtbjSSK3SDbr_UXWQ8GbCnncMVCs37gYWGedBePMEbk4G9eCsiiWy22ejJIJ3H3bx53Huq&source=gbs_api',
    },
    language: 'en',
    previewLink: 'http://books.google.fr/books?id=QVjPsd1UukEC&hl=&source=gbs_api',
    infoLink: 'https://play.google.com/store/books/details?id=QVjPsd1UukEC&source=gbs_api',
    canonicalVolumeLink: 'https://play.google.com/store/books/details?id=QVjPsd1UukEC',
  };

  const api: GoogleBooksApi = new GoogleBooksApi('default', true);
  const book: Book = api.createBookItem(volumeInfo);

  it('Title', () => {
    expect(book.title).toEqual(volumeInfo.title);
  });

  it('Subtitle', () => {
    expect(book.subtitle).toEqual(volumeInfo.subtitle);
  });

  it('Author', () => {
    expect(book.author).toEqual(api.formatList(volumeInfo.authors));
  });

  it('Category', () => {
    expect(book.category).toEqual(api.formatList(volumeInfo.categories));
  });

  it('Publisher', () => {
    expect(book.publisher).toEqual(volumeInfo.publisher);
  });

  it('Published date', () => {
    expect(book.publishDate).toEqual(volumeInfo.publishedDate);
  });

  it('Total pages', () => {
    expect(book.totalPage).toEqual(volumeInfo.pageCount);
  });

  it('Cover URL is the largest available (zoom=6 derived from thumbnail)', () => {
    const coverUrl = new URL(book.coverUrl);
    const thumbnailUrl = new URL(volumeInfo.imageLinks.thumbnail!);
    expect(coverUrl.searchParams.get('zoom')).toEqual('6');
    expect(coverUrl.searchParams.get('id')).toEqual(thumbnailUrl.searchParams.get('id'));
    expect(coverUrl.searchParams.get('imgtk')).toEqual(thumbnailUrl.searchParams.get('imgtk'));
  });

  it('Cover small URL', () => {
    expect(book.coverSmallUrl).toEqual(volumeInfo.imageLinks.smallThumbnail!.replace('http://', 'https://'));
  });

  it('Cover medium URL is the thumbnail (reliable for download)', () => {
    expect(book.coverMediumUrl).toEqual(volumeInfo.imageLinks.thumbnail!.replace('http://', 'https://'));
  });

  it('Description', () => {
    expect(book.description).toEqual(volumeInfo.description);
  });

  it('Link', () => {
    expect(book.link).toEqual(volumeInfo.canonicalVolumeLink);
  });

  it('Preview link', () => {
    expect(book.previewLink).toEqual(volumeInfo.previewLink);
  });

  it('ISBN 10', () => {
    expect(book.isbn10).toEqual(volumeInfo.industryIdentifiers[0].identifier);
  });

  it('ISBN 13', () => {
    expect(book.isbn13).toEqual(volumeInfo.industryIdentifiers[1].identifier);
  });

  it('Enables Edge curl', () => {
    expect(book.coverUrl).toContain('&edge=curl');
    expect(book.coverSmallUrl).toContain('&edge=curl');
  });

  it('Disables Edge curl', () => {
    const api: GoogleBooksApi = new GoogleBooksApi('default', false);
    const book: Book = api.createBookItem(volumeInfo);

    expect(book.coverUrl).not.toContain('&edge=curl');
    expect(book.coverSmallUrl).not.toContain('&edge=curl');
  });

  it('Disabling Edge curl preserves all other URL parameters', () => {
    const api: GoogleBooksApi = new GoogleBooksApi('default', false);
    const book: Book = api.createBookItem(volumeInfo);

    // coverMediumUrl is the thumbnail, so we check edge curl removal on it
    const mediumUrl = new URL(book.coverMediumUrl!);
    const originalUrl = new URL(volumeInfo.imageLinks.thumbnail!);

    expect(mediumUrl.searchParams.get('id')).toEqual(originalUrl.searchParams.get('id'));
    expect(mediumUrl.searchParams.get('printsec')).toEqual(originalUrl.searchParams.get('printsec'));
    expect(mediumUrl.searchParams.get('img')).toEqual(originalUrl.searchParams.get('img'));
    expect(mediumUrl.searchParams.get('zoom')).toEqual(originalUrl.searchParams.get('zoom'));
    expect(mediumUrl.searchParams.get('imgtk')).toEqual(originalUrl.searchParams.get('imgtk'));
    expect(mediumUrl.searchParams.get('source')).toEqual(originalUrl.searchParams.get('source'));
    expect(mediumUrl.searchParams.has('edge')).toBe(false);
  });
});

describe('Cover URL size preference', () => {
  const baseThumbUrl =
    'http://books.google.com/books/content?id=testID&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api';

  const makeVolumeInfo = (imageLinks: Record<string, string>): VolumeInfo =>
    ({
      title: 'Test',
      publishedDate: '2020-01-01',
      industryIdentifiers: [],
      readingModes: { text: false, image: false },
      printType: 'BOOK',
      maturityRating: 'NOT_MATURE',
      allowAnonLogging: false,
      contentVersion: '1.0.0',
      panelizationSummary: { containsEpubBubbles: false, containsImageBubbles: false },
      imageLinks,
      language: 'en',
      previewLink: '',
      infoLink: '',
      canonicalVolumeLink: '',
    }) as VolumeInfo;

  it('coverUrl derives zoom=6 from thumbnail (largest available)', () => {
    const api = new GoogleBooksApi('default', true);
    const book = api.createBookItem(
      makeVolumeInfo({
        smallThumbnail: 'http://example.com/small',
        thumbnail: baseThumbUrl,
      }),
    );
    const coverUrl = new URL(book.coverUrl);
    expect(coverUrl.searchParams.get('zoom')).toEqual('6');
    expect(coverUrl.searchParams.get('id')).toEqual('testID');
  });

  it('coverUrl uses extraLarge directly when provided by the API', () => {
    const api = new GoogleBooksApi('default', true);
    const book = api.createBookItem(
      makeVolumeInfo({
        thumbnail: baseThumbUrl,
        extraLarge: 'http://example.com/xl',
      }),
    );
    expect(book.coverUrl).toEqual('https://example.com/xl');
  });

  it('coverMediumUrl is the thumbnail (reliable for download)', () => {
    const api = new GoogleBooksApi('default', true);
    const book = api.createBookItem(
      makeVolumeInfo({
        thumbnail: baseThumbUrl,
      }),
    );
    expect(book.coverMediumUrl).toEqual(baseThumbUrl.replace('http://', 'https://'));
  });

  it('coverLargeUrl uses extraLarge over large when both provided', () => {
    const api = new GoogleBooksApi('default', true);
    const book = api.createBookItem(
      makeVolumeInfo({
        thumbnail: baseThumbUrl,
        large: 'http://example.com/l',
        extraLarge: 'http://example.com/xl',
      }),
    );
    expect(book.coverLargeUrl).toEqual('https://example.com/xl');
  });

  it('coverLargeUrl is empty when API provides only thumbnail (no derived zoom)', () => {
    const api = new GoogleBooksApi('default', true);
    const book = api.createBookItem(
      makeVolumeInfo({
        thumbnail: baseThumbUrl,
      }),
    );
    expect(book.coverLargeUrl).toEqual('');
  });

  it('coverUrl is always the largest available for download and display', () => {
    const api = new GoogleBooksApi('default', true);
    const book = api.createBookItem(
      makeVolumeInfo({
        smallThumbnail: 'http://example.com/small',
        thumbnail: baseThumbUrl,
      }),
    );
    const coverUrl = new URL(book.coverUrl);
    expect(coverUrl.searchParams.get('zoom')).toEqual('6');
  });
});

describe('convertGoogleBookImageURLSize', () => {
  const baseUrl =
    'http://books.google.com/books/content?id=QVjPsd1UukEC&printsec=frontcover&img=1&zoom=1&edge=curl&imgtk=AFLRE71SvX9ABv9Ensxle&source=gbs_api';

  it('changes zoom without affecting other parameters', () => {
    const result = GoogleBooksApi.convertGoogleBookImageURLSize(baseUrl, 5);
    const resultUrl = new URL(result);
    const originalUrl = new URL(baseUrl);

    expect(resultUrl.searchParams.get('zoom')).toEqual('5');
    expect(resultUrl.searchParams.get('id')).toEqual(originalUrl.searchParams.get('id'));
    expect(resultUrl.searchParams.get('printsec')).toEqual(originalUrl.searchParams.get('printsec'));
    expect(resultUrl.searchParams.get('img')).toEqual(originalUrl.searchParams.get('img'));
    expect(resultUrl.searchParams.get('edge')).toEqual(originalUrl.searchParams.get('edge'));
    expect(resultUrl.searchParams.get('imgtk')).toEqual(originalUrl.searchParams.get('imgtk'));
    expect(resultUrl.searchParams.get('source')).toEqual(originalUrl.searchParams.get('source'));
  });

  it('handles multi-digit zoom values', () => {
    const urlWithZoom10 = 'http://books.google.com/books/content?id=abc&zoom=10&source=gbs_api';
    const result = GoogleBooksApi.convertGoogleBookImageURLSize(urlWithZoom10, 3);
    const resultUrl = new URL(result);

    expect(resultUrl.searchParams.get('zoom')).toEqual('3');
    expect(resultUrl.searchParams.get('id')).toEqual('abc');
    expect(resultUrl.searchParams.get('source')).toEqual('gbs_api');
  });
});
