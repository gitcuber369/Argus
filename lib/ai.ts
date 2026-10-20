import { createOllama } from "ai-sdk-ollama";
import { generateText, type LanguageModel } from "ai";

export type Provider =
  | "ollama"
  | "openai"
  | "anthropic"
  | "groq"
  | "openrouter"
  | "openai-compatible";

export type ModelConfig = {
  provider: Provider;
  model: string;
  apiKey?: string;
  baseURL?: string;
};

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const DEFAULT_MODEL = process.env.ARGUS_MODEL ?? "qwen3:8b";

export function getModel(config: ModelConfig): LanguageModel {
  switch (config.provider) {
    case "ollama": {
      const ollama = createOllama({ baseURL: config.baseURL ?? OLLAMA_HOST });
      return ollama(config.model);
    }
    default:
      throw new Error(`Provider "${config.provider}" not implemented yet`);
  }
}

export async function callModel(
  prompt: string,
  config: ModelConfig = { provider: "ollama", model: DEFAULT_MODEL },
): Promise<string> {
  const model = getModel(config);
  const { text } = await generateText({ model, prompt });
  return text;
}
