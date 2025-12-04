import React, { useState } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Message YojanaAI..."
        className="w-full bg-gray-800 text-gray-100 border border-gray-700 rounded-xl px-4 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder-gray-500 shadow-sm"
        disabled={disabled}
      />
      <button
        type="submit"
        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${text.trim() && !disabled
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        disabled={disabled || !text.trim()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
        </svg>
      </button>
    </form>
  );
}
