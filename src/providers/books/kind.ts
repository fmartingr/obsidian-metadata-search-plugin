import { MetadataKind, SearchResult } from '../types';

export const BOOKS_TEMPLATE_PARAMETERS = [
  'title',
  'subtitle',
  'author',
  'authors',
  'category',
  'categories',
  'publisher',
  'publishDate',
  'totalPage',
  'coverUrl',
  'coverSmallUrl',
  'coverMediumUrl',
  'coverLargeUrl',
  'localCoverImage',
  'isbn10',
  'isbn13',
  'isbn',
  'link',
  'description',
  'previewLink',
];

export const booksKind: MetadataKind = {
  id: 'books',
  name: 'Books',
  icon: 'book',
  description: 'Search and create notes for books.',
  templateParameters: BOOKS_TEMPLATE_PARAMETERS,
  defaultFileNameFormat: '{{title}} - {{author}}',

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

    const publisher = result.publisher ? `, ${result.publisher}` : '';
    const publishDate = result.publishDate ? ` (${result.publishDate})` : '';
    const totalPage = result.totalPage ? `, p${result.totalPage}` : '';
    const subtitle = `${result.author || ''}${publisher}${publishDate}${totalPage}`;
    textContainer.createEl('small', { text: subtitle });
  },
};
