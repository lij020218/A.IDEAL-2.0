import { Prompt } from "@/types";
import { aiTools } from "./ai-tools";

export const samplePrompts: Prompt[] = [
  {
    id: "1",
    title: "Advanced Blog Post Writer",
    description: "Create engaging, SEO-optimized blog posts with proper structure",
    content: `You are an expert content writer. Create a comprehensive blog post about [TOPIC] with the following requirements:

1. Write an attention-grabbing headline
2. Include an engaging introduction with a hook
3. Structure the content with clear H2 and H3 headings
4. Add actionable insights and real-world examples
5. Include a compelling conclusion with a call-to-action
6. Optimize for SEO with natural keyword integration

Target audience: [AUDIENCE]
Word count: [WORD_COUNT]
Tone: [professional/casual/friendly]`,
    category: "writing",
    tags: ["blog", "SEO", "content-marketing", "writing"],
    recommendedTools: [aiTools[0], aiTools[1], aiTools[5]],
    rating: 4.9,
    usageCount: 1523,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    isFeatured: true,
  },
  {
    id: "2",
    title: "Code Review Assistant",
    description: "Comprehensive code review with best practices and improvements",
    content: `Act as a senior software engineer performing a detailed code review. Analyze the following code:

[PASTE CODE HERE]

Please provide:
1. Overall code quality assessment
2. Potential bugs or security vulnerabilities
3. Performance optimization suggestions
4. Best practices violations
5. Refactoring recommendations
6. Testing suggestions

Focus on: [LANGUAGE/FRAMEWORK]
Experience level: [beginner/intermediate/advanced]`,
    category: "coding",
    tags: ["code-review", "programming", "best-practices", "refactoring"],
    recommendedTools: [aiTools[0], aiTools[1], aiTools[4]],
    rating: 4.8,
    usageCount: 2341,
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-18"),
    isFeatured: true,
  },
  {
    id: "3",
    title: "Product Description Generator",
    description: "Create compelling product descriptions that convert",
    content: `Create a compelling product description for [PRODUCT NAME] that drives conversions.

Product details:
- Category: [CATEGORY]
- Key features: [FEATURES]
- Target audience: [AUDIENCE]
- Unique selling points: [USP]

Requirements:
1. Write a captivating headline (max 10 words)
2. Opening paragraph that hooks the reader
3. Bullet points highlighting key benefits (not just features)
4. Address potential objections
5. Create urgency without being pushy
6. End with a strong call-to-action

Tone: [persuasive/professional/friendly]
Length: [short/medium/long]`,
    category: "marketing",
    tags: ["e-commerce", "copywriting", "conversion", "marketing"],
    recommendedTools: [aiTools[0], aiTools[1]],
    rating: 4.7,
    usageCount: 892,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
    isFeatured: false,
  },
  {
    id: "4",
    title: "Professional Image Generation",
    description: "Detailed prompts for creating stunning AI-generated images",
    content: `Create a highly detailed image of [SUBJECT] with the following specifications:

Visual Style:
- Art style: [photorealistic/digital art/oil painting/watercolor]
- Mood: [dramatic/peaceful/energetic/mysterious]
- Color palette: [vibrant/muted/monochrome/pastel]

Composition:
- Perspective: [close-up/wide shot/aerial view]
- Lighting: [golden hour/studio lighting/dramatic shadows]
- Background: [detailed/blurred/minimal]

Quality Settings:
- Resolution: 8K, ultra-detailed
- Camera: [specific lens if photorealistic]
- Additional: sharp focus, professional photography

Exclude: [unwanted elements]`,
    category: "design",
    tags: ["image-generation", "AI-art", "visual-design", "creative"],
    recommendedTools: [aiTools[2], aiTools[3], aiTools[7]],
    rating: 4.9,
    usageCount: 3124,
    createdAt: new Date("2024-01-22"),
    updatedAt: new Date("2024-01-22"),
    isFeatured: true,
  },
  {
    id: "5",
    title: "Business Strategy Analyzer",
    description: "Analyze business strategies and provide actionable insights",
    content: `Act as a business strategy consultant. Analyze the following business scenario:

Company: [COMPANY NAME]
Industry: [INDUSTRY]
Current situation: [DESCRIPTION]
Challenge: [MAIN CHALLENGE]

Please provide:
1. SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
2. Market positioning assessment
3. Competitive advantage analysis
4. Strategic recommendations (short-term and long-term)
5. Key performance indicators to track
6. Risk assessment and mitigation strategies
7. Implementation roadmap

Focus areas: [specific areas to analyze]`,
    category: "business",
    tags: ["strategy", "business-analysis", "consulting", "planning"],
    recommendedTools: [aiTools[0], aiTools[1], aiTools[5]],
    rating: 4.6,
    usageCount: 756,
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
    isFeatured: false,
  },
  {
    id: "6",
    title: "Interactive Learning Tutor",
    description: "Personalized tutoring for any subject with adaptive learning",
    content: `You are an expert tutor for [SUBJECT]. Help me learn with the following approach:

Student level: [beginner/intermediate/advanced]
Learning style: [visual/auditory/kinesthetic/reading-writing]
Goal: [specific learning objective]

Teaching method:
1. Start with a simple explanation using analogies
2. Provide concrete examples
3. Ask checking questions to ensure understanding
4. Gradually increase complexity
5. Offer practice problems with step-by-step solutions
6. Adapt explanations based on my responses

Please be patient, encouraging, and use the Socratic method to help me discover answers.

Topic to learn: [SPECIFIC TOPIC]`,
    category: "education",
    tags: ["learning", "tutoring", "education", "teaching"],
    recommendedTools: [aiTools[0], aiTools[1], aiTools[5]],
    rating: 4.8,
    usageCount: 1645,
    createdAt: new Date("2024-01-28"),
    updatedAt: new Date("2024-01-28"),
    isFeatured: true,
  },
];

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
