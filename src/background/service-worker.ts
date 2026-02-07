/**
 * CReal - Background Service Worker
 * Handles API communication, persistent storage, and message passing between content scripts
 */

import { ApiManager } from './api-manager';

const apiManager = new ApiManager();

chrome.runtime.onInstalled.addListener(() => {
  console.log('[CReal] Extension installed');
});

chrome.runtime.onMessage.addListener(
  (
    message: { type: string; payload?: unknown },
    _sender,
    sendResponse: (response: unknown) => void
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((err) => {
        console.error('[CReal] Message handler error:', err);
        sendResponse({ error: String(err) });
      });
    return true; // Keep channel open for async response
  }
);

async function handleMessage(message: { type: string; payload?: unknown }) {
  switch (message.type) {
    case 'ANALYZE_ARTICLE':
      return apiManager.analyzeArticle(
        message.payload as { text: string; url?: string; title?: string; author?: string; source?: string }
      );
    case 'GET_CACHED_ANALYSIS':
      return apiManager.getCachedAnalysis(message.payload as string);
    case 'GET_ARTICLE_HISTORY':
      return apiManager.getArticleHistory();
    case 'DELETE_ARTICLE':
      await apiManager.deleteArticle(message.payload as string);
      return { success: true };
    case 'CLEAR_HISTORY':
      await apiManager.clearHistory();
      return { success: true };
    case 'GENERATE_VIDEO':
      return apiManager.generateArticleVideo(
        message.payload as { title: string; excerpt: string; reasoning: string }
      );
    case 'FETCH_AUTHOR_INFO':
      return apiManager.fetchAuthorInfo(
        message.payload as { authorName: string }
      );
    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

