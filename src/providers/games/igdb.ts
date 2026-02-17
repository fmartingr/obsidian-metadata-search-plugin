import { requestUrl } from 'obsidian';
import { MetadataProvider, ProviderRegistration, SearchResult } from '../types';
import { GAMES_TEMPLATE_PARAMETERS } from './kind';
import { IgdbGame, IgdbTokenResponse } from './models/igdb_response';
import { Notice, Setting } from 'obsidian';

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const IGDB_API_URL = 'https://api.igdb.com/v4';

/** ESRB age-rating category in the IGDB enum. */
const ESRB_CATEGORY = 1;

/** Map IGDB ESRB rating enum values to human-readable names. */
const ESRB_RATING_NAMES: Record<number, string> = {
  6: 'Rating Pending',
  7: 'Early Childhood',
  8: 'Everyone',
  9: 'Everyone 10+',
  10: 'Teen',
  11: 'Mature',
  12: 'Adults Only',
};

/** Parameters that can be filled from the IGDB search endpoint. */
const SUPPORTED_PARAMETERS = GAMES_TEMPLATE_PARAMETERS.filter(p => !['localCoverImage', 'playtime'].includes(p));

/**
 * Cached Twitch OAuth token shared across provider instances within the same
 * plugin session. Avoids requesting a new token for every single search.
 */
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export class IgdbGamesProvider implements MetadataProvider {
  readonly id = 'igdb-games';
  readonly name = 'IGDB';
  readonly kind = 'games';

  private static readonly PAGE_SIZE = 20;

  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(settings: Record<string, string>) {
    this.clientId = settings.clientId || '';
    this.clientSecret = settings.clientSecret || '';
  }

  getSupportedParameters(): string[] {
    return SUPPORTED_PARAMETERS;
  }

  getSettingDefinitions() {
    return igdbGamesRegistration.settingDefinitions;
  }

  validate(): void {
    if (!this.clientId || !this.clientSecret) {
      throw new ConfigurationError(
        'Please configure your Twitch Client ID and Client Secret in settings. ' +
          'You can create them at dev.twitch.tv/console.',
      );
    }
  }

  /** Obtain a Twitch app access token (client-credentials flow). */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 60 s buffer).
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
      return cachedToken.accessToken;
    }

    const url = new URL(TWITCH_TOKEN_URL);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('client_secret', this.clientSecret);
    url.searchParams.set('grant_type', 'client_credentials');

    const res = await requestUrl({ url: url.href, method: 'POST' });
    const data = res.json as IgdbTokenResponse;

    cachedToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return cachedToken.accessToken;
  }

  /** Send an Apicalypse query to an IGDB endpoint. */
  private async igdbPost<T>(endpoint: string, body: string, accessToken: string): Promise<T> {
    const res = await requestUrl({
      url: `${IGDB_API_URL}/${endpoint}`,
      method: 'POST',
      headers: {
        'Client-ID': this.clientId,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      body,
    });
    return res.json as T;
  }

  async search(query: string): Promise<SearchResult[]> {
    this.validate();
    try {
      const accessToken = await this.getAccessToken();

      const body = [
        `search "${query.replace(/"/g, '\\"')}";`,
        'fields name,slug,first_release_date,cover.url,rating,aggregated_rating,' +
          'genres.name,platforms.name,' +
          'involved_companies.company.name,involved_companies.developer,involved_companies.publisher,' +
          'summary,url,age_ratings.rating,age_ratings.category,themes.name;',
        `limit ${IgdbGamesProvider.PAGE_SIZE};`,
      ].join('\n');

      const games = await this.igdbPost<IgdbGame[]>('games', body, accessToken);
      if (!games?.length) return [];
      return games.map(game => this.createResultItem(game));
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }

  createResultItem(item: IgdbGame): SearchResult {
    const genres = item.genres?.map(g => g.name) ?? [];
    const platforms = item.platforms?.map(p => p.name) ?? [];
    const developers = item.involved_companies?.filter(c => c.developer).map(c => c.company.name) ?? [];
    const publishers = item.involved_companies?.filter(c => c.publisher).map(c => c.company.name) ?? [];
    const themes = item.themes?.map(t => t.name) ?? [];

    const esrb = item.age_ratings?.find(r => r.category === ESRB_CATEGORY);

    return {
      title: item.name ?? '',
      releaseDate: item.first_release_date ? this.formatDate(item.first_release_date) : '',
      coverUrl: item.cover?.url ? this.buildCoverUrl(item.cover.url) : '',
      rating: item.rating != null ? Math.round(item.rating * 100) / 100 : '',
      metacritic: item.aggregated_rating != null ? Math.round(item.aggregated_rating * 100) / 100 : '',
      genre: genres.join(', '),
      genres,
      platform: platforms.join(', '),
      platforms,
      developer: developers.join(', '),
      developers,
      publisher: publishers.join(', '),
      publishers,
      description: item.summary ?? '',
      tag: themes.join(', '),
      tags: themes,
      esrbRating: esrb ? (ESRB_RATING_NAMES[esrb.rating] ?? '') : '',
      link: item.url ?? '',
      slug: item.slug ?? '',
    };
  }

  /** Convert a Unix timestamp (seconds) to a YYYY-MM-DD date string. */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0];
  }

  /**
   * Build a full-size cover URL from an IGDB image path.
   * IGDB returns URLs like `//images.igdb.com/igdb/image/upload/t_thumb/co1234.jpg`.
   * We add HTTPS and swap the size to `t_cover_big`.
   */
  buildCoverUrl(url: string): string {
    let result = url;
    if (result.startsWith('//')) {
      result = `https:${result}`;
    }
    return result.replace(/\/t_\w+\//, '/t_cover_big/');
  }
}

export const igdbGamesRegistration: ProviderRegistration = {
  id: 'igdb-games',
  name: 'IGDB',
  kind: 'games',
  settingDefinitions: [
    {
      key: 'clientId',
      name: 'Twitch Client ID',
      description: 'Twitch application Client ID. Create one at dev.twitch.tv/console.',
      type: 'text',
    },
    {
      key: 'clientSecret',
      name: 'Twitch Client Secret',
      description: 'Twitch application Client Secret.',
      type: 'password',
    },
  ],
  factory: (settings: Record<string, string>) => new IgdbGamesProvider(settings),
  renderExtraSettings: (containerEl: HTMLElement, settings: Record<string, string>, save: () => Promise<void>) => {
    void save;
    new Setting(containerEl)
      .setName('Connection check')
      .setDesc('Verify Twitch credentials against the IGDB API.')
      .addButton(btn => {
        btn.setButtonText('Test Connection').onClick(async () => {
          const clientId = settings.clientId;
          const clientSecret = settings.clientSecret;
          if (!clientId || !clientSecret) {
            new Notice('Both Client ID and Client Secret are required.');
            return;
          }
          try {
            const provider = new IgdbGamesProvider(settings);
            await provider.getAccessToken();
            new Notice('IGDB connection successful.');
          } catch {
            new Notice('IGDB connection failed. Please check your credentials.');
          }
        });
      });
  },
};

/** Reset the cached token — exposed for testing. */
export function _resetCachedToken(): void {
  cachedToken = null;
}
