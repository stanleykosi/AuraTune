'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  ListMusic,
  BarChart3,
  Settings,
  LucideIcon // Keep for type definition of the map values
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Map icon names to actual Lucide components
const iconComponents: { [key: string]: LucideIcon } = {
  LayoutDashboard,
  Sparkles,
  ListMusic,
  BarChart3,
  Settings,
};

interface SidebarNavItemProps {
  href: string;
  label: string;
  iconName: string; // Changed from icon: LucideIcon to iconName: string
}

export function SidebarNavItem({ href, label, iconName }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const Icon = iconComponents[iconName]; // Look up the component from the map

  if (!Icon) {
    // Optional: handle cases where an icon name might not be found
    console.warn(`Icon "${iconName}" not found in SidebarNavItem. Ensure it's added to iconComponents map.`);
    return null; // Or render a default icon/placeholder
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        'md:justify-start justify-center',
        isActive && 'bg-muted text-primary'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-5 w-5" />
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
