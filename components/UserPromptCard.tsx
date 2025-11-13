"use client";

import { Star, TrendingUp, Tag } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";

interface UserPrompt {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  imageUrl?: string | null;
  createdAt: string;
  user: {
    name?: string;
    email: string;
  };
}

interface UserPromptCardProps {
  prompt: UserPrompt;
}

export default function UserPromptCard({ prompt }: UserPromptCardProps) {
  return (
    <Link href={`/prompt/${prompt.id}`}>
      <div className="card-aurora group relative overflow-hidden rounded-xl p-6 cursor-pointer">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-1">
              {prompt.topic}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {prompt.prompt.length > 100
                ? prompt.prompt.substring(0, 100) + "..."
                : prompt.prompt}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {prompt.recommendedTools.slice(0, 3).map((tool, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium"
              >
                <Tag className="h-3 w-3" />
                {tool}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>0 uses</span>
              </div>
            </div>

            <div className="flex -space-x-2">
              {prompt.recommendedTools.slice(0, 3).map((tool, index) => (
                <div
                  key={index}
                  className="h-8 w-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs font-semibold"
                  title={tool}
                >
                  {tool.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
