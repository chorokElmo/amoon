import type { SVGProps } from "react";
type IconName = "search" | "bag" | "menu" | "close" | "arrow" | "instagram" | "heart" | "truck" | "card" | "exchange" | "diamond" | "shirt" | "star";
const paths: Record<IconName, React.ReactNode> = {
  heart: <path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 6l-1-1.2a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z"/>,
  truck: <><path d="M2 5h12v12H2zM14 9h4l4 4v4h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
  card: <><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M2 9h20M6 15h5"/></>,
  exchange: <><path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/></>,
  diamond: <><path d="m3 8 4-5h10l4 5-9 14L3 8Zm0 0h18M7 3l5 19 5-19"/></>,
  shirt: <path d="m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4c-1 3-7 3-8 0Z"/>,
  star: <path d="m12 2 3 6.5 7 1-5 5 1 7-6-3.5-6 3.5 1-7-5-5 7-1L12 2Z"/>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
  bag: <><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></>,
  menu: <path d="M3 7h18M3 17h18"/>, close: <path d="m6 6 12 12M18 6 6 18"/>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></>,
};
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
