# Obsidian Metadata Search Plugin

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/fmartingr/obsidian-metadata-search-plugin/release.yml?logo=github)
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/fmartingr/obsidian-metadata-search-plugin?sort=semver)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/fmartingr/obsidian-metadata-search-plugin/total)

Search for metadata from external services and create notes in your Obsidian vault. Supports multiple metadata kinds (books, games) with pluggable providers for each.

> Originally forked from [obsidian-book-search-plugin](https://github.com/anpigon/obsidian-book-search-plugin).

## Features

- **Books** — Search by title, author, publisher, or ISBN and create book notes.
- **Games** — Search for video games and create game notes.
- **Multiple providers per kind** — Choose the service that works best for you.
- **Customisable templates** — Use template files with `{{variables}}` and inline scripts.
- **Cover image saving** — Optionally download cover images into your vault.
- **Per-kind settings** — Independent configuration for each metadata kind (folder, template, provider, etc.).

## Supported providers

| Kind  | Provider                                        | API key required? |
| ----- | ----------------------------------------------- | ----------------- |
| Books | [Google Books](https://books.google.com/)       | Optional          |
| Books | [Naver Books](https://developers.naver.com/)    | Yes               |
| Books | [Hardcover](https://hardcover.app/)             | Yes               |
| Games | [RAWG](https://rawg.io/apidocs)                | Yes (free)        |
| Games | [IGDB](https://api-docs.igdb.com/)              | Yes (Twitch)      |

## Changelog

Visit the [GitHub Releases](https://github.com/fmartingr/obsidian-metadata-search-plugin/releases) page for the full changelog.

## Installation

Search for **Metadata Search** in the Obsidian Community Plugins browser and click **Install**, or use this direct link:

[Install Metadata Search Plugin](https://obsidian.md/plugins?id=obsidian-metadata-search-plugin)

## How to use

### 1. Click the ribbon icon or run a command

Each enabled metadata kind registers its own ribbon icon and commands:

- **Create new books note** / **Create new games note** — Opens a search modal, lets you pick a result, and creates a new note.
- **Insert books metadata** / **Insert games metadata** — Searches using the current note's name and inserts metadata at the top of the active note.

### 2. Search by keywords

Type a query (e.g. a book title or game name) into the search modal and press Enter.

### 3. Select a result

Pick an item from the search results. If **Show cover images in search** is enabled, cover thumbnails are displayed alongside each result.

### 4. A note is created

A new note is created (or metadata is inserted) using your configured template and file name format.

## Settings

Settings are organised per metadata kind. Each kind has its own section with the following options:

### General

| Setting                     | Description                                      |
| --------------------------- | ------------------------------------------------ |
| Open new note on completion | Automatically open the note after creation.      |

### Per-kind settings

| Setting                      | Description                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Enabled                      | Enable/disable this metadata kind entirely.                                                          |
| Service provider             | Choose which provider to use for searching.                                                          |
| New file location            | Folder where new notes are created.                                                                  |
| New file name                | File name format using `{{variables}}`. A live preview is shown in settings.                         |
| Template file                | Path to a template note used when creating notes. If empty, default YAML frontmatter is generated.   |
| Show cover images in search  | Display cover thumbnails in the search results modal.                                                |
| Save cover images            | Download cover images into your vault. When enabled, a **Cover image path** folder can be specified. |

Provider-specific credentials (API keys, tokens, etc.) are configured within the provider section under each kind.

## Template variables

### Books

| Variable          | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `title`           | The title of the book.                                   |
| `subtitle`        | The subtitle of the book (may be empty).                 |
| `author`          | Comma-separated list of authors.                         |
| `authors`         | Array of author names.                                   |
| `category`        | Comma-separated list of categories.                      |
| `categories`      | Array of category names.                                 |
| `description`     | Book description.                                        |
| `publisher`       | Publisher name.                                          |
| `publishDate`     | Publication date.                                        |
| `totalPage`       | Total number of pages.                                   |
| `coverUrl`        | Cover image URL (largest available).                     |
| `coverSmallUrl`   | Small cover image URL.                                   |
| `coverMediumUrl`  | Medium cover image URL.                                  |
| `coverLargeUrl`   | Large cover image URL.                                   |
| `localCoverImage` | Local vault path of the saved cover image.               |
| `isbn10`          | ISBN-10.                                                 |
| `isbn13`          | ISBN-13.                                                 |
| `isbn`            | ISBN (Naver provider).                                   |
| `link`            | Canonical link to the book.                              |
| `previewLink`     | Preview link (Google Books).                             |

### Games

| Variable          | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `title`           | The title of the game.                                   |
| `releaseDate`     | Release date (YYYY-MM-DD).                               |
| `coverUrl`        | Cover image URL.                                         |
| `localCoverImage` | Local vault path of the saved cover image.               |
| `rating`          | User rating.                                             |
| `metacritic`      | Metacritic / aggregated critic score.                    |
| `playtime`        | Average playtime in hours (RAWG only).                   |
| `genre`           | Comma-separated list of genres.                          |
| `genres`          | Array of genre names.                                    |
| `platform`        | Comma-separated list of platforms.                       |
| `platforms`       | Array of platform names.                                 |
| `developer`       | Comma-separated list of developers (IGDB only).          |
| `developers`      | Array of developer names (IGDB only).                    |
| `publisher`       | Comma-separated list of publishers (IGDB only).          |
| `publishers`      | Array of publisher names (IGDB only).                    |
| `description`     | Game description/summary (IGDB only).                    |
| `link`            | Link to the game page.                                   |
| `esrbRating`      | ESRB age rating.                                         |
| `tag`             | Comma-separated list of tags/themes.                     |
| `tags`            | Array of tag/theme names.                                |
| `slug`            | URL slug for the game.                                   |

## Example templates

- [Book template](examples/book-template.md)
- [Game template](examples/game-template.md)

### Using Templater with cover images

If you use the [Templater](https://github.com/SilentVoid13/Templater) plugin, you can conditionally render cover images:

```
<%* if (tp.frontmatter.cover && tp.frontmatter.cover.trim() !== "") { tR += `![cover|150](${tp.frontmatter.cover})` } %>
```

For locally saved images:

```
<%* if (tp.frontmatter.localCover && tp.frontmatter.localCover.trim() !== "") { tR += `![[${tp.frontmatter.localCover}|150]]` } %>
```

## Advanced

### Inline scripts

The search result object is available as `item` inside inline script blocks (`<%= ... %>`). You can use this to manipulate values beyond what simple `{{variable}}` replacement offers.

#### Print the full result object

````
```json
<%=JSON.stringify(item, null, 2)%>
```
````

#### Link authors individually

```
authors: <%=item.authors.map(author => `[[${author}]]`).join(', ')%>
```

#### List authors as YAML array

```
authors: <%=item.authors.map(author=>`\n  - ${author}`).join('')%>
```

#### List/link categories

```
categories: <%=item.categories.map(category => `[[${category}]]`).join(', ')%>
```

#### Extract just the publication year

```
published_at: <%= item.publishDate.substring(0, 4) %>
```

#### Reformat a date (remove dashes)

```
published_at: <%= item.publishDate.replace(/-/g,'') %>
```

### Dataview integration

Example Dataview queries for a bookshelf:

````
# 📚 My Bookshelf

```dataview
TABLE WITHOUT ID
	status as Status,
	rows.file.link as Book
FROM  #📚Book
WHERE !contains(file.path, "Templates")
GROUP BY status
SORT status
```

## List of all books

```dataview
TABLE WITHOUT ID
	status as Status,
	"![|60](" + cover + ")" as Cover,
	link(file.link, title) as Title,
	author as Author,
	join(list(publisher, publish)) as Publisher
FROM #📚Book
WHERE !contains(file.path, "Templates")
SORT status DESC, file.ctime ASC
```
````

## Provider setup

### Google Books

Works without an API key, but you may hit rate limits. To add a key:

1. Create a project on [Google Cloud Console](https://console.cloud.google.com/projectcreate).
2. Enable the [Books API](https://console.cloud.google.com/apis/library/books.googleapis.com).
3. Create an API key in [Credentials](https://console.cloud.google.com/apis/credentials).
4. (Optional) Restrict the key to the Books API only.
5. Paste the key into the plugin settings under the Google Books provider.

Google Books also supports a **preferred locale** setting and an optional **locale picker** in the search modal.

### Naver Books

Requires a Client ID and Client Secret from the [Naver Developer Center](https://developers.naver.com/).

### Hardcover

Requires an API token from [Hardcover.app](https://hardcover.app/). A **Test Connection** button is available in settings to verify your token.

### RAWG

Requires a free API key from [rawg.io/apidocs](https://rawg.io/apidocs).

### IGDB

Requires Twitch application credentials (Client ID and Client Secret). Create them at [dev.twitch.tv/console](https://dev.twitch.tv/console). A **Test Connection** button is available in settings to verify your credentials.

## CSS customisation

The plugin includes built-in styles for search result items. If you want to customise the appearance of cover images in search results, you can add a CSS snippet in Obsidian:

1. Go to **Settings → Appearance → CSS Snippets → Open snippets folder**.
2. Create a new `.css` file and add your overrides.

The relevant CSS classes are:

```css
.metadata-search-suggestion-item { /* Result item container */ }
.metadata-search-cover-image { /* Cover image thumbnail */ }
.metadata-search-text-info { /* Text info container */ }
```

## License

[Obsidian Metadata Search Plugin](https://github.com/fmartingr/obsidian-metadata-search-plugin) is licensed under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.

## Contributing

Feel free to contribute!

- [Open an issue](https://github.com/fmartingr/obsidian-metadata-search-plugin/issues) to report bugs, suggest improvements, or ask questions.
- [Submit a pull request](https://github.com/fmartingr/obsidian-metadata-search-plugin/pulls) to contribute code.

### Development

This project uses [bun](https://bun.sh/) as its package manager and build tool.

```bash
# Install dependencies
bun install

# Start development build (watch mode)
bun run dev

# Run linting (format check + eslint + tsc)
bun run lint

# Run tests
bun run test

# Production build (outputs to dist/)
bun run build
```

The `dist/` folder contains the built plugin files (`main.js`, `manifest.json`, `styles.css`). You can symlink it into your vault's `.obsidian/plugins/obsidian-metadata-search-plugin/` for local testing, or use the provided helper scripts:

```bash
# Install built plugin into a vault (set OBSIDIAN_VAULT env var)
bun run vault:install

# Uninstall from a vault
bun run vault:uninstall
```

## Support

If this plugin helped you and you wish to contribute :)

<a href="https://www.buymeacoffee.com/fmartingr" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="60"></a>
