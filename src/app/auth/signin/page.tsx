import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AuthButton from "@/components/shared/auth-button"

export default async function SignInPage() {
  const session = await getServerSession(authOptions)

  // If the user is already signed in, redirect to the home page
  if (session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <AuthButton />
        </div>
      </div>
    </div>
  )
} 