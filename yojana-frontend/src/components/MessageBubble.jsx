export default function MessageBubble({ msg }) {
  const isUser = msg.from === "user";

  return (
    <div className={`flex items-start gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      
      {!isUser && (
        <div className="w-8 h-8 bg-slate-800 text-white flex items-center justify-center rounded-full text-sm">
          AI
        </div>
      )}

      <div className={`p-3 rounded-xl max-w-[75%] shadow-sm ${
        isUser
          ? "bg-sky-600 text-white rounded-br-none"
          : "bg-white text-slate-800 rounded-bl-none"
      }`}>
        {msg.text}
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-sky-600 text-white flex items-center justify-center rounded-full text-sm">
          U
        </div>
      )}

    </div>
  );
}
