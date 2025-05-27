/**
 * @description
 * Client component responsible for handling page transitions using Framer Motion.
 * It wraps the main page content and applies animations when the route changes.
 *
 * Key features:
 * - Uses `AnimatePresence` to enable enter and exit animations.
 * - Uses `motion.main` to define the animation variants (fade in/out).
 * - Relies on `usePathname` from `next/navigation` to trigger animations on route changes.
 *
 * @dependencies
 * - `react`: For `React.ReactNode`.
 * - `framer-motion`: For `motion` and `AnimatePresence`.
 * - `next/navigation`: For `usePathname` hook.
 *
 * @notes
 * - This component is marked as `"use client"` because it uses client-side hooks.
 * - It should be used within a server layout component to wrap the page content (`children`).
 */
"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"

interface PageTransitionWrapperProps {
  children: React.ReactNode
}

const pageVariants = {
  initial: {
    opacity: 0,
    // y: 10, // Optional: slight vertical movement
  },
  in: {
    opacity: 1,
    // y: 0,
    transition: {
      duration: 0.3, // Slower transition for page content
      ease: "easeInOut",
    },
  },
  out: {
    opacity: 0,
    // y: -10,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
}

export default function PageTransitionWrapper({
  children,
}: PageTransitionWrapperProps): JSX.Element {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname} // Keyed by pathname to trigger animations on route change
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0" // Keep original layout classes
      >
        {children}
      </motion.main>
    </AnimatePresence>
  )
}