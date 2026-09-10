// Web Speech API Service with Browser Capability Detection

export function isWebSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function startWebSpeechRecognition(
  onResult: (text: String) => void,
  onError: (errorMsg: String) => void,
  lang: string = 'en-IN'
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
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      if (event.results && event.results.length > 0) {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      onError(`Speech recognition error: ${event.error}`);
    };

    recognition.start();
    return recognition;
  } catch (err: any) {
    onError(`Failed to start voice search: ${err.message || err}`);
    return null;
  }
}
