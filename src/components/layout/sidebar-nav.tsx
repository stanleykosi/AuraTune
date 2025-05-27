"use client"

import { motion } from "framer-motion"
import { SidebarNavItem } from "./sidebar-nav-item"

const navItems = [
  { href: "/dashboard", label: "Dashboard", iconName: "LayoutDashboard" },
  {
    href: "/generate/curated",
    label: "Curated Templates",
    iconName: "Sparkles",
  },
  {
    href: "/generate/track-match",
    label: "Track Match",
    iconName: "ListMusic",
  },
  { href: "/analytics", label: "Analytics", iconName: "BarChart3" },
  { href: "/settings", label: "Settings", iconName: "Settings" },
]

export function SidebarNav() {
  const navContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
      },
    },
  }

  return (
    <motion.nav
      variants={navContainerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-2"
    >
      {navItems.map((item) => (
        <SidebarNavItem key={item.href} {...item} />
      ))}
    </motion.nav>
  )
} 