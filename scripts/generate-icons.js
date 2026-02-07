#!/usr/bin/env node
/**
 * Generate placeholder icons for CReal extension
 * Replace with proper icons before publishing
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

// Minimal valid 1x1 PNG (Chrome scales as needed - replace with proper icons)
const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);
const PNG_16 = MINIMAL_PNG;
const PNG_48 = MINIMAL_PNG;
const PNG_128 = MINIMAL_PNG;

fs.mkdirSync(ICONS_DIR, { recursive: true });
fs.writeFileSync(path.join(ICONS_DIR, 'icon16.png'), PNG_16);
fs.writeFileSync(path.join(ICONS_DIR, 'icon48.png'), PNG_48);
fs.writeFileSync(path.join(ICONS_DIR, 'icon128.png'), PNG_128);
console.log('[CReal] Icons generated at public/icons/');
