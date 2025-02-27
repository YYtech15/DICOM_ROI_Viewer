import { useState, useEffect } from 'react';
import imageCache from '../utils/imageCache';

interface PreloadOptions {
  preloadCount?: number;
  enabled?: boolean;
}

export default function usePreloadedImages(
  baseUrl: string,
  currentIndex: number,
  maxIndex: number,
  { preloadCount = 3, enabled = true }: PreloadOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [preloadedIndices, setPreloadedIndices] = useState<number[]>([]);

  // コンポーネントがアンマウントされたときにキャッシュを解放
  useEffect(() => {
    return () => {
      // 現在のURLセットをクリーンアップ
      if (currentImageUrl) {
        imageCache.removeFromCache(currentImageUrl);
      }
    };
  }, [currentImageUrl]);

  // 現在のインデックス画像をロード
  useEffect(() => {
    if (!baseUrl || !enabled) return;
    
    let isMounted = true;
    const loadCurrentImage = async () => {
      try {
        setIsLoading(true);
        const url = `${baseUrl}&slice_index=${currentIndex}`;
        const cachedUrl = await imageCache.getImage(url);
        
        if (isMounted) {
          setCurrentImageUrl(cachedUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading current image:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCurrentImage();
    
    return () => {
      isMounted = false;
    };
  }, [baseUrl, currentIndex, enabled]);

  // 前後の画像をプリロード
  useEffect(() => {
    if (!baseUrl || !enabled) return;
    
    const preloadImages = async () => {
      const indicesToPreload: number[] = [];
      
      // 前方のスライスをプリロード
      for (let i = 1; i <= preloadCount; i++) {
        const nextIndex = currentIndex + i;
        if (nextIndex <= maxIndex) {
          indicesToPreload.push(nextIndex);
        }
      }
      
      // 後方のスライスをプリロード
      for (let i = 1; i <= preloadCount; i++) {
        const prevIndex = currentIndex - i;
        if (prevIndex >= 0) {
          indicesToPreload.push(prevIndex);
        }
      }
      
      // 既にプリロード済みのインデックスは除外
      const newIndicesToPreload = indicesToPreload.filter(
        idx => !preloadedIndices.includes(idx)
      );
      
      // 非同期でプリロード（進行状況は追跡しない）
      newIndicesToPreload.forEach(async (index) => {
        try {
          const url = `${baseUrl}&slice_index=${index}`;
          await imageCache.getImage(url);
        } catch (error) {
          console.warn(`Failed to preload image at index ${index}:`, error);
        }
      });
      
      setPreloadedIndices([...preloadedIndices, ...newIndicesToPreload]);
    };

    preloadImages();
  }, [baseUrl, currentIndex, maxIndex, preloadCount, preloadedIndices, enabled]);

  return { currentImageUrl, isLoading };
}