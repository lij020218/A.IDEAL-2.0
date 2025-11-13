"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Plus, Edit2, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ko } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  color: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  currentUserId?: string;
}

export default function CalendarModal({ isOpen, onClose, challengeId, currentUserId }: CalendarModalProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [color, setColor] = useState("#3b82f6");

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleSaveEvent = async () => {
    if (!title || !startDate) {
      alert("제목과 시작일은 필수입니다");
      return;
    }

    setIsLoading(true);

    try {
      if (editingEvent) {
        // Update existing event
        const response = await fetch(`/api/challenges/${challengeId}/events`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: editingEvent.id,
            title,
            description,
            startDate,
            endDate: endDate || null,
            color,
          }),
        });

        if (response.ok) {
          await fetchEvents();
          resetForm();
        } else {
          alert("일정 수정에 실패했습니다");
        }
      } else {
        // Create new event
        const response = await fetch(`/api/challenges/${challengeId}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            startDate,
            endDate: endDate || null,
            color,
          }),
        });

        if (response.ok) {
          await fetchEvents();
          resetForm();
        } else {
          alert("일정 생성에 실패했습니다");
        }
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert("일정 저장에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/challenges/${challengeId}/events?eventId=${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchEvents();
      } else {
        alert("일정 삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("일정 삭제에 실패했습니다");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setColor("#3b82f6");
    setShowEventForm(false);
    setEditingEvent(null);
    setSelectedDate(null);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || "");
    setStartDate(event.startDate.split("T")[0]);
    setEndDate(event.endDate ? event.endDate.split("T")[0] : "");
    setColor(event.color);
    setShowEventForm(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setStartDate(format(date, "yyyy-MM-dd"));
    setShowEventForm(true);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
      return date >= eventStart && date <= eventEnd;
    });
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-aurora rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">일정 관리</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
          >
            이전
          </button>
          <h3 className="text-lg font-semibold">
            {format(currentMonth, "yyyy년 M월", { locale: ko })}
          </h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
          >
            다음
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
              {day}
            </div>
          ))}
          {calendarDays.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                className={`p-2 rounded-lg border ${
                  isToday ? "border-primary bg-primary/10" : "border-border"
                } ${isSelected ? "bg-secondary" : ""} ${
                  !isSameMonth(day, currentMonth) ? "opacity-30" : ""
                } hover:bg-secondary transition-colors min-h-[80px] flex flex-col items-start`}
              >
                <span className="text-sm font-medium">{format(day, "d")}</span>
                <div className="w-full mt-1 space-y-0.5">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs px-1 py-0.5 rounded truncate"
                      style={{ backgroundColor: event.color + "40", color: event.color }}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-muted-foreground">+{dayEvents.length - 2}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Event Form or List */}
        {!showEventForm ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">일정 목록</h3>
              <button
                onClick={() => setShowEventForm(true)}
                className="btn-aurora px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                새 일정
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">등록된 일정이 없습니다</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="p-3 bg-secondary rounded-lg flex items-start gap-3">
                    <div className="w-1 h-full rounded" style={{ backgroundColor: event.color }} />
                    <div className="flex-1">
                      <h4 className="font-semibold">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(event.startDate), "yyyy-MM-dd")}
                        {event.endDate && ` ~ ${format(new Date(event.endDate), "yyyy-MM-dd")}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.user.name || event.user.email}
                      </p>
                    </div>
                    {currentUserId === event.user.id && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingEvent ? "일정 수정" : "새 일정"}</h3>
              <button onClick={resetForm} className="text-sm text-muted-foreground hover:text-primary">
                취소
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">제목 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-aurora w-full px-3 py-2 rounded-lg"
                placeholder="일정 제목"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-aurora w-full px-3 py-2 rounded-lg resize-none"
                rows={3}
                placeholder="일정 설명 (선택)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">시작일 *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-aurora w-full px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">종료일</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-aurora w-full px-3 py-2 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">색상</label>
              <div className="flex gap-2">
                {["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full ${color === c ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleSaveEvent}
              disabled={isLoading || !title || !startDate}
              className="btn-aurora w-full py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "저장 중..." : editingEvent ? "수정하기" : "생성하기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
