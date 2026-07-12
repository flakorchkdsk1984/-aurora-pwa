// Text-to-speech helper in Spanish, customized for children with special needs
let currentSpeech = null;

export function speak(text, rate = 0.85, pitch = 1.1) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Cancel any running speech to avoid overlapping audio
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set voice to a Spanish voice if available
  const voices = window.speechSynthesis.getVoices();
  const spanishVoice = voices.find(
    (voice) => voice.lang.startsWith('es') || voice.lang.includes('Spanish')
  );
  
  if (spanishVoice) {
    utterance.voice = spanishVoice;
  }
  
  // Custom settings for friendly and understandable voice
  utterance.lang = 'es-ES';
  utterance.rate = rate; // Slower rate for cognitive comprehension
  utterance.pitch = pitch; // Slightly higher pitch to make it sound child-friendly and energetic

  window.speechSynthesis.speak(utterance);
  currentSpeech = utterance;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Warm-up voice engine (some browsers need list initialization)
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}
