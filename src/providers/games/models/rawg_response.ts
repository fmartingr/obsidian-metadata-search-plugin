export interface RawgSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawgGame[];
}

export interface RawgGame {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  tba: boolean;
  background_image: string | null;
  rating: number;
  rating_top: number;
  ratings_count: number;
  metacritic: number | null;
  playtime: number;
  updated: string;
  platforms: RawgPlatformEntry[] | null;
  genres: RawgNamedItem[] | null;
  tags: RawgNamedItem[] | null;
  esrb_rating: RawgNamedItem | null;
  short_screenshots: RawgScreenshot[] | null;
}

export interface RawgGameDetails extends RawgGame {
  description_raw: string;
  developers: RawgNamedItem[] | null;
  publishers: RawgNamedItem[] | null;
  website: string | null;
}

export interface RawgPlatformEntry {
  platform: RawgNamedItem;
  released_at: string | null;
  requirements: {
    minimum?: string;
    recommended?: string;
  } | null;
}

export interface RawgNamedItem {
  id: number;
  name: string;
  slug: string;
}

export interface RawgScreenshot {
  id: number;
  image: string;
}
