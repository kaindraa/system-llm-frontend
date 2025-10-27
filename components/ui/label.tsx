"use client";

import type { FC, LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Label: FC<LabelHTMLAttributes<HTMLLabelElement>> = ({
  className,
  ...props
}) => (
  <label
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
);
Label.displayName = "Label";
