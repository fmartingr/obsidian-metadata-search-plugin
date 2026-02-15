import { App, SuggestModal } from 'obsidian';
import { MetadataKind, SearchResult } from '@providers/types';

export class MetadataSuggestModal extends SuggestModal<SearchResult> {
  constructor(
    app: App,
    private readonly kind: MetadataKind,
    private readonly showCoverImage: boolean,
    private readonly suggestion: SearchResult[],
    private onChoose: (error: Error | null, result?: SearchResult) => void,
  ) {
    super(app);
  }

  getSuggestions(query: string): SearchResult[] {
    const searchQuery = query?.toLowerCase();
    return this.suggestion.filter(result => {
      const title = (result.title as string)?.toLowerCase() ?? '';
      const author = (result.author as string)?.toLowerCase() ?? '';
      const publisher = (result.publisher as string)?.toLowerCase() ?? '';
      return title.includes(searchQuery) || author.includes(searchQuery) || publisher.includes(searchQuery);
    });
  }

  renderSuggestion(result: SearchResult, el: HTMLElement): void {
    this.kind.renderSuggestion(result, el, this.showCoverImage);
  }

  onChooseSuggestion(result: SearchResult): void {
    this.onChoose(null, result);
  }
}
