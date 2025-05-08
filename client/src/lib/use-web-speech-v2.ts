import { useState, useEffect, useCallback, useRef } from 'react';

// Define types for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
  interpretation: any;
  emma: Document | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

// Add these to the global Window interface
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseSpeechRecognitionProps {
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
  continuous?: boolean;
  language?: string;
  autoRestart?: boolean;
  timeout?: number;
}

interface UseSpeechSynthesisProps {
  onEnd?: () => void;
  voice?: SpeechSynthesisVoice;
  pitch?: number;
  rate?: number;
}

/**
 * Completely redesigned and more robust speech recognition hook
 * with persistent recognition and better error handling
 */
export function useSpeechRecognition({
  onResult = () => {},
  onEnd = () => {},
  continuous = true,
  language = 'en-US',
  autoRestart = true,
  timeout = 30000, // 30 seconds of silence before auto-stopping
}: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  // Use refs to maintain state across re-renders
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastResultTimestampRef = useRef<number>(0);
  const isUserInitiatedStopRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const finalTranscriptRef = useRef<string>('');
  const transcriptHistoryRef = useRef<string[]>([]);
  const attemptCountRef = useRef<number>(0);
  
  // Clear any active timeouts
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);
  
  // Set up a timeout to check for silence
  const setupSilenceDetection = useCallback(() => {
    clearTimeouts();
    
    if (!autoRestart || !isListening) return;
    
    timeoutRef.current = setTimeout(() => {
      console.log(`Speech recognition silent for ${timeout/1000} seconds, force restarting...`);
      
      if (recognitionRef.current && isListening && isMountedRef.current) {
        try {
          // Force stop
          recognitionRef.current.abort();
          
          // Schedule a restart
          restartTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && !isUserInitiatedStopRef.current) {
              console.log("Auto-restarting after silence...");
              attemptCountRef.current += 1;
              
              // If we've tried too many times, report an error but keep trying
              if (attemptCountRef.current > 3) {
                console.warn("Multiple restart attempts needed. Speech recognition may be unstable.");
              }
              
              // Create a new recognition instance to avoid any lingering issues
              createAndStartRecognition();
            }
          }, 500);
        } catch (err) {
          console.error("Error during silence handling:", err);
        }
      }
    }, timeout);
  }, [autoRestart, isListening, timeout]);
  
  // Create a new recognition instance and start it
  const createAndStartRecognition = useCallback(() => {
    if (typeof window === 'undefined' || !isMountedRef.current) return;
    
    // Clean up existing instance if any
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
    
    // Create a fresh instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = continuous;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.maxAlternatives = 1;
    recognitionRef.current.lang = language;
    
    // Configure event handlers
    recognitionRef.current.onresult = (event) => {
      if (!isMountedRef.current) return;
      
      // Reset attempt counter since we're getting results
      attemptCountRef.current = 0;
      
      // Process results
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          // Add to our final transcript history
          finalTranscript += ' ' + transcript;
          transcriptHistoryRef.current.push(transcript);
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update refs and state
      finalTranscriptRef.current = finalTranscript.trim();
      const fullTranscript = (finalTranscript + ' ' + interimTranscript).trim();
      
      if (fullTranscript !== transcript) {
        setTranscript(fullTranscript);
        onResult(fullTranscript);
      }
      
      // Update last activity timestamp and reset timeout
      lastResultTimestampRef.current = Date.now();
      setupSilenceDetection();
      
      console.log("Recognition result received:", { 
        finalTranscript: finalTranscriptRef.current,
        interimTranscript,
        fullTranscript
      });
    };
    
    recognitionRef.current.onerror = (event) => {
      if (!isMountedRef.current) return;
      
      if (event.error === 'no-speech') {
        // This is a common error when there's silence, don't treat as an error
        console.log("No speech detected, resetting silence detection");
        setupSilenceDetection();
        return;
      }
      
      if (event.error === 'aborted' && !isUserInitiatedStopRef.current) {
        console.log("Recognition aborted but not by user, will auto-restart");
        return; // The onend handler will take care of restarting
      }
      
      console.error(`Speech recognition error: ${event.error}`, event);
      setError(`Speech recognition error: ${event.error}`);
      
      // For network errors, we should try to restart
      if (['network', 'service-not-allowed'].includes(event.error) && autoRestart) {
        restartTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && !isUserInitiatedStopRef.current) {
            console.log(`Attempting to recover from ${event.error} error...`);
            createAndStartRecognition();
          }
        }, 1000);
      }
    };
    
    recognitionRef.current.onend = () => {
      if (!isMountedRef.current) return;
      
      console.log("Speech recognition ended", { 
        isUserInitiated: isUserInitiatedStopRef.current,
        autoRestart,
        transcriptLength: transcript.length
      });
      
      // Update UI state
      setIsListening(false);
      
      // If not user-initiated and auto-restart is enabled, restart
      if (autoRestart && !isUserInitiatedStopRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            console.log("Auto-restarting speech recognition after end event");
            createAndStartRecognition();
            setIsListening(true);
          }
        }, 300);
      } else {
        // Only call onEnd if this was a true, user-requested end
        onEnd();
        clearTimeouts();
      }
      
      // Reset the user-initiated flag
      isUserInitiatedStopRef.current = false;
    };
    
    // Start recognition
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setupSilenceDetection();
      console.log("Speech recognition started", { 
        continuous, 
        language,
        autoRestart
      });
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Failed to start speech recognition. Please try again.");
      setIsListening(false);
    }
  }, [continuous, language, onEnd, onResult, autoRestart, setupSilenceDetection, transcript, clearTimeouts]);
  
  // Initialize on mount and clean up on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    // Check browser support
    if (typeof window === 'undefined') {
      setIsSupported(false);
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    
    return () => {
      isMountedRef.current = false;
      
      // Clean up
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      
      clearTimeouts();
    };
  }, [clearTimeouts]);
  
  // Public start method
  const start = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    
    // Reset state for a new session
    setError(null);
    isUserInitiatedStopRef.current = false;
    lastResultTimestampRef.current = Date.now();
    
    // Keep existing transcript if any
    if (transcript.length === 0) {
      finalTranscriptRef.current = '';
      transcriptHistoryRef.current = [];
    }
    
    createAndStartRecognition();
    console.log("Manual start of speech recognition initiated");
  }, [isSupported, createAndStartRecognition, transcript.length]);
  
  // Public stop method
  const stop = useCallback(() => {
    isUserInitiatedStopRef.current = true;
    clearTimeouts();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // If stop fails, try to abort
        try {
          recognitionRef.current.abort();
        } catch (abortErr) {
          console.error("Error stopping speech recognition:", abortErr);
        }
      }
    }
    
    setIsListening(false);
    console.log("Manual stop of speech recognition initiated");
  }, [clearTimeouts]);
  
  return {
    transcript,
    isListening,
    error,
    isSupported,
    start,
    stop,
    setTranscript
  };
}

