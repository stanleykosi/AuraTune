"use server"

import DashboardCardSkeleton from "./DashboardCardSkeleton"

export default async function DashboardSectionSkeleton(): Promise<JSX.Element> {
  const skeletonCount = 3 // We have 3 cards in the dashboard section

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <DashboardCardSkeleton key={`dashboard-skeleton-${index}`} />
      ))}
    </div>
  )
} 