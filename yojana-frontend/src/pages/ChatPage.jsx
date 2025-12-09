import React, { useState, useRef } from 'react';
import ChatInput from '../components/ChatInput';
import SchemeModal from '../components/SchemeModal';
import { parseText, recommendByText } from '../api';

export default function ChatPage() {
    const [messages, setMessages] = useState([
        { from: 'bot', text: 'Hi — I am YojanaAI. Tell me about yourself (age, state, income, role).' }
    ]);

    const [loading, setLoading] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState(null);
    const chatRef = useRef(null);

    React.useEffect(() => {
        const el = chatRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, loading]);

    const addMessage = msg => setMessages(prev => [...prev, msg]);

    async function handleSend(text) {
        addMessage({ from: 'user', text });
        setLoading(true);

        try {
            await parseText(text);
            const rec = await recommendByText(text);

            if (rec.invalid) {
                addMessage({ from: 'bot', text: rec.message });
                return;
            }

            if ((rec.strict || rec.fallback) && rec.items?.length > 0) {
                addMessage({
                    from: 'bot',
                    text: `Here are ${rec.items.length} matching schemes for you:`,
                    type: 'results',
                    items: rec.items
                });
                return;
            }

            addMessage({
                from: 'bot',
                text:
                    "Couldn't match. Try:\n" +
                    "\"I am a 19 year old girl from Karnataka earning 2 lakh yearly\""
            });

        } catch (err) {
            console.error(err);
            addMessage({ from: 'bot', text: 'Something went wrong.' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-900 text-gray-100 pt-16">

            <div ref={chatRef} className="flex-1 overflow-auto p-4">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex flex-col ${m.from === 'user' ? 'items-end' : 'items-start'}`}>

                            <div className={`max-w-[85%] rounded-2xl px-5 py-3
                                ${m.from === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100'}`}>
                                <p className="whitespace-pre-wrap leading-relaxed">
                                    {m.text}
                                </p>
                            </div>

                            {m.type === 'results' && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    {m.items.map(s => (
                                        <SchemeCardWithAudio
                                            key={s.slug}
                                            scheme={s}
                                            onViewDetails={() => setSelectedScheme(s)}
                                        />
                                    ))}
                                </div>
                            )}

                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-2 text-gray-400">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-gray-800">
                <div className="max-w-3xl mx-auto">
                    <ChatInput onSend={handleSend} disabled={loading} />
                    <p className="text-center text-xs text-gray-500 mt-2">
                        YojanaAI may not always be accurate. Verify eligibility before applying.
                    </p>
                </div>
            </div>

            {selectedScheme && (
                <SchemeModal scheme={selectedScheme} onClose={() => {
                    window.speechSynthesis.cancel();
                    setSelectedScheme(null);
                }} />
            )}

        </div>
    );
}

// Scheme Card with Simple Bilingual Support (No Gemini)
function SchemeCardWithAudio({ scheme, onViewDetails }) {
    const [language, setLanguage] = useState('en');
    const [hindiSummary, setHindiSummary] = useState(null);
    const [translating, setTranslating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Generate English summary from scheme data
    function getEnglishSummary() {
        return `${scheme.scheme_name}. This scheme is for ${scheme.target_groups?.join(', ') || 'general public'}. Income limit: ${scheme.income_limit || 'not specified'}. Category: ${scheme.schemeCategory || 'government scheme'}. Provided by ${scheme.ministry || 'Government of India'}.`;
    }

    // Translate to Hindi using Google Translate
    async function translateToHindi(text) {
        try {
            const res = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`
            );
            const data = await res.json();
            return data[0].map(item => item[0]).join('');
        } catch (error) {
            console.error('Translation error:', error);
            return null;
        }
    }

    // Load Hindi translation when switching to Hindi
    React.useEffect(() => {
        if (language === 'hi' && !hindiSummary && !translating) {
            setTranslating(true);
            translateToHindi(getEnglishSummary())
                .then(translated => {
                    setHindiSummary(translated || getEnglishSummary());
                })
                .catch(err => {
                    console.error('Translation failed:', err);
                    setHindiSummary(getEnglishSummary());
                })
                .finally(() => {
                    setTranslating(false);
                });
        }
    }, [language]);

    async function speak() {
        window.speechSynthesis.cancel();

        let text;

        // If Hindi is selected but not yet translated, translate first
        if (language === 'hi' && !hindiSummary) {
            setTranslating(true);
            const translated = await translateToHindi(getEnglishSummary());
            text = translated || getEnglishSummary();
            setHindiSummary(text);
            setTranslating(false);
        } else {
            text = language === 'en' ? getEnglishSummary() : (hindiSummary || getEnglishSummary());
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'en' ? 'en-IN' : 'hi-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = (e) => {
            console.error('Speech error:', e);
            setIsPlaying(false);
        };

        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                const voice = availableVoices.find(v => v.lang === utterance.lang);
                if (voice) utterance.voice = voice;
                window.speechSynthesis.speak(utterance);
            };
        } else {
            const voice = voices.find(v => v.lang === utterance.lang);
            if (voice) utterance.voice = voice;
            window.speechSynthesis.speak(utterance);
        }
    }

    function stopSpeech() {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
    }

    const currentSummary = language === 'en' ? getEnglishSummary() : hindiSummary;

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col shadow-md hover:shadow-xl transition-all hover:border-gray-600">

            {/* Language Toggle */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => {
                        stopSpeech();
                        setLanguage('en');
                    }}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${language === 'en'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                >
                    🇬🇧 English
                </button>
                <button
                    onClick={() => {
                        stopSpeech();
                        setLanguage('hi');
                    }}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${language === 'hi'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                >
                    🇮🇳 हिंदी
                </button>
            </div>

            {/* Scheme Title */}
            <h3 className="font-bold text-lg text-blue-300 mb-3 leading-tight">{scheme.scheme_name}</h3>

            {/* Summary */}
            <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700 min-h-[100px]">
                {translating ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                        <span>Translating to Hindi...</span>
                    </div>
                ) : (
                    <p className="text-gray-300 text-sm leading-relaxed">
                        {currentSummary || getEnglishSummary()}
                    </p>
                )}
            </div>

            {/* Audio Player Section */}
            {isPlaying && (
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse"></div>
                            <div className="w-1 h-6 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                            <div className="w-1 h-5 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                            <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse"></div>
                        </div>
                        <span className="text-sm text-blue-300 font-medium">
                            Playing in {language === 'en' ? 'English' : 'हिंदी'}
                        </span>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-auto">

                {/* Audio Control */}
                <div className="flex gap-2">
                    {!isPlaying ? (
                        <button
                            onClick={speak}
                            disabled={translating}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg font-medium transition-all ${language === 'en'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                            </svg>
                            Play in {language === 'en' ? 'English' : 'हिंदी'}
                        </button>
                    ) : (
                        <button
                            onClick={stopSpeech}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                            Stop
                        </button>
                    )}
                </div>

                {/* View Details Button */}
                <button
                    onClick={onViewDetails}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                >
                    View Full Details
                </button>
            </div>
        </div>
    );
}
