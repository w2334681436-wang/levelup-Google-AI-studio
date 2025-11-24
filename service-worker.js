// Service Worker: 实施 PWA 基础缓存策略

const CACHE_NAME = 'levelup-cache-v3'; // 缓存版本升级
// 应用外壳的核心文件：/index.html 是应用启动所需的唯一 HTML 文件。
const APP_SHELL_FILES = [
  '/', 
  '/index.html',
  '/manifest.json',
  '/icon.png',
];

// 监听安装事件：缓存所有应用外壳所需文件
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing and caching essential App Shell...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // 确保 /index.html 被缓存。由于 Service Worker 的作用域是根目录，
        // 即使 Vite 打包的 JS/CSS 路径变动，只要 index.html 在，应用就能启动。
        return cache.addAll(APP_SHELL_FILES);
      })
      .catch(error => {
        console.error('Failed to cache App Shell assets:', error);
      })
  );
  self.skipWaiting();
});

// 监听激活事件：清理旧版本缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating and cleaning old caches...');
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
      return clients.claim();
    })
  );
});

// 监听获取（Fetch）事件：缓存优先，导航回退到 index.html
self.addEventListener('fetch', (event) => {
  // 1. 尝试从缓存中匹配资源
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        // 2. 如果缓存中没有，从网络获取
        return fetch(event.request).catch(() => {
          // 3. 网络请求失败时，检查是否是导航请求
          if (event.request.mode === 'navigate') {
            // 如果是导航请求（例如应用启动），返回缓存中的 /index.html 作为应用外壳
            return caches.match('/index.html');
          }
          
          // 对于其他非导航请求（如图片、字体等），返回离线提示
          return new Response("Offline or resource not cached.", { status: 503, statusText: "Offline" });
        });
      })
  );
});
