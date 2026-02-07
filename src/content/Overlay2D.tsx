/**
 * CReal - Phase 1 MVP Overlay
 * Simple 2D bias visualization with glass morphism styling
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { extractArticle } from '../lib/utils/article-parser';

interface BiasResult {
  left_right: number;
  auth_lib: number;
  nat_glob: number;
  confidence: number;
  reasoning: string;
}

interface AnalysisState {
  status: 'idle' | 'loading' | 'success' | 'error';
  bias?: BiasResult;
  error?: string;
}

type ViewMode = 'minimized' | 'compact' | 'dashboard';

export function Overlay2D() {
  const [viewMode, setViewMode] = useState<ViewMode>('minimized');
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: 'idle' });
  const [article, setArticle] = useState<{ title: string; url: string } | null>(null);

  const runAnalysis = useCallback(async () => {
    const extracted = extractArticle();
    if (!extracted) {
      setAnalysis({
        status: 'error',
        error: 'Could not extract article content from this page.',
      });
      setArticle(null);
      return;
    }

    setArticle({ title: extracted.title, url: extracted.url });
    setAnalysis({ status: 'loading' });

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_ARTICLE',
        payload: {
          text: extracted.text,
          url: extracted.url,
        },
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      setAnalysis({
        status: 'success',
        bias: response.bias,
      });
      setViewMode('compact');
    } catch (err) {
      setAnalysis({
        status: 'error',
        error: err instanceof Error ? err.message : 'Analysis failed.',
      });
    }
  }, []);

  useEffect(() => {
    const extracted = extractArticle();
    if (extracted) {
      setArticle({ title: extracted.title, url: extracted.url });
    }
  }, []);

  useEffect(() => {
    const handler = () => runAnalysis();
    document.addEventListener('creal-run-analysis', handler);
    return () => document.removeEventListener('creal-run-analysis', handler);
  }, [runAnalysis]);

  const toggleView = () => {
    if (viewMode === 'minimized') {
      setViewMode('compact');
      if (analysis.status === 'idle') runAnalysis();
    } else if (viewMode === 'compact') {
      setViewMode('dashboard');
    } else {
      setViewMode('minimized');
    }
  };

  return (
    <div className="creal-overlay fixed bottom-4 right-4 z-[2147483647] font-sans">
      <AnimatePresence mode="wait">
        {viewMode === 'minimized' && (
          <motion.button
            key="minimized"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={toggleView}
            className="creal-btn-minimize flex h-14 w-14 items-center justify-center rounded-full bg-creal-bg/90 text-creal-accent shadow-neon backdrop-blur-glass"
            title="CReal - Analyze article bias"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </motion.button>
        )}

        {(viewMode === 'compact' || viewMode === 'dashboard') && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="creal-card w-80 overflow-hidden rounded-2xl border border-white/10 bg-creal-bg/90 shadow-neon backdrop-blur-glass"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-semibold text-creal-accent">CReal</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode(viewMode === 'compact' ? 'dashboard' : 'compact')}
                  className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"
                >
                  {viewMode === 'compact' ? '⊕' : '⊖'}
                </button>
                <button
                  onClick={() => setViewMode('minimized')}
                  className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"
                >
                  −
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto p-4">
              {analysis.status === 'idle' && (
                <div className="text-center">
                  <p className="mb-3 text-sm text-white/80">
                    {article ? 'Click Analyze to assess bias' : 'No article detected on this page.'}
                  </p>
                  <button
                    onClick={runAnalysis}
                    disabled={!article}
                    className="rounded-lg bg-creal-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                  >
                    Analyze
                  </button>
                </div>
              )}

              {analysis.status === 'loading' && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-creal-accent border-t-transparent" />
                  <p className="text-sm text-white/70">Analyzing bias...</p>
                </div>
              )}

              {analysis.status === 'error' && (
                <div className="rounded-lg border border-creal-danger/50 bg-creal-danger/10 p-3">
                  <p className="text-sm text-creal-danger">{analysis.error}</p>
                  <p className="mt-2 text-xs text-white/60">
                    Add your Gemini API key in the extension popup.
                  </p>
                  <button
                    onClick={runAnalysis}
                    className="mt-3 rounded bg-white/10 px-3 py-1 text-sm text-white/90 hover:bg-white/20"
                  >
                    Retry
                  </button>
                </div>
              )}

              {analysis.status === 'success' && analysis.bias && (
                <BiasDisplay bias={analysis.bias} expanded={viewMode === 'dashboard'} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BiasDisplay({
  bias,
  expanded,
}: {
  bias: BiasResult;
  expanded: boolean;
}) {
  const axes = [
    {
      label: 'Left ↔ Right',
      value: bias.left_right,
      left: 'Left',
      right: 'Right',
    },
    {
      label: 'Authoritarian ↔ Libertarian',
      value: bias.auth_lib,
      left: 'Auth.',
      right: 'Lib.',
    },
    {
      label: 'Nationalist ↔ Globalist',
      value: bias.nat_glob,
      left: 'Nat.',
      right: 'Glob.',
    },
  ] as const;

  const getBarColor = (value: number) => {
    const abs = Math.abs(value);
    if (abs < 20) return 'bg-creal-neutral';
    if (abs < 50) return 'bg-creal-warning';
    return 'bg-creal-danger';
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-white/50">Confidence: {bias.confidence}%</div>

      {axes.map((axis) => (
        <div key={axis.label}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-white/70">{axis.left}</span>
            <span className="text-white/70">{axis.right}</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className={`absolute left-0 top-0 h-full ${getBarColor(axis.value)}`}
              initial={{ width: 0, left: '50%' }}
              animate={{
                width: `${Math.abs(axis.value)}%`,
                left: axis.value < 0 ? `${50 + (axis.value as number)}%` : '50%',
              }}
              transition={{ duration: 0.5, ease: 'easeOut' as const }}
            />
          </div>
          <p className="mt-1 text-xs text-white/50">{axis.label}</p>
        </div>
      ))}

      {expanded && (
        <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-medium text-white/80">Reasoning</p>
          <p className="mt-1 text-sm text-white/70">{bias.reasoning}</p>
        </div>
      )}
    </div>
  );
}
