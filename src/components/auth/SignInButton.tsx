"use client"

import { signIn } from "next-auth/react"
import type { ClientSafeProvider } from "next-auth/react"

interface SignInButtonProps {
  provider: ClientSafeProvider
}

export default function SignInButton({ provider }: SignInButtonProps) {
  return (
    <button
      onClick={() => signIn(provider.id, { callbackUrl: "/" })}
      className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      Sign in with {provider.name}
    </button>
  )
} 