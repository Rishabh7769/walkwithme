/**
 * WalkWithMe — Landmark & Language Translation Utilities
 *
 * Strips cardinal directions from Google/OSRM Maps instructions and replaces
 * them with landmark-based, human-friendly language in English, Hindi, and Hinglish.
 */

import type { Language } from '@/types';

// ── Cardinal Direction Replacement ────────────────────────────────────────

const CARDINAL_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bhead\s+north\b/gi, 'walk straight ahead'],
  [/\bhead\s+south\b/gi, 'walk straight ahead'],
  [/\bhead\s+east\b/gi, 'walk straight ahead'],
  [/\bhead\s+west\b/gi, 'walk straight ahead'],
  [/\bhead\s+northwest\b/gi, 'walk diagonally to your left'],
  [/\bhead\s+northeast\b/gi, 'walk diagonally to your right'],
  [/\bhead\s+southwest\b/gi, 'walk diagonally to your left'],
  [/\bhead\s+southeast\b/gi, 'walk diagonally to your right'],

  [/\b(turn|go|walk)\s+north\b/gi, 'walk straight ahead'],
  [/\b(turn|go|walk)\s+south\b/gi, 'walk straight ahead'],
  [/\b(turn|go|walk)\s+east\b/gi, 'walk to your right'],
  [/\b(turn|go|walk)\s+west\b/gi, 'walk to your left'],
  [/\b(turn|go|walk)\s+northwest\b/gi, 'walk diagonally to your left'],
  [/\b(turn|go|walk)\s+northeast\b/gi, 'walk diagonally to your right'],

  [/\b(continue|proceed)\s+(north|south)\b/gi, 'keep going straight'],
  [/\b(continue|proceed)\s+east\b/gi, 'keep going to your right'],
  [/\b(continue|proceed)\s+west\b/gi, 'keep going to your left'],

  [/\bGPS\b/g, ''],
  [/\bbearing\b/gi, 'direction'],
  [/\bcoordinates\b/gi, 'location'],
  [/\blatitude\b/gi, ''],
  [/\blongitude\b/gi, ''],
];

/**
 * Strips all cardinal directions and GPS jargon from a navigation instruction.
 */
export function sanitizeInstruction(rawInstruction: string): string {
  let result = rawInstruction
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');

  for (const [pattern, replacement] of CARDINAL_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  result = result.replace(/\s+/g, ' ').trim();

  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}

// ── Maneuver to friendly description ─────────────────────────────────────

export function maneuverToFriendly(maneuver: string | null): string {
  if (!maneuver) return 'Continue';

  const map: Record<string, string> = {
    'turn-left': 'Turn left',
    'turn-right': 'Turn right',
    'turn-sharp-left': 'Turn sharply to your left',
    'turn-sharp-right': 'Turn sharply to your right',
    'turn-slight-left': 'Turn slightly to your left',
    'turn-slight-right': 'Turn slightly to your right',
    'uturn-left': 'Turn around to your left',
    'uturn-right': 'Turn around to your right',
    'straight': 'Walk straight ahead',
    'ramp-left': 'Take the ramp on your left',
    'ramp-right': 'Take the ramp on your right',
    'merge': 'Merge ahead',
    'fork-left': 'Keep left at the fork',
    'fork-right': 'Keep right at the fork',
    'roundabout-left': 'At the roundabout, go left',
    'roundabout-right': 'At the roundabout, go right',
  };

  return map[maneuver] ?? 'Continue walking';
}

// ── Hindi & Hinglish Translation Helpers ─────────────────────────────────

export function translateInstruction(instruction: string, language: Language): string {
  if (language === 'en' || !instruction) return instruction;

  let text = instruction;

  if (language === 'hi') {
    text = text
      .replace(/walk straight ahead/gi, 'सीधे आगे बढ़ें')
      .replace(/keep going straight/gi, 'सीधे चलते रहें')
      .replace(/turn left/gi, 'बाएं मुड़ें')
      .replace(/turn right/gi, 'दाएं मुड़ें')
      .replace(/walk to your right/gi, 'अपनी दाईं ओर चलें')
      .replace(/walk to your left/gi, 'अपनी बाईं ओर चलें')
      .replace(/diagonally to your left/gi, 'तिरछे बाईं ओर')
      .replace(/diagonally to your right/gi, 'तिरछे दाईं ओर')
      .replace(/arrive at your destination/gi, 'आप अपनी मंजिल पर पहुंच गए हैं 🎉')
      .replace(/keep walking/gi, 'चलते रहें');
    return text;
  }

  if (language === 'hinglish') {
    text = text
      .replace(/walk straight ahead/gi, 'Seedha aage chalo')
      .replace(/keep going straight/gi, 'Seedha chalte raho')
      .replace(/turn left/gi, 'Left mudo')
      .replace(/turn right/gi, 'Right mudo')
      .replace(/walk to your right/gi, 'Aapne right side chalo')
      .replace(/walk to your left/gi, 'Aapne left side chalo')
      .replace(/diagonally to your left/gi, 'Thoda left side hoke chalo')
      .replace(/diagonally to your right/gi, 'Thoda right side hoke chalo')
      .replace(/arrive at your destination/gi, 'Aap apni manzil par pahunch gaye 🎉')
      .replace(/keep walking/gi, 'Bas chalte raho');
    return text;
  }

  return instruction;
}

// ── Reassurance messages ──────────────────────────────────────────────────

export const ON_TRACK_MESSAGES_EN = [
  "You're going the right way! 😊",
  "Perfect, keep going!",
  "Yes, that's the correct road.",
  "You're doing great!",
];

export const ON_TRACK_MESSAGES_HI = [
  "आप बिल्कुल सही रास्ते पर हैं! 😊",
  "बहुत बढ़िया, आगे बढ़ते रहें!",
  "हाँ, यही सही रास्ता है।",
  "आप बहुत अच्छा कर रहे हैं!",
];

export const ON_TRACK_MESSAGES_HINGLISH = [
  "Bilkul sahi raste pe ho! 😊",
  "Bahut badhiya, aage chalte raho!",
  "Haan, yahi sahi rasta hai.",
  "Aap ekdum sahi ja rahe ho!",
];

export function getRandomMessage(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
}
