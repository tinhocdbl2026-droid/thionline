// Web Speech API helper with Vietnamese language prioritization

let vietnameseVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function loadVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    voicesLoaded = true;
    // Look for Vietnamese voice first
    vietnameseVoice =
      voices.find(v => v.lang === 'vi-VN' || v.lang.toLowerCase().startsWith('vi')) ||
      voices.find(v => v.name.toLowerCase().includes('vietnam')) ||
      null;
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

export function speakStudentName(name: string, enabled = true): Promise<void> {
  return new Promise((resolve) => {
    if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending utterances

      const text = `Mời bạn ${name}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly slower, crisp and clear for classroom
      utterance.pitch = 1.05; // Friendly and welcoming tone
      utterance.lang = 'vi-VN';

      if (!voicesLoaded) {
        loadVoices();
      }

      if (vietnameseVoice) {
        utterance.voice = vietnameseVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      // Safety timeout in case speech engine hangs
      const timer = setTimeout(() => {
        resolve();
      }, 5000);

      utterance.addEventListener('end', () => clearTimeout(timer));
      utterance.addEventListener('error', () => clearTimeout(timer));

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      resolve();
    }
  });
}
