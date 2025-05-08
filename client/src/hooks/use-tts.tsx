import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import axios from 'axios';

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
  
  // Function to process pending text
  const processPendingText = useCallback((text: string) => {
    // This callback avoids the circular dependency with the useEffect
    const now = Date.now();
    setLastSpeakTime(now);
    setPendingText(null);
    
    try {
      // Stop any current playback first
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      // Check if browser supports speech synthesis
      const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
      if (!hasSpeechSynthesis) {
        throw new Error('Speech synthesis not supported in this browser');
      }
      
      // Use browser's speech synthesis directly
      speakWithBrowser(text);
    } catch (error: any) {
      console.error('TTS error:', error);
      onError?.(error);
      
      toast({
        title: 'Text-to-Speech Error',
        description: error.message || 'Failed to generate speech',
        variant: 'destructive'
      });
    }
  }, [onError, toast]);
  
  // Handle pending speech when not speaking anymore
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // When speech finishes and we have pending text, process it
    if (!isSpeaking && pendingText) {
      timeoutId = setTimeout(() => {
        console.log("Processing pending TTS request");
        processPendingText(pendingText);
      }, DEBOUNCE_TIME);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isSpeaking, pendingText, processPendingText]);
  
  // Select the best voice based on quality and language
  const getBestVoice = useCallback(() => {
    if (voices.length === 0) return null;
    
    // Prefer higher quality voices in this order:
    // 1. English premium/enhanced voices
    // 2. Any English voice
    // 3. Any available voice
    
    // Look for premium English voices first
    const premiumVoices = voices.filter(
      v => v.lang.startsWith('en-') && 
      (v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Neural'))
    );
    
    if (premiumVoices.length > 0) return premiumVoices[0];
    
    // Any English voice
    const englishVoices = voices.filter(v => v.lang.startsWith('en-'));
    if (englishVoices.length > 0) return englishVoices[0];
    
    // Fall back to the first available voice
    return voices[0];
  }, [voices]);
  
  // These states are already declared at the top of the component
  
  /**
   * Generate and play TTS audio for the given text with debounce protection
   */
  const speak = async (text: string): Promise<void> => {
    if (!text.trim()) return;
    
    // Debounce mechanism to prevent rapid sequential calls
    const now = Date.now();
    
    if (isSpeaking) {
      // If already speaking, don't interrupt
      console.log("Already speaking, ignoring new speech request");
      return;
    }
    
    if (now - lastSpeakTime < DEBOUNCE_TIME) {
      // Too soon since last call, schedule for later
      console.log("Debouncing TTS request");
      setPendingText(text);
      return;
    }
    
    // Update last speak time
    setLastSpeakTime(now);
    setPendingText(null);
    
    try {
      // Stop any current playback
      stop();
      
      // Check if browser supports speech synthesis
      const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
      if (!hasSpeechSynthesis) {
        throw new Error('Speech synthesis not supported in this browser');
      }
      
      // Try server-enhanced TTS first
      try {
        const response = await axios.post('/api/tts/generate', {
          text,
          voice,
          emotionLevel
        });
        
        // Get enhanced text from server
        const enhancedText = response.data.text || text;
        speakWithBrowser(enhancedText);
      } catch (serverError) {
        console.error('Server TTS failed, using browser fallback');
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
  
  /**
   * Use browser's built-in speech synthesis
   */
  const speakWithBrowser = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Use the best available voice
    const bestVoice = getBestVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    
    // Set speech parameters
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    // Set up event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      onAudioStart?.();
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      onAudioEnd?.();
    };
    
    utterance.onerror = (event) => {
      console.error('SpeechSynthesis error:', event);
      setIsSpeaking(false);
      onError?.(new Error('Speech synthesis failed'));
    };
    
    // Start speaking
    window.speechSynthesis.speak(utterance);
  };

  /**
   * Stop current audio playback
   */
  const stop = () => {
    // Stop any browser speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
  };

  return {
    speak,
    isSpeaking,
    stop,
    audioSrc
  };
}