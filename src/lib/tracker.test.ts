import { describe, expect, it } from "vitest";
import {
  getBlockedMilestones,
  getCurrentFocus,
  getDashboardSummary,
  getDatedCompletions,
  getStatusCounts
} from "./tracker";
import type { TrackedProject, TrackerData } from "../types/tracker";

const baseProject: TrackedProject = {
  id: "alpha",
  name: "Alpha",
  role: "Primary project",
  rootPath: "C:\\Alpha",
  activeCodePaths: ["C:\\Alpha"],
  verificationCommands: [],
  sourceDocs: [],
  milestones: [
    {
      id: "blocked",
      title: "Blocked item",
      status: "blocked",
      completedAt: null,
      source: "source",
      evidence: "evidence",
      blocker: "Needs a contract",
      nextAction: "Choose the API contract.",
      notes: null
    },
    {
      id: "done",
      title: "Done item",
      status: "done",
      completedAt: "2026-06-01",
      source: "source",
      evidence: "evidence",
      blocker: null,
      nextAction: null,
      notes: null
    },
    {
      id: "confirm",
      title: "Confirm item",
      status: "needs_confirmation",
      completedAt: null,
      source: "source",
      evidence: "evidence",
      blocker: null,
      nextAction: "Run verification.",
      notes: null
    }
  ]
};

const trackerFixture: TrackerData = {
  schemaVersion: "1.0.0",
  createdAt: "2026-06-01",
  updatedAt: "2026-06-03",
  statusValues: ["todo", "in_progress", "done", "blocked", "deferred", "needs_confirmation"],
  projects: [
    baseProject,
    {
      ...baseProject,
      id: "beta",
      name: "Beta",
      milestones: [
        {
          ...baseProject.milestones[1],
          id: "older-done",
          title: "Older done item",
          completedAt: "2026-05-20"
        },
        {
          ...baseProject.milestones[2],
          id: "todo",
          title: "Todo item",
          status: "todo",
          completedAt: null,
          nextAction: "Start the baseline."
        }
      ]
    }
  ]
};

describe("tracker helpers", () => {
  it("counts milestone statuses for a project", () => {
    expect(getStatusCounts(baseProject)).toEqual({
      todo: 0,
      in_progress: 0,
      done: 1,
      blocked: 1,
      deferred: 0,
      needs_confirmation: 1
    });
  });

  it("selects the highest-priority current focus", () => {
    expect(getCurrentFocus(baseProject)).toBe("Choose the API contract.");
  });

  it("returns blocked milestones", () => {
    expect(getBlockedMilestones(baseProject)).toHaveLength(1);
    expect(getBlockedMilestones(baseProject)[0].blocker).toBe("Needs a contract");
  });

  it("aggregates dashboard summary counts", () => {
    expect(getDashboardSummary(trackerFixture)).toMatchObject({
      totalProjects: 2,
      totalMilestones: 5,
      done: 2,
      blocked: 1,
      needsConfirmation: 1,
      todo: 1
    });
  });

  it("sorts dated completions from newest to oldest", () => {
    expect(getDatedCompletions(trackerFixture).map((item) => item.milestone.completedAt)).toEqual([
      "2026-06-01",
      "2026-05-20"
    ]);
  });
});
