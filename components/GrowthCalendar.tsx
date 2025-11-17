"use client";

import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface Curriculum {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  description: string;
  estimatedTime: number;
  progressStatus: string;
}

interface GrowthCalendarProps {
  topicId: string;
  curriculum: Curriculum[];
}

const normalizeStatus = (status?: string | null) => {
  if (!status) return "not_started";
  const lowered = status.toLowerCase();
  if (lowered === "completed") return "completed";
  if (lowered === "in-progress" || lowered === "in progress" || lowered === "in_progress") {
    return "in_progress";
  }
  if (lowered === "paused") return "paused";
  return "not_started";
};

export default function GrowthCalendar({ topicId, curriculum }: GrowthCalendarProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const initialStatusMap = useMemo(() => {
    const map = new Map<number, string>();
    curriculum.forEach((item) => {
      map.set(item.dayNumber, normalizeStatus(item.progressStatus));
    });
    return map;
  }, [curriculum]);
  const [statusMap, setStatusMap] = useState(initialStatusMap);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProgress = async () => {
      try {
        setIsRefreshing(true);
        const response = await fetch(`/api/growth/progress?topicId=${topicId}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!isMounted) return;
        const map = new Map<number, string>();
        data.progress.forEach((p: { dayNumber: number; status: string }) => {
          map.set(p.dayNumber, normalizeStatus(p.status));
        });
        setStatusMap((prev) => {
          // merge to keep any missing days from curriculum
          const merged = new Map(prev);
          map.forEach((value, key) => merged.set(key, value));
          return merged;
        });
      } catch (error) {
        console.error("[GrowthCalendar] Failed to refresh progress:", error);
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [topicId]);

  // Get curriculum dates
  const curriculumDates = curriculum.map((c) => new Date(c.date));
  const minDate = curriculumDates.length > 0 ? new Date(Math.min(...curriculumDates.map(d => d.getTime()))) : new Date();
  const maxDate = curriculumDates.length > 0 ? new Date(Math.max(...curriculumDates.map(d => d.getTime()))) : new Date();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get curriculum for a specific date
  const getCurriculumForDate = (date: Date) => {
    return curriculum.find((c) => isSameDay(new Date(c.date), date));
  };

  // Navigate months
  const previousMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (newMonth >= startOfMonth(minDate)) {
      setCurrentMonth(newMonth);
    }
  };

  const nextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (newMonth <= startOfMonth(maxDate)) {
      setCurrentMonth(newMonth);
    }
  };

  const handleDateClick = (date: Date, item: Curriculum) => {
    router.push(`/grow/${topicId}/learn/${item.dayNumber}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground dark:text-white/60" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/30 dark:bg-green-500/20 backdrop-blur-md border-green-500/60 dark:border-green-500/40 shadow-lg shadow-green-500/20 dark:shadow-green-500/30";
      case "in_progress":
        return "bg-yellow-500/30 dark:bg-yellow-500/20 backdrop-blur-md border-yellow-500/60 dark:border-yellow-500/40 shadow-lg shadow-yellow-500/20 dark:shadow-yellow-500/30";
      default:
        return "bg-white/50 dark:bg-white/5 backdrop-blur-md border-white/40 dark:border-white/20 shadow-lg shadow-black/5 dark:shadow-black/15";
    }
  };

  // Calculate starting day of week (0 = Sunday)
  const firstDayOfMonth = monthStart.getDay();
  const emptyDays = Array(firstDayOfMonth).fill(null);

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold dark:text-white/90">
          {format(currentMonth, "yyyy년 MM월", { locale: ko })}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            disabled={currentMonth <= startOfMonth(minDate)}
            className="px-3 py-2 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground dark:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            disabled={currentMonth >= startOfMonth(maxDate)}
            className="px-3 py-2 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground dark:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      {isRefreshing && (
        <p className="text-xs text-muted-foreground dark:text-white/80 text-right">진행 상황 새로고침 중...</p>
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-medium p-2 dark:text-white/90 ${
              index === 0 ? "text-red-500 dark:text-red-400" : index === 6 ? "text-blue-500 dark:text-blue-400" : ""
            }`}
          >
            {day}
          </div>
        ))}

        {/* Empty cells before month starts */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Calendar Days */}
        {daysInMonth.map((date) => {
          const item = getCurriculumForDate(date);
          const isToday = isSameDay(date, new Date());
          const isPast = isBefore(date, startOfDay(new Date())) && !isToday;

          if (!item) {
            return (
              <div
                key={date.toISOString()}
                className="aspect-square p-2 text-center text-sm text-muted-foreground/50 dark:text-white/30"
              >
                {format(date, "d")}
              </div>
            );
          }

          const currentStatus = normalizeStatus(statusMap.get(item.dayNumber) || item.progressStatus);

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date, item)}
              className={`aspect-square p-2 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-xl ${getStatusColor(
                currentStatus
              )} ${isToday ? "ring-2 ring-primary dark:ring-primary/60 shadow-xl shadow-primary/20 dark:shadow-primary/30" : ""}`}
            >
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <span className="text-sm font-medium text-foreground dark:text-white/90">{format(date, "d")}</span>
                {getStatusIcon(currentStatus)}
                <span className="text-xs line-clamp-2 text-center px-1 text-foreground dark:text-white/80">
                  {item.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/20 shadow-lg shadow-black/5 dark:shadow-black/15">
          <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
          <span className="text-foreground dark:text-white/80">완료</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/20 shadow-lg shadow-black/5 dark:shadow-black/15">
          <Clock className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
          <span className="text-foreground dark:text-white/80">학습 중</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/20 shadow-lg shadow-black/5 dark:shadow-black/15">
          <Circle className="h-4 w-4 text-muted-foreground dark:text-white/60" />
          <span className="text-foreground dark:text-white/80">미시작</span>
        </div>
      </div>
    </div>
  );
}
