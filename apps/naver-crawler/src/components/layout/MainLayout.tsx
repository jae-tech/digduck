export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto p-4">
        <main>{children}</main>
      </div>
    </div>
  );
}
