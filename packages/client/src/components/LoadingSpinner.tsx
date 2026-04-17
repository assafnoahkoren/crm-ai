export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`${sizeClasses[size]} border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin`}
      />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function EmptyState({ message, icon = "📭" }: { message: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
