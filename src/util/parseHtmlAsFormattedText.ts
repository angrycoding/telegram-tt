import type { ApiFormattedText, ApiMessageEntity } from '../api/types';
import { ApiMessageEntityTypes } from '../api/types';

import { RE_LINK_TEMPLATE } from '../config';
import { IS_EMOJI_SUPPORTED } from './windowEnvironment';


const MARKDOWN_TAGS: {[key: string]: any} = {
	'**': {
		open: '<b>',
		close: '</b>'
	},
	'~~': {
		open: '<s>',
		close: '</s>'
	},
	'_': {
		open: '<i>',
		close: '</i>'
	},
	'__': {
		open: '<u>',
		close: '</u>'
	},
	'||': {
		open: `<span data-entity-type="${ApiMessageEntityTypes.Spoiler}">`,
		close: '</span>'
	}
}

const Tokenizer = class {

	public input: string = '';
	private inputLen: number = 0;
	private buffer: any[] = [];
	private regexp: RegExp = new RegExp('');

	private static REGEXP_ESCAPE = /([.?*+^$[\]\\(){}|-])/g;

	private static tokenToString = (value: RegExp | string) => {
		if (value instanceof RegExp) {
			value = value.toString().split('/').slice(1, -1).join('/')
		} else {
			value = value.replace(Tokenizer.REGEXP_ESCAPE, '\\$1')
		}
		return value;
	}
	
	constructor(...tokens: Array<string | RegExp>) {
		tokens = tokens.map(Tokenizer.tokenToString);
		tokens = tokens.sort((a, b) => String(b).length - String(a).length);
		this.regexp = new RegExp(tokens.map(token => '(' + token + ')').join('|'), 'g');
	}

	init = (input: string) => {
		this.input = input;
		this.inputLen = input.length;
		this.regexp.lastIndex = 0;
		this.buffer.splice(0, Infinity);
	}

	private ensureToken = () => {

		const { regexp, buffer, input, inputLen } = this;

		if (buffer.length) return;

		const startPos = regexp.lastIndex;

		const match = regexp.exec(input);
		if (match) {

			const matchText = match[0];
			const matchIndex = match.index;
			const escape = (input[matchIndex - 1] === '\\');

			if (escape) {
				buffer.push(input.slice(startPos, matchIndex + matchText.length));
			}
			
			else {
				if (startPos < matchIndex) {
					buffer.push(input.slice(startPos, matchIndex));
				}

				buffer.push(matchText);
			}


		}

		else {
			regexp.lastIndex = inputLen;
			buffer.push(input.slice(startPos));
		}
		
	}


	next = () => {
		this.ensureToken();
		return this.buffer.shift()
	}

}

const tokenizer = new Tokenizer(...Object.keys(MARKDOWN_TAGS));


const parseMarkdown = (parsedHtml: string) => {

	tokenizer.init(parsedHtml);

	let token: any;

	const result: Array<{
		kind: 'starting' | 'start' | 'end' | 'data',
		data: string,
	}> = []

	while (token = tokenizer.next()) {

		const tag = (MARKDOWN_TAGS[token] && token);
		const openingTag = tag && result.find(item => item.kind === 'starting' && item.data === token);

		if (tag && !openingTag) {
			result.push({
				kind: 'starting',
				data: token
			});
		}

		else if (tag === '`' && openingTag) {

			openingTag.kind = 'start'

			result.push({
				...openingTag,
				kind: 'end'
			});


		}

		else if (tag && openingTag) {
			openingTag.kind = 'start'
			result.push({
				...openingTag,
				kind: 'end'
			});
		}

		else {
			result.push({
				kind: 'data',
				data: token
			});
		}

	}

	return result.map(item => {
		if (item.kind === 'start') return MARKDOWN_TAGS[item.data].open;
		if (item.kind === 'end') return MARKDOWN_TAGS[item.data].close;
		return item.data;
	}).join('');

}

