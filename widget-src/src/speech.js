/**
 * Voice recognition manager — wraps the Web Speech API.
 */
export class SpeechManager {
  constructor() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = !!SR;
    this.recognition = this.supported ? new SR() : null;
    this.isRecording = false;

    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";
      this.recognition.maxAlternatives = 1;
    }
  }

  /**
   * Start listening with callbacks.
   * @param {object} handlers
   * @param {function} handlers.onStart  - Called when mic opens
   * @param {function} handlers.onResult - Called with (transcript, isFinal)
   * @param {function} handlers.onEnd    - Called when recognition ends
   * @param {function} handlers.onError  - Called with error type string
   */
  start({ onStart, onResult, onEnd, onError }) {
    if (!this.recognition || this.isRecording) return;

    this.recognition.onstart = () => {
      this.isRecording = true;
      onStart?.();
    };

    this.recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      const isFinal = e.results[0].isFinal;
      onResult?.(transcript, isFinal);
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      onEnd?.();
    };

    this.recognition.onerror = (e) => {
      this.isRecording = false;
      onError?.(e.error);
    };

    try {
      this.recognition.start();
    } catch (e) {
      this.isRecording = false;
      onError?.(e.name || "start-failed");
    }
  }

  stop() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
  }
}
