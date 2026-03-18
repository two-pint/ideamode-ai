"use client";

import { useDroppable } from "@dnd-kit/core";
import { type IdeaStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

type DroppableLaneProps = {
  status: IdeaStatus;
  children: React.ReactNode;
  className?: string;
};

export function DroppableLane({ status, children, className }: DroppableLaneProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && "ring-2 ring-primary/50 rounded-xl")}
    >
      {children}
    </div>
  );
}
