"use client";
import { useState, useCallback, useEffect, useRef } from "react";

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
  onDropPreview?: (x: number, y: number) => void;
  snapToGrid?: boolean;
  currentPosition?: { x: number; y: number }; // Current grid position
  gridSelector?: string; // CSS selector for grid container
  gridDimensions?: { cols: number; rows: number }; // Grid size
  itemSpan?: { w: number; h: number }; // Current item span
}

export function useDragAndDrop(options: UseDragAndDropOptions = {}) {
  const {
    onDragStart,
    onDragEnd,
    onDragMove,
    onDropPreview,
    snapToGrid = true,
    currentPosition = { x: 0, y: 0 },
    gridSelector = ".widget-grid",
    gridDimensions = { cols: 5, rows: 5 },
    itemSpan = { w: 1, h: 1 },
  } = options;

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    draggedElement: null,
  });

  const gridMetricsRef = useRef<{
    cols: number;
    rows: number;
    cellWidth: number;
    cellHeight: number;
    colGap: number;
    rowGap: number;
  } | null>(null);

  const animRafRef = useRef<number | null>(null);
  const currentVisualRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const targetVisualRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const runningRef = useRef<boolean>(false);
  const smoothingRef = useRef<number>(0.25);
  const lastPreviewRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // left click only
    e.preventDefault();
    const element = e.currentTarget as HTMLElement;
    
    // Add visual feedback
    element.style.cursor = 'grabbing';
    element.style.userSelect = 'none';
    element.style.willChange = 'transform';
    element.classList.add('widget-dragging');

    // Measure grid once at drag start
    const gridEl = document.querySelector(gridSelector) as HTMLElement | null;
    const rect = gridEl?.getBoundingClientRect();
    const styles = gridEl ? window.getComputedStyle(gridEl) : null;
    const colGap = styles ? parseFloat(styles.columnGap || styles.gap || "0") : 0;
    const rowGap = styles ? parseFloat(styles.rowGap || styles.gap || "0") : 0;
    const cols = gridDimensions.cols;
    const rows = gridDimensions.rows;
    const totalColGaps = (cols - 1) * colGap;
    const totalRowGaps = (rows - 1) * rowGap;
    const gridWidth = rect ? rect.width : cols * 160 + totalColGaps;
    const gridHeight = rect ? rect.height : rows * 160 + totalRowGaps;
    const cellWidth = (gridWidth - totalColGaps) / cols;
    const cellHeight = (gridHeight - totalRowGaps) / rows;
    gridMetricsRef.current = { cols, rows, cellWidth, cellHeight, colGap, rowGap };
    
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      draggedElement: element,
    });

    onDragStart?.(element);
    // Start animation loop once
    if (!runningRef.current) {
      runningRef.current = true;
      const animate = () => {
        if (!runningRef.current) {
          animRafRef.current = null;
          return;
        }
        const cur = currentVisualRef.current;
        const tar = targetVisualRef.current;
        const s = smoothingRef.current;
        cur.dx += (tar.dx - cur.dx) * s;
        cur.dy += (tar.dy - cur.dy) * s;
        if (dragState.draggedElement) {
          dragState.draggedElement.style.transform = `translate3d(${cur.dx}px, ${cur.dy}px, 0)`;
        }
        animRafRef.current = requestAnimationFrame(animate);
      };
      animRafRef.current = requestAnimationFrame(animate);
    }
  }, [onDragStart, gridSelector, gridDimensions.cols, gridDimensions.rows, dragState.draggedElement]);

  const handleMouseMove = useCallback((e: PointerEvent) => {
    if (!dragState.isDragging || !dragState.draggedElement) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    // Update target for smoothing; animation loop will lerp to it
    targetVisualRef.current = { dx: deltaX, dy: deltaY };

    // Calculate grid position using cached grid metrics
    const metrics = gridMetricsRef.current;
    const cols = metrics?.cols ?? gridDimensions.cols;
    const rows = metrics?.rows ?? gridDimensions.rows;
    const cellWidth = metrics?.cellWidth ?? 160;
    const cellHeight = metrics?.cellHeight ?? 160;

    const deltaXGrid = Math.round(deltaX / cellWidth);
    const deltaYGrid = Math.round(deltaY / cellHeight);
    const unclampedX = currentPosition.x + deltaXGrid;
    const unclampedY = currentPosition.y + deltaYGrid;
    const maxX = Math.max(0, cols - itemSpan.w);
    const maxY = Math.max(0, rows - itemSpan.h);
    const newX = Math.max(0, Math.min(maxX, unclampedX));
    const newY = Math.max(0, Math.min(maxY, unclampedY));
    
    if (snapToGrid) {
      const prev = lastPreviewRef.current;
      if (!prev || prev.x !== newX || prev.y !== newY) {
        lastPreviewRef.current = { x: newX, y: newY };
        onDropPreview?.(newX, newY);
      }
    }

    onDragMove?.(dragState.draggedElement, deltaX, deltaY);
  }, [dragState.isDragging, dragState.draggedElement, dragState.startX, dragState.startY, snapToGrid, onDragMove, onDropPreview, currentPosition, gridDimensions, itemSpan]);

  const handleMouseUp = useCallback((e: PointerEvent) => {
    if (!dragState.isDragging || !dragState.draggedElement) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    // Stop animation loop
    if (animRafRef.current != null) {
      cancelAnimationFrame(animRafRef.current);
      animRafRef.current = null;
    }
    runningRef.current = false;

    // Reset visual transform and styles
    dragState.draggedElement.style.transform = '';
    dragState.draggedElement.style.zIndex = '';
    dragState.draggedElement.style.cursor = '';
    dragState.draggedElement.style.userSelect = '';
    dragState.draggedElement.classList.remove('widget-dragging');

    lastPreviewRef.current = null;

    // Calculate grid position using cached grid metrics
    const metrics = gridMetricsRef.current;
    const cols = metrics?.cols ?? gridDimensions.cols;
    const rows = metrics?.rows ?? gridDimensions.rows;
    const cellWidth = metrics?.cellWidth ?? 160;
    const cellHeight = metrics?.cellHeight ?? 160;

    const deltaXGrid = Math.round(deltaX / cellWidth);
    const deltaYGrid = Math.round(deltaY / cellHeight);
    const unclampedX = currentPosition.x + deltaXGrid;
    const unclampedY = currentPosition.y + deltaYGrid;
    const maxX = Math.max(0, cols - itemSpan.w);
    const maxY = Math.max(0, rows - itemSpan.h);
    const newX = Math.max(0, Math.min(maxX, unclampedX));
    const newY = Math.max(0, Math.min(maxY, unclampedY));

    onDragEnd?.(dragState.draggedElement, newX, newY);

    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      draggedElement: null,
    });
  }, [dragState, onDragEnd, currentPosition, gridDimensions, itemSpan]);

  // Add global event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      const opts: AddEventListenerOptions = { passive: true };
      document.addEventListener("pointermove", handleMouseMove as EventListener, opts);
      document.addEventListener("pointerup", handleMouseUp as EventListener, opts);
      
      return () => {
        document.removeEventListener("pointermove", handleMouseMove as EventListener, opts);
        document.removeEventListener("pointerup", handleMouseUp as EventListener, opts);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  return {
    dragState,
    handleMouseDown,
    isDragging: dragState.isDragging,
  };
}
