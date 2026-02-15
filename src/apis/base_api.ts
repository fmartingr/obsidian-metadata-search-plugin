import { Book } from '@models/book.model';
import { BookSearchPluginSettings } from '@settings/settings';
import { ServiceProvider } from '@src/constants';
import { requestUrl } from 'obsidian';
import { GoogleBooksApi } from './google_books_api';
import { HardcoverBooksApi } from './hardcover_books_api';
import { NaverBooksApi } from './naver_books_api';

export interface BaseBooksApiImpl {
  getByQuery(query: string, options?: Record<string, string>): Promise<Book[]>;
}

export function factoryServiceProvider(settings: BookSearchPluginSettings): BaseBooksApiImpl {
  switch (settings.serviceProvider) {
    case ServiceProvider.google:
      return new GoogleBooksApi(settings.localePreference, settings.enableCoverImageEdgeCurl, settings.apiKey);
    case ServiceProvider.naver:
      return new NaverBooksApi(settings.naverClientId, settings.naverClientSecret);
    case ServiceProvider.hardcover:
      return new HardcoverBooksApi(settings.hardcoverApiToken);
    default:
      throw new Error('Unsupported service provider.');
  }
}

export async function apiGet<T>(
  url: string,
  params: Record<string, string | number> = {},
  headers?: Record<string, string>,
): Promise<T> {
  const apiURL = new URL(url);
  appendQueryParams(apiURL, params);

  const res = await requestUrl({
    url: apiURL.href,
    method: 'GET',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  });

  return res.json as T;
}

export async function apiPost<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<T> {
  const res = await requestUrl({
    url,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  return res.json as T;
}

function appendQueryParams(url: URL, params: Record<string, string | number>): void {
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString());
  });
}
