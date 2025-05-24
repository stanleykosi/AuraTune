/**
 * @description
 * Skeleton loader component for a single curated template card.
 * This component displays a placeholder UI that mimics the structure of an individual
 * template card, providing visual feedback while data is loading.
 *
 * Key features:
 * - Uses `Skeleton` components from Shadcn UI for placeholder elements.
 * - Matches the layout of `CuratedTemplateCard` for a consistent loading experience.
 * - Intended to be used within a grid skeleton or as a standalone placeholder.
 *
 * @dependencies
 * - `@/components/ui/skeleton`: Shadcn Skeleton component.
 * - `@/components/ui/card`: Shadcn Card components for layout structure.
 *
 * @notes
 * - This is a server component as it doesn't require client-side interactivity.
 */
"use server"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

export default async function CuratedTemplateCardSkeleton(): Promise<JSX.Element> {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="items-center text-center">
        <Skeleton className="h-12 w-12 rounded-full mb-2" /> {/* Icon placeholder */}
        <CardTitle>
          <Skeleton className="h-6 w-3/4 mx-auto" /> {/* Title placeholder */}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow text-center">
        <CardDescription>
          <Skeleton className="h-4 w-full mb-1" /> {/* Description line 1 placeholder */}
          <Skeleton className="h-4 w-5/6 mx-auto mb-1" /> {/* Description line 2 placeholder */}
          <Skeleton className="h-4 w-1/2 mx-auto" /> {/* Description line 3 placeholder */}
        </CardDescription>
      </CardContent>
      {/* No CardFooter for now in the actual card design, so skeleton matches */}
    </Card>
  )
}