"use server"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function DashboardCardSkeleton(): Promise<JSX.Element> {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <Skeleton className="h-4 w-24" /> {/* Card Title placeholder */}
        </CardTitle>
        <Skeleton className="h-5 w-5" /> {/* Icon placeholder */}
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-3/5 mb-2" /> {/* Main text placeholder (e.g., New Playlist) */}
        <Skeleton className="h-3 w-full mb-1" /> {/* Description line 1 placeholder */}
        <Skeleton className="h-3 w-5/6" /> {/* Description line 2 placeholder */}
      </CardContent>
    </Card>
  )
} 