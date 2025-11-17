"use client";

import { User, Clock, Star, Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { AIProviderBadge, isAIProvider, AI_PROVIDER_LABELS } from "@/components/AIProviderBadge";

interface SavedPrompt {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  imageUrl?: string | null;
  createdAt: string;
  aiProvider?: string | null;
  aiModel?: string | null;
  views?: number;
  averageRating?: number | null;
  ratingCount?: number;
  user: {
    name?: string;
    email: string;
  };
}

interface SavedPromptCardProps {
  prompt: SavedPrompt;
}

export default function SavedPromptCard({ prompt }: SavedPromptCardProps) {
  const provider = prompt.aiProvider && isAIProvider(prompt.aiProvider) ? prompt.aiProvider : null;
  const providerLabel = provider ? AI_PROVIDER_LABELS[provider] : null;

  return (
    <Link href={`/prompt/${prompt.id}`}>
      <div className="card-aurora group relative overflow-hidden rounded-xl cursor-pointer h-full flex flex-col">
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

        <div className="p-6 flex-1 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                {prompt.topic}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                {prompt.prompt.length > 150 ? `${prompt.prompt.substring(0, 150)}...` : prompt.prompt}
              </p>
            </div>
            {provider && (
              <div className="flex flex-col items-end gap-1">
                <AIProviderBadge provider={provider} model={prompt.aiModel || undefined} size="sm" />
                {providerLabel && (
                  <span className="text-[11px] text-muted-foreground">
                    {providerLabel}
                    {prompt.aiModel ? ` · ${prompt.aiModel}` : ""}
                  </span>
                )}
              </div>
            )}
          </div>

          {prompt.recommendedTools && prompt.recommendedTools.length > 0 && (
            <div className="flex flex-wrap gap-2">
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

          <div className="mt-auto pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
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
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{prompt.views || 0}</span>
              </div>
              {prompt.averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span>{prompt.averageRating.toFixed(1)} ({prompt.ratingCount})</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
