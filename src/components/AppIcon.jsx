const icons = {
  arrow: <path d="M5 12h13m-5-5 5 5-5 5" />,
  bell: (
    <>
      <path d="M15 17H9a4 4 0 0 1-4-4v-1.5c0-2.6 1.3-5 3.5-6.4V4a3.5 3.5 0 1 1 7 0v1.1A7.9 7.9 0 0 1 19 11.5V13a4 4 0 0 1-4 4Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5Z" />
      <path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z" />
    </>
  ),
  bookmark: (
    <>
      <path d="M7 3h10a1 1 0 0 1 1 1v17l-6-3-6 3V4a1 1 0 0 1 1-1Z" />
      <path d="M9 7h6" />
    </>
  ),
  chevron: <path d="m10 6 6 6-6 6" />,
  fire: <path d="M12 22c4 0 7-2.6 7-6.5 0-2.7-1.6-5.3-4-7.5.2 2-1 3.5-2.1 4.2.1-3.6-1.8-6.8-4.6-9.2.2 3.5-3.3 6-3.3 10.5C5 18.3 8 22 12 22Z" />,
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  levels: (
    <>
      <path d="M6 20v-6M12 20V9M18 20V4" />
      <path d="M4 20h4M10 20h4M16 20h4" />
    </>
  ),
  lotus: (
    <>
      <path d="M12 20c-4.4-2.4-5.5-6-4.2-10 2.6 1 4.2 3.2 4.2 6.6C12 13.2 13.6 11 16.2 10c1.3 4-.1 7.6-4.2 10Z" />
      <path d="M12 13c-2.1-2.9-2.1-6 0-9 2.1 3 2.1 6.1 0 9ZM8 17c-3.2-.4-5.2-2.2-6-5 2.6-.3 4.6.5 6 2.5M16 17c3.2-.4 5.2-2.2 6-5-2.6-.3-4.6.5-6 2.5M5 20h14" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M10 17h10" />
    </>
  ),
  message: (
    <>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.8-5.1A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8 6 4-6 4V8Z" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.7c-.9.8-1.8 1.3-1.8 2.8M12 17h.01" />
    </>
  ),
  spark: (
    <>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <path d="m4.9 4.9 2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
    </>
  ),
  location: (
    <>
      <path d="M12 21s-7-5.3-7-11a7 7 0 1 1 14 0c0 5.7-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  calendar: (
    <>
      <rect height="16" rx="2" width="18" x="3" y="4" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  check: <path d="m5 12 5 5L20 7" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  arrowLeft: <path d="M19 12H5m7-7-7 7 7 7" />,
};

export default function AppIcon({ name, size = 24, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
    >
      {icons[name]}
    </svg>
  );
}
