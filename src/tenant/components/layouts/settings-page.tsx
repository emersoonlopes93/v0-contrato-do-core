export function SettingsPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
