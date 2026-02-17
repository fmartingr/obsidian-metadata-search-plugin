import { SearchResult } from '@providers/types';

// == Format Syntax == //
export const NUMBER_REGEX = /^-?[0-9]*$/;
export const DATE_REGEX = /{{DATE(\+-?[0-9]+)?}}/;
export const DATE_REGEX_FORMATTED = /{{DATE:([^}\n\r+]*)(\+-?[0-9]+)?}}/;

export function replaceIllegalFileNameCharactersInString(text: string) {
  return text.replace(/[\\,#%&{}/*<>$":@.?|]/g, '').replace(/\s+/g, ' ');
}

export function isISBN(str: string) {
  return /^(97(8|9))?\d{9}(\d|X)$/.test(str);
}

export function makeFileName(data: SearchResult, fileNameFormat: string, extension = 'md') {
  const result = replaceVariableSyntax(data, replaceDateInString(fileNameFormat));
  return replaceIllegalFileNameCharactersInString(result || 'Untitled') + `.${extension}`;
}

export function replaceVariableSyntax(data: SearchResult, text: string): string {
  if (!text?.trim()) {
    return '';
  }

  const entries = Object.entries(data);

  return entries
    .reduce((result, [key, val = '']) => {
      return result.replace(new RegExp(`{{${key}}}`, 'ig'), String(val));
    }, text)
    .replace(/{{\w+}}/gi, '')
    .trim();
}

/** Check whether a YAML value needs to be wrapped in quotes to avoid misinterpretation. */
function yamlNeedsQuoting(value: string): boolean {
  // Starts with YAML-special characters (flow sequences, mappings, anchors, etc.)
  if (/^[\[{*&!|>'"%@`]/.test(value)) return true;
  // Contains `: ` which YAML would interpret as a nested mapping
  if (/:\s/.test(value)) return true;
  // Contains ` #` which YAML would interpret as an inline comment
  if (/ #/.test(value)) return true;
  return false;
}

export function toStringFrontMatter(data: Record<string, unknown>): string {
  return Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) return '';
        const items = value.map(v => `  - ${v}`).join('\n');
        return `${key}:\n${items}\n`;
      }
      const newValue = value?.toString().trim() ?? '';
      if (!newValue || /\r|\n/.test(newValue)) {
        return '';
      }
      if (yamlNeedsQuoting(newValue)) {
        return `${key}: "${newValue.replace(/"/g, '&quot;')}"\n`;
      }
      return `${key}: ${newValue}\n`;
    })
    .join('')
    .trim();
}

export function getDate(input?: { format?: string; offset?: number }) {
  let duration;

  if (input?.offset !== null && input?.offset !== undefined && typeof input.offset === 'number') {
    duration = window.moment.duration(input.offset, 'days');
  }

  return input?.format
    ? window.moment().add(duration).format(input?.format)
    : window.moment().add(duration).format('YYYY-MM-DD');
}

export function replaceDateInString(input: string) {
  let output: string = input;

  while (DATE_REGEX.test(output)) {
    const dateMatch = DATE_REGEX.exec(output);
    let offset = 0;

    if (dateMatch?.[1]) {
      const offsetString = dateMatch[1].replace('+', '').trim();
      const offsetIsInt = NUMBER_REGEX.test(offsetString);
      if (offsetIsInt) offset = parseInt(offsetString);
    }
    output = replacer(output, DATE_REGEX, getDate({ offset }));
  }

  while (DATE_REGEX_FORMATTED.test(output)) {
    const dateMatch = DATE_REGEX_FORMATTED.exec(output);
    const format = dateMatch?.[1];
    let offset = 0;

    if (dateMatch?.[2]) {
      const offsetString = dateMatch[2].replace('+', '').trim();
      const offsetIsInt = NUMBER_REGEX.test(offsetString);
      if (offsetIsInt) offset = parseInt(offsetString);
    }

    output = replacer(output, DATE_REGEX_FORMATTED, getDate({ format, offset }));
  }

  return output;
}

function replacer(str: string, reg: RegExp, replaceValue: string) {
  return str.replace(reg, function () {
    return replaceValue;
  });
}
