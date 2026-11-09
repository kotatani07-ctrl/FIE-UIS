import { EmptyState, ErrorState, Skeleton } from "./ui";

export function LoadingBlock({
  label,
  rows = 3,
  className = "h-28",
}: {
  label: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className="mt-10">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="flex flex-col gap-4">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className={`${className} w-full`} />
        ))}
      </div>
    </div>
  );
}

export function ListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-10">
      <ErrorState onRetry={onRetry} />
    </div>
  );
}

export function ListEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-10">
      <EmptyState title={title} description={description} />
    </div>
  );
}
