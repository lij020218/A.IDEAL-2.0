"use client";

import { PromptCategory } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  selectedCategory: PromptCategory | "all";
  onCategoryChange: (category: PromptCategory | "all") => void;
}

const categories: { value: PromptCategory | "all"; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "🌟" },
  { value: "writing", label: "Writing", icon: "✍️" },
  { value: "coding", label: "Coding", icon: "💻" },
  { value: "marketing", label: "Marketing", icon: "📢" },
  { value: "design", label: "Design", icon: "🎨" },
  { value: "business", label: "Business", icon: "💼" },
  { value: "education", label: "Education", icon: "📚" },
  { value: "productivity", label: "Productivity", icon: "⚡" },
  { value: "creative", label: "Creative", icon: "🎭" },
  { value: "analysis", label: "Analysis", icon: "📊" },
];

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-2 min-w-max">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              selectedCategory === category.value
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
