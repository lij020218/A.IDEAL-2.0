import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI model configuration
const DEFAULT_MODEL = "gpt-5.1-2025-11-13";

export const OPENAI_MODEL = process.env.OPENAI_MODEL || DEFAULT_MODEL;
