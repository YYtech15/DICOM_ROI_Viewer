import { useState, useRef, useCallback, useEffect } from 'react';

interface ImageControlsOptions {
  maxZoom?: number;
  minZoom?: number;
  zoomSpeed?: number;
  initialZoom?: number;
  onZoomChange?: (zoom: number) => void;
}

interface Position {
  x: number;
  y: number;
}

export default function useImageControls({
  maxZoom = 5,
  minZoom = 0.5,
  zoomSpeed = 0.1,
  initialZoom = 1,
  onZoomChange
}: ImageControlsOptions = {}) {
  const [zoom, setZoom] = useState(initialZoom);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<Position>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 制約付きズーム設定
  const setConstrainedZoom = useCallback((newZoom: number) => {
    const constrainedZoom = Math.min(Math.max(newZoom, minZoom), maxZoom);
    setZoom(constrainedZoom);
    if (onZoomChange) {
      onZoomChange(constrainedZoom);
    }
  }, [maxZoom, minZoom, onZoomChange]);

  // ズームイン
  const zoomIn = useCallback(() => {
    setConstrainedZoom(zoom + zoomSpeed);
  }, [zoom, zoomSpeed, setConstrainedZoom]);

  // ズームアウト
  const zoomOut = useCallback(() => {
    setConstrainedZoom(zoom - zoomSpeed);
  }, [zoom, zoomSpeed, setConstrainedZoom]);

  // ズームリセット
  const resetZoom = useCallback(() => {
    setConstrainedZoom(initialZoom);
    setPosition({ x: 0, y: 0 });
  }, [initialZoom, setConstrainedZoom]);

  // ホイールでのズーム
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    // マウス位置を基準にズームするための計算
    if (containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // コンテナ内でのマウス位置（中心を原点とする）
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      
      // 現在の位置からマウス位置への相対オフセット
      const relativeX = mouseX - position.x;
      const relativeY = mouseY - position.y;
      
      // 新しいズームレベル
      const newZoom = e.deltaY < 0 
        ? Math.min(zoom + zoomSpeed, maxZoom)  
        : Math.max(zoom - zoomSpeed, minZoom);
      
      // ズームによる位置調整（マウス位置を中心にズーム）
      if (newZoom !== zoom) {
        const zoomFactor = newZoom / zoom;
        
        // 新しい位置
        setPosition({
          x: mouseX - relativeX * zoomFactor,
          y: mouseY - relativeY * zoomFactor
        });
        
        setConstrainedZoom(newZoom);
      }
    } else {
      // コンテナがなければ通常のズーム
      setConstrainedZoom(
        e.deltaY < 0
          ? Math.min(zoom + zoomSpeed, maxZoom)
          : Math.max(zoom - zoomSpeed, minZoom)
      );
    }
  }, [zoom, position, zoomSpeed, maxZoom, minZoom, setConstrainedZoom]);

  // ドラッグ開始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  }, [zoom]);

  // ドラッグ中
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  }, [isDragging]);

  // ドラッグ終了
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // マウスがコンテナから出た場合
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // パン位置の制約（画像が完全に見えなくなるのを防ぐ）
  useEffect(() => {
    if (containerRef.current && zoom > 1) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      
      // 端の余白（最低10%は見えるようにする）
      const margin = Math.min(containerWidth, containerHeight) * 0.1;
      
      // ズームされた仮想サイズ
      const virtualWidth = containerWidth * zoom;
      const virtualHeight = containerHeight * zoom;
      
      // 許容されるパンの最大距離
      const maxPanX = (virtualWidth - containerWidth) / 2 + margin;
      const maxPanY = (virtualHeight - containerHeight) / 2 + margin;
      
      // 位置の制約
      setPosition(prev => ({
        x: Math.max(-maxPanX, Math.min(maxPanX, prev.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, prev.y))
      }));
    }
  }, [zoom]);

  // イベントリスナーの設定
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // ホイールイベント
      container.addEventListener('wheel', handleWheel);
      
      // マウスイベント（グローバル）
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        container.removeEventListener('wheel', handleWheel);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [handleWheel, handleMouseMove, handleMouseUp]);

  return {
    zoom,
    position,
    isDragging,
    containerRef,
    handleMouseDown,
    handleMouseLeave,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom: setConstrainedZoom
  };
}