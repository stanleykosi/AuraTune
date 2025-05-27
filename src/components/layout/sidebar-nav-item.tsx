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
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion'; // Added framer-motion import

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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!Icon) {
    // Optional: handle cases where an icon name might not be found
    console.warn(`Icon "${iconName}" not found in SidebarNavItem. Ensure it's added to iconComponents map.`);
    return null; // Or render a default icon/placeholder
  }

  return (
    <motion.div
      className="rounded-lg"
      whileHover={{
        scale: 1.03,
        backgroundColor: isActive ? "hsl(var(--muted))" : "hsl(var(--accent)/0.075)"
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
    >
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
          'md:justify-start justify-center',
          isActive && 'bg-muted text-primary'
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon size={20} />
        {isClient ? (
          <span className="hidden md:inline">{label}</span>
        ) : (
          // Fallback for SSR to avoid layout shift, though isClient makes it client-rendered
          <span className="hidden md:inline">{label}</span>
        )}
      </Link>
    </motion.div>
  );
}
