/**
 * @description
 * This client component acts as a wrapper for NextAuth.js's `SessionProvider`.
 * It is essential for making session data available throughout the application
 * when using the Next.js App Router, as `SessionProvider` relies on React Context.
 *
 * Key features:
 * - Declared as a client component (`"use client"`).
 * - Renders the `SessionProvider` from `next-auth/react`, passing through children.
 *
 * @dependencies
 * - `next-auth/react`: Provides the `SessionProvider` component.
 * - `react`: For `React.ReactNode` type.
 *
 * @notes
 * - This component should be used in the root layout (`src/app/layout.tsx`) to ensure
 *   session context is available to all nested routes and components.
 */
"use client"

import { SessionProvider } from "next-auth/react"
import React from "react"

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * AuthProvider component.
 * Wraps its children with NextAuth's `SessionProvider` to provide session context.
 * @param {AuthProviderProps} props - The component's props.
 * @param {React.ReactNode} props.children - The child components to render within the provider.
 * @returns {JSX.Element} The `SessionProvider` wrapping the children.
 */
export default function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  return <SessionProvider>{children}</SessionProvider>
}