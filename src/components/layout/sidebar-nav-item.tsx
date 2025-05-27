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
  custom?: number; // Used for framer-motion animation delay
}

const navItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.07, // Use custom prop for delay, matches staggerChildren in parent
    },
  }),
};

export function SidebarNavItem({ href, label, iconName, custom }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const Icon = iconComponents[iconName]; // Look up the component from the map

  if (!Icon) {
    // Optional: handle cases where an icon name might not be found
    console.warn(`Icon "${iconName}" not found in SidebarNavItem. Ensure it's added to iconComponents map.`);
    return null; // Or render a default icon/placeholder
  }

  return (
    <motion.div
      className="rounded-lg"
      variants={navItemVariants}
      custom={custom}
      initial="hidden"
      animate="visible"
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
        <span className="hidden md:inline">{label}</span>
      </Link>
    </motion.div>
  );
}
