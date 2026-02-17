import { apiGet } from '@utils/api';
import { MetadataProvider, ProviderRegistration, SearchResult } from '../types';
import { GAMES_TEMPLATE_PARAMETERS } from './kind';
import { RawgGame, RawgSearchResponse } from './models/rawg_response';

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

const RAWG_API_URL = 'https://api.rawg.io/api';

/** Parameters that can be filled from the search endpoint (no detail fetch). */
const SUPPORTED_PARAMETERS = GAMES_TEMPLATE_PARAMETERS.filter(
  p => !['localCoverImage', 'description', 'developer', 'developers', 'publisher', 'publishers'].includes(p),
);

export class RawgGamesProvider implements MetadataProvider {
  readonly id = 'rawg-games';
  readonly name = 'RAWG';
  readonly kind = 'games';

  private static readonly PAGE_SIZE = 20;

  private readonly apiKey: string;

  constructor(settings: Record<string, string>) {
    this.apiKey = settings.apiKey || '';
  }

  getSupportedParameters(): string[] {
    return SUPPORTED_PARAMETERS;
  }

  getSettingDefinitions() {
    return rawgGamesRegistration.settingDefinitions;
  }

  validate(): void {
    if (!this.apiKey) {
      throw new ConfigurationError('Please obtain an API key from rawg.io/apidocs and configure it in settings.');
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    this.validate();
    try {
      const params: Record<string, string | number> = {
        key: this.apiKey,
        search: query,
        page_size: RawgGamesProvider.PAGE_SIZE,
      };
      const response = await apiGet<RawgSearchResponse>(`${RAWG_API_URL}/games`, params);
      if (!response?.count) return [];
      return response.results.map(game => this.createResultItem(game));
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }

  createResultItem(item: RawgGame): SearchResult {
    const genres = item.genres?.map(g => g.name) ?? [];
    const platforms = item.platforms?.map(p => p.platform.name) ?? [];
    const tags = item.tags?.map(t => t.name) ?? [];

    return {
      title: item.name ?? '',
      releaseDate: item.released ?? '',
      coverUrl: item.background_image ?? '',
      rating: item.rating ?? '',
      metacritic: item.metacritic ?? '',
      playtime: item.playtime ?? '',
      genre: genres.join(', '),
      genres,
      platform: platforms.join(', '),
      platforms,
      tag: tags.join(', '),
      tags,
      esrbRating: item.esrb_rating?.name ?? '',
      link: item.slug ? `https://rawg.io/games/${item.slug}` : '',
      slug: item.slug ?? '',
    };
  }
}

export const rawgGamesRegistration: ProviderRegistration = {
  id: 'rawg-games',
  name: 'RAWG',
  kind: 'games',
  settingDefinitions: [
    {
      key: 'apiKey',
      name: 'API Key',
      description: 'RAWG API key. Get one free at rawg.io/apidocs.',
      type: 'password',
    },
  ],
  factory: (settings: Record<string, string>) => new RawgGamesProvider(settings),
};
