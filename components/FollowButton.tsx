"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, UserCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  targetUserId?: string;
  size?: "xs" | "sm" | "md";
  variant?: "solid" | "outline";
  className?: string;
  initialIsFollowing?: boolean;
  onToggle?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  targetUserId,
  size = "sm",
  variant = "outline",
  className,
  initialIsFollowing,
  onToggle,
}: FollowButtonProps) {
  const { data: session, status } = useSession();
  const [isFollowing, setIsFollowing] = useState<boolean | null>(
    initialIsFollowing ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const canShow =
    !!session?.user?.id &&
    !!targetUserId &&
    session.user.id !== targetUserId;

  useEffect(() => {
    if (initialIsFollowing !== undefined) {
      setIsFollowing(initialIsFollowing);
    }
  }, [initialIsFollowing]);

  useEffect(() => {
    if (initialIsFollowing !== undefined) {
      return;
    }
    if (!canShow) return;
    let cancelled = false;

    const fetchStatus = async () => {
      setIsChecking(true);
      try {
        const response = await fetch(`/api/users/${targetUserId}/follow`);
        if (response.ok) {
          const data = await response.json();
          if (!cancelled) {
            setIsFollowing(Boolean(data.isFollowing));
          }
        } else {
          if (!cancelled) {
            setIsFollowing(false);
          }
        }
      } catch (error) {
        console.error("Error checking follow status:", error);
        if (!cancelled) {
          setIsFollowing(false);
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    };

    fetchStatus();
    return () => {
      cancelled = true;
    };
  }, [canShow, targetUserId, initialIsFollowing]);

  if (status === "loading" || !canShow) {
    return null;
  }

  const handleToggle = async () => {
    if (!targetUserId) return;
    setIsLoading(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method,
      });
      if (response.ok) {
        const nextState = !isFollowing;
        setIsFollowing(nextState);
        onToggle?.(nextState);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses =
    size === "md"
      ? "text-sm px-4 py-2"
      : size === "sm"
      ? "text-xs px-3 py-1.5"
      : "text-[11px] px-2.5 py-1";

  const isActive = Boolean(isFollowing);

  const variantClasses = isActive
    ? "bg-primary/10 text-primary border border-primary/30"
    : variant === "solid"
    ? "bg-primary text-primary-foreground hover:bg-primary/90"
    : "border border-primary/40 text-primary hover:bg-primary/10";

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || isChecking}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium transition-colors disabled:opacity-60",
        sizeClasses,
        variantClasses,
        className
      )}
      aria-pressed={isActive}
    >
      {isLoading || isChecking ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isActive ? (
        <>
          <UserCheck className="h-3.5 w-3.5" />
          팔로잉
        </>
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5" />
          팔로우
        </>
      )}
    </button>
  );
}


