export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto p-4">
        <main>{children}</main>
      </div>
    </div>
  );
}
