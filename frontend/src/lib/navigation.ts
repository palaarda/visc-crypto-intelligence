import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, LineChart, Zap, Layers, Brain, Globe2,
  Newspaper, BarChart3, Briefcase, Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  section: "operations" | "intelligence" | "system";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",       label: "Dashboard",        icon: LayoutDashboard, section: "operations" },
  { href: "/markets",         label: "Markets",          icon: LineChart,       section: "operations" },
  { href: "/signals",         label: "Signals",          icon: Zap,             section: "operations" },
  { href: "/strategies",      label: "Strategies",       icon: Layers,          section: "operations" },
  { href: "/ai-intelligence", label: "AI Intelligence",  icon: Brain,           section: "intelligence" },
  { href: "/macro-events",    label: "Macro Events",     icon: Globe2,          section: "intelligence" },
  { href: "/news",            label: "News Center",      icon: Newspaper,       section: "intelligence" },
  { href: "/analytics",       label: "Analytics",        icon: BarChart3,       section: "intelligence" },
  { href: "/portfolio",       label: "Portfolio",        icon: Briefcase,       section: "intelligence" },
  { href: "/settings",        label: "Settings",         icon: Settings,        section: "system" },
];

export const SECTION_LABELS: Record<NavItem["section"], string> = {
  operations: "Operations",
  intelligence: "Intelligence",
  system: "System",
};

export const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/dashboard":       { title: "Operations Center", subtitle: "Market intelligence overview" },
  "/markets":         { title: "Markets", subtitle: "Asset monitoring and analysis" },
  "/coin-analysis":   { title: "Asset Analysis", subtitle: "Deep market intelligence" },
  "/signals":         { title: "Signals", subtitle: "Published signal intelligence" },
  "/strategies":      { title: "Strategies", subtitle: "Confluence engine modules" },
  "/ai-intelligence": { title: "AI Intelligence", subtitle: "Decision support context" },
  "/macro-events":    { title: "Macro Events", subtitle: "Global economic calendar" },
  "/news":            { title: "News Center", subtitle: "Market-moving intelligence" },
  "/analytics":       { title: "Analytics", subtitle: "Performance and distribution" },
  "/statistics":      { title: "Analytics", subtitle: "Performance and distribution" },
  "/portfolio":       { title: "Portfolio", subtitle: "Position and risk tracking" },
  "/settings":        { title: "Settings", subtitle: "Platform configuration" },
};

export function resolvePageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path + "/"));
  return match?.[1] ?? { title: "VISC", subtitle: "Market Intelligence Platform" };
}