export const ENTITY_CLASS_BY_NODE_NAME: Record<string, ApiMessageEntityTypes> = {
  B: ApiMessageEntityTypes.Bold,
  STRONG: ApiMessageEntityTypes.Bold,
  I: ApiMessageEntityTypes.Italic,
  EM: ApiMessageEntityTypes.Italic,
  INS: ApiMessageEntityTypes.Underline,
  U: ApiMessageEntityTypes.Underline,
  S: ApiMessageEntityTypes.Strike,
  STRIKE: ApiMessageEntityTypes.Strike,
  DEL: ApiMessageEntityTypes.Strike,
  CODE: ApiMessageEntityTypes.Code,
  PRE: ApiMessageEntityTypes.Pre,
  BLOCKQUOTE: ApiMessageEntityTypes.Blockquote,
};

const MAX_TAG_DEEPNESS = 3;

export default function parseHtmlAsFormattedText(
  html: string, withMarkdownLinks = false, skipMarkdown = false,
): ApiFormattedText {
  const fragment = document.createElement('div');
  
  if (skipMarkdown) {
    fragment.innerHTML = html;
  } else {
    fragment.innerHTML = withMarkdownLinks ? parseMarkdownLinks(html) : html;
    processMarkdown(fragment);
  }


  fixImageContent(fragment);
  const text = fragment.innerText.trim().replace(/\u200b+/g, '');
  const trimShift = fragment.innerText.indexOf(text[0]);
  let textIndex = -trimShift;
  let recursionDeepness = 0;
  const entities: ApiMessageEntity[] = [];

  function addEntity(node: ChildNode) {
    if (node.nodeType === Node.COMMENT_NODE) return;
    const { index, entity } = getEntityDataFromNode(node, text, textIndex);

    if (entity) {
      textIndex = index;
      entities.push(entity);
    } else if (node.textContent) {
      // Skip newlines on the beginning
      if (index === 0 && node.textContent.trim() === '') {
        return;
      }
      textIndex += node.textContent.length;
    }

    if (node.hasChildNodes() && recursionDeepness <= MAX_TAG_DEEPNESS) {
      recursionDeepness += 1;
      Array.from(node.childNodes).forEach(addEntity);
    }
  }

  Array.from(fragment.childNodes).forEach((node) => {
    recursionDeepness = 1;
    addEntity(node);
  });

  return {
    text,
    entities: entities.length ? entities : undefined,
  };
}

export function fixImageContent(fragment: HTMLDivElement) {
  fragment.querySelectorAll('img').forEach((node) => {
    if (node.dataset.documentId) { // Custom Emoji
      node.textContent = (node as HTMLImageElement).alt || '';
    } else { // Regular emoji with image fallback
      node.replaceWith(node.alt || '');
    }
  });
}




function processMarkdown(htmlElement: HTMLElement) {

  let { innerHTML } = htmlElement;

  innerHTML = innerHTML
  
  // Strip redundant nbsp's
  .replace(/&nbsp;/g, ' ')

  // Replace <div><br></div> with newline (new line in Safari)
  .replace(/<div><br([^>]*)?><\/div>/g, '\n')
  
  // Replace <br> with newline
  .replace(/<br([^>]*)?>/g, '\n')
  
  // Strip redundant <div> tags
  .replace(/<\/div>(\s*)<div>/g, '\n')
  .replace(/<div>/g, '\n')
  .replace(/<\/div>/g, '')

  // Pre
  .replace(/^`{3}(.*?)[\n\r](.*?[\n\r]?)`{3}/gms, '<pre data-language="$1">$2</pre>')
  .replace(/^`{3}[\n\r]?(.*?)[\n\r]?`{3}/gms, '<pre>$1</pre>')
  .replace(/[`]{3}([^`]+)[`]{3}/g, '<pre>$1</pre>')
  
  // Code
  .replace(/(?!<(code|pre)[^<]*|<\/)[`]{1}([^`\n]+)[`]{1}(?![^<]*<\/(code|pre)>)/g, '<code>$2</code>')

  .replace(
    /(?!<(?:code|pre)[^<]*|<\/)\[([^\]\n]+)\]\(customEmoji:(\d+)\)(?![^<]*<\/(?:code|pre)>)/g,
    '<img alt="$1" data-document-id="$2">',
  )

  // Custom Emoji markdown tag
  if (!IS_EMOJI_SUPPORTED) {
    // Prepare alt text for custom emoji
    innerHTML = innerHTML.replace(/\[<img[^>]+alt="([^"]+)"[^>]*>]/gm, '[$1]');
  }




  const walker = document.createTreeWalker(htmlElement, NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) {
    const node = walker.currentNode;
    const { textContent, parentElement } = node;
    if (!textContent || !parentElement || parentElement.closest('code,pre')) continue;

    if (node instanceof Text) {
      const tpl = document.createElement('template');
      tpl.innerHTML = parseMarkdown(textContent);
      node.replaceWith(tpl.content)
    }

  }
}

