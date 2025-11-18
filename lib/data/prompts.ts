import { Prompt } from "@/types";

export const samplePrompts: Prompt[] = [];

export function getPromptsByCategory(category: string): Prompt[] {
  return samplePrompts.filter((prompt) => prompt.category === category);
}

export function getFeaturedPrompts(): Prompt[] {
  return samplePrompts.filter((prompt) => prompt.isFeatured);
}

export function searchPrompts(query: string): Prompt[] {
  const lowercaseQuery = query.toLowerCase();
  return samplePrompts.filter(
    (prompt) =>
      prompt.title.toLowerCase().includes(lowercaseQuery) ||
      prompt.description.toLowerCase().includes(lowercaseQuery) ||
      prompt.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
  );
}
