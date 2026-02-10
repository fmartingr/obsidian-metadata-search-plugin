import { factoryServiceProvider } from './base_api';
import { GoogleBooksApi } from './google_books_api';
import { NaverBooksApi } from './naver_books_api';
import { ServiceProvider } from '@src/constants';
import { BookSearchPluginSettings } from '@settings/settings';

function makeSettings(overrides: Partial<BookSearchPluginSettings>): BookSearchPluginSettings {
  return {
    folder: '',
    fileNameFormat: '',
    frontmatter: '',
    content: '',
    useDefaultFrontmatter: true,
    defaultFrontmatterKeyType: 'camelCase',
    templateFile: '',
    serviceProvider: ServiceProvider.google,
    naverClientId: '',
    naverClientSecret: '',
    localePreference: 'default',
    apiKey: '',
    openPageOnCompletion: false,
    showCoverImageInSearch: false,
    enableCoverImageSave: false,
    enableCoverImageEdgeCurl: true,
    coverImagePath: '',
    askForLocale: false,
    ...overrides,
  } as BookSearchPluginSettings;
}

describe('factoryServiceProvider', () => {
  it('returns GoogleBooksApi for google provider', () => {
    const settings = makeSettings({ serviceProvider: ServiceProvider.google });
    const api = factoryServiceProvider(settings);
    expect(api).toBeInstanceOf(GoogleBooksApi);
  });

  it('returns NaverBooksApi for naver provider with valid credentials', () => {
    const settings = makeSettings({
      serviceProvider: ServiceProvider.naver,
      naverClientId: 'test-id',
      naverClientSecret: 'test-secret',
    });
    const api = factoryServiceProvider(settings);
    expect(api).toBeInstanceOf(NaverBooksApi);
  });

  it('throws when naver provider has missing credentials', () => {
    const settings = makeSettings({
      serviceProvider: ServiceProvider.naver,
      naverClientId: '',
      naverClientSecret: '',
    });
    expect(() => factoryServiceProvider(settings)).toThrow();
  });

  it('throws for unsupported service provider', () => {
    const settings = makeSettings({ serviceProvider: 'unknown' as ServiceProvider });
    expect(() => factoryServiceProvider(settings)).toThrow('Unsupported service provider.');
  });
});
