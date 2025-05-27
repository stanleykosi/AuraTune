/**
 * @description
 * Client component to display a single statistic in a card format.
 * This component is used on the Analytics Dashboard to present key metrics
 * such as total playlists created.
 *
 * Key features:
 * - Displays a title, a prominent value, and an optional description.
 * - Can include an icon for visual context.
 * - Uses Shadcn UI `Card` for styling.
 *
 * @dependencies
 * - `react`: For component definition and `React.ElementType`.
 * - `@/components/ui/card`: Shadcn Card components for layout.
 * - `lucide-react`: For icons.
 *
 * @notes
 * - This component is designed to be reusable for various statistics.
 */
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as Icons from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: string
}

export default function StatsCard({
  title,
  value,
  description,
  icon,
}: StatsCardProps): JSX.Element {
  const Icon = icon ? (Icons[icon as keyof typeof Icons] as LucideIcon) : undefined

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-5 w-5 text-primary" />}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground pt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}