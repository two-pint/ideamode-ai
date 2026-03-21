"use client";

import { toast as sonnerToast } from "sonner";

/**
 * Stable toast ids so repeated actions (e.g. autosave) update one toast instead of stacking.
 * Use with {@link toastAutosaveSuccess} / {@link toastAutosaveError}.
 */
export const toastIds = {
  ideaNoteAutosave: "autosave-idea-note",
  brainstormNoteAutosave: "autosave-brainstorm-note",
  wireframeAutosave: "autosave-wireframe",
} as const;

export type AutosaveToastId = keyof typeof toastIds;

export function toastAutosaveSuccess(scope: AutosaveToastId, message: string) {
  sonnerToast.success(message, { id: toastIds[scope], duration: 2200 });
}

export function toastAutosaveError(scope: AutosaveToastId, message: string) {
  sonnerToast.error(message, { id: toastIds[scope], duration: 5000 });
}

export function toastSuccess(message: string) {
  sonnerToast.success(message);
}

export function toastError(message: string) {
  sonnerToast.error(message);
}
