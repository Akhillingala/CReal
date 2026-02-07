/**
 * CReal - API Manager
 * Coordinates AI analysis requests, persistent storage, and video generation
 */

import { BiasAnalyzer, type BiasResult } from '../lib/analyzers/bias-detector';
import { generateVideoPrompt } from '../lib/video/video-prompt';
import { generateVideo, type VeoGenerateResult } from '../lib/video/veo-client';
import { StorageService } from '../lib/storage/storage-service';
import type { ArticleRecord } from '../lib/storage/types';


import { GoogleGenerativeAI } from '@google/generative-ai';

const biasAnalyzer = new BiasAnalyzer();
const storageService = new StorageService();

interface AnalysisResult {
  bias: BiasResult;
  cached: boolean;
  timestamp: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export class ApiManager {

  async analyzeArticle(payload: { text: string; url?: string; title?: string; author?: string; source?: string }): Promise<AnalysisResult> {
    const { text, url = 'unknown', title = 'Untitled Article', author, source } = payload;

    // Check persistent storage first
    const stored = await storageService.getAnalysis(url);
    if (stored && Date.now() - stored.timestamp < CACHE_TTL_MS) {
      return {
        bias: stored.bias,
        cached: true,
        timestamp: stored.timestamp,
      };
    }

    // Run fresh analysis
    const bias = await biasAnalyzer.analyze(text);
    const timestamp = Date.now();
    const result: AnalysisResult = {
      bias,
      cached: false,
      timestamp,
    };

    // Save to persistent storage
    const record: ArticleRecord = {
      url,
      title,
      author,
      source,
      bias,
      timestamp,
      cached: false,
    };
    await storageService.saveAnalysis(record);

    // Auto-cleanup old analyses (non-blocking)
    storageService.clearOldAnalyses().catch((err) => {
      console.warn('[CReal] Failed to clear old analyses:', err);
    });

    return result;
  }

  async getCachedAnalysis(url: string): Promise<AnalysisResult | null> {
    const stored = await storageService.getAnalysis(url);
    if (!stored) return null;

    return {
      bias: stored.bias,
      cached: true,
      timestamp: stored.timestamp,
    };
  }

  async getArticleHistory(): Promise<ArticleRecord[]> {
    return storageService.getAllAnalyses();
  }

  async deleteArticle(url: string): Promise<void> {
    return storageService.deleteAnalysis(url);
  }

  async clearHistory(): Promise<void> {
    return storageService.clearAllAnalyses();
  }

  /** Generate a short (<15s) video clip summarizing the article. Uses same Gemini API key. */
  async generateArticleVideo(payload: {
    title: string;
    excerpt: string;
    reasoning: string;
  }): Promise<VeoGenerateResult> {
    const apiKey = await biasAnalyzer.getApiKey();
    if (!apiKey) {
      throw new Error('No API key. Add your Gemini API key in the extension popup.');
    }
    const context = [payload.excerpt, payload.reasoning].filter(Boolean).join('\n\n');
    const prompt = await generateVideoPrompt(apiKey, payload.title, context);
    return generateVideo(apiKey, prompt);
  }

  /** Fetch author information including bio, articles, and professional details */
  async fetchAuthorInfo(payload: { authorName: string }): Promise<{ authorInfo: any }> {
    const { authorName } = payload;
    const apiKey = await biasAnalyzer.getApiKey();

    if (!apiKey) {
      throw new Error('No API key. Add your Gemini API key in the extension popup.');
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);

      // Try models in order of preference
      const modelNames = ['gemini-2.0-flash', 'gemini-1.5-flash'];
      let rawText = '';
      let lastError: unknown;

      const prompt = `Search for information about the journalist/author "${authorName}". Provide:
1. A brief biography (2-3 sentences)
2. Their occupation/role
3. Age (if publicly available)
4. List of 3-5 notable articles they've written (with titles and URLs if available)
5. Any social media or professional profile links (LinkedIn, Twitter, etc.)

Format your response as a JSON object with this structure:
{
  "name": "${authorName}",
  "bio": "brief biography",
  "occupation": "their role/title",
  "age": "age if available, otherwise null",
  "articles": [
    {"title": "article title", "url": "article url", "source": "publication", "date": "publication date"}
  ],
  "socialLinks": [
    {"platform": "platform name", "url": "profile url"}
  ]
}

If you cannot find specific information, use null for that field. Only include verified, publicly available information. Return only valid JSON.`;

      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: "application/json"
            }
          });

          const result = await model.generateContent(prompt);
          const response = result.response;
          rawText = response.text();

          if (rawText) break; // Success
        } catch (err) {
          lastError = err;
          console.warn(`[CReal] Failed to fetch author info with ${modelName}:`, err);
          // Continue to next model
        }
      }

      if (!rawText) {
        throw lastError || new Error('All models failed to respond');
      }

      // Extract JSON from the response (handle markdown code blocks if any remain)
      let jsonText = rawText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const authorInfo = JSON.parse(jsonText);
      return { authorInfo };

    } catch (error) {
      console.error('[CReal] Error fetching author info:', error);
      throw new Error('Failed to fetch author information. Please try again.');
    }
  }
}

