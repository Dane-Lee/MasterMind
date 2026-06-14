export type StatusValue =
  | "todo"
  | "in_progress"
  | "done"
  | "blocked"
  | "deferred"
  | "needs_confirmation";

export interface TrackingPolicy {
  sourceOfTruth?: string;
  completionModel?: string;
  completedAtPolicy?: string;
  credentialPolicy?: string;
}

export interface VerificationCommand {
  label: string;
  cwd: string;
  command: string;
}

export interface SourceDoc {
  title: string;
  path: string;
  sourceType: string;
  usedFor?: string;
}

export interface Milestone {
  id: string;
  title: string;
  status: StatusValue;
  completedAt: string | null;
  source: string;
  evidence: string;
  blocker: string | null;
  nextAction: string | null;
  notes: string | null;
}

export interface CheckIn {
  date: string;
  type: string;
  summary?: string;
  evidenceSnapshot?: string;
  notes?: string[];
}

export interface TrackedProject {
  id: string;
  name: string;
  role: string;
  rootPath: string;
  activeCodePaths: string[];
  verificationCommands: VerificationCommand[];
  sourceDocs: SourceDoc[];
  milestones: Milestone[];
  checkIns?: CheckIn[];
}

export interface TrackerData {
  schemaVersion: string;
  createdAt: string;
  updatedAt: string;
  statusValues: StatusValue[];
  trackingPolicy?: TrackingPolicy;
  projects: TrackedProject[];
}

export interface StatusCounts {
  todo: number;
  in_progress: number;
  done: number;
  blocked: number;
  deferred: number;
  needs_confirmation: number;
}
