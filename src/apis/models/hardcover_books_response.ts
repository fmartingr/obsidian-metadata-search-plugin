export interface HardcoverSearchResponse {
  data: {
    search: {
      ids: number[];
    };
  };
}

export interface HardcoverBooksResponse {
  data: {
    books: HardcoverBook[];
  };
}

export interface HardcoverBook {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  pages?: number;
  release_date?: string;
  slug?: string;
  image?: {
    url?: string;
  };
  contributions: {
    author: {
      name: string;
    };
  }[];
  cached_tags?: Record<string, unknown>;
  isbn_13?: string;
  isbn_10?: string;
}
