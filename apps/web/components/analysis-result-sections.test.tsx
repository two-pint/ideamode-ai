import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalysisResultView } from "./analysis-result-sections";
import type { IdeaAnalysisItem } from "@/lib/api";

function makeAnalysis(overrides: Partial<IdeaAnalysisItem> = {}): IdeaAnalysisItem {
  return {
    id: 1,
    idea_id: 1,
    analysis_type: "competitor",
    status: "completed",
    result: {},
    annotations: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("AnalysisResultView", () => {
  it("shows running state when running is true", () => {
    render(
      <AnalysisResultView analysis={makeAnalysis({ status: "running" })} running={true} />
    );
    expect(screen.getByText(/running analysis/i)).toBeInTheDocument();
  });

  it("shows queued when status is pending", () => {
    render(
      <AnalysisResultView analysis={makeAnalysis({ status: "pending" })} running={false} />
    );
    expect(screen.getByText(/queued/i)).toBeInTheDocument();
  });

  it("shows error when result has error", () => {
    render(
      <AnalysisResultView
        analysis={makeAnalysis({ result: { error: "API not configured" } })}
        running={false}
      />
    );
    expect(screen.getByText("API not configured")).toBeInTheDocument();
  });

  it("shows no result data when result is empty and completed", () => {
    render(<AnalysisResultView analysis={makeAnalysis()} running={false} />);
    expect(screen.getByText(/no result data/i)).toBeInTheDocument();
  });

  it("shows verdict recommendation when verdict present", () => {
    render(
      <AnalysisResultView
        analysis={makeAnalysis({
          analysis_type: "full",
          result: {
            verdict: {
              score: 75,
              recommendation: "Proceed with Caution",
              key_risks: [],
              next_steps: [],
            },
          },
        })}
        running={false}
      />
    );
    expect(screen.getByText("Proceed with Caution")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();
  });
});
