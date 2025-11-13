"use client";

import { FileText, User, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";

interface SavedPrompt {
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

interface SavedPromptCardProps {
  prompt: SavedPrompt;
}

export default function SavedPromptCard({ prompt }: SavedPromptCardProps) {
  return (
    <Link href={`/prompt/${prompt.id}`}>
      <div className="card-aurora group relative overflow-hidden rounded-xl cursor-pointer h-full flex flex-col">
        {/* Image Section */}
        {prompt.imageUrl && (
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={prompt.imageUrl}
              alt={prompt.topic}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        {/* Content Section */}
        <div className="p-6 flex-1 flex flex-col">

          <div className="flex-1">
            <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {prompt.topic}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {prompt.prompt.length > 150
                ? prompt.prompt.substring(0, 150) + "..."
                : prompt.prompt}
            </p>
          </div>

          {/* Tools Section */}
          {prompt.recommendedTools && prompt.recommendedTools.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {prompt.recommendedTools.slice(0, 3).map((tool, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium"
                >
                  {tool}
                </span>
              ))}
              {prompt.recommendedTools.length > 3 && (
                <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                  +{prompt.recommendedTools.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[120px]">
                {prompt.user.name || prompt.user.email.split("@")[0]}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(prompt.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
