import React from "react";

export default function FluidLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <main className="w-full max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
