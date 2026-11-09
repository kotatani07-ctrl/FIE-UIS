import { Container } from "./ui";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Container className="pb-12 pt-14 lg:pb-16 lg:pt-20">
      <span
        aria-hidden="true"
        className="mb-4 block h-1 w-10 rounded-full bg-accent-400"
      />
      <h1 className="font-display text-3xl font-bold leading-tight tracking-[-0.01em] text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
        {description}
      </p>
    </Container>
  );
}
