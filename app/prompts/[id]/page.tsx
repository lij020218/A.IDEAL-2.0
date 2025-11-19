"use client";

import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { samplePrompts } from "@/lib/data/prompts";
import { Star, Copy, ExternalLink, TrendingUp, Tag, ArrowLeft } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export default function PromptDetailPage() {
  const params = useParams();
  const prompt = samplePrompts.find((p) => p.id === params.id);
  const [copied, setCopied] = useState(false);

  if (!prompt) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Prompt not found</h1>
          <Link href="/" className="text-primary hover:underline mt-4 inline-block">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to prompts
        </Link>

        {/* Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold mb-2 break-words">{prompt.title}</h1>
              <p className="text-lg text-muted-foreground">{prompt.description}</p>
            </div>
            {prompt.isFeatured && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                Featured
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            {prompt.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{prompt.rating}</span>
                <span className="text-muted-foreground">rating</span>
              </div>
            )}
            {prompt.usageCount && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold">{formatNumber(prompt.usageCount)}</span>
                <span className="text-muted-foreground">uses</span>
              </div>
            )}
            <div className="text-muted-foreground">
              Updated: {formatDate(prompt.updatedAt)}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {prompt.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-3 py-1 text-sm font-medium"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Prompt Content */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Prompt Content</h2>
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy Prompt"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-sm bg-secondary/50 p-4 rounded-md">
            {prompt.content}
          </pre>
        </div>

        {/* Recommended AI Tools */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Recommended AI Tools</h2>
          <p className="text-muted-foreground mb-6">
            These AI tools are best suited for this prompt based on their capabilities and strengths.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prompt.recommendedTools.map((tool) => (
              <a
                key={tool.id}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 p-4 border rounded-lg hover:border-primary transition-colors bg-card"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
                  {tool.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {tool.name}
                    </h3>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tool.description}
                  </p>
                  {tool.isPremium && (
                    <span className="inline-block mt-2 text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded">
                      Premium
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Usage Tips */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">💡 Usage Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Customize the prompt by replacing placeholders like [TOPIC] with your specific needs</li>
            <li>• Experiment with different AI tools to see which gives the best results</li>
            <li>• Adjust the tone and style parameters to match your requirements</li>
            <li>• Save successful variations for future use</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
