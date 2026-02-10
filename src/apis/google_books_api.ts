import { apiGet, BaseBooksApiImpl } from '@apis/base_api';
import { Book } from '@models/book.model';
import { GoogleBooksResponse, VolumeInfo } from './models/google_books_response';

export class GoogleBooksApi implements BaseBooksApiImpl {
  private static readonly MAX_RESULTS = 40;
  private static readonly PRINT_TYPE = 'books';

  constructor(
    private readonly localePreference: string,
    private readonly enableCoverImageEdgeCurl: boolean,
    private readonly apiKey?: string,
  ) {}

  private getLanguageRestriction(local: string): string {
    return local === 'default' ? window.moment.locale() : local;
  }

  private buildSearchParams(query: string, options?: Record<string, string>): Record<string, string | number> {
    const params: Record<string, string | number> = {
      q: query,
      maxResults: GoogleBooksApi.MAX_RESULTS,
      printType: GoogleBooksApi.PRINT_TYPE,
      langRestrict: this.getLanguageRestriction(options?.locale || this.localePreference),
    };

    if (this.apiKey) {
      params['key'] = this.apiKey;
    }
    return params;
  }

  async getByQuery(query: string, options?: Record<string, string>): Promise<Book[]> {
    try {
      const params = this.buildSearchParams(query, options);
      const searchResults = await apiGet<GoogleBooksResponse>('https://www.googleapis.com/books/v1/volumes', params);
      if (!searchResults?.totalItems) return [];
      return searchResults.items.map(({ volumeInfo }) => this.createBookItem(volumeInfo));
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }

  private extractISBNs(industryIdentifiers: VolumeInfo['industryIdentifiers']): Record<string, string> {
    return (
      industryIdentifiers?.reduce(
        (result, item) => {
          const isbnType = item.type === 'ISBN_10' ? 'isbn10' : 'isbn13';
          result[isbnType] = item.identifier.trim();
          return result;
        },
        {} as Record<string, string>,
      ) ?? {}
    );
  }

  private extractBasicBookInfo(item: VolumeInfo): Partial<Book> {
    const images = item.imageLinks;
    const baseUrl = images?.thumbnail ?? '';
    return {
      title: item.title,
      subtitle: item.subtitle,
      author: this.formatList(item.authors),
      authors: item.authors,
      category: this.formatList(item.categories),
      categories: item.categories,
      publisher: item.publisher,
      totalPage: item.pageCount,
      coverUrl: this.setCoverImageEdgeCurl(
        images?.extraLarge ?? (baseUrl ? GoogleBooksApi.convertGoogleBookImageURLSize(baseUrl, 6) : ''),
        this.enableCoverImageEdgeCurl,
      ),
      coverSmallUrl: this.setCoverImageEdgeCurl(images?.smallThumbnail ?? '', this.enableCoverImageEdgeCurl),
      coverMediumUrl: this.setCoverImageEdgeCurl(images?.thumbnail ?? '', this.enableCoverImageEdgeCurl),
      coverLargeUrl: this.setCoverImageEdgeCurl(
        images?.extraLarge ?? images?.large ?? '',
        this.enableCoverImageEdgeCurl,
      ),
      publishDate: item.publishedDate || '',
      description: item.description,
      link: item.canonicalVolumeLink || item.infoLink,
      previewLink: item.previewLink,
    };
  }

  public createBookItem(item: VolumeInfo): Book {
    const book: Book = {
      title: '',
      subtitle: '',
      author: '',
      authors: [],
      category: '',
      categories: [],
      publisher: '',
      publishDate: '',
      totalPage: '',
      coverUrl: '',
      coverSmallUrl: '',
      coverMediumUrl: '',
      coverLargeUrl: '',
      description: '',
      link: '',
      previewLink: '',
      ...this.extractBasicBookInfo(item),
      ...this.extractISBNs(item.industryIdentifiers),
    };
    return book;
  }

  public formatList(list?: string[]): string {
    return list && list.length > 1 ? list.map(item => item.trim()).join(', ') : (list?.[0] ?? '');
  }

  private setCoverImageEdgeCurl(url: string, enabled: boolean): string {
    if (!url) return url;
    try {
      const urlObj = new URL(url);
      // Google Books API returns HTTP URLs, but HTTPS is required for
      // Obsidian's requestUrl to download images reliably.
      urlObj.protocol = 'https:';
      if (!enabled) {
        // Edge curl is included in the cover image URL parameters by default,
        // so we need to remove it if it's disabled.
        urlObj.searchParams.delete('edge');
      }
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  static convertGoogleBookImageURLSize(url: string, zoom: number) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('zoom', String(zoom));
      return urlObj.toString();
    } catch {
      return url;
    }
  }
}
