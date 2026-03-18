"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { type Brainstorm } from "@/lib/api";
import { BrainstormCard } from "@/components/brainstorm-card";

type DraggableBrainstormCardProps = {
  brainstorm: Brainstorm;
  ownerUsername?: string | null;
  sharedByUsername?: string | null;
};

export function DraggableBrainstormCard({
  brainstorm,
  ownerUsername,
  sharedByUsername,
}: DraggableBrainstormCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `brainstorm-${brainstorm.id}`,
    data: { brainstorm },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? "opacity-50 cursor-grabbing" : "cursor-grab"}
    >
      <BrainstormCard
        brainstorm={brainstorm}
        ownerUsername={ownerUsername}
        sharedByUsername={sharedByUsername}
      />
    </div>
  );
}
