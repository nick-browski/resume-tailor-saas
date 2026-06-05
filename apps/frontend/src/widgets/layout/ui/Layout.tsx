import React from "react";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:px-4 sm:py-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-200">
              The Imposter
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Transform your resume for any job
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-4 sm:px-4 sm:py-8 flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
