#!/usr/bin/env node
/**
 * Test if the Gemini API key is valid and the API is working.
 * Loads key from .env.local. Run: npm run test:gemini
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODELS_TO_TRY = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];

/**
 * Test if the Gemini API is working with the key from env.
 * @returns {Promise<{ ok: boolean, model?: string, message?: string, error?: string }>}
 */
async function testGeminiApi() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || !apiKey.startsWith('AIza')) {
    return {
      ok: false,
      error: 'No valid GEMINI_API_KEY in .env.local (expected key starting with AIza...)',
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastErr;

  for (const modelName of MODELS_TO_TRY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Reply with exactly: OK');
      const text = (result.response.text() || '').trim();
      return {
        ok: true,
        model: modelName,
        message: text || 'API responded successfully',
      };
    } catch (e) {
      lastErr = e;
      if ((e?.message || '').includes('API key not valid')) break;
    }
  }

  const errMsg = lastErr?.message || String(lastErr);
  return {
    ok: false,
    error: errMsg,
  };
}

async function main() {
  console.log('Testing Gemini API...\n');
  const result = await testGeminiApi();

  if (result.ok) {
    console.log('✅ API is working');
    console.log('   Model:', result.model);
    console.log('   Response:', result.message);
    process.exit(0);
  } else {
    console.error('❌ API test failed');
    console.error('   ', result.error);
    if ((result.error || '').includes('API key')) {
      console.error('\n   Get a key: https://aistudio.google.com/apikey');
    }
    process.exit(1);
  }
}

// Run when executed directly (npm run test:gemini or node scripts/test-gemini.js)
if (require.main === module) {
  main();
}

module.exports = { testGeminiApi };
