import { decompose } from "./stages/decompose.ts";
import { search } from "./stages/search.ts";
import { extract } from "./stages/extract.ts";
import { log } from "../log.ts";
import type {
  ReasoningNode,
  ResearchRun,
  SubQuestion,
  Stage,
} from "../types.ts";
import { v4 as uuidv4 } from "uuid";

function newId(prefix: string): string {
  return `${prefix}_${uuidv4().slice(0, 8)}`;
}

export async function runAgent(
  question: string,
  options: { userId: string; signal?: AbortSignal },
): Promise<ResearchRun> {
  const { userId, signal } = options;

  const run: ResearchRun = {
    id: newId("run"),
    userId,
    question,
    subQuestions: [],
    nodes: new Map(),
    evidence: new Map(),
    status: "running",
    startedAt: Date.now(),
  };

  function startNode(
    stage: Stage,
    parentId: string | null,
    thought: string,
  ): string {
    const id = newId("n");
    const node: ReasoningNode = {
      id,
      userId,
      parentId,
      stage,
      thought,
      children: [],
      status: "thinking",
      tokensUsed: 0,
      startedAt: Date.now(),
    };
    run.nodes.set(id, node);

    if (parentId) {
      const parent = run.nodes.get(parentId);
      if (parent) parent.children.push(id);
    }
    return id;
  }

  function finishNode(id: string, status: "done" | "failed" = "done"): void {
    const node = run.nodes.get(id);
    if (!node) return;
    run.nodes.set(id, { ...node, status, finishedAt: Date.now() });
  }

  try {
    signal?.throwIfAborted();

    const decomposeNodeId = startNode("decompose", null, question);
    const decomposeStart = Date.now();
    const subQuestionTexts = await decompose(question);
    log({
      runId: run.id,
      userId,
      stage: "decompose",
      durationMs: Date.now() - decomposeStart,
      outcome: "ok",
    });
    finishNode(decomposeNodeId);

    run.subQuestions = subQuestionTexts.map((text): SubQuestion => ({
      id: newId("sq"),
      userId,
      question: text,
      status: "pending",
      evidenceIds: [],
    }));

    for (const subQuestion of run.subQuestions) {
      signal?.throwIfAborted();
      subQuestion.status = "searching";

      const searchNodeId = startNode(
        "search",
        decomposeNodeId,
        subQuestion.question,
      );
      const searchStart = Date.now();
      const results = await search(subQuestion.question, signal);
      log({
        runId: run.id,
        userId,
        stage: "search",
        durationMs: Date.now() - searchStart,
        outcome: "ok",
      });
      finishNode(searchNodeId);

      const extractNodeId = startNode(
        "extract",
        searchNodeId,
        `Extracting evidence for: ${subQuestion.question}`,
      );
      const extractStart = Date.now();
      const evidence = await extract(
        results,
        subQuestion.id,
        userId,
        signal,
      );
      log({
        runId: run.id,
        userId,
        stage: "extract",
        durationMs: Date.now() - extractStart,
        outcome: "ok",
      });
      finishNode(extractNodeId);

      for (const item of evidence) {
        run.evidence.set(item.id, item);
        subQuestion.evidenceIds.push(item.id);
      }
      subQuestion.status = "answered";
    }

    run.status = "done";
    run.finishedAt = Date.now();
    return run;
  } catch (err) {
    run.status = "failed";
    run.finishedAt = Date.now();
    throw err;
  }
}

function serializeRun(run: ResearchRun) {
  return {
    ...run,
    nodes: Object.fromEntries(run.nodes),
    evidence: Object.fromEntries(run.evidence),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const run = await runAgent("What are the up sides of having coffee", {
    userId: "local",
  });
  console.log(JSON.stringify(serializeRun(run), null, 2));
}
