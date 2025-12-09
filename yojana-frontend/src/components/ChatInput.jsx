import React, { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLang, setSelectedLang] = useState('hi-IN'); // Default: Hindi
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Language options
  const languages = [
    { code: 'hi-IN', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'en-IN', label: 'English', flag: '🇬🇧' }
  ];

  async function translateHindiToEnglish(text) {
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=hi&tl=en&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      const translated = data?.[0]?.[0]?.[0] || text;
      return translated;
    } catch {
      return text;
    }
  }

  function startVoiceInput() {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert("Speech Recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = selectedLang;
    recognition.interimResults = true; // Show live transcript
    recognition.continuous = false;

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      // Show live transcript
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onend = async () => {
      setIsRecording(false);

      if (!finalTranscript.trim()) {
        setTranscript('');
        return;
      }

      // Detect if Hindi → translate to English for backend
      const hasHindiWord = /[ऀ-ॿ]/.test(finalTranscript);
      const finalText = hasHindiWord
        ? await translateHindiToEnglish(finalTranscript)
        : finalTranscript;

      onSend(finalText.trim());
      setText("");
      setTranscript('');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setTranscript('');

      if (event.error === 'no-speech') {
        alert('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access.');
      }
    };

    setIsRecording(true);
    setTranscript('');
    recognition.start();
  }

  function stopVoiceInput() {
    try {
      recognitionRef.current?.stop();
    } catch { }
    setIsRecording(false);
    setTranscript('');
  }

  function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <div className="w-full">
      {/* Language Selector (only visible when recording) */}
      {!isRecording && (
        <div className="flex justify-center gap-2 mb-3">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedLang === lang.code
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                }`}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      )}

      {/* Live Transcript Display */}
      {isRecording && transcript && (
        <div className="mb-3 p-4 bg-blue-900/20 border border-blue-700/50 rounded-xl">
          <div className="flex items-start gap-2">
            <div className="relative flex h-3 w-3 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-blue-400 mb-1 font-medium">Listening...</p>
              <p className="text-gray-200 text-sm leading-relaxed">{transcript}</p>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 shadow-lg">

        {/* Text Input */}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isRecording ? "Listening..." : "Type or speak your query..."}
          disabled={disabled || isRecording}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-500"
        />

        {/* Microphone Button */}
        {!isRecording ? (
          <button
            onClick={startVoiceInput}
            disabled={disabled}
            className="group relative p-3 text-gray-400 hover:text-blue-400 transition-all hover:bg-blue-900/20 rounded-xl"
            title={`Speak in ${languages.find(l => l.code === selectedLang)?.label}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>

            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-xs text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {languages.find(l => l.code === selectedLang)?.flag} {languages.find(l => l.code === selectedLang)?.label}
            </span>
          </button>
        ) : (
          <button
            onClick={stopVoiceInput}
            disabled={disabled}
            className="p-3 text-red-400 hover:text-red-300 transition-all bg-red-900/20 rounded-xl animate-pulse"
            title="Stop Recording"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled || isRecording}
          className={`px-5 py-2.5 rounded-xl font-medium transition-all ${text.trim() && !isRecording
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {/* Status Indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="flex gap-1">
            <div className="w-1 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-1 h-6 bg-blue-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-1 h-5 bg-blue-500 rounded-full animate-pulse delay-150"></div>
            <div className="w-1 h-7 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-xs text-blue-400 font-medium">
            Recording in {languages.find(l => l.code === selectedLang)?.label}
          </p>
        </div>
      )}
    </div>
  );
}
