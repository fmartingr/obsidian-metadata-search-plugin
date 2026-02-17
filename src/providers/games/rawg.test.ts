import { RawgGamesProvider } from './rawg';
import { RawgGame } from './models/rawg_response';

describe('RawgGamesProvider', () => {
  describe('validate', () => {
    it('throws when apiKey is empty', () => {
      const provider = new RawgGamesProvider({ apiKey: '' });
      expect(() => provider.validate()).toThrow('API key');
    });

    it('does not throw when apiKey is provided', () => {
      const provider = new RawgGamesProvider({ apiKey: 'test-key' });
      expect(() => provider.validate()).not.toThrow();
    });
  });

  describe('createResultItem', () => {
    const provider = new RawgGamesProvider({ apiKey: 'test-key' });

    const rawgGame: RawgGame = {
      id: 3498,
      slug: 'grand-theft-auto-v',
      name: 'Grand Theft Auto V',
      released: '2013-09-17',
      tba: false,
      background_image: 'https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg',
      rating: 4.47,
      rating_top: 5,
      ratings_count: 6457,
      metacritic: 92,
      playtime: 73,
      updated: '2023-04-17T09:09:38',
      platforms: [
        {
          platform: { id: 4, name: 'PC', slug: 'pc' },
          released_at: '2015-04-14',
          requirements: null,
        },
        {
          platform: { id: 187, name: 'PlayStation 5', slug: 'playstation5' },
          released_at: '2022-03-15',
          requirements: null,
        },
      ],
      genres: [
        { id: 4, name: 'Action', slug: 'action' },
        { id: 3, name: 'Adventure', slug: 'adventure' },
      ],
      tags: [
        { id: 31, name: 'Singleplayer', slug: 'singleplayer' },
        { id: 7, name: 'Multiplayer', slug: 'multiplayer' },
      ],
      esrb_rating: { id: 4, name: 'Mature', slug: 'mature' },
      short_screenshots: null,
    };

    const result = provider.createResultItem(rawgGame);

    it('maps title from name', () => {
      expect(result.title).toEqual('Grand Theft Auto V');
    });

    it('maps releaseDate from released', () => {
      expect(result.releaseDate).toEqual('2013-09-17');
    });

    it('maps coverUrl from background_image', () => {
      expect(result.coverUrl).toEqual(rawgGame.background_image);
    });

    it('maps rating', () => {
      expect(result.rating).toEqual(4.47);
    });

    it('maps metacritic', () => {
      expect(result.metacritic).toEqual(92);
    });

    it('maps playtime', () => {
      expect(result.playtime).toEqual(73);
    });

    it('maps genres as comma-separated string', () => {
      expect(result.genre).toEqual('Action, Adventure');
    });

    it('maps genres as array', () => {
      expect(result.genres).toEqual(['Action', 'Adventure']);
    });

    it('maps platforms as comma-separated string', () => {
      expect(result.platform).toEqual('PC, PlayStation 5');
    });

    it('maps platforms as array', () => {
      expect(result.platforms).toEqual(['PC', 'PlayStation 5']);
    });

    it('maps tags as comma-separated string', () => {
      expect(result.tag).toEqual('Singleplayer, Multiplayer');
    });

    it('maps tags as array', () => {
      expect(result.tags).toEqual(['Singleplayer', 'Multiplayer']);
    });

    it('maps esrbRating', () => {
      expect(result.esrbRating).toEqual('Mature');
    });

    it('maps link from slug', () => {
      expect(result.link).toEqual('https://rawg.io/games/grand-theft-auto-v');
    });

    it('maps slug', () => {
      expect(result.slug).toEqual('grand-theft-auto-v');
    });

    it('handles missing optional fields', () => {
      const minimalGame: RawgGame = {
        id: 1,
        slug: 'test-game',
        name: 'Test Game',
        released: null,
        tba: false,
        background_image: null,
        rating: 0,
        rating_top: 5,
        ratings_count: 0,
        metacritic: null,
        playtime: 0,
        updated: '',
        platforms: null,
        genres: null,
        tags: null,
        esrb_rating: null,
        short_screenshots: null,
      };
      const minimalResult = provider.createResultItem(minimalGame);
      expect(minimalResult.title).toEqual('Test Game');
      expect(minimalResult.releaseDate).toEqual('');
      expect(minimalResult.coverUrl).toEqual('');
      expect(minimalResult.rating).toEqual(0);
      expect(minimalResult.metacritic).toEqual('');
      expect(minimalResult.playtime).toEqual(0);
      expect(minimalResult.genre).toEqual('');
      expect(minimalResult.genres).toEqual([]);
      expect(minimalResult.platform).toEqual('');
      expect(minimalResult.platforms).toEqual([]);
      expect(minimalResult.tag).toEqual('');
      expect(minimalResult.tags).toEqual([]);
      expect(minimalResult.esrbRating).toEqual('');
      expect(minimalResult.link).toEqual('https://rawg.io/games/test-game');
      expect(minimalResult.slug).toEqual('test-game');
    });
  });

  describe('getSupportedParameters', () => {
    it('includes expected game fields', () => {
      const provider = new RawgGamesProvider({ apiKey: 'test-key' });
      const params = provider.getSupportedParameters();
      expect(params).toContain('title');
      expect(params).toContain('releaseDate');
      expect(params).toContain('genres');
      expect(params).toContain('platforms');
      expect(params).toContain('metacritic');
      expect(params).toContain('rating');
    });

    it('does not include fields that require detail fetch', () => {
      const provider = new RawgGamesProvider({ apiKey: 'test-key' });
      const params = provider.getSupportedParameters();
      expect(params).not.toContain('description');
      expect(params).not.toContain('developer');
      expect(params).not.toContain('developers');
      expect(params).not.toContain('publisher');
      expect(params).not.toContain('publishers');
    });
  });
});
