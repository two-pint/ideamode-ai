"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide transition-colors w-fit",
  {
    variants: {
      variant: {
        default: "border-transparent bg-zinc-100 text-zinc-700",
        brainstorm: "border-transparent bg-amber-100 text-amber-800",
        exploring: "border-transparent bg-violet-100 text-violet-800",
        researching: "border-transparent bg-blue-100 text-blue-800",
        ready: "border-transparent bg-emerald-100 text-emerald-800",
        archived: "border-transparent bg-zinc-200 text-zinc-600",
        validating: "border-transparent bg-blue-100 text-blue-800",
        validated: "border-transparent bg-emerald-100 text-emerald-800",
        shelved: "border-transparent bg-zinc-200 text-zinc-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
