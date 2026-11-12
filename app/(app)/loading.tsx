export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      <span className="sr-only">טוען…</span>
    </div>
  );
}
