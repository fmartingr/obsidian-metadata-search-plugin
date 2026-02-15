import { SearchResult } from '@providers/types';
import * as utils from './utils';

describe('utils', () => {
  const result: SearchResult = {
    title: '코스모스',
    author: '칼 세이건',
    authors: ['칼 세이건'],
  };

  it('replaceIllegalFileNameCharactersInString 1', () => {
    expect(utils.replaceIllegalFileNameCharactersInString('재레드 다이아몬드의 <대변동 : 위기, 선택, 변화>')).toBe(
      '재레드 다이아몬드의 대변동 위기 선택 변화',
    );
  });

  it('replaceIllegalFileNameCharactersInString 2', () => {
    expect(utils.replaceIllegalFileNameCharactersInString('2022 고시넷 초록이 NCS 모듈형 1 | 통합기본서(2판)')).toBe(
      '2022 고시넷 초록이 NCS 모듈형 1 통합기본서(2판)',
    );
  });

  it('makeFileName with format', () => {
    expect(utils.makeFileName(result, '{{author}}-{{title}}')).toBe('칼 세이건-코스모스.md');
  });

  it('makeFileName with title and author', () => {
    expect(utils.makeFileName(result, '{{title}} - {{author}}')).toBe('코스모스 - 칼 세이건.md');
  });

  it('makeFileName with special characters in title', () => {
    const newResult = {
      ...result,
      title: '코스모스 : 창백한 푸른점',
    };
    expect(utils.makeFileName(newResult, '{{title}} - {{author}}')).toBe('코스모스 창백한 푸른점 - 칼 세이건.md');
  });

  it('replaceVariableSyntax replaces known variables', () => {
    const text = '{{title}} by {{author}}';
    expect(utils.replaceVariableSyntax(result, text)).toBe('코스모스 by 칼 세이건');
  });

  it('replaceVariableSyntax strips unknown variables', () => {
    const text = '{{title}} {{unknownField}}';
    expect(utils.replaceVariableSyntax(result, text)).toBe('코스모스');
  });

  it('toStringFrontMatter generates YAML', () => {
    const data = { title: 'Test', author: 'Author', pages: 100 };
    const yaml = utils.toStringFrontMatter(data);
    expect(yaml).toContain('title: Test');
    expect(yaml).toContain('author: Author');
    expect(yaml).toContain('pages: 100');
  });

  it('toStringFrontMatter handles arrays', () => {
    const data = { categories: ['Fiction', 'Drama'] };
    const yaml = utils.toStringFrontMatter(data);
    expect(yaml).toContain('categories:');
    expect(yaml).toContain('  - Fiction');
    expect(yaml).toContain('  - Drama');
  });

  it('toStringFrontMatter skips empty values', () => {
    const data = { title: 'Test', empty: '', undef: undefined };
    const yaml = utils.toStringFrontMatter(data);
    expect(yaml).toContain('title: Test');
    expect(yaml).not.toContain('empty');
    expect(yaml).not.toContain('undef');
  });
});
