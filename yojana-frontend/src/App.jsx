import React, { useState, useRef, useEffect } from 'react';
import ChatInput from './components/ChatInput';
import MessageBubble from './components/MessageBubble';
import SchemeCard from './components/SchemeCard';
import SchemeModal from './components/SchemeModal';
import { parseText, recommendByText } from './api';

export default function App() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi — I am YojanaAI. Tell me about yourself (age, state, income, role).' }
  ]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);

  const chatRef = useRef(null);

  // auto-scroll chat to bottom when messages change
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  function addMessage(msg) {
    setMessages(m => [...m, msg]);
  }

  async function handleSend(text) {
    addMessage({ from: 'user', text });
    setLoading(true);

    try {
      // internal parse (not shown)
      await parseText(text);

      const rec = await recommendByText(text);

      if (rec && rec.items && rec.items.length > 0) {
        setResults(rec.items);
        addMessage({ from: 'bot', text: `Found ${rec.items.length} recommendation(s).` });
      } else if (rec && rec.fallback && rec.items?.length > 0) {
        setResults(rec.items);
        addMessage({ from: 'bot', text: `Couldn't find strict matches; showing close suggestions.` });
      } else {
        setResults([]);
        addMessage({ from: 'bot', text: 'Sorry — I could not find relevant schemes. Try keywords like "education", "housing".' });
      }

    } catch (e) {
      console.error(e);
      addMessage({ from: 'bot', text: 'Error contacting backend. Make sure the server is running.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">YojanaAI — Govt Scheme Assistant</h1>
          <p className="text-sm text-slate-500 mt-1">Chat & get personalized scheme recommendations</p>
        </div>

        {/* Main Layout */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Chat Column */}
          <div className="lg:col-span-2">
            <div ref={chatRef} className="h-96 overflow-auto p-4 bg-slate-50 rounded space-y-3">
              {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}

              {loading && (
                <div className="flex justify-center my-2">
                  <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent animate-spin rounded-full"></div>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 border-t bg-white">
              <ChatInput onSend={handleSend} disabled={loading} />
            </div>
          </div>

          {/* Recommendations Column */}
          <div className="lg:col-span-1">
            <div className="p-4 bg-white rounded h-96 overflow-auto flex flex-col">
              <h3 className="font-semibold mb-3">Recommendations</h3>

              {loading && results.length === 0 && (
                <div className="text-center text-xs text-slate-400 mb-3">Fetching best schemes...</div>
              )}

              <div className="space-y-3 flex-1">
                {results.length === 0 ? (
                  <div className="text-sm text-slate-500">No recommendations yet. Ask something like "24 year old female from Karnataka income 3 lakh student".</div>
                ) : results.map(s => (
                  <SchemeCard 
                    key={s.slug}
                    scheme={s}
                    onSelect={setSelectedScheme}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 text-right text-xs text-slate-500">
          Backend: <span className="font-mono">http://localhost:3000</span>
        </div>
      </div>

      {/* Modal */}
      {selectedScheme && (
        <SchemeModal scheme={selectedScheme} onClose={() => setSelectedScheme(null)} />
      )}
    </div>
  );
}
