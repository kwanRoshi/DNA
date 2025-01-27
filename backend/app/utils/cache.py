from typing import Any, Optional
import time
from collections import OrderedDict

class Cache:
    def __init__(self, max_size: int = 1000, ttl: int = 3600):
        self.max_size = max_size
        self.ttl = ttl  # Time to live in seconds
        self.cache: OrderedDict[str, tuple[Any, float]] = OrderedDict()

    def get(self, key: str) -> Optional[Any]:
        """获取缓存的值"""
        if key not in self.cache:
            return None

        value, timestamp = self.cache[key]
        if time.time() - timestamp > self.ttl:
            del self.cache[key]
            return None

        # 更新访问顺序
        self.cache.move_to_end(key)
        return value

    def set(self, key: str, value: Any):
        """设置缓存"""
        if len(self.cache) >= self.max_size:
            # 删除最早的项目
            self.cache.popitem(last=False)

        self.cache[key] = (value, time.time())
        self.cache.move_to_end(key)

    def delete(self, key: str):
        """删除缓存项"""
        if key in self.cache:
            del self.cache[key]

    def clear(self):
        """清除所有缓存"""
        self.cache.clear()

    def cleanup(self):
        """清理过期的缓存项"""
        current_time = time.time()
        expired_keys = [
            key for key, (_, timestamp) in self.cache.items()
            if current_time - timestamp > self.ttl
        ]
        for key in expired_keys:
            del self.cache[key]

# 创建缓存实例
analysis_cache = Cache() 