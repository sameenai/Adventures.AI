export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 border border-stone-800 bg-stone-900 px-4 py-3">
        <span className="h-2 w-2 animate-bounce bg-stone-600 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce bg-stone-600 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce bg-stone-600" />
      </div>
    </div>
  );
}
