import type { LucideIcon, LucideProps } from "lucide-react-native";
import { createElement, type ComponentType } from "react";

/**
 * Lucide's `LucideIcon` type does not satisfy React 19's JSX typings for
 * `ForwardRefExoticComponent`. Rendering via `createElement` with a cast keeps
 * runtime behavior identical while satisfying the compiler.
 */
export function renderLucide(Icon: LucideIcon, props: LucideProps) {
  return createElement(Icon as unknown as ComponentType<LucideProps>, props);
}
