/**
 * @description
 * Client component for displaying a single curated template as an interactive card.
 * It shows the template's icon, name, and description.
 * This component is designed to be clickable to initiate playlist generation based on the template.
 *
 * Key features:
 * - Displays template information: icon, name, description.
 * - Uses Shadcn `Card` for styling.
 * - Dynamically renders icons: supports `lucide:<icon-name>` format and direct image URLs.
 *   Falls back to a default music icon if the specified icon is invalid or not found.
 * - Designed with hover effects to indicate interactivity.
 * - Includes an `onClick` handler to trigger actions when the card is selected.
 *
 * @dependencies
 * - `react`: For component definition.
 * - `next/image`: For rendering image icons if `icon_url` is a URL.
 * - `lucide-react`: For rendering Lucide icons and providing a default icon.
 * - `@/components/ui/card`: Shadcn Card components for styling.
 * - `@/db/schema/curated-templates-schema`: For the `SelectCuratedTemplate` type.
 *
 * @notes
 * - Marked as `"use client"` because it handles `onClick` events.
 * - The icon rendering logic attempts to be flexible. Error handling for icon loading is included.
 */
"use client"

import React from "react"
import Image from "next/image"
import * as LucideIcons from "lucide-react"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SelectCuratedTemplate } from "@/db/schema/curated-templates-schema"

interface CuratedTemplateCardProps {
  template: SelectCuratedTemplate
  onClick: (templateId: string) => void // Callback when the card is clicked
  isLoading?: boolean // Optional: to disable card during an operation
}

/**
 * Renders an icon based on the provided icon URL.
 * Supports 'lucide:<iconName>' format, image URLs, or falls back to a default icon.
 * @param iconUrl The URL or identifier for the icon.
 * @param templateName The name of the template, used for alt text or labels.
 * @returns JSX.Element representing the icon.
 */
const TemplateIcon: React.FC<{
  iconUrl: string | null | undefined
  templateName: string
}> = ({ iconUrl, templateName }) => {
  const defaultIcon = (
    <LucideIcons.Music
      aria-label={`Default icon for ${templateName}`}
      className="h-10 w-10 text-primary group-hover:text-accent transition-colors duration-200"
    />
  )

  if (!iconUrl) {
    return defaultIcon
  }

  if (iconUrl.startsWith("lucide:")) {
    const iconName = iconUrl.split(":")[1]
    const pascalCaseIconName = iconName
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")
    const IconComponent = (LucideIcons as any)[
      pascalCaseIconName
    ] as LucideIcons.LucideIcon | undefined

    if (IconComponent) {
      return (
        <IconComponent
          aria-label={`${templateName} icon`}
          className="h-10 w-10 text-primary group-hover:text-accent transition-colors duration-200"
        />
      )
    }
    console.warn(
      `Lucide icon "${pascalCaseIconName}" (from "${iconUrl}") not found for template "${templateName}". Falling back to default.`
    )
    return defaultIcon
  }

  if (
    iconUrl.startsWith("http://") ||
    iconUrl.startsWith("https://") ||
    iconUrl.startsWith("/")
  ) {
    return (
      <div className="relative h-10 w-10">
        <Image
          src={iconUrl}
          alt={`${templateName} icon`}
          fill
          sizes="40px"
          className="object-contain group-hover:scale-105 transition-transform duration-200"
        />
      </div>
    )
  }

  console.warn(
    `Invalid icon_url format "${iconUrl}" for template "${templateName}". Falling back to default.`
  )
  return defaultIcon
}

export default function CuratedTemplateCard({
  template,
  onClick,
  isLoading = false,
}: CuratedTemplateCardProps): JSX.Element {
  const handleClick = () => {
    if (!isLoading) {
      onClick(template.id)
    }
  }

  // Animation variants for the card
  const cardVariants = {
    initial: { scale: 1, y: 0, boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.05)" },
    hover: { scale: 1.03, y: -2, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)" },
    tap: { scale: 0.98 },
  }

  const cardTransition = {
    type: "spring",
    stiffness: 300,
    damping: 20,
  }

  return (
    <motion.div
      variants={!isLoading ? cardVariants : undefined}
      initial="initial"
      whileHover={!isLoading ? "hover" : undefined}
      whileTap={!isLoading ? "tap" : undefined}
      transition={!isLoading ? cardTransition : undefined}
      className="h-full" // Ensure motion.div takes full height for layout
    >
      <Card
        className={`h-full flex flex-col group transition-all duration-200 ease-in-out
                   bg-card/80 backdrop-blur-sm hover:bg-card
                   ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-xl hover:border-primary/50"}`}
        onClick={!isLoading ? handleClick : undefined}
        onKeyDown={(e) => {
          if (!isLoading && (e.key === "Enter" || e.key === " ")) {
            onClick(template.id)
          }
        }}
        tabIndex={isLoading ? -1 : 0}
        role="button"
        aria-label={`Select template: ${template.name}. Description: ${template.description}`}
        aria-disabled={isLoading}
        data-testid={`curated-template-card-${template.id}`}
      >
        <CardHeader className="items-center text-center pt-6 pb-4">
          <div className="mb-3 p-3 bg-primary/10 rounded-full group-hover:bg-accent/10 transition-colors duration-200">
            <TemplateIcon
              iconUrl={template.icon_url}
              templateName={template.name}
            />
          </div>
          <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-200">
            {template.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow text-center pb-6 px-4">
          <CardDescription className="text-sm text-muted-foreground group-hover:text-foreground/90 transition-colors duration-200 leading-relaxed">
            {template.description}
          </CardDescription>
        </CardContent>
      </Card>
    </motion.div>
  )
}