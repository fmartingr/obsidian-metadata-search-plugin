import { IgdbGamesProvider } from './igdb';
import { IgdbGame } from './models/igdb_response';

describe('IgdbGamesProvider', () => {
  describe('validate', () => {
    it('throws when clientId is empty', () => {
      const provider = new IgdbGamesProvider({ clientId: '', clientSecret: 'secret' });
      expect(() => provider.validate()).toThrow('Client ID');
    });

    it('throws when clientSecret is empty', () => {
      const provider = new IgdbGamesProvider({ clientId: 'id', clientSecret: '' });
      expect(() => provider.validate()).toThrow('Client Secret');
    });

    it('does not throw when both credentials are provided', () => {
      const provider = new IgdbGamesProvider({ clientId: 'id', clientSecret: 'secret' });
      expect(() => provider.validate()).not.toThrow();
    });
  });

  describe('createResultItem', () => {
    const provider = new IgdbGamesProvider({ clientId: 'id', clientSecret: 'secret' });

    const igdbGame: IgdbGame = {
      id: 1020,
      name: 'Grand Theft Auto V',
      slug: 'grand-theft-auto-v',
      first_release_date: 1379376000, // 2013-09-17
      cover: {
        id: 1234,
        url: '//images.igdb.com/igdb/image/upload/t_thumb/co1234.jpg',
      },
      rating: 89.123456,
      aggregated_rating: 96.78,
      genres: [
        { id: 10, name: 'Racing' },
        { id: 31, name: 'Adventure' },
      ],
      platforms: [
        { id: 6, name: 'PC (Microsoft Windows)' },
        { id: 48, name: 'PlayStation 4' },
      ],
      involved_companies: [
        {
          id: 100,
          company: { id: 1, name: 'Rockstar North' },
          developer: true,
          publisher: false,
        },
        {
          id: 101,
          company: { id: 2, name: 'Rockstar Games' },
          developer: false,
          publisher: true,
        },
      ],
      summary: 'An open-world action-adventure game.',
      url: 'https://www.igdb.com/games/grand-theft-auto-v',
      age_ratings: [
        { id: 500, category: 1, rating: 11 },
        { id: 501, category: 2, rating: 5 },
      ],
      themes: [
        { id: 1, name: 'Action' },
        { id: 23, name: 'Open World' },
      ],
    };

    const result = provider.createResultItem(igdbGame);

    it('maps title from name', () => {
      expect(result.title).toEqual('Grand Theft Auto V');
    });

    it('maps releaseDate from first_release_date', () => {
      expect(result.releaseDate).toEqual('2013-09-17');
    });

    it('maps coverUrl with https and t_cover_big', () => {
      expect(result.coverUrl).toEqual('https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg');
    });

    it('maps rating rounded to 2 decimal places', () => {
      expect(result.rating).toEqual(89.12);
    });

    it('maps metacritic from aggregated_rating', () => {
      expect(result.metacritic).toEqual(96.78);
    });

    it('maps genres as comma-separated string', () => {
      expect(result.genre).toEqual('Racing, Adventure');
    });

    it('maps genres as array', () => {
      expect(result.genres).toEqual(['Racing', 'Adventure']);
    });

    it('maps platforms as comma-separated string', () => {
      expect(result.platform).toEqual('PC (Microsoft Windows), PlayStation 4');
    });

    it('maps platforms as array', () => {
      expect(result.platforms).toEqual(['PC (Microsoft Windows)', 'PlayStation 4']);
    });

    it('maps developers from involved_companies', () => {
      expect(result.developer).toEqual('Rockstar North');
      expect(result.developers).toEqual(['Rockstar North']);
    });

    it('maps publishers from involved_companies', () => {
      expect(result.publisher).toEqual('Rockstar Games');
      expect(result.publishers).toEqual(['Rockstar Games']);
    });

    it('maps description from summary', () => {
      expect(result.description).toEqual('An open-world action-adventure game.');
    });

    it('maps tags from themes as comma-separated string', () => {
      expect(result.tag).toEqual('Action, Open World');
    });

    it('maps tags from themes as array', () => {
      expect(result.tags).toEqual(['Action', 'Open World']);
    });

    it('maps esrbRating from age_ratings with category 1', () => {
      expect(result.esrbRating).toEqual('Mature');
    });

    it('maps link from url', () => {
      expect(result.link).toEqual('https://www.igdb.com/games/grand-theft-auto-v');
    });

    it('maps slug', () => {
      expect(result.slug).toEqual('grand-theft-auto-v');
    });

    it('handles missing optional fields', () => {
      const minimalGame: IgdbGame = {
        id: 1,
      };
      const minimalResult = provider.createResultItem(minimalGame);
      expect(minimalResult.title).toEqual('');
      expect(minimalResult.releaseDate).toEqual('');
      expect(minimalResult.coverUrl).toEqual('');
      expect(minimalResult.rating).toEqual('');
      expect(minimalResult.metacritic).toEqual('');
      expect(minimalResult.genre).toEqual('');
      expect(minimalResult.genres).toEqual([]);
      expect(minimalResult.platform).toEqual('');
      expect(minimalResult.platforms).toEqual([]);
      expect(minimalResult.developer).toEqual('');
      expect(minimalResult.developers).toEqual([]);
      expect(minimalResult.publisher).toEqual('');
      expect(minimalResult.publishers).toEqual([]);
      expect(minimalResult.description).toEqual('');
      expect(minimalResult.tag).toEqual('');
      expect(minimalResult.tags).toEqual([]);
      expect(minimalResult.esrbRating).toEqual('');
      expect(minimalResult.link).toEqual('');
      expect(minimalResult.slug).toEqual('');
    });

    it('handles game with no ESRB age rating', () => {
      const gameWithPegiOnly: IgdbGame = {
        id: 2,
        age_ratings: [{ id: 600, category: 2, rating: 5 }],
      };
      const r = provider.createResultItem(gameWithPegiOnly);
      expect(r.esrbRating).toEqual('');
    });

    it('handles game with unknown ESRB rating value', () => {
      const gameWithUnknownRating: IgdbGame = {
        id: 3,
        age_ratings: [{ id: 700, category: 1, rating: 99 }],
      };
      const r = provider.createResultItem(gameWithUnknownRating);
      expect(r.esrbRating).toEqual('');
    });
  });

  describe('formatDate', () => {
    const provider = new IgdbGamesProvider({ clientId: 'id', clientSecret: 'secret' });

    it('converts Unix timestamp to YYYY-MM-DD', () => {
      expect(provider.formatDate(1379376000)).toEqual('2013-09-17');
    });

    it('handles epoch zero', () => {
      expect(provider.formatDate(0)).toEqual('1970-01-01');
    });
  });

  describe('buildCoverUrl', () => {
    const provider = new IgdbGamesProvider({ clientId: 'id', clientSecret: 'secret' });

    it('adds https and swaps size to t_cover_big', () => {
      const url = '//images.igdb.com/igdb/image/upload/t_thumb/co1234.jpg';
      expect(provider.buildCoverUrl(url)).toEqual('https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg');
    });

    it('swaps other size prefixes to t_cover_big', () => {
      const url = '//images.igdb.com/igdb/image/upload/t_logo_med/co5678.jpg';
      expect(provider.buildCoverUrl(url)).toEqual('https://images.igdb.com/igdb/image/upload/t_cover_big/co5678.jpg');
    });

    it('handles URL that already has https', () => {
      const url = 'https://images.igdb.com/igdb/image/upload/t_thumb/co1234.jpg';
      expect(provider.buildCoverUrl(url)).toEqual('https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg');
    });
  });

  describe('getSupportedParameters', () => {
    const provider = new IgdbGamesProvider({ clientId: 'id', clientSecret: 'secret' });
    const params = provider.getSupportedParameters();

    it('includes expected game fields', () => {
      expect(params).toContain('title');
      expect(params).toContain('releaseDate');
      expect(params).toContain('genres');
      expect(params).toContain('platforms');
      expect(params).toContain('metacritic');
      expect(params).toContain('rating');
      expect(params).toContain('description');
      expect(params).toContain('developer');
      expect(params).toContain('developers');
      expect(params).toContain('publisher');
      expect(params).toContain('publishers');
    });

    it('does not include localCoverImage', () => {
      expect(params).not.toContain('localCoverImage');
    });

    it('does not include playtime (not available from IGDB)', () => {
      expect(params).not.toContain('playtime');
    });
  });
});
