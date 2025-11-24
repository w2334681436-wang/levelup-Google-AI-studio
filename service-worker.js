// PWA Service Worker: 这是一个最小化的 Service Worker 占位符。
// 在实际的生产环境中，您应该使用工具（例如 vite-plugin-pwa）来自动生成包含缓存策略的 Service Worker。

// 监听安装事件
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

// 监听激活事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // 确保 Service Worker 立即接管控制权
  event.waitUntil(clients.claim());
});

// 监听获取（Fetch）事件 - 这是一个最简的例子，不包含任何复杂的缓存逻辑
self.addEventListener('fetch', (event) => {
  // 仅在网络请求失败时才尝试处理缓存，这可以防止在开发模式下产生混淆
  event.respondWith(
    fetch(event.request).catch(() => {
      // 可以在此处添加离线页面逻辑
      return new Response("App is offline. Please check your network.", { status: 503, statusText: "Offline" });
    })
  );
});
