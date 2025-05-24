/**
 * @description
 * Skeleton loader component for the curated templates grid.
 * This component displays a grid of placeholder template cards, providing a visual
 * representation of the page structure while the actual template data is being fetched.
 *
 * Key features:
 * - Renders multiple instances of `CuratedTemplateCardSkeleton`.
 * - Matches the grid layout of `CuratedTemplateGrid`.
 * - Used as a fallback in a React Suspense boundary for the curated templates page.
 *
 * @dependencies
 * - `./curated-template-card-skeleton`: The skeleton component for a single card.
 *
 * @notes
 * - This is a server component as it's purely for visual placeholders.
 * - The number of skeleton cards can be adjusted to match typical page content.
 */
"use server"

import CuratedTemplateCardSkeleton from "./curated-template-card-skeleton"

export default async function CuratedTemplatesGridSkeleton(): Promise<JSX.Element> {
  const skeletonCount = 6 // Display 6 skeleton cards as a placeholder

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <CuratedTemplateCardSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  )
}