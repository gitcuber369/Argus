import { generateText, Output } from "ai";
import { getModel } from "../../ai.ts";
import { z } from "zod";

export async function decompose(userMessage: string): Promise<string[]> {
  const model = getModel({ provider: "ollama", model: "qwen3:8b" });

  const result = await generateText({
    model,
    output: Output.object({ schema: z.array(z.string()).length(3) }),
    prompt: `Break the following research question into exactly 3 sub-questions. Return them as a JSON array of strings.

    Question: ${userMessage}`,
  });

  return result.output;
}
