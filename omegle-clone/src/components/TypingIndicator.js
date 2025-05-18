export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
      <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></span>
      <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></span>
      <p className="ml-2 text-sm">Stranger is typing...</p>
    </div>
  );
}
