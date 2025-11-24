// Service Worker: 实施 PWA 基础缓存策略

const CACHE_NAME = 'levelup-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  // 注意：在实际 Vite 部署环境中，这里还应包含所有打包后的 JS/CSS 文件。
  // 由于我们不知道打包后的文件名，这里只缓存核心静态文件。
];

// 监听安装事件
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing and caching assets...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // 缓存应用外壳所需的所有资源
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 监听激活事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // 清理旧的缓存版本
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 确保 Service Worker 立即接管控制权
      return clients.claim();
    })
  );
});

// 监听获取（Fetch）事件 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有匹配的资源，则直接返回
        if (response) {
          return response;
        }
        // 否则，从网络获取
        return fetch(event.request);
      })
      .catch((error) => {
        // 离线且缓存中没有资源时的最后捕获
        console.error('Fetch failed for:', event.request.url, error);
        // 如果是主页请求失败，可以返回一个离线页面
        if (event.request.mode === 'navigate') {
           return new Response("App is offline. Please check your network.", { status: 503, statusText: "Offline" });
        }
        // 对于其他资源，返回一个空的或错误响应
        return new Response('Network error or resource not cached.', { status: 500 });
      })
  );
});
