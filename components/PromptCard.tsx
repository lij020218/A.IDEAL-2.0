"use client";

import { Prompt } from "@/types";
import { Star, TrendingUp, Tag } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";

interface PromptCardProps {
  prompt: Prompt;
}

export default function PromptCard({ prompt }: PromptCardProps) {
  return (
    <Link href={`/prompts/${prompt.id}`}>
      <div className="card-aurora group relative overflow-hidden rounded-xl p-6 cursor-pointer">
        {prompt.isFeatured && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Featured
            </span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-1">
              {prompt.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {prompt.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {prompt.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {prompt.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{prompt.rating}</span>
                </div>
              )}
              {prompt.usageCount && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{formatNumber(prompt.usageCount)} uses</span>
                </div>
              )}
            </div>

            <div className="flex -space-x-2">
              {prompt.recommendedTools.slice(0, 3).map((tool) => (
                <div
                  key={tool.id}
                  className="h-8 w-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs font-semibold"
                  title={tool.name}
                >
                  {tool.name.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
