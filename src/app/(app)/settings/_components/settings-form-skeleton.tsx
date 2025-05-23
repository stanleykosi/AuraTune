/**
 * @description
 * Skeleton loader component for the User Settings page.
 * This component displays a placeholder UI that mimics the structure of the settings form,
 * providing visual feedback to the user while the actual settings data is being loaded.
 *
 * Key features:
 * - Uses `Skeleton` components from Shadcn UI to represent loading elements.
 * - Matches the general layout of the `SettingsForm` for a smooth transition.
 *
 * @dependencies
 * - `@/components/ui/skeleton`: Shadcn Skeleton component.
 * - `@/components/ui/card`: Shadcn Card component for layout.
 *
 * @notes
 * - This component is typically used as a fallback in a React Suspense boundary.
 */
"use server" // Or "use client" if it had client-side logic, but for pure skeleton it can be server.

import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"

export default async function SettingsPageSkeleton(): Promise<JSX.Element> {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" /> {/* Placeholder for CardTitle */}
        <Skeleton className="h-4 w-3/4 mt-1" /> {/* Placeholder for CardDescription */}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" /> {/* Placeholder for Label */}
          <Skeleton className="h-10 w-full" /> {/* Placeholder for Input */}
          <Skeleton className="h-3 w-2/3 mt-1" /> {/* Placeholder for help text */}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-24" /> {/* Placeholder for Save Button */}
      </CardFooter>
    </Card>
  )
}