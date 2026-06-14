import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const trackerRoot = path.resolve(__dirname, "..");
const projectsPath = path.join(trackerRoot, "projects.json");
const reportPath = path.join(trackerRoot, "PROJECT_STATUS.md");

const raw = fs.readFileSync(projectsPath, "utf8");
const data = JSON.parse(raw);

const allowedStatuses = new Set(data.statusValues ?? []);
const expectedProjectCount = 8;
const sensitivePatterns = [
  /service_role_key/i,
  /jwt_secret/i,
  /smtp_pass/i,
  /password123/i,
  /senti_live_[A-Za-z0-9_=-]+/i,
  /supabase_anon_key\s*=/i
];

function fail(message) {
  throw new Error(message);
}

function md(value) {
  return String(value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
}

function statusCounts(project) {
  const counts = Object.fromEntries([...allowedStatuses].map((status) => [status, 0]));
  for (const milestone of project.milestones ?? []) {
    counts[milestone.status] = (counts[milestone.status] ?? 0) + 1;
  }
  return counts;
}

function formatCounts(project) {
  const counts = statusCounts(project);
  const total = project.milestones?.length ?? 0;
  return [
    `${counts.done ?? 0}/${total} done`,
    `${counts.todo ?? 0} todo`,
    `${counts.needs_confirmation ?? 0} confirm`,
    `${counts.blocked ?? 0} blocked`,
    `${counts.deferred ?? 0} deferred`
  ].join("; ");
}

function pickCurrentFocus(project) {
  const order = ["in_progress", "blocked", "todo", "needs_confirmation", "deferred"];
  for (const status of order) {
    const milestone = project.milestones?.find((item) => item.status === status);
    if (milestone) {
      return milestone.nextAction || milestone.title;
    }
  }
  return "No open milestone recorded.";
}

function blockers(project) {
  const blocked = project.milestones?.filter((item) => item.status === "blocked") ?? [];
  if (!blocked.length) return "None recorded";
  return blocked.map((item) => item.title).join("; ");
}

function listMilestones(project, statuses, limit = 5) {
  const selected = (project.milestones ?? [])
    .filter((item) => statuses.includes(item.status))
    .slice(0, limit);
  if (!selected.length) return "- None recorded";
  return selected
    .map((item) => {
      const date = item.completedAt ? ` (${item.completedAt})` : "";
      const suffix = item.nextAction && !statuses.includes("done") ? ` Next: ${item.nextAction}` : "";
      return `- ${item.title}${date} [${item.status}].${suffix ? ` ${suffix}` : ""}`;
    })
    .join("\n");
}

function datedCompletions(projects) {
  const items = [];
  for (const project of projects) {
    for (const milestone of project.milestones ?? []) {
      if (milestone.status === "done" && milestone.completedAt) {
        items.push({ project: project.name, milestone });
      }
    }
  }
  return items.sort((a, b) => a.milestone.completedAt.localeCompare(b.milestone.completedAt));
}

function validate() {
  if (!Array.isArray(data.projects)) fail("projects.json must contain a projects array.");
  if (data.projects.length !== expectedProjectCount) {
    fail(`Expected ${expectedProjectCount} projects, found ${data.projects.length}.`);
  }

  const ids = new Set();
  for (const project of data.projects) {
    if (!project.id || ids.has(project.id)) fail(`Missing or duplicate project id: ${project.id}`);
    ids.add(project.id);
    if (!project.name) fail(`Project ${project.id} is missing a name.`);
    if (!project.rootPath) fail(`Project ${project.id} is missing rootPath.`);
    if (!Array.isArray(project.activeCodePaths) || !project.activeCodePaths.length) {
      fail(`Project ${project.id} must include activeCodePaths.`);
    }
    if (!Array.isArray(project.milestones) || !project.milestones.length) {
      fail(`Project ${project.id} must include milestones.`);
    }
    for (const milestone of project.milestones) {
      if (!milestone.id || !milestone.title) fail(`Project ${project.id} has a milestone missing id/title.`);
      if (!allowedStatuses.has(milestone.status)) {
        fail(`Project ${project.id} milestone ${milestone.id} has invalid status ${milestone.status}.`);
      }
      if (milestone.completedAt && !/^\d{4}-\d{2}-\d{2}$/.test(milestone.completedAt)) {
        fail(`Project ${project.id} milestone ${milestone.id} has invalid completedAt ${milestone.completedAt}.`);
      }
    }
  }

  const serialized = JSON.stringify(data);
  for (const pattern of sensitivePatterns) {
    if (pattern.test(serialized)) {
      fail(`projects.json appears to contain sensitive material matching ${pattern}.`);
    }
  }
}

validate();

const reportDate = data.updatedAt || new Date().toISOString().slice(0, 10);
const lines = [];

lines.push("# Project Status Dashboard");
lines.push("");
lines.push(`Generated from projects.json updated ${reportDate}.`);
lines.push("");
lines.push("Manual milestone records are the source of truth. Evidence scans and verification commands support the records but do not automatically mark work complete.");
lines.push("");
lines.push("## Summary");
lines.push("");
lines.push("| Project | Ecosystem Role | Status Mix | Current Focus | Blockers |");
lines.push("|---|---|---|---|---|");

for (const project of data.projects) {
  lines.push(
    `| ${md(project.name)} | ${md(project.role)} | ${md(formatCounts(project))} | ${md(pickCurrentFocus(project))} | ${md(blockers(project))} |`
  );
}

const completed = datedCompletions(data.projects);
lines.push("");
lines.push("## Completed Since Last Check-In");
lines.push("");
lines.push("Initial baseline only; no post-baseline completions are recorded yet.");
lines.push("");
lines.push("## Known Dated Completions");
lines.push("");
if (completed.length) {
  for (const item of completed) {
    lines.push(`- ${item.milestone.completedAt}: ${item.project} - ${item.milestone.title}`);
  }
} else {
  lines.push("- None recorded with exact dates yet.");
}

lines.push("");
lines.push("## Project Details");

for (const project of data.projects) {
  lines.push("");
  lines.push(`### ${project.name}`);
  lines.push("");
  lines.push(`- Root: \`${project.rootPath}\``);
  lines.push(`- Active code path(s): ${project.activeCodePaths.map((item) => `\`${item}\``).join(", ")}`);
  lines.push(`- Verification commands: ${(project.verificationCommands ?? []).map((item) => `\`${item.command}\``).join(", ") || "None recorded"}`);
  lines.push("");
  lines.push("Confirmed or Source-Explicit Done:");
  lines.push(listMilestones(project, ["done"], 6));
  lines.push("");
  lines.push("Needs Confirmation:");
  lines.push(listMilestones(project, ["needs_confirmation"], 6));
  lines.push("");
  lines.push("Open Next Actions:");
  lines.push(listMilestones(project, ["in_progress", "blocked", "todo"], 8));
}

lines.push("");
lines.push("## Status Semantics");
lines.push("");
lines.push("- `done`: source-explicit or manually confirmed completion. `completedAt` is only filled when the exact date is known.");
lines.push("- `needs_confirmation`: source suggests the item exists or is complete, but it has not been independently verified in this tracker.");
lines.push("- `todo`: planned work not yet completed.");
lines.push("- `blocked`: cannot proceed cleanly until a named blocker is resolved.");
lines.push("- `deferred`: intentionally sequenced behind other work.");

fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Rendered ${reportPath}`);
