import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface UseTTSOptions {
  voice?: string;
  emotionLevel?: number;
  rate?: number;
  pitch?: number;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  onError?: (error: Error) => void;
}

interface UseTTSReturn {
  speak: (text: string) => Promise<void>;
  isSpeaking: boolean;
  stop: () => void;
  audioSrc: string | null;
}

/**
 * Custom hook to use text-to-speech functionality
 * Uses browser's SpeechSynthesis API with optional server enhancement
 * 
 * @param options - Configuration options for TTS
 * @returns - Functions and state for TTS control
 */
export function useTTS({
  voice = 'default',
  emotionLevel = 0.7,
  rate = 1.0,
  pitch = 1.0,
  onAudioStart,
  onAudioEnd,
  onError
}: UseTTSOptions = {}): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [lastSpeakTime, setLastSpeakTime] = useState(0);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Minimum time between speak calls in milliseconds
  const DEBOUNCE_TIME = 500;
  
  // Load available voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // Get available voices
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
        }
      }
    };
    
    // Chrome loads voices asynchronously
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Initial load attempt
      loadVoices();
    }
    
    return () => {
      // Clean up
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  /**
   * Use browser's built-in speech synthesis with improved safeguards
   * to prevent auto-repeating issues
   */
  const speakWithBrowser = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // IMPORTANT: Cancel any existing speech first
    // This is essential to prevent multiple utterances from stacking up
    window.speechSynthesis.cancel();
    
    // Generate a unique tracking ID for this specific utterance
    const utteranceId = Date.now().toString().slice(-5);
    console.log(`[SPEECH-${utteranceId}] Starting new speech utterance`);
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Use the best available voice
    const bestVoice = voices.length > 0 ? voices[0] : null;
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    
    // Set speech parameters
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    // Set up event handlers with better logging
    utterance.onstart = () => {
      console.log(`[SPEECH-${utteranceId}] Speech started`);
      setIsSpeaking(true);
      onAudioStart?.();
    };
    
    utterance.onend = () => {
      console.log(`[SPEECH-${utteranceId}] Speech ended normally`);
      setIsSpeaking(false);
      onAudioEnd?.();
    };
    
    utterance.onerror = (event) => {
      console.error(`[SPEECH-${utteranceId}] SpeechSynthesis error:`, event);
      setIsSpeaking(false);
      onError?.(new Error(`Speech synthesis failed: ${event.error || 'Unknown error'}`));
    };
    
    // Start speaking - only after we've set up all handlers
    window.speechSynthesis.speak(utterance);
  }, [voices, rate, pitch, onAudioStart, onAudioEnd, onError]);
  
  /**
   * Stop current audio playback
   */
  const stop = useCallback(() => {
    // Stop any browser speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
  }, []);
  
  /**
   * Final version: A completely redesigned speak function that guarantees
   * speech is only initiated by explicit calls and never auto-repeats
   * 
   * - Added unique utterance ID for tracking
   * - Improved debouncing using timestamps
   * - Added more console logs for debugging
   */
  const speak = async (text: string): Promise<void> => {
    if (!text.trim()) return;
    
    // Implement strict debouncing by time and speaking state
    const now = Date.now();
    
    // Never interrupt ongoing speech
    if (isSpeaking) {
      console.log("IMPORTANT: Already speaking, ignoring new speech request");
      return;
    }
    
    // Strict minimum 1-second gap between speech requests
    // This prevents potential race conditions
    if (now - lastSpeakTime < 1000) {
      console.log("IMPORTANT: Ignoring speak request - too soon after last request");
      return;
    }
    
    // Mark this as the most recent speak time
    setLastSpeakTime(now);
    
    try {
      // Stop any current playback
      stop();
      
      // Check if browser supports speech synthesis
      const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
      if (!hasSpeechSynthesis) {
        throw new Error('Speech synthesis not supported in this browser');
      }
      
      // Generate a unique ID for logging/tracking this speech request
      const speechId = Math.floor(Math.random() * 10000);
      console.log(`[${speechId}] Processing speech request: "${text.substring(0, 30)}..."`);
      
      // Try server-enhanced TTS first (with more error handling)
      try {
        console.log(`[${speechId}] Requesting enhanced text from server`);
        const response = await axios.post('/api/tts/generate', {
          text,
          voice,
          emotionLevel
        });
        
        // Verify we got a valid response
        if (response.data && response.data.text) {
          const enhancedText = response.data.text;
          console.log(`[${speechId}] Using server-enhanced text`);
          speakWithBrowser(enhancedText);
        } else {
          console.warn(`[${speechId}] Server returned invalid response, using original text`);
          speakWithBrowser(text);
        }
      } catch (serverError) {
        console.warn(`[${speechId}] Server TTS failed, using browser fallback`, serverError);
        // Fall back to browser-only TTS with original text
        speakWithBrowser(text);
      }
    } catch (error: any) {
      console.error('TTS error:', error);
      onError?.(error);
      
      toast({
        title: 'Text-to-Speech Error',
        description: error.message || 'Failed to generate speech',
        variant: 'destructive'
      });
    }
  };

  return {
    speak,
    isSpeaking,
    stop,
    audioSrc
  };
}