// Web Speech API Service with Browser Capability Detection & Multi-Language Support

export function isWebSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function getSpeechRecognitionLang(langCode: string = 'en'): string {
  const map: Record<string, string> = {
    'en': 'en-IN',
    'hi': 'hi-IN',
    'hi-en': 'hi-IN',
    'bn': 'bn-IN',
    'mr': 'mr-IN',
    'te': 'te-IN',
    'ta': 'ta-IN',
    'gu': 'gu-IN',
    'ur': 'ur-IN',
    'kn': 'kn-IN',
    'or': 'or-IN',
    'ml': 'ml-IN',
    'pa': 'pa-IN',
    'as': 'as-IN',
  };
  return map[langCode] || 'en-IN';
}

export function startWebSpeechRecognition(
  onResult: (text: string) => void,
  onError: (errorMsg: string) => void,
  langCode: string = 'en'
): any {
  if (!isWebSpeechSupported()) {
    onError('Voice search is not supported in this browser. Please type your search query.');
    return null;
  }

  try {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = getSpeechRecognitionLang(langCode);

    recognition.onresult = (event: any) => {
      if (event.results && event.results.length > 0) {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onResult(transcript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      const errType = event.error;
      if (errType === 'not-allowed' || errType === 'permission-denied') {
        onError('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else if (errType === 'no-speech') {
        onError('No speech detected. Please try speaking again.');
      } else if (errType === 'audio-capture') {
        onError('No microphone found on your device.');
      } else {
        onError(`Speech recognition error: ${errType}`);
      }
    };

    recognition.start();
    return recognition;
  } catch (err: any) {
    onError(`Failed to start voice search: ${err.message || err}`);
    return null;
  }
}

