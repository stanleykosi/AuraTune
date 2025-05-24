/**
 * @description
 * Client component for displaying a grid of curated templates.
 * It receives a list of templates and renders each one using the `CuratedTemplateCard` component.
 * Handles the case where no templates are available.
 *
 * Key features:
 * - Renders templates in a responsive grid.
 * - Uses `CuratedTemplateCard` for individual template display.
 * - Displays a message if no templates are found.
 *
 * @dependencies
 * - `react`: For component definition.
 * - `./curated-template-card`: Component for rendering individual template cards.
 * - `@/db/schema/curated-templates-schema`: For the `SelectCuratedTemplate` type.
 * - `@/components/ui/alert`: For displaying messages like "no templates found".
 * - `lucide-react`: For icons in alerts.
 *
 * @notes
 * - Marked as `"use client"` because it will manage modal state for playlist preview in a future step.
 * - The grid layout adjusts for different screen sizes.
 */
"use client"

import React from "react"
import CuratedTemplateCard from "./curated-template-card"
import { SelectCuratedTemplate } from "@/db/schema/curated-templates-schema"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

interface CuratedTemplateGridProps {
  templates: SelectCuratedTemplate[]
  // onTemplateSelect will be added in a later step:
  // onTemplateSelect: (templateId: string) => void;
}

export default function CuratedTemplateGrid({
  templates,
}: CuratedTemplateGridProps): JSX.Element {
  // In a future step, this function will be passed to CuratedTemplateCard:
  // const handleCardClick = (templateId: string) => {
  //   onTemplateSelect(templateId);
  // };

  if (!templates || templates.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No Templates Found</AlertTitle>
        <AlertDescription>
          There are currently no curated templates available. Please check back
          later or contact support if you believe this is an error.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {templates.map((template) => (
        <CuratedTemplateCard
          key={template.id}
          template={template}
          // onClick={handleCardClick} // To be enabled later
        />
      ))}
    </div>
  )
}