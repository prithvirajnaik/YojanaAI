import React, { useState, useEffect } from 'react';
import { askAI } from '../api';

export default function SchemeModal({ scheme, onClose }) {
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    const [language, setLanguage] = useState("en");
    const [hindiData, setHindiData] = useState(null);
    const [translating, setTranslating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // STOP speech on close
    useEffect(() => {
        return () => window.speechSynthesis.cancel();
    }, []);

    async function translate(text) {
        if (!text) return "";
        try {
            const res = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`
            );
            const data = await res.json();
            return data[0].map(item => item[0]).join("");
        } catch {
            return text;
        }
    }

    async function switchToHindi() {
        window.speechSynthesis.cancel();
        setIsPlaying(false);

        if (hindiData) {
            setLanguage("hi");
            return;
        }

        setTranslating(true);

        const translated = {
            benefits: await translate(scheme.benefits),
            eligibility: await translate(scheme.raw_eligibility),
            documents: await translate(scheme.documents),
            application: await translate(scheme.application),
        };

        setHindiData(translated);
        setLanguage("hi");
        setTranslating(false);
    }

    function switchToEnglish() {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setLanguage("en");
    }

    function getDisplayData() {
        if (language === "en") {
            return {
                benefits: scheme.benefits,
                eligibility: scheme.raw_eligibility,
                documents: scheme.documents,
                application: scheme.application,
            };
        }
        return hindiData || {};
    }

    async function speakAll() {
        window.speechSynthesis.cancel();
        setIsPlaying(true);

        const display = getDisplayData();

        let text = `
${scheme.scheme_name}.
Benefits: ${display.benefits || ""}.
Eligibility: ${display.eligibility || ""}.
Documents needed: ${display.documents || ""}.
Application: ${display.application || ""}.
        `;

        let langCode = language === "hi" ? "hi-IN" : "en-IN";

        // create speech object
        const speakObj = () => {
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = langCode;
            utter.rate = 0.9;
            utter.onend = () => setIsPlaying(false);
            utter.onerror = () => setIsPlaying(false);

            const voices = speechSynthesis.getVoices();
            const voice = voices.find(v => v.lang === langCode);
            if (voice) utter.voice = voice;

            window.speechSynthesis.speak(utter);
        };

        // ensure voices exist
        if (!window.speechSynthesis.getVoices().length) {
            window.speechSynthesis.onvoiceschanged = speakObj;
        } else {
            speakObj();
        }
    }

    function stopSpeech() {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
    }

    const d = getDisplayData();

    async function ask() {
        if (!aiQuery.trim()) return;

        setAiLoading(true);
        try {
            const res = await askAI(aiQuery, scheme);
            setAiResponse(res.answer || "No response");
        } catch {
            setAiResponse("Error contacting AI");
        }
        setAiLoading(false);
    }
  const schemeLink = scheme.slug
    ? `https://myscheme.gov.in/schemes/${scheme.slug}`
    : null;
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
            <div className="bg-gray-900 text-gray-200 w-full max-w-3xl max-h-[85vh] rounded-xl shadow-xl overflow-y-auto border border-gray-700">

                {/* HEADER */}
                <div className="p-5 flex justify-between border-b border-gray-700">
                    <h2 className="text-lg font-semibold text-white">{scheme.scheme_name}</h2>
{schemeLink && (
              <a
                href={schemeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition text-sm"
                title="Open scheme page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </a>
            )}
                    <button onClick={() => { stopSpeech(); onClose(); }} className="text-gray-400 hover:text-white">
                        ✖
                    </button>
                </div>

                <div className="p-5 space-y-6">

                    {/* LANGUAGE BUTTONS */}
                    <div className="flex gap-2">
                        <button
                            onClick={switchToEnglish}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                language === "en" ? "bg-blue-600 text-white" : "bg-gray-700"
                            }`}
                        >
                            🇬🇧 English
                        </button>

                        <button
                            onClick={switchToHindi}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                language === "hi" ? "bg-orange-600 text-white" : "bg-gray-700"
                            }`}
                        >
                            🇮🇳 हिन्दी
                        </button>
                    </div>

                    {translating && (
                        <p className="text-yellow-300 text-sm">Translating… please wait</p>
                    )}

                    {/* AUDIO */}
                    <div>
                        {!isPlaying ? (
                            <button
                                onClick={speakAll}
                                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                🔊 Read Full Information
                            </button>
                        ) : (
                            <button
                                onClick={stopSpeech}
                                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Stop Audio ❌
                            </button>
                        )}
                    </div>

                    {/* BENEFITS */}
                    <div>
                        <h3 className="text-blue-400 font-semibold">Benefits</h3>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {d.benefits || "Not Provided"}
                        </p>
                    </div>

                    {/* ELIGIBILITY */}
                    <div>
                        <h3 className="text-blue-400 font-semibold">Eligibility</h3>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {d.eligibility || "Not Provided"}
                        </p>
                    </div>

                    {/* DOCUMENTS */}
                    <div>
                        <h3 className="text-blue-400 font-semibold">Documents Required</h3>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {d.documents || "Not Provided"}
                        </p>
                    </div>

                    {/* APPLICATION */}
                    <div>
                        <h3 className="text-blue-400 font-semibold">How to Apply</h3>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {d.application || "Not Provided"}
                        </p>
                    </div>

                    {/* AI CHAT */}
                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="text-purple-400 text-sm font-semibold mb-2">Ask AI about this scheme</h3>

                        {aiResponse && (
                            <p className="border border-purple-500 rounded-lg p-2 text-sm whitespace-pre-wrap">
                                {aiResponse}
                            </p>
                        )}

                        <div className="flex gap-2">
                            <input
                                value={aiQuery}
                                onChange={e => setAiQuery(e.target.value)}
                                placeholder="Ask about eligibility or documents..."
                                className="flex-1 bg-gray-800 px-3 py-2 rounded-lg border border-gray-600 text-sm"
                            />
                            <button
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
                                onClick={ask}
                                disabled={aiLoading}
                            >
                                {aiLoading ? "..." : "Ask"}
                            </button>
                            
                        </div>
                    </div>
                    {/* === DOWNLOAD PDF ALWAYS === */}
                    <div className="pt-4 border-t border-gray-700 flex flex-col gap-3">
                        <button
                            onClick={() => window.open(`http://localhost:3000/pdf/${scheme.slug}`, "_blank")}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition shadow-md hover:shadow-lg"
                        >
                            ⬇ Download Required Documents PDF
                        </button>

                        {scheme.url && (
                            <a
                                href={scheme.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition"
                            >
                                Visit Official Website
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M3 3h7a1 1 0 010 2H6.414l9.293 9.293a1 1 0 11-1.414 1.414L5 6.414V10a1 1 0 01-2 0V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                            </a>
                        )}
                    </div>

                </div>

            </div>
        </div>
        
    );
}
