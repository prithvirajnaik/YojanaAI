import React, { useState, useRef, useEffect } from 'react';
import ChatInput from '../components/ChatInput';
import SchemeCard from '../components/SchemeCard';
import SchemeModal from '../components/SchemeModal';
import { parseText, recommendByText } from '../api';

export default function ChatPage() {
    const [messages, setMessages] = useState([
        { from: 'bot', text: 'Hi — I am YojanaAI. Tell me about yourself (age, state, income, role).' }
    ]);

    const [loading, setLoading] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState(null);
    const chatRef = useRef(null);

    useEffect(() => {
        const el = chatRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages, loading]);

    const addMessage = (msg) => {
        setMessages(prev => [...prev, msg]);
    };

    async function handleSend(text) {
        addMessage({ from: 'user', text });
        setLoading(true);

        try {
            // silently parse (just to help backend debug)
            await parseText(text);
const rec = await recommendByText(text);

// ----------- BAD INPUT -----------
if (rec.invalid) {
    addMessage({
        from: 'bot',
        text: rec.message || "Please add more information."
    });
    return;
}

// ----------- STRICT MATCH -----------
if (rec.strict && rec.items?.length > 0) {
    addMessage({
        from: 'bot',
        text: `Found ${rec.items.length} recommendation(s) for you:`,
        type: 'results',
        items: rec.items
    });
    return;
}

// ----------- SEMANTIC FALLBACK -----------
if (rec.fallback && rec.items?.length > 0) {
    addMessage({
        from: 'bot',
        text: `Couldn't find strict matches — showing closest suggestions:`,
        type: 'results',
        items: rec.items
    });
    return;
}

// ----------- NOTHING FOUND -----------
addMessage({
    from: 'bot',
    text:
        "Couldn't find relevant schemes.\n\n" +
        "Try responding like:\n" +
        "Age: 21\nGender: Female\nState: Karnataka\nIncome: 2 lakh yearly\n" +
        "or simply say:\n\"I'm a 19-year-old student from Delhi with 1.2 lakh income\""
});

        } catch (err) {
            console.error(err);
            addMessage({ from: 'bot', text: 'Something went wrong contacting server.' });

        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-900 text-gray-100 pt-16">

            {/* Chat window */}
            <div ref={chatRef} className="flex-1 overflow-auto p-4">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex flex-col ${m.from === 'user' ? 'items-end' : 'items-start'}`}>

                            <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${m.from === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-100'
                                }`}>
                                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                            </div>

                            {/* Render schemes */}
                            {m.type === 'results' && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    {m.items.map(s => (
                                        <SchemeCard
                                            key={s.slug}
                                            scheme={s}
                                            onSelect={setSelectedScheme}
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

            {/* Input */}
            <div className="p-4 border-t border-gray-800">
                <div className="max-w-3xl mx-auto">
                    <ChatInput onSend={handleSend} disabled={loading} />
                    <p className="text-center text-xs text-gray-500 mt-2">
                        YojanaAI may not always be accurate. Verify scheme eligibility before applying.
                    </p>
                </div>
            </div>

            {/* Modal popup */}
            {selectedScheme && (
                <SchemeModal
                    scheme={selectedScheme}
                    onClose={() => setSelectedScheme(null)}
                />
            )}
        </div>
    );
}
