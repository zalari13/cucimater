const PATHS = {
  drop: "M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10z",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  car: "M5 16l1.5-5a2 2 0 0 1 2-1.5h7a2 2 0 0 1 2 1.5L19 16M4 16h16v3H4zM7.5 19v1.5M16.5 19v1.5",
  helmet: "M4 15a8 8 0 0 1 16 0v3H9a5 5 0 0 1-5-5zM11 12h9",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  clock: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  check: "M8.5 12l2.5 2.5 4.5-5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  right: "M9 6l6 6-6 6",
  users: "M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  can: "M8 3h8l1 4H7zM7 7h10v14H7zM10 11h4",
  star: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}