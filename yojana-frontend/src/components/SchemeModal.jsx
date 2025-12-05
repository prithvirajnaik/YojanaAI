import React, { useState } from 'react';
import { askAI } from '../api';

export default function SchemeModal({ scheme, onClose }) {
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  if (!scheme) return null;

  async function handleAskAI() {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await askAI(aiQuery, scheme);
      setAiResponse(res.answer || "Sorry, I couldn't get an answer.");
    } catch (e) {
      setAiResponse("Error connecting to AI.");
    }
    setAiLoading(false);
    setAiQuery('');
  }

  function handleQuickAsk(q) {
    setAiQuery(q);
    // slight delay to allow state update if we wanted to auto-submit, 
    // but here we just fill it. 
    // Actually let's auto-submit for better UX
    setAiLoading(true);
    askAI(q, scheme).then(res => {
      setAiResponse(res.answer);
      setAiLoading(false);
      setAiQuery('');
    });
  }

  const schemeLink = scheme.slug
    ? `https://myscheme.gov.in/schemes/${scheme.slug}`
    : null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      {/* Outer container */}
      <div className="bg-gray-800 border border-gray-700 max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center gap-4">

          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-100 leading-tight">
              {scheme.scheme_name}
            </h2>

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
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

        </div>

        {/* Scrollable content */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-300">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</h3>
              <p className="text-sm font-medium text-gray-200">{scheme.schemeCategory || "Not specified"}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Level</h3>
              <p className="text-sm font-medium text-gray-200">{scheme.level || "Not specified"}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-blue-400 mb-2">Benefits</h3>
            <p className="text-sm leading-relaxed">{scheme.benefits || "Not available"}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-blue-400 mb-2">Eligibility</h3>
            <p className="text-sm leading-relaxed">{scheme.raw_eligibility || "Not specified"}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-blue-400 mb-2">Documents Required</h3>
            <p className="text-sm leading-relaxed">{scheme.documents || "Not specified"}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-blue-400 mb-2">How to Apply</h3>
            <p className="text-sm leading-relaxed break-words">{scheme.application || "Not available"}</p>
          </div>
          {/* AI Chat Section */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
              ✨ Ask YojanaAI
            </h3>

            <div className="bg-gray-900/50 rounded-xl p-4 space-y-3">
              {aiResponse && (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-sm text-gray-200 leading-relaxed animate-fade-in">
                  <p className="whitespace-pre-wrap">{aiResponse}</p>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask about eligibility, documents, etc..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                />
                <button
                  onClick={handleAskAI}
                  disabled={aiLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition"
                >
                  {aiLoading ? '...' : 'Ask'}
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => handleQuickAsk("Summarize this scheme in 2 lines")}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-1.5 rounded-full border border-gray-700 whitespace-nowrap transition"
                >
                  Summarize
                </button>
                <button
                  onClick={() => handleQuickAsk("Am I eligible for this?")}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-1.5 rounded-full border border-gray-700 whitespace-nowrap transition"
                >
                  Check Eligibility
                </button>
                <button
                  onClick={() => handleQuickAsk("What documents do I need?")}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-1.5 rounded-full border border-gray-700 whitespace-nowrap transition"
                >
                  Documents
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-4 border-t border-gray-700 flex flex-col gap-4">

            {/* Official Link (conditionally visible) */}
            {scheme.url && (
              <a
                href={scheme.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Visit Official Website
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                </svg>
              </a>
            )}

            {/* Download PDF button ALWAYS visible */}
            <button
              style={{
                padding: "10px",
                background: "#4f46e5",
                color: "white",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                marginTop: "10px",
                fontWeight: "600"
              }}
              onClick={() => {
                window.open(`http://localhost:3000/pdf/${scheme.slug}`, "_blank");
              }}
            >
              ⬇ Download Required Documents PDF
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}
