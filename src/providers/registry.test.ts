import { registry } from './registry';
import { booksKind } from './books/kind';
import { googleBooksRegistration } from './books/google';
import { naverBooksRegistration } from './books/naver';
import { hardcoverBooksRegistration } from './books/hardcover';
import { GoogleBooksProvider } from './books/google';
import { NaverBooksProvider } from './books/naver';
import { HardcoverBooksProvider } from './books/hardcover';
import { gamesKind } from './games/kind';
import { rawgGamesRegistration, RawgGamesProvider } from './games/rawg';

// Register everything for tests
registry.registerKind(booksKind);
registry.registerKind(gamesKind);
registry.registerProvider(googleBooksRegistration);
registry.registerProvider(naverBooksRegistration);
registry.registerProvider(hardcoverBooksRegistration);
registry.registerProvider(rawgGamesRegistration);

describe('ProviderRegistry', () => {
  describe('kinds', () => {
    it('returns registered kinds', () => {
      const kinds = registry.getKinds();
      expect(kinds.length).toBeGreaterThanOrEqual(2);
      expect(kinds.find(k => k.id === 'books')).toBeDefined();
      expect(kinds.find(k => k.id === 'games')).toBeDefined();
    });

    it('gets a kind by id', () => {
      const kind = registry.getKind('books');
      expect(kind).toBeDefined();
      expect(kind?.name).toEqual('Books');
    });

    it('gets games kind by id', () => {
      const kind = registry.getKind('games');
      expect(kind).toBeDefined();
      expect(kind?.name).toEqual('Games');
    });

    it('returns undefined for unknown kind', () => {
      expect(registry.getKind('unknown')).toBeUndefined();
    });
  });

  describe('providers', () => {
    it('returns providers for books kind', () => {
      const providers = registry.getProvidersForKind('books');
      expect(providers.length).toEqual(3);
    });

    it('returns providers for games kind', () => {
      const providers = registry.getProvidersForKind('games');
      expect(providers.length).toEqual(1);
    });

    it('creates GoogleBooksProvider', () => {
      const provider = registry.createProvider('google-books', {});
      expect(provider).toBeInstanceOf(GoogleBooksProvider);
    });

    it('creates NaverBooksProvider', () => {
      const provider = registry.createProvider('naver-books', {
        clientId: 'id',
        clientSecret: 'secret',
      });
      expect(provider).toBeInstanceOf(NaverBooksProvider);
    });

    it('creates HardcoverBooksProvider', () => {
      const provider = registry.createProvider('hardcover-books', {
        apiToken: 'token',
      });
      expect(provider).toBeInstanceOf(HardcoverBooksProvider);
    });

    it('creates RawgGamesProvider', () => {
      const provider = registry.createProvider('rawg-games', {
        apiKey: 'test-key',
      });
      expect(provider).toBeInstanceOf(RawgGamesProvider);
    });

    it('throws for unknown provider', () => {
      expect(() => registry.createProvider('unknown', {})).toThrow("Provider 'unknown' not found.");
    });

    it('gets provider registration', () => {
      const reg = registry.getProviderRegistration('google-books');
      expect(reg).toBeDefined();
      expect(reg?.name).toEqual('Google Books');
      expect(reg?.kind).toEqual('books');
    });

    it('gets rawg provider registration', () => {
      const reg = registry.getProviderRegistration('rawg-games');
      expect(reg).toBeDefined();
      expect(reg?.name).toEqual('RAWG');
      expect(reg?.kind).toEqual('games');
    });
  });
});
