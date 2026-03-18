"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { type Idea } from "@/lib/api"
import { IdeaCard } from "@/components/idea-card"

type DraggableIdeaCardProps = {
  idea: Idea;
  ownerUsername?: string | null;
  sharedByUsername?: string | null;
};

export function DraggableIdeaCard({
  idea,
  ownerUsername,
  sharedByUsername,
}: DraggableIdeaCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `idea-${idea.id}`,
      data: { idea },
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
      <IdeaCard
        idea={idea}
        ownerUsername={ownerUsername}
        sharedByUsername={sharedByUsername}
      />
    </div>
  );
}
