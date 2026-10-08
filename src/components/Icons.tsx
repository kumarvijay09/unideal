import React from "react";

export type IconName =
  | "search"
  | "heart"
  | "map"
  | "arrow"
  | "book"
  | "laptop"
  | "home"
  | "ball"
  | "shirt"
  | "bag"
  | "more"
  | "message"
  | "plus"
  | "user"
  | "menu"
  | "spark"
  | "shield"
  | "chat"
  | "handshake"
  | "x"
  | "check"
  | "send"
  | "tag"
  | "clock"
  | "vehicle"
  | "upload"
  | "camera"
  | "image"
  | "trash";

const paths: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
  ),
  map: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z" />
    </>
  ),
  laptop: (
    <>
      <rect x="5" y="4" width="14" height="11" rx="1" />
      <path d="M3 19h18M8 19l1-2h6l1 2" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  ball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 4 3 4-2 4-5 1M16 4l-3 4 2 4 5 1M9 20l3-4 3 4" />
    </>
  ),
  shirt: <path d="m8 4-5 3 3 5 2-1v9h8v-9l2 1 3-5-5-3a4 4 0 0 1-8 0Z" />,
  bag: (
    <>
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </>
  ),
  message: (
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  spark: (
    <path d="M12 2c.8 5.3 3.7 8.2 9 9-5.3.8-8.2 3.7-9 9-.8-5.3-3.7-8.2-9-9 5.3-.8 8.2-3.7 9-9Z" />
  ),
  shield: (
    <>
      <path d="M12 3 4 6v5c0 5.2 3.4 8.4 8 10 4.6-1.6 8-4.8 8-10V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  chat: (
    <>
      <path d="M20 14a3 3 0 0 1-3 3H9l-5 3v-6a3 3 0 0 1-1-2V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3Z" />
      <path d="M8 9h8M8 12h5" />
    </>
  ),
  handshake: (
    <>
      <path d="m8 11 3 3c1 1 3-1 2-2l-2-2 2-2c1-1 2-1 3 0l4 4" />
      <path d="m4 8 3-3 4 3M3 14l3 3 2-2 2 2 2-2 2 1 6-6" />
    </>
  ),
  x: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  check: (
    <>
      <path d="m20 6-11 11-5-5" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  tag: (
    <>
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  vehicle: (
    <>
      <circle cx="5.5" cy="17.5" r="3" />
      <circle cx="18.5" cy="17.5" r="3" />
      <path d="M15 6h3l3 8.5M5.5 14.5 8 6h4l3 8" />
      <path d="M8 6 5.5 14.5" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </>
  ),
  camera: (
    <>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] || paths.spark}
    </svg>
  );
}
