/**
 * CReal - Article Parser
 * Extracts article text and metadata from news pages
 */

const ARTICLE_SELECTORS = [
  'article',
  '[role="article"]',
  'main article',
  '.article-content',
  '.post-content',
  '.entry-content',
  '.story-body',
  '.article-body',
  '[itemprop="articleBody"]',
  '.content-body',
  '.post-body',
  'main',
];

const IGNORE_SELECTORS = [
  'script',
  'style',
  'nav',
  'header',
  'footer',
  '.advertisement',
  '.ad',
  '[role="navigation"]',
  '.comments',
  '.social-share',
];

export interface ExtractedArticle {
  title: string;
  text: string;
  url: string;
  source?: string;
  excerpt?: string;
}

export function extractArticle(): ExtractedArticle | null {
  const url = window.location.href;
  const title = getTitle();
  const text = getArticleText();
  const source = getSource(url);

  if (!text || text.trim().length < 100) {
    return null;
  }

  return {
    title,
    text: text.trim(),
    url,
    source,
    excerpt: text.slice(0, 300).trim() + (text.length > 300 ? '...' : ''),
  };
}

function getTitle(): string {
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  if (ogTitle) return ogTitle.trim();

  const h1 = document.querySelector('h1');
  if (h1) return h1.textContent?.trim() ?? '';

  return document.title ?? 'Untitled';
}

function getArticleText(): string {
  let container: Element | null = null;

  for (const selector of ARTICLE_SELECTORS) {
    const el = document.querySelector(selector);
    if (el && getTextLength(el) > 200) {
      container = el;
      break;
    }
  }

  if (!container) {
    container = document.body;
  }

  return extractTextFromElement(container);
}

function getTextLength(el: Element): number {
  return extractTextFromElement(el).replace(/\s+/g, ' ').trim().length;
}

function extractTextFromElement(el: Element): string {
  const clone = el.cloneNode(true) as Element;

  for (const selector of IGNORE_SELECTORS) {
    clone.querySelectorAll(selector).forEach((n) => n.remove());
  }

  return clone.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function getSource(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}
