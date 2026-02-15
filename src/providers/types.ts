/**
 * A search result is a flat record of values keyed by template parameter names.
 * Providers fill in as many of the kind's template parameters as possible.
 */
export interface SearchResult {
  [key: string]: string | string[] | number | undefined;
}

/**
 * Defines a setting field that a provider needs configured.
 */
export interface ProviderSettingField {
  key: string;
  name: string;
  description: string;
  type: 'text' | 'password';
}

/**
 * Registration info for a provider, used by the registry.
 * Separates static metadata from instance creation so settings UI
 * can be rendered without instantiating the provider.
 */
export interface ProviderRegistration {
  /** Unique identifier, e.g. 'google-books' */
  readonly id: string;
  /** Human-readable name, e.g. 'Google Books' */
  readonly name: string;
  /** The metadata kind this provider serves, e.g. 'books' */
  readonly kind: string;
  /** Setting field definitions for the settings tab */
  readonly settingDefinitions: ProviderSettingField[];
  /** Create a provider instance from its settings */
  factory(settings: Record<string, string>): MetadataProvider;
  /** Optional: render additional settings UI beyond the basic fields */
  renderExtraSettings?(containerEl: HTMLElement, settings: Record<string, string>, save: () => Promise<void>): void;
}

/**
 * Defines a metadata kind (e.g., books, games).
 * Each kind specifies the template parameters available for note templates.
 */
export interface MetadataKind {
  /** Unique identifier, e.g. 'books' */
  readonly id: string;
  /** Human-readable name, e.g. 'Books' */
  readonly name: string;
  /** Obsidian icon name for ribbon/commands */
  readonly icon: string;
  /** Description for the settings tab */
  readonly description: string;
  /** Template parameters this kind supports — these are the {{variables}} available in templates */
  readonly templateParameters: string[];
  /** Default file name format when user hasn't set one, e.g. '{{title}} - {{author}}' */
  readonly defaultFileNameFormat: string;
  /** Render a suggestion item in the suggest modal */
  renderSuggestion(result: SearchResult, el: HTMLElement, showCoverImage: boolean): void;
}

/**
 * Interface all metadata providers must implement.
 */
export interface MetadataProvider {
  /** Unique identifier matching its registration */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** The metadata kind this provider serves */
  readonly kind: string;

  /**
   * Search for items matching the query.
   * Returns an array of SearchResult objects with template parameter values.
   */
  search(query: string, options?: Record<string, string>): Promise<SearchResult[]>;

  /**
   * Returns the list of template parameter names this provider can fill.
   */
  getSupportedParameters(): string[];

  /**
   * Validate that the provider's settings are correctly configured.
   * Throws an error with a user-friendly message if not valid.
   */
  validate(): void;

  /**
   * Optional: render extra UI elements in the search modal (e.g., locale selector).
   * Should set initial values and change handlers on the options object,
   * which is then passed to search().
   */
  renderSearchOptions?(containerEl: HTMLElement, options: Record<string, string>): void;
}
