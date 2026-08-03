/**
 * WalkWithMe — Language Utilities
 *
 * Detects language from text, formats AI-friendly language codes,
 * and provides fallback language resolution.
 */

import type { Language } from '@/types';

// ── Detection ──────────────────────────────────────────────────────────────

/**
 * Detects whether text is primarily Hindi (Devanagari script).
 * Uses Unicode range U+0900–U+097F for Devanagari characters.
 */
export function isHindi(text: string): boolean {
  const devanagariPattern = /[\u0900-\u097F]/;
  return devanagariPattern.test(text);
}

/**
 * Detects whether text is Hinglish (Hindi words written in Latin script).
 * Heuristic: contains common Hindi words written in English.
 */
export function isHinglish(text: string): boolean {
  const hinglishWords = [
    'koi', 'baat', 'nahi', 'haan', 'theek', 'sahi', 'galat',
    'rasto', 'seedha', 'ulta', 'sidha', 'chal', 'chalo', 'aage',
    'peeche', 'left', 'right', 'bas', 'thoda', 'aur', 'yahan',
    'wahan', 'kahan', 'jaana', 'pahunch', 'mujhe', 'tumhe',
    'accha', 'acha', 'bilkul', 'ekdum', 'jaldi', 'ek', 'do',
  ];
  const lower = text.toLowerCase();
  const wordCount = hinglishWords.filter((word) => lower.includes(word)).length;
  return wordCount >= 2;
}

/**
 * Detects the language from a user's text input.
 * Returns the most likely language code.
 */
export function detectLanguage(text: string): Exclude<Language, 'auto'> {
  if (isHindi(text)) return 'hi';
  if (isHinglish(text)) return 'hinglish';
  return 'en';
}

/**
 * Resolves an effective language given user preference and optional detected language.
 * If preference is 'auto', falls back to detected language.
 */
export function resolveLanguage(
  preference: Language,
  detectedFromText?: string,
): Exclude<Language, 'auto'> {
  if (preference !== 'auto') return preference as Exclude<Language, 'auto'>;
  if (detectedFromText) return detectLanguage(detectedFromText);
  return 'en';
}

// ── Labels ────────────────────────────────────────────────────────────────

/** Human-readable label for a language code */
export function getLanguageLabel(lang: Language): string {
  const labels: Record<Language, string> = {
    auto: 'Auto',
    en: 'English',
    hi: 'हिंदी',
    hinglish: 'Hinglish',
  };
  return labels[lang];
}

/**
 * Google Maps API language code for a given app language.
 * Used when requesting directions.
 */
export function toGoogleMapsLanguage(lang: Language): string {
  const map: Record<Language, string> = {
    auto: 'en',
    en: 'en',
    hi: 'hi',
    hinglish: 'hi',
  };
  return map[lang];
}
