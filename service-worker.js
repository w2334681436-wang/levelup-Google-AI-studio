// Service Worker: 实施 PWA 基础缓存策略

// 升级版本号，强制浏览器更新旧的 Service Worker
const CACHE_NAME = 'levelup-cache-v4';

// 应用外壳的核心文件
const APP_SHELL_FILES = [
  '/', 
  '/index.html',
  '/manifest.json',
  '/icon.png',
];

// 1. 安装阶段：强行缓存核心文件
self.addEventListener('install', (event) => {
  console.log('[SW] Installing and caching App Shell...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(APP_SHELL_FILES);
      })
      .then(() => self.skipWaiting()) // 强制跳过等待，立即接管
  );
});

// 2. 激活阶段：清理所有旧版本缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating and cleaning old caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即控制所有页面
  );
});

// 3. 拦截请求：核心修复逻辑
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      // A. 缓存优先策略
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        // B. 网络请求
        const networkResponse = await fetch(event.request);
        
        // 关键点：如果网络请求返回 404，且这是页面导航请求（mode === 'navigate'）
        // 说明 Vercel 没找到文件，这时候必须返回 index.html 给 React 去处理
        if ((!networkResponse || networkResponse.status === 404) && event.request.mode === 'navigate') {
           console.log('[SW] 404 detected on navigation, serving index.html fallback');
           return caches.match('/index.html');
        }

        return networkResponse;

      } catch (error) {
        // C. 断网情况
        console.log('[SW] Network error:', error);
        // 如果是页面导航请求，断网了也要返回 index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        // 其他资源断网就不管了，或者返回个错误图片
        return new Response("Offline", { status: 503, statusText: "Offline" });
      }
    })()
  );
});
