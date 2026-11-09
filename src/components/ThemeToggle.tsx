"use client";

/**
 * Light/dark switch. With no saved choice the site follows the system setting;
 * a click stores the choice in a cookie so the server renders it without a flash.
 */
export function ThemeToggle({ label }: { label: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const current = root.dataset.theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="grid h-[1.625rem] w-[1.625rem] cursor-pointer place-items-center border border-ink transition-colors duration-300 hover:bg-ink hover:text-paper"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 3 A9 9 0 0 1 12 21 Z" fill="currentColor" />
      </svg>
    </button>
  );
}