function parseMarkdownLinks(html: string) {
  return html.replace(new RegExp(`\\[([^\\]]+?)]\\((${RE_LINK_TEMPLATE}+?)\\)`, 'g'), (_, text, link) => {
    const url = link.includes('://') ? link : link.includes('@') ? `mailto:${link}` : `https://${link}`;
    return `<a href="${url}">${text}</a>`;
  });
}

function getEntityDataFromNode(
  node: ChildNode,
  rawText: string,
  textIndex: number,
): { index: number; entity?: ApiMessageEntity } {
  const type = getEntityTypeFromNode(node);

  if (!type || !node.textContent) {
    return {
      index: textIndex,
      entity: undefined,
    };
  }

  const rawIndex = rawText.indexOf(node.textContent, textIndex);
  // In some cases, last text entity ends with a newline (which gets trimmed from `rawText`).
  // In this case, `rawIndex` would return `-1`, so we use `textIndex` instead.
  const index = rawIndex >= 0 ? rawIndex : textIndex;
  const offset = rawText.substring(0, index).length;
  const { length } = rawText.substring(index, index + node.textContent.length);

  if (type === ApiMessageEntityTypes.TextUrl) {
    return {
      index,
      entity: {
        type,
        offset,
        length,
        url: (node as HTMLAnchorElement).href,
      },
    };
  }
  if (type === ApiMessageEntityTypes.MentionName) {
    return {
      index,
      entity: {
        type,
        offset,
        length,
        userId: (node as HTMLAnchorElement).dataset.userId!,
      },
    };
  }

  if (type === ApiMessageEntityTypes.Pre) {
    return {
      index,
      entity: {
        type,
        offset,
        length,
        language: (node as HTMLPreElement).dataset.language,
      },
    };
  }

  if (type === ApiMessageEntityTypes.CustomEmoji) {
    return {
      index,
      entity: {
        type,
        offset,
        length,
        documentId: (node as HTMLImageElement).dataset.documentId!,
      },
    };
  }

  return {
    index,
    entity: {
      type,
      offset,
      length,
    },
  };
}

function getEntityTypeFromNode(node: ChildNode): ApiMessageEntityTypes | undefined {
  if (node instanceof HTMLElement && node.dataset.entityType) {
    return node.dataset.entityType as ApiMessageEntityTypes;
  }

  if (ENTITY_CLASS_BY_NODE_NAME[node.nodeName]) {
    return ENTITY_CLASS_BY_NODE_NAME[node.nodeName];
  }

  if (node.nodeName === 'A') {
    const anchor = node as HTMLAnchorElement;
    if (anchor.dataset.entityType === ApiMessageEntityTypes.MentionName) {
      return ApiMessageEntityTypes.MentionName;
    }
    if (anchor.dataset.entityType === ApiMessageEntityTypes.Url) {
      return ApiMessageEntityTypes.Url;
    }
    if (anchor.href.startsWith('mailto:')) {
      return ApiMessageEntityTypes.Email;
    }
    if (anchor.href.startsWith('tel:')) {
      return ApiMessageEntityTypes.Phone;
    }
    if (anchor.href !== anchor.textContent) {
      return ApiMessageEntityTypes.TextUrl;
    }

    return ApiMessageEntityTypes.Url;
  }

  if (node.nodeName === 'SPAN') {
    return (node as HTMLElement).dataset.entityType as any;
  }

  if (node.nodeName === 'IMG') {
    if ((node as HTMLImageElement).dataset.documentId) {
      return ApiMessageEntityTypes.CustomEmoji;
    }
  }

  return undefined;
}
