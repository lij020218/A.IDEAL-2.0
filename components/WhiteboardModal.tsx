"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, Type, Trash2, Square } from "lucide-react";

interface WhiteboardItem {
  id: string;
  type: string;
  content: string;
  position: string; // JSON
  size: string; // JSON
  style?: string | null; // JSON
}

interface Whiteboard {
  id: string;
  title: string;
  items: WhiteboardItem[];
}

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  messageToAdd?: { content: string } | null;
  onMessageAdded?: () => void;
}

export default function WhiteboardModal({
  isOpen,
  onClose,
  challengeId,
  messageToAdd,
  onMessageAdded,
}: WhiteboardModalProps) {
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [selectedWhiteboard, setSelectedWhiteboard] = useState<Whiteboard | null>(null);
  const [showNewWhiteboardForm, setShowNewWhiteboardForm] = useState(false);
  const [newWhiteboardTitle, setNewWhiteboardTitle] = useState("");
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchWhiteboards();
    }
  }, [isOpen]);

  const prevMessageToAddRef = useRef<{ content: string } | null>(null);

  useEffect(() => {
    if (messageToAdd && selectedWhiteboard && messageToAdd !== prevMessageToAddRef.current) {
      handleAddMessageToWhiteboard(messageToAdd.content);
      prevMessageToAddRef.current = messageToAdd;
    }
  }, [messageToAdd, selectedWhiteboard]);

  const fetchWhiteboards = async () => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/whiteboards`);
      if (response.ok) {
        const data = await response.json();
        setWhiteboards(data.whiteboards);
        if (data.whiteboards.length > 0) {
          if (!selectedWhiteboard) {
            setSelectedWhiteboard(data.whiteboards[0]);
          } else {
            // Update the selected whiteboard with latest data
            const updatedSelected = data.whiteboards.find(
              (wb: Whiteboard) => wb.id === selectedWhiteboard.id
            );
            if (updatedSelected) {
              setSelectedWhiteboard(updatedSelected);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching whiteboards:", error);
    }
  };

  const handleCreateWhiteboard = async () => {
    if (!newWhiteboardTitle.trim()) {
      alert("화이트보드 제목을 입력해주세요");
      return;
    }

    try {
      const response = await fetch(`/api/challenges/${challengeId}/whiteboards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newWhiteboardTitle }),
      });

      if (response.ok) {
        await fetchWhiteboards();
        setNewWhiteboardTitle("");
        setShowNewWhiteboardForm(false);
      } else {
        alert("화이트보드 생성에 실패했습니다");
      }
    } catch (error) {
      console.error("Error creating whiteboard:", error);
      alert("화이트보드 생성에 실패했습니다");
    }
  };

  const getRandomPosition = () => {
    // Generate random position within canvas bounds
    const maxX = 600; // Approximate canvas width minus item width
    const maxY = 400; // Approximate canvas height minus item height
    return {
      x: Math.floor(Math.random() * maxX) + 50,
      y: Math.floor(Math.random() * maxY) + 50,
    };
  };

  const handleAddTextBox = async () => {
    if (!selectedWhiteboard) return;

    try {
      const response = await fetch(`/api/challenges/${challengeId}/whiteboards/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whiteboardId: selectedWhiteboard.id,
          type: "text",
          content: "새 텍스트",
          position: getRandomPosition(),
          size: { width: 200, height: 100 },
          style: { color: "#ffffff", fontSize: 16 },
        }),
      });

      if (response.ok) {
        await fetchWhiteboards();
      }
    } catch (error) {
      console.error("Error adding text box:", error);
    }
  };

  const handleAddMessageToWhiteboard = async (content: string) => {
    if (!selectedWhiteboard) return;

    try {
      const response = await fetch(`/api/challenges/${challengeId}/whiteboards/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whiteboardId: selectedWhiteboard.id,
          type: "message",
          content,
          position: getRandomPosition(),
          size: { width: 250, height: 120 },
          style: { color: "#ffffff", fontSize: 14 },
        }),
      });

      if (response.ok) {
        await fetchWhiteboards();
        if (onMessageAdded) {
          onMessageAdded();
        }
      }
    } catch (error) {
      console.error("Error adding message to whiteboard:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(
        `/api/challenges/${challengeId}/whiteboards/items?itemId=${itemId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        await fetchWhiteboards();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    // Don't start dragging if clicking on textarea or button
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }

    const item = selectedWhiteboard?.items.find((i) => i.id === itemId);
    if (!item) return;

    const pos = JSON.parse(item.position);
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    setIsDragging(itemId);
    setDragOffset({
      x: e.clientX - canvasRect.left - pos.x,
      y: e.clientY - canvasRect.top - pos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;

    updateItemPosition(isDragging, { x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const updateItemPosition = async (itemId: string, position: { x: number; y: number }) => {
    try {
      await fetch(`/api/challenges/${challengeId}/whiteboards/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          position,
        }),
      });

      // Update local state immediately for smooth dragging
      setWhiteboards((prev) =>
        prev.map((wb) => {
          if (wb.id === selectedWhiteboard?.id) {
            return {
              ...wb,
              items: wb.items.map((item) =>
                item.id === itemId ? { ...item, position: JSON.stringify(position) } : item
              ),
            };
          }
          return wb;
        })
      );
    } catch (error) {
      console.error("Error updating item position:", error);
    }
  };

  const handleContentChange = async (itemId: string, newContent: string) => {
    try {
      await fetch(`/api/challenges/${challengeId}/whiteboards/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          content: newContent,
        }),
      });

      // Update local state
      setWhiteboards((prev) =>
        prev.map((wb) => {
          if (wb.id === selectedWhiteboard?.id) {
            return {
              ...wb,
              items: wb.items.map((item) =>
                item.id === itemId ? { ...item, content: newContent } : item
              ),
            };
          }
          return wb;
        })
      );
    } catch (error) {
      console.error("Error updating content:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-aurora rounded-xl p-6 w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Square className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">화이트보드</h2>
            </div>
            {selectedWhiteboard && (
              <select
                value={selectedWhiteboard.id}
                onChange={(e) => {
                  const wb = whiteboards.find((w) => w.id === e.target.value);
                  if (wb) setSelectedWhiteboard(wb);
                }}
                className="input-aurora px-3 py-2 rounded-lg"
              >
                {whiteboards.map((wb) => (
                  <option key={wb.id} value={wb.id}>
                    {wb.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewWhiteboardForm(!showNewWhiteboardForm)}
              className="btn-aurora px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              새 보드
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* New Whiteboard Form */}
        {showNewWhiteboardForm && (
          <div className="mb-4 p-4 bg-secondary rounded-lg flex gap-2">
            <input
              type="text"
              value={newWhiteboardTitle}
              onChange={(e) => setNewWhiteboardTitle(e.target.value)}
              placeholder="화이트보드 제목"
              className="input-aurora flex-1 px-3 py-2 rounded-lg"
            />
            <button onClick={handleCreateWhiteboard} className="btn-aurora px-4 py-2 rounded-lg">
              생성
            </button>
            <button
              onClick={() => {
                setShowNewWhiteboardForm(false);
                setNewWhiteboardTitle("");
              }}
              className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              취소
            </button>
          </div>
        )}

        {/* Tools */}
        {selectedWhiteboard && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={handleAddTextBox}
              className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors flex items-center gap-2"
            >
              <Type className="h-4 w-4" />
              텍스트 추가
            </button>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 border-2 border-dashed border-border rounded-lg relative overflow-hidden bg-white/5">
          {!selectedWhiteboard ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              화이트보드를 선택하거나 새로 만드세요
            </div>
          ) : selectedWhiteboard.items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              텍스트를 추가하거나 채팅 메시지를 드래그하세요
            </div>
          ) : (
            <div
              ref={canvasRef}
              className="w-full h-full relative"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {selectedWhiteboard.items.map((item) => {
                const position = JSON.parse(item.position);
                const size = JSON.parse(item.size);
                const style = item.style ? JSON.parse(item.style) : {};

                return (
                  <div
                    key={item.id}
                    className="absolute rounded-lg shadow-lg group"
                    style={{
                      left: position.x,
                      top: position.y,
                      width: size.width,
                      minHeight: size.height,
                      backgroundColor: "#ffffff20",
                      border: `2px solid ${style.color || "#ffffff"}`,
                    }}
                  >
                    {/* Drag handle */}
                    <div
                      className="px-3 py-2 cursor-move rounded-t-lg flex items-center justify-between"
                      style={{
                        backgroundColor: "#ffffff30",
                      }}
                      onMouseDown={(e) => handleMouseDown(e, item.id)}
                    >
                      <span className="text-xs opacity-70" style={{ color: style.color || "#ffffff" }}>
                        {item.type === "message" ? "메시지" : "텍스트"}
                      </span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 rounded bg-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-white" />
                      </button>
                    </div>
                    {/* Content */}
                    <textarea
                      value={item.content}
                      onChange={(e) => handleContentChange(item.id, e.target.value)}
                      className="w-full px-3 pb-3 bg-transparent border-none outline-none resize-none"
                      style={{
                        fontSize: style.fontSize || 14,
                        color: style.color || "#ffffff",
                        height: `calc(${size.height}px - 36px)`,
                        minHeight: '64px',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
