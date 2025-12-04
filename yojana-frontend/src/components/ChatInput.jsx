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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Describe yourself: age, state, income, role..."
        className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
        disabled={disabled}
      />
      <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded" disabled={disabled}>
        Send
      </button>
    </form>
  );
}
