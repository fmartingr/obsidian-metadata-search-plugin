import { MetadataKind, SearchResult } from '../types';

export const GAMES_TEMPLATE_PARAMETERS = [
  'title',
  'releaseDate',
  'coverUrl',
  'localCoverImage',
  'rating',
  'metacritic',
  'playtime',
  'genre',
  'genres',
  'platform',
  'platforms',
  'developer',
  'developers',
  'publisher',
  'publishers',
  'description',
  'link',
  'esrbRating',
  'tag',
  'tags',
  'slug',
];

export const gamesKind: MetadataKind = {
  id: 'games',
  name: 'Games',
  icon: 'gamepad-2',
  description: 'Search and create notes for video games.',
  templateParameters: GAMES_TEMPLATE_PARAMETERS,
  defaultFileNameFormat: '{{title}}',
  defaultFrontmatterFields: [
    'title',
    'releaseDate',
    'coverUrl',
    'localCoverImage',
    'genres',
    'link',
    { key: 'status', defaultValue: 'Backlog' },
  ],

  renderSuggestion(result: SearchResult, el: HTMLElement, showCoverImage: boolean): void {
    el.addClass('metadata-search-suggestion-item');

    const coverUrl = result.coverUrl as string | undefined;
    if (showCoverImage && coverUrl) {
      el.createEl('img', {
        cls: 'metadata-search-cover-image',
        attr: { src: coverUrl, alt: `Cover: ${result.title}` },
      });
    }

    const textContainer = el.createEl('div', { cls: 'metadata-search-text-info' });
    textContainer.createEl('div', { text: (result.title as string) || '' });

    const parts: string[] = [];
    if (result.releaseDate) parts.push(String(result.releaseDate));
    if (result.platform) parts.push(String(result.platform));
    if (result.metacritic) parts.push(`Metacritic: ${result.metacritic}`);
    textContainer.createEl('small', { text: parts.join(' · ') });
  },
};
