import React from "react";

export default function FluidLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="w-full max-w-7xl mx-auto p-4">
        <main>{children}</main>
      </div>
    </div>
  );
}
