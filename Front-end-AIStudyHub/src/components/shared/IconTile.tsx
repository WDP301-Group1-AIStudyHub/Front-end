import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const iconTileVariants = cva(
  "inline-grid shrink-0 place-items-center rounded-md border font-medium transition-colors select-none",
  {
    variants: {
      size: {
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-12 text-base",
      },
      tone: {
        neutral: "border-border bg-muted text-muted-foreground",
        primary: "border-primary/30 bg-primary/10 text-primary",
        success: "border-success/30 bg-success/15 text-success",
        warning: "border-warning/30 bg-warning/15 text-warning",
        info: "border-info/30 bg-info/15 text-info",
        destructive: "border-destructive/30 bg-destructive/15 text-destructive",
        pdf: "border-red-300 bg-red-100 text-red-600",
        docx: "border-blue-300 bg-blue-100 text-blue-600",
        xlsx: "border-emerald-300 bg-emerald-100 text-emerald-600",
        pptx: "border-orange-300 bg-orange-100 text-orange-600",
        txt: "border-gray-300 bg-gray-100 text-gray-600",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "neutral",
    },
  }
)

export function getFileTone(fileName?: string): "pdf" | "docx" | "xlsx" | "pptx" | "txt" {
  if (!fileName) return "txt"
  const ext = fileName.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return "pdf"
  if (ext === "docx" || ext === "doc") return "docx"
  if (ext === "xlsx" || ext === "xls") return "xlsx"
  if (ext === "pptx" || ext === "ppt") return "pptx"
  return "txt"
}

export interface IconTileProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof iconTileVariants> {
  fileName?: string
}

export function IconTile({
  className,
  size,
  tone,
  fileName,
  children,
  ...props
}: IconTileProps) {
  const resolvedTone = tone || (fileName ? getFileTone(fileName) : "neutral")

  return (
    <span
      className={cn(iconTileVariants({ size, tone: resolvedTone }), className)}
      {...props}
    >
      {children}
    </span>
  )
}
