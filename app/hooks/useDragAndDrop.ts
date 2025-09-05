"use client";
import { useState, useCallback, useEffect } from "react";

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  draggedElement: HTMLElement | null;
}

interface UseDragAndDropOptions {
  onDragStart?: (element: HTMLElement) => void;
  onDragEnd?: (element: HTMLElement, newX: number, newY: number) => void;
  onDragMove?: (element: HTMLElement, deltaX: number, deltaY: number) => void;
  gridSize?: number; // Size of each grid cell
  snapToGrid?: boolean;
}

export function useDragAndDrop(options: UseDragAndDropOptions = {}) {
  const {
    onDragStart,
    onDragEnd,
    onDragMove,
    gridSize = 100,
    snapToGrid = true,
  } = options;

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    draggedElement: null,
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const element = e.currentTarget as HTMLElement;
    
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      draggedElement: element,
    });

    onDragStart?.(element);
  }, [onDragStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedElement) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    setDragState(prev => ({
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY,
    }));

    onDragMove?.(dragState.draggedElement, deltaX, deltaY);
  }, [dragState.isDragging, dragState.draggedElement, dragState.startX, dragState.startY, onDragMove]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedElement) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    // Calculate grid position
    let newX = Math.round(deltaX / gridSize);
    let newY = Math.round(deltaY / gridSize);

    if (snapToGrid) {
      newX = Math.max(0, Math.min(4, newX));
      newY = Math.max(0, Math.min(4, newY));
    }

    onDragEnd?.(dragState.draggedElement, newX, newY);

    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      draggedElement: null,
    });
  }, [dragState, gridSize, snapToGrid, onDragEnd]);

  // Add global event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  return {
    dragState,
    handleMouseDown,
    isDragging: dragState.isDragging,
  };
}
