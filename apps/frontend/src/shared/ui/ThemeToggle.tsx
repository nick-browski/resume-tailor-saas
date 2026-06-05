import { useThemeStore } from "@/shared/lib/themeStore";

function SunIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative inline-flex items-center gap-1 rounded-full bg-gray-200 dark:bg-gray-700 p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-900"
    >
      {/* Highlight that glides under the active icon */}
      <span
        aria-hidden="true"
        className={`absolute left-1 top-1 w-7 h-7 rounded-full bg-white dark:bg-gray-900 shadow-sm transition-transform duration-300 ease-in-out motion-reduce:transition-none ${
          isDark ? "translate-x-8" : "translate-x-0"
        }`}
      />
      <span
        className={`relative z-10 flex items-center justify-center w-7 h-7 transition duration-300 ease-in-out motion-reduce:transition-none ${
          isDark
            ? "text-gray-400 opacity-70 scale-90"
            : "text-amber-500 opacity-100 scale-100"
        }`}
      >
        <SunIcon />
      </span>
      <span
        className={`relative z-10 flex items-center justify-center w-7 h-7 transition duration-300 ease-in-out motion-reduce:transition-none ${
          isDark
            ? "text-blue-300 opacity-100 scale-100"
            : "text-gray-400 opacity-70 scale-90"
        }`}
      >
        <MoonIcon />
      </span>
    </button>
  );
}
