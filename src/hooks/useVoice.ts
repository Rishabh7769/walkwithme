/**
 * WalkWithMe — Custom Voice Hooks
 *
 * Hooks:
 * - useSpeech: Speaks instructions aloud if voice is enabled in user settings
 * - useVoiceRecorder: Handles microphone audio recording for voice conversations
 */

import { useState, useCallback, useEffect } from 'react';
import { speakText, stopSpeaking, startRecordingAudio, stopRecordingAudio } from '@/services/voice';
import { useUserStore } from '@/store/useUserStore';
import { useNavigationStore } from '@/store/useNavigationStore';

/**
 * Hook for Text-to-Speech playback.
 */
export function useSpeech() {
  const { profile } = useUserStore();
  const { isSpeaking, setIsSpeaking } = useNavigationStore();

  const speak = useCallback(
    async (text: string) => {
      if (!profile.voiceEnabled || !text) return;

      setIsSpeaking(true);
      await speakText(
        text,
        profile.languagePreference,
        () => setIsSpeaking(false),
        () => setIsSpeaking(false),
      );
    },
    [profile.voiceEnabled, profile.languagePreference, setIsSpeaking],
  );

  const stop = useCallback(async () => {
    await stopSpeaking();
    setIsSpeaking(false);
  }, [setIsSpeaking]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    voiceEnabled: profile.voiceEnabled,
  };
}

/**
 * Hook for Audio Recording (Speech-to-Text).
 */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);

  const start = useCallback(async (): Promise<boolean> => {
    setRecordedUri(null);
    const success = await startRecordingAudio();
    setIsRecording(success);
    return success;
  }, []);

  const stop = useCallback(async (): Promise<string | null> => {
    if (!isRecording) return null;
    const uri = await stopRecordingAudio();
    setIsRecording(false);
    setRecordedUri(uri);
    return uri;
  }, [isRecording]);

  return {
    start,
    stop,
    isRecording,
    recordedUri,
  };
}
