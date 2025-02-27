/**
 * 画像キャッシュユーティリティ。
 * URLをキーとしてBlobとObjectURLをキャッシュし、メモリを効率的に使用します。
 */
class ImageCache {
    private cache: Map<string, string> = new Map();
    private fetchingPromises: Map<string, Promise<string>> = new Map();
    private maxSize: number;
    private currentSize: number = 0;
  
    constructor(maxSize: number = 50) {
      this.maxSize = maxSize;
    }
  
    /**
     * URLからイメージを取得またはキャッシュから返します
     */
    async getImage(url: string): Promise<string> {
      // キャッシュ内にある場合
      if (this.cache.has(url)) {
        return this.cache.get(url)!;
      }
      
      // 既に取得中の場合、そのプロミスを返す
      if (this.fetchingPromises.has(url)) {
        return this.fetchingPromises.get(url)!;
      }
      
      // 新たにフェッチ
      const fetchPromise = this.fetchAndCacheImage(url);
      this.fetchingPromises.set(url, fetchPromise);
      
      try {
        const objectUrl = await fetchPromise;
        this.fetchingPromises.delete(url);
        return objectUrl;
      } catch (error) {
        this.fetchingPromises.delete(url);
        throw error;
      }
    }
  
    /**
     * 特定のURLに紐づくキャッシュを削除します
     */
    removeFromCache(url: string): void {
      if (this.cache.has(url)) {
        URL.revokeObjectURL(this.cache.get(url)!);
        this.cache.delete(url);
        this.currentSize--;
      }
    }
  
    /**
     * キャッシュをクリアします
     */
    clearCache(): void {
      this.cache.forEach(objectUrl => {
        URL.revokeObjectURL(objectUrl);
      });
      this.cache.clear();
      this.currentSize = 0;
    }
  
    /**
     * 画像を取得し、キャッシュします
     */
    private async fetchAndCacheImage(url: string): Promise<string> {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        // 最大キャッシュサイズに達した場合、古いエントリを削除
        while (this.currentSize >= this.maxSize) {
          const oldestKey = this.cache.keys().next().value;
          this.removeFromCache(oldestKey);
        }
        
        this.cache.set(url, objectUrl);
        this.currentSize++;
        
        return objectUrl;
      } catch (error) {
        logger.error('Error fetching image:', error);
        throw new Error('Failed to load image');
      }
    }
  }
  
  export default new ImageCache();