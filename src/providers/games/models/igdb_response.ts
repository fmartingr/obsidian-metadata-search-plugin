export interface IgdbGame {
  id: number;
  name?: string;
  slug?: string;
  first_release_date?: number;
  cover?: IgdbCover;
  rating?: number;
  aggregated_rating?: number;
  genres?: IgdbNamedItem[];
  platforms?: IgdbNamedItem[];
  involved_companies?: IgdbInvolvedCompany[];
  summary?: string;
  url?: string;
  age_ratings?: IgdbAgeRating[];
  themes?: IgdbNamedItem[];
}

export interface IgdbCover {
  id: number;
  url?: string;
}

export interface IgdbNamedItem {
  id: number;
  name: string;
}

export interface IgdbInvolvedCompany {
  id: number;
  company: IgdbNamedItem;
  developer: boolean;
  publisher: boolean;
}

export interface IgdbAgeRating {
  id: number;
  category: number;
  rating: number;
}

export interface IgdbTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}
