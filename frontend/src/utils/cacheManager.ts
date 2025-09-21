type CacheItem<T> = {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
};

class CacheManager {
  private storage: Storage;
  private readonly prefix = 'speakle_cache_';

  constructor(useSessionStorage = true) {
    // sessionStorage는 탭이 열려있는 동안만 유지, localStorage는 영구 저장
    this.storage = useSessionStorage ? sessionStorage : localStorage;
  }

  /**
   * 캐시 키 생성 - 추천/검색 조건을 기반으로 고유 키 생성
   */
  generateKey(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          acc[key] = params[key];
        }
        return acc;
      }, {} as Record<string, any>);

    const key = this.prefix + btoa(encodeURIComponent(JSON.stringify(sortedParams)));
    return key;
  }

  /**
   * 캐시에 데이터 저장
   * @param key 캐시 키
   * @param data 저장할 데이터
   * @param ttl 캐시 유효시간 (밀리초, 기본값: 1시간)
   */
  set<T>(key: string, data: T, ttl: number = 60 * 60 * 1000): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl
      };
      this.storage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Cache set error:', error);
      // 스토리지가 꽉 찼으면 오래된 캐시 정리
      this.clearExpiredCache();
      try {
        // 다시 시도
        this.storage.setItem(key, JSON.stringify({ data, timestamp: Date.now(), ttl }));
      } catch (retryError) {
        console.error('Cache set failed after cleanup:', retryError);
      }
    }
  }

  /**
   * 캐시에서 데이터 가져오기
   * @param key 캐시 키
   * @returns 캐시된 데이터 또는 null
   */
  get<T>(key: string): T | null {
    try {
      const cached = this.storage.getItem(key);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();

      // TTL 체크
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        this.storage.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  /**
   * 특정 캐시 삭제
   */
  remove(key: string): void {
    this.storage.removeItem(key);
  }

  /**
   * 만료된 캐시 정리
   */
  clearExpiredCache(): void {
    const keys = Object.keys(this.storage);
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const cached = this.storage.getItem(key);
          if (cached) {
            const cacheItem: CacheItem<any> = JSON.parse(cached);
            if (now - cacheItem.timestamp > cacheItem.ttl) {
              this.storage.removeItem(key);
            }
          }
        } catch {
          // 파싱 오류 시 해당 캐시 삭제
          this.storage.removeItem(key);
        }
      }
    });
  }

  /**
   * 모든 캐시 삭제
   */
  clearAll(): void {
    const keys = Object.keys(this.storage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        this.storage.removeItem(key);
      }
    });
  }
}

// 싱글톤 인스턴스 - sessionStorage 사용
export const cacheManager = new CacheManager(true);

// 추천 결과 전용 캐시 헬퍼
export const recommendCache = {
  /**
   * 추천 결과 저장
   */
  set(situation: string, location: string, data: any, ttl?: number) {
    const key = cacheManager.generateKey({
      type: 'recommend',
      situation,
      location
    });
    return cacheManager.set(key, data, ttl);
  },

  /**
   * 추천 결과 가져오기
   */
  get(situation: string, location: string) {
    const key = cacheManager.generateKey({
      type: 'recommend',
      situation,
      location
    });
    return cacheManager.get(key);
  },

  /**
   * 특정 추천 결과 삭제
   */
  clear(situation?: string, location?: string) {
    if (situation && location) {
      const key = cacheManager.generateKey({
        type: 'recommend',
        situation,
        location
      });
      cacheManager.remove(key);
    }
  }
};

// 검색 결과 전용 캐시 헬퍼
export const searchCache = {
  /**
   * 검색 결과 저장
   */
  set(keyword: string, page: number, sort: string, data: any, ttl?: number) {
    const key = cacheManager.generateKey({
      type: 'search',
      keyword,
      page,
      sort
    });
    return cacheManager.set(key, data, ttl);
  },

  /**
   * 검색 결과 가져오기
   */
  get(keyword: string, page: number, sort: string) {
    const key = cacheManager.generateKey({
      type: 'search',
      keyword,
      page,
      sort
    });
    return cacheManager.get(key);
  },

  /**
   * 검색 결과 삭제
   */
  clear() {
    // 검색은 자주 바뀌므로 전체 삭제는 제공하지 않음
  }
};