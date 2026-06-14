import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CircleDashed,
  Clipboard,
  ClipboardList,
  Copy,
  HelpCircle,
  ListChecks,
  Search,
  Terminal,
  X
} from "lucide-react";
import { trackerData } from "./data/trackerData";
import {
  formatStatusMix,
  getBlockedMilestones,
  getCurrentFocus,
  getDashboardSummary,
  getDatedCompletions,
  getMilestonesByStatus,
  getStatusCounts,
  projectMatchesFilter,
  projectMatchesSearch,
  statusLabels,
  type ProjectFilter
} from "./lib/tracker";
import type { Milestone, StatusValue, TrackedProject, VerificationCommand } from "./types/tracker";

const filters: Array<{ value: ProjectFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "blocked", label: "Blocked" },
  { value: "needs_confirmation", label: "Needs confirmation" },
  { value: "open", label: "Open" },
  { value: "done", label: "Done work" }
];

const statusIconMap: Record<StatusValue, ReactNode> = {
  blocked: <AlertTriangle aria-hidden="true" size={15} />,
  done: <CheckCircle2 aria-hidden="true" size={15} />,
  needs_confirmation: <HelpCircle aria-hidden="true" size={15} />,
  todo: <CircleDashed aria-hidden="true" size={15} />,
  in_progress: <ListChecks aria-hidden="true" size={15} />,
  deferred: <ClipboardList aria-hidden="true" size={15} />
};

export function App() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");

  const summary = useMemo(() => getDashboardSummary(trackerData), []);
  const datedCompletions = useMemo(() => getDatedCompletions(trackerData), []);
  const filteredProjects = useMemo(
    () =>
      trackerData.projects.filter(
        (project) => projectMatchesSearch(project, query) && projectMatchesFilter(project, filter)
      ),
    [filter, query]
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MasterMind</p>
          <h1>Progress Dashboard</h1>
        </div>
        <div className="updated-pill">Updated {trackerData.updatedAt}</div>
      </header>

      <section className="summary-grid" aria-label="Progress summary">
        <MetricCard label="Projects" value={summary.totalProjects} tone="neutral" />
        <MetricCard label="Milestones" value={summary.totalMilestones} tone="blue" />
        <MetricCard label="Done" value={summary.done} tone="green" />
        <MetricCard label="Blocked" value={summary.blocked} tone="red" />
        <MetricCard label="Confirm" value={summary.needsConfirmation} tone="amber" />
      </section>

      <section className="toolbar" aria-label="Project filters">
        <label className="search-field">
          <Search aria-hidden="true" size={18} />
          <span className="sr-only">Search projects</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, paths, commands"
          />
          {query ? (
            <button
              className="icon-button"
              type="button"
              title="Clear search"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <X aria-hidden="true" size={16} />
            </button>
          ) : null}
        </label>

        <div className="segmented-control" role="group" aria-label="Project status filter">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              className={filter === item.value ? "is-active" : ""}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="content-grid">
        <div className="project-list" aria-label="Projects">
          <div className="list-header">
            <h2>{filteredProjects.length} projects</h2>
            <span>{formatStatusMix(getCombinedCounts(filteredProjects))}</span>
          </div>

          {filteredProjects.map((project) => (
            <ProjectPanel key={project.id} project={project} />
          ))}

          {!filteredProjects.length ? (
            <div className="empty-state">No projects match the current filters.</div>
          ) : null}
        </div>

        <aside className="side-rail" aria-label="Known dated completions">
          <section className="rail-section">
            <h2>Known Dated Completions</h2>
            <div className="completion-list">
              {datedCompletions.length ? (
                datedCompletions.map((item) => (
                  <div className="completion-row" key={`${item.projectId}-${item.milestone.id}`}>
                    <time>{item.milestone.completedAt}</time>
                    <strong>{item.projectName}</strong>
                    <span>{item.milestone.title}</span>
                  </div>
                ))
              ) : (
                <p className="muted">None recorded with exact dates.</p>
              )}
            </div>
          </section>

          <section className="rail-section">
            <h2>Status Semantics</h2>
            <dl className="semantics-list">
              {trackerData.statusValues.map((status) => (
                <div key={status}>
                  <dt>
                    <StatusBadge status={status} />
                  </dt>
                  <dd>{semanticDescription(status)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "neutral" | "blue" | "green" | "red" | "amber";
}) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProjectPanel({ project }: { project: TrackedProject }) {
  const counts = getStatusCounts(project);
  const blockers = getBlockedMilestones(project);
  const openMilestones = getMilestonesByStatus(project, ["blocked", "in_progress", "todo"]);
  const confirmMilestones = getMilestonesByStatus(project, ["needs_confirmation"]);
  const doneMilestones = getMilestonesByStatus(project, ["done"]);
  const deferredMilestones = getMilestonesByStatus(project, ["deferred"]);

  return (
    <article className="project-panel">
      <header className="project-heading">
        <div>
          <h3>{project.name}</h3>
          <p>{project.role}</p>
        </div>
        <div className="status-mix" aria-label={`${project.name} status mix`}>
          {trackerData.statusValues.map((status) => (
            <span key={status} className={`count-pill status-${status}`}>
              {statusIconMap[status]}
              {counts[status]}
            </span>
          ))}
        </div>
      </header>

      <div className="project-meta">
        <div>
          <span>Current focus</span>
          <strong>{getCurrentFocus(project)}</strong>
        </div>
        <div>
          <span>Root</span>
          <code>{project.rootPath}</code>
        </div>
      </div>

      {blockers.length ? (
        <div className="blocker-strip">
          <AlertTriangle aria-hidden="true" size={16} />
          <span>{blockers.map((item) => item.blocker || item.title).join(" | ")}</span>
        </div>
      ) : null}

      <VerificationCommands commands={project.verificationCommands} />

      <MilestoneSection title="Open Next Actions" milestones={openMilestones} />
      <MilestoneSection title="Needs Confirmation" milestones={confirmMilestones} />
      <MilestoneSection title="Done" milestones={doneMilestones} compact />
      <MilestoneSection title="Deferred" milestones={deferredMilestones} compact />
    </article>
  );
}

function VerificationCommands({ commands }: { commands: VerificationCommand[] }) {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  if (!commands.length) {
    return null;
  }

  async function copyCommand(command: VerificationCommand) {
    await navigator.clipboard.writeText(command.command);
    setCopiedCommand(command.label);
    window.setTimeout(() => setCopiedCommand(null), 1400);
  }

  return (
    <section className="command-section" aria-label="Verification commands">
      <h4>
        <Terminal aria-hidden="true" size={16} />
        Verification
      </h4>
      <div className="command-list">
        {commands.map((command) => (
          <div className="command-row" key={`${command.cwd}-${command.label}-${command.command}`}>
            <div>
              <strong>{command.label}</strong>
              <code>{command.command}</code>
              <span>{command.cwd}</span>
            </div>
            <button
              type="button"
              title={`Copy ${command.label}`}
              onClick={() => void copyCommand(command)}
            >
              {copiedCommand === command.label ? (
                <Check aria-hidden="true" size={16} />
              ) : (
                <Copy aria-hidden="true" size={16} />
              )}
              <span>{copiedCommand === command.label ? "Copied" : "Copy"}</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function MilestoneSection({
  title,
  milestones,
  compact = false
}: {
  title: string;
  milestones: Milestone[];
  compact?: boolean;
}) {
  if (!milestones.length) {
    return null;
  }

  return (
    <section className="milestone-section">
      <h4>{title}</h4>
      <div className={compact ? "milestone-list compact" : "milestone-list"}>
        {milestones.map((milestone) => (
          <div className="milestone-row" key={milestone.id}>
            <StatusBadge status={milestone.status} />
            <div>
              <strong>{milestone.title}</strong>
              {milestone.nextAction ? <p>Next: {milestone.nextAction}</p> : null}
              {milestone.blocker ? <p>Blocker: {milestone.blocker}</p> : null}
              {!compact ? <span>{milestone.evidence}</span> : null}
              {milestone.completedAt ? <time>{milestone.completedAt}</time> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: StatusValue }) {
  return (
    <span className={`status-badge status-${status}`}>
      {statusIconMap[status]}
      {statusLabels[status]}
    </span>
  );
}

function getCombinedCounts(projects: TrackedProject[]) {
  return projects.reduce((counts, project) => {
    const projectCounts = getStatusCounts(project);
    for (const status of trackerData.statusValues) {
      counts[status] += projectCounts[status];
    }
    return counts;
  }, getStatusCounts({ ...trackerData.projects[0], milestones: [] }));
}

function semanticDescription(status: StatusValue): string {
  const descriptions: Record<StatusValue, string> = {
    done: "Source-explicit or manually confirmed completion.",
    needs_confirmation: "Source suggests the work exists, but it has not been independently verified.",
    todo: "Planned work not yet completed.",
    in_progress: "Active work already started.",
    blocked: "Cannot proceed cleanly until the named blocker is resolved.",
    deferred: "Intentionally sequenced behind other work."
  };

  return descriptions[status];
}