export function useSpeechSynthesis({
  onEnd = () => {},
  voice,
  pitch = 1,
  rate = 1
}: UseSpeechSynthesisProps = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }
    
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    
    // Chrome requires a 'voiceschanged' event listener
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    updateVoices();
    
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, []);
  
  const speak = useCallback((text: string) => {
    if (!isSupported) {
      setError('Speech synthesis is not supported in this browser.');
      return;
    }
    
    // Cancel any previous speech
    window.speechSynthesis.cancel();
    
    setError(null);
    setIsSpeaking(true);
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (voice) {
      utterance.voice = voice;
    } else {
      // Select a natural sounding English voice if available
      const englishVoices = voices.filter(v => v.lang.startsWith('en-'));
      if (englishVoices.length > 0) {
        utterance.voice = englishVoices[0];
      }
    }
    
    utterance.pitch = pitch;
    utterance.rate = rate;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd();
    };
    
    utterance.onerror = (event) => {
      setError(`Speech synthesis error: ${event.error}`);
      setIsSpeaking(false);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [isSupported, voice, voices, pitch, rate, onEnd]);
  
  const cancel = useCallback(() => {
    if (!isSupported) return;
    
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);
  
  return {
    voices,
    speak,
    cancel,
    isSpeaking,
    error,
    isSupported
  };
}