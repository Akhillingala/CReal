/**
 * SeeReal - Highlighter Utility
 * Handles applying and removing verbatim text highlights in the DOM
 */

export const HIGHLIGHT_CLASS = 'seereal-highlight-element';

/**
 * Apply highlights to the document body by wrapping verbatim matches in <mark>
 */
export function applyPageHighlights(highlights: string[]): void {
    if (!highlights || highlights.length === 0) return;

    // 1. Remove any existing highlights first
    removePageHighlights();

    // 2. Sort highlights by length descending to avoid partial matches
    const sortedHighlights = [...highlights].sort((a, b) => b.length - a.length);

    // 3. Create regex for verbatim matches
    const escapedHighlights = sortedHighlights.map(h => {
        return h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });

    const regex = new RegExp(`(${escapedHighlights.join('|')})`, 'gi');

    // 4. Walk the DOM and replace text nodes
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                // Skip text inside certain tags or SeeReal components
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;

                const tagName = parent.tagName.toLowerCase();
                if (['script', 'style', 'noscript', 'iframe', 'canvas'].includes(tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }

                // Skip our own overlay
                if (parent.closest('.seereal-overlay') || parent.closest('#seereal-overlay-root')) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const nodesToProcess: Text[] = [];
    let currentNode: Node | null;
    while ((currentNode = walker.nextNode())) {
        nodesToProcess.push(currentNode as Text);
    }

    nodesToProcess.forEach(textNode => {
        const content = textNode.textContent || '';
        if (regex.test(content)) {
            const fragment = document.createDocumentFragment();
            const parts = content.split(regex);

            parts.forEach(part => {
                if (highlights.some(h => h.toLowerCase() === part.toLowerCase())) {
                    const mark = document.createElement('mark');
                    mark.className = HIGHLIGHT_CLASS;
                    // Apply some inline styles to ensure visibility regardless of site CSS
                    mark.style.backgroundColor = 'rgba(255, 215, 0, 0.4)'; // Royal Gold-ish
                    mark.style.color = 'inherit';
                    mark.style.borderRadius = '2px';
                    mark.style.padding = '0 2px';
                    mark.textContent = part;
                    fragment.appendChild(mark);
                } else {
                    fragment.appendChild(document.createTextNode(part));
                }
            });

            textNode.parentNode?.replaceChild(fragment, textNode);
        }
    });
}

/**
 * Remove all SeeReal highlights from the page
 */
export function removePageHighlights(): void {
    const elements = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
    elements.forEach(el => {
        const parent = el.parentNode;
        if (parent) {
            while (el.firstChild) {
                parent.insertBefore(el.firstChild, el);
            }
            parent.removeChild(el);
            // Normalize to rejoin text nodes
            parent.normalize();
        }
    });
}
