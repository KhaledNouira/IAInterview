import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionProps {
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
  continuous?: boolean;
  language?: string;
}

interface UseSpeechSynthesisProps {
  onEnd?: () => void;
  voice?: SpeechSynthesisVoice;
  pitch?: number;
  rate?: number;
}

export function useSpeechRecognition({
  onResult = () => {},
  onEnd = () => {},
  continuous = false,
  language = 'en-US'
}: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsSupported(false);
      return;
    }
    
    // Check if SpeechRecognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = continuous;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language;
    
    recognitionRef.current.onresult = (event) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const text = result[0].transcript;
      
      setTranscript(text);
      onResult(text);
    };
    
    recognitionRef.current.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      stop();
    };
    
    recognitionRef.current.onend = () => {
      setIsListening(false);
      onEnd();
    };
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        stop();
      }
    };
  }, [continuous, language, onEnd, onResult]);
  
  const start = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      return;
    }
    
    setError(null);
    setIsListening(true);
    recognitionRef.current.start();
  }, [isSupported]);
  
  const stop = useCallback(() => {
    if (!recognitionRef.current || !isListening) {
      return;
    }
    
    recognitionRef.current.stop();
    setIsListening(false);
  }, [isListening]);
  
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
