/**
 * WalkWithMe — Voice Service (TTS & STT Audio)
 *
 * Integrates:
 * - expo-speech for Text-to-Speech (reading companion instructions aloud)
 * - expo-av for Speech-to-Text audio recording
 *
 * Safe-wrapped to prevent native module crashes on web or unsupported clients.
 */

import * as Speech from 'expo-speech';
import type { Language } from '@/types';
import { toGoogleMapsLanguage } from '@/utils';

// Safely resolve Audio module to prevent ExponentAV crashes on web / missing native module
let AudioModule: any = null;
try {
  AudioModule = require('expo-av').Audio;
} catch (error) {
  console.warn('[VoiceService] expo-av native module not available in this environment.');
}

// ── Text To Speech (TTS) ──────────────────────────────────────────────────

let currentSpeakingState = false;

/**
 * Speaks a given text string aloud using Expo Speech.
 * Uses a calm, slightly slower speech rate (0.9x) suited for anxious users walking.
 */
export async function speakText(
  text: string,
  language: Language = 'auto',
  onDone?: () => void,
  onError?: (error: any) => void,
): Promise<void> {
  if (!text || text.trim().length === 0) return;

  // Stop any ongoing speech before starting new instruction
  await stopSpeaking();

  const langCode = toGoogleMapsLanguage(language);

  currentSpeakingState = true;

  try {
    if (Speech && typeof Speech.speak === 'function') {
      Speech.speak(text, {
        language: langCode,
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          currentSpeakingState = false;
          if (onDone) onDone();
        },
        onStopped: () => {
          currentSpeakingState = false;
        },
        onError: (err) => {
          currentSpeakingState = false;
          console.warn('[VoiceService] Speech error:', err);
          if (onError) onError(err);
        },
      });
    } else {
      currentSpeakingState = false;
    }
  } catch (error) {
    currentSpeakingState = false;
    console.warn('[VoiceService] Failed to invoke Speech.speak:', error);
  }
}

/**
 * Stops any active speech output immediately.
 */
export async function stopSpeaking(): Promise<void> {
  try {
    if (Speech && typeof Speech.isSpeakingAsync === 'function') {
      const isSpeakingNow = await Speech.isSpeakingAsync();
      if (isSpeakingNow && typeof Speech.stop === 'function') {
        await Speech.stop();
      }
    }
  } catch (error) {
    // Ignore stop errors
  } finally {
    currentSpeakingState = false;
  }
}

export function isCurrentlySpeaking(): boolean {
  return currentSpeakingState;
}

// ── Audio Recording (STT) ─────────────────────────────────────────────────

let recordingInstance: any = null;

/**
 * Requests microphone audio permissions from the device.
 */
export async function requestAudioPermission(): Promise<boolean> {
  if (!AudioModule) return false;

  try {
    const response = await AudioModule.requestPermissionsAsync();
    return response.granted;
  } catch (error) {
    console.warn('[VoiceService] Permission request failed:', error);
    return false;
  }
}

/**
 * Starts recording audio for voice input.
 */
export async function startRecordingAudio(): Promise<boolean> {
  if (!AudioModule) return false;

  try {
    const granted = await requestAudioPermission();
    if (!granted) return false;

    await AudioModule.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    if (recordingInstance) {
      await recordingInstance.stopAndUnloadAsync();
      recordingInstance = null;
    }

    const { recording } = await AudioModule.Recording.createAsync(
      AudioModule.RecordingOptionsPresets.HIGH_QUALITY,
    );

    recordingInstance = recording;
    return true;
  } catch (error) {
    console.warn('[VoiceService] Failed to start recording:', error);
    recordingInstance = null;
    return false;
  }
}

/**
 * Stops recording audio and returns the local file URI of the recorded sound file.
 */
export async function stopRecordingAudio(): Promise<string | null> {
  if (!recordingInstance) return null;

  try {
    await recordingInstance.stopAndUnloadAsync();
    const uri = recordingInstance.getURI();
    recordingInstance = null;
    return uri;
  } catch (error) {
    console.warn('[VoiceService] Failed to stop recording:', error);
    recordingInstance = null;
    return null;
  }
}
