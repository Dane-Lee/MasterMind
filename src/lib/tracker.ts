import type {
  Milestone,
  StatusCounts,
  StatusValue,
  TrackedProject,
  TrackerData
} from "../types/tracker";

export const statusOrder: StatusValue[] = [
  "in_progress",
  "blocked",
  "todo",
  "needs_confirmation",
  "deferred",
  "done"
];

export const openStatusOrder: StatusValue[] = ["in_progress", "blocked", "todo"];

export const statusLabels: Record<StatusValue, string> = {
  todo: "Todo",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked",
  deferred: "Deferred",
  needs_confirmation: "Needs confirmation"
};

export function createEmptyStatusCounts(): StatusCounts {
  return {
    todo: 0,
    in_progress: 0,
    done: 0,
    blocked: 0,
    deferred: 0,
    needs_confirmation: 0
  };
}

export function getStatusCounts(project: TrackedProject): StatusCounts {
  return project.milestones.reduce<StatusCounts>((counts, milestone) => {
    counts[milestone.status] += 1;
    return counts;
  }, createEmptyStatusCounts());
}

export function getTotalMilestones(projects: TrackedProject[]): number {
  return projects.reduce((total, project) => total + project.milestones.length, 0);
}

export function getDashboardSummary(data: TrackerData) {
  const aggregate = data.projects.reduce<StatusCounts>((counts, project) => {
    const projectCounts = getStatusCounts(project);
    for (const status of data.statusValues) {
      counts[status] += projectCounts[status];
    }
    return counts;
  }, createEmptyStatusCounts());

  return {
    totalProjects: data.projects.length,
    totalMilestones: getTotalMilestones(data.projects),
    done: aggregate.done,
    blocked: aggregate.blocked,
    needsConfirmation: aggregate.needs_confirmation,
    todo: aggregate.todo,
    deferred: aggregate.deferred,
    inProgress: aggregate.in_progress
  };
}

export function getCurrentFocus(project: TrackedProject): string {
  for (const status of openStatusOrder.concat(["needs_confirmation", "deferred"])) {
    const milestone = project.milestones.find((item) => item.status === status);
    if (milestone) {
      return milestone.nextAction || milestone.title;
    }
  }

  return "No open milestone recorded.";
}

export function getBlockedMilestones(project: TrackedProject): Milestone[] {
  return project.milestones.filter((milestone) => milestone.status === "blocked");
}

export function getMilestonesByStatus(
  project: TrackedProject,
  statuses: StatusValue[]
): Milestone[] {
  const statusRank = new Map(statuses.map((status, index) => [status, index]));
  return project.milestones
    .filter((milestone) => statusRank.has(milestone.status))
    .sort((left, right) => {
      const leftRank = statusRank.get(left.status) ?? 0;
      const rightRank = statusRank.get(right.status) ?? 0;
      return leftRank - rightRank;
    });
}

export function getDatedCompletions(data: TrackerData) {
  return data.projects
    .flatMap((project) =>
      project.milestones
        .filter((milestone) => milestone.status === "done" && Boolean(milestone.completedAt))
        .map((milestone) => ({
          projectId: project.id,
          projectName: project.name,
          milestone
        }))
    )
    .sort((left, right) =>
      String(right.milestone.completedAt).localeCompare(String(left.milestone.completedAt))
    );
}

export function projectMatchesSearch(project: TrackedProject, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const searchable = [
    project.name,
    project.role,
    project.rootPath,
    project.activeCodePaths.join(" "),
    project.verificationCommands.map((item) => `${item.label} ${item.command}`).join(" "),
    project.milestones
      .map((item) => `${item.title} ${item.status} ${item.nextAction ?? ""} ${item.blocker ?? ""}`)
      .join(" ")
  ]
    .join(" ")
    .toLowerCase();

  return searchable.includes(needle);
}

export type ProjectFilter = "all" | "blocked" | "needs_confirmation" | "open" | "done";

export function projectMatchesFilter(project: TrackedProject, filter: ProjectFilter): boolean {
  if (filter === "all") return true;
  if (filter === "open") {
    return project.milestones.some((milestone) => openStatusOrder.includes(milestone.status));
  }

  return project.milestones.some((milestone) => milestone.status === filter);
}

export function formatStatusMix(counts: StatusCounts): string {
  return [
    `${counts.done} done`,
    `${counts.todo} todo`,
    `${counts.needs_confirmation} confirm`,
    `${counts.blocked} blocked`,
    `${counts.deferred} deferred`
  ].join(" / ");
}
