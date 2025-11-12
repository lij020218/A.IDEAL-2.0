import { AITool } from "@/types";

export const aiTools: AITool[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    description: "OpenAI's powerful conversational AI for text generation and analysis",
    url: "https://chat.openai.com",
    category: "text-generation",
    isPremium: true,
  },
  {
    id: "claude",
    name: "Claude",
    description: "Anthropic's AI assistant for thoughtful and detailed conversations",
    url: "https://claude.ai",
    category: "text-generation",
    isPremium: true,
  },
  {
    id: "midjourney",
    name: "Midjourney",
    description: "Leading AI image generation tool for creative visuals",
    url: "https://www.midjourney.com",
    category: "image-generation",
    isPremium: true,
  },
  {
    id: "dall-e",
    name: "DALL-E 3",
    description: "OpenAI's advanced image generation from text descriptions",
    url: "https://openai.com/dall-e-3",
    category: "image-generation",
    isPremium: true,
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    description: "AI pair programmer for code completion and generation",
    url: "https://github.com/features/copilot",
    category: "code-assistant",
    isPremium: true,
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Google's multimodal AI for text, code, and analysis",
    url: "https://gemini.google.com",
    category: "general",
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    description: "AI-powered search and research assistant",
    url: "https://www.perplexity.ai",
    category: "general",
  },
  {
    id: "stable-diffusion",
    name: "Stable Diffusion",
    description: "Open-source image generation model",
    url: "https://stability.ai/stable-diffusion",
    category: "image-generation",
  },
  {
    id: "eleven-labs",
    name: "ElevenLabs",
    description: "Advanced AI voice generation and cloning",
    url: "https://elevenlabs.io",
    category: "audio-generation",
    isPremium: true,
  },
  {
    id: "runway",
    name: "Runway",
    description: "AI tools for video editing and generation",
    url: "https://runwayml.com",
    category: "video-generation",
    isPremium: true,
  },
];

export function getToolsByCategory(category: string): AITool[] {
  return aiTools.filter((tool) => tool.category === category);
}

export function getToolById(id: string): AITool | undefined {
  return aiTools.find((tool) => tool.id === id);
}
