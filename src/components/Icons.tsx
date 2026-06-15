import React from 'react';

type P = { size?: number };

const Svg = ({ size = 14, children }: { size?: number; children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
    {children}
  </svg>
);

export const IcSend = ({ size }: P) => <Svg size={size}>
  <line x1="22" y1="2" x2="11" y2="13"/>
  <polygon points="22 2 15 22 11 13 2 9"/>
</Svg>;

export const IcTrash = ({ size }: P) => <Svg size={size}>
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6l-1 14H6L5 6"/>
  <path d="M10 11v6M14 11v6"/>
  <path d="M9 6V4h6v2"/>
</Svg>;

export const IcDownload = ({ size }: P) => <Svg size={size}>
  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
  <polyline points="7 10 12 15 17 10"/>
  <line x1="12" y1="15" x2="12" y2="3"/>
</Svg>;

export const IcCopy = ({ size }: P) => <Svg size={size}>
  <rect x="9" y="9" width="13" height="13" rx="2"/>
  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
</Svg>;

export const IcBell = ({ size }: P) => <Svg size={size}>
  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
  <path d="M13.73 21a2 2 0 01-3.46 0"/>
</Svg>;

export const IcBellOff = ({ size }: P) => <Svg size={size}>
  <path d="M13.73 21a2 2 0 01-3.46 0"/>
  <path d="M18.63 13A17.89 17.89 0 0118 8"/>
  <path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14"/>
  <path d="M18 8a6 6 0 00-9.33-4.97"/>
  <line x1="1" y1="1" x2="23" y2="23"/>
</Svg>;

export const IcBox = ({ size }: P) => <Svg size={size}>
  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
  <line x1="12" y1="22.08" x2="12" y2="12"/>
</Svg>;

export const IcGrid = ({ size }: P) => <Svg size={size}>
  <rect x="3" y="3" width="7" height="7" rx="1"/>
  <rect x="14" y="3" width="7" height="7" rx="1"/>
  <rect x="14" y="14" width="7" height="7" rx="1"/>
  <rect x="3" y="14" width="7" height="7" rx="1"/>
</Svg>;

export const IcText = ({ size }: P) => <Svg size={size}>
  <polyline points="4 7 4 4 20 4 20 7"/>
  <line x1="9" y1="20" x2="15" y2="20"/>
  <line x1="12" y1="4" x2="12" y2="20"/>
</Svg>;

export const IcLayout = ({ size }: P) => <Svg size={size}>
  <rect x="3" y="3" width="18" height="18" rx="2"/>
  <line x1="3" y1="9" x2="21" y2="9"/>
  <line x1="9" y1="21" x2="9" y2="9"/>
</Svg>;

export const IcImages = ({ size }: P) => <Svg size={size}>
  <rect x="3" y="3" width="18" height="18" rx="2"/>
  <circle cx="8.5" cy="8.5" r="1.5"/>
  <polyline points="21 15 16 10 5 21"/>
</Svg>;

export const IcMinus = ({ size }: P) => <Svg size={size}>
  <line x1="5" y1="12" x2="19" y2="12"/>
</Svg>;

export const IcPlus = ({ size }: P) => <Svg size={size}>
  <line x1="12" y1="5" x2="12" y2="19"/>
  <line x1="5" y1="12" x2="19" y2="12"/>
</Svg>;

export const IcChevronUp = ({ size }: P) => <Svg size={size}>
  <polyline points="18 15 12 9 6 15"/>
</Svg>;

export const IcChevronDown = ({ size }: P) => <Svg size={size}>
  <polyline points="6 9 12 15 18 9"/>
</Svg>;

export const IcX = ({ size }: P) => <Svg size={size}>
  <line x1="18" y1="6" x2="6" y2="18"/>
  <line x1="6" y1="6" x2="18" y2="18"/>
</Svg>;

export const IcHelpCircle = ({ size }: P) => <Svg size={size}>
  <circle cx="12" cy="12" r="10"/>
  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
  <line x1="12" y1="17" x2="12.01" y2="17"/>
</Svg>;

export const IcInfo = ({ size }: P) => <Svg size={size}>
  <circle cx="12" cy="12" r="10"/>
  <line x1="12" y1="16" x2="12" y2="12"/>
  <line x1="12" y1="8" x2="12.01" y2="8"/>
</Svg>;

export const IcUser = ({ size }: P) => <Svg size={size}>
  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</Svg>;

export const IcClock = ({ size }: P) => <Svg size={size}>
  <circle cx="12" cy="12" r="10"/>
  <polyline points="12 6 12 12 16 14"/>
</Svg>;

export const IcEmbed = ({ size }: P) => <Svg size={size}>
  <polyline points="16 18 22 12 16 6"/>
  <polyline points="8 6 2 12 8 18"/>
  <line x1="12" y1="2" x2="12" y2="22"/>
</Svg>;

export const IcCheck = ({ size }: P) => <Svg size={size}>
  <polyline points="20 6 9 17 4 12"/>
</Svg>;

export const IcAlertTriangle = ({ size }: P) => <Svg size={size}>
  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
  <line x1="12" y1="9" x2="12" y2="13"/>
  <line x1="12" y1="17" x2="12.01" y2="17"/>
</Svg>;
