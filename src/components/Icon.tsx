const PATHS = {
  plus: 'M12 5v14M5 12h14',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M2 12h2M20 12h2M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2',
  arrowLeft: 'M19 12H5M11 18l-6-6 6-6',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM16.5 16.5 21 21',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  sliders: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h9M17 18h3M15 4v4M9 10v4M15 16v4',
  link: 'M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1',
  wallet: 'M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7ZM3 9h18M16 13h2',
  sparkle: 'M12 3l1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3ZM18 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z',
  users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 19v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  refresh: 'M20 11a8 8 0 1 0-.7 4.3M20 5v6h-6',
} as const

export type IconName = keyof typeof PATHS

interface IconProps {
  name: IconName
  className?: string
}

export function Icon({ name, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
