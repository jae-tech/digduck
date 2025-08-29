import React from "react";

export default function CenteredLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <main className="w-full flex justify-center">{children}</main>
    </div>
  );
}
