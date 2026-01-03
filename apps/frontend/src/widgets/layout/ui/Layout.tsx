import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:px-4 sm:py-5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            The Imposter
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Transform your resume for any job
          </p>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-4 sm:px-4 sm:py-8 flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
