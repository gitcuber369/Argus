export type ReasoningNode = {
  id: string;
  userId: string;
  parentId: string | null;
  stage: "decompose" | "search" | "extract" | "critique" | "synthesize";
  thought: string;
  children: string[];
  tokensUsed: number;
  status: "thinking" | "done" | "failed";
  startedAt: number;
  finishedAt?: number;
};
export type Stage =
  "decompose" | "search" | "extract" | "critique" | "synthesize";

export type NodeStatus = "thinking" | "done" | "failed";

export type SubQuestionStatus = "pending" | "searching" | "answered" | "failed";

export type SubQuestion = {
  id: string;
  userId: string;
  question: string;
  status: SubQuestionStatus;
  evidenceIds: string[];
};

export type Evidence = {
  id: string;
  userId: string;
  claim: string;
  sourceUrl: string;
  sourceTitle: string;
  quote: string;
  confidence: string;
  subQuestionId: string;
};

export type ResearchRun = {
  id: string;
  userId: string;
  question: string;
  subQuestions: SubQuestion[];
  nodes: Map<string, ReasoningNode>;
  evidence: Map<string, Evidence>;
  status: "running" | "done" | "failed";
  startedAt: number;
  finishedAt?: number;
};
