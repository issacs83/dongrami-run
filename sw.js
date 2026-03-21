// 동그라미 런 Service Worker v3.5.0
const CACHE_NAME = 'dongrami-run-v3.5.0';
const ASSETS = [
    '/dongrami-run/',
    '/dongrami-run/index.html',
    '/dongrami-run/manifest.json'
];

// 설치 시 핵심 파일 캐시
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// 활성화 시 이전 버전 캐시 삭제
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Network First 전략: 네트워크 우선, 실패 시 캐시
self.addEventListener('fetch', event => {
    // 같은 origin 요청만 처리
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // 성공하면 캐시 업데이트
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, clone);
                });
                return response;
            })
            .catch(() => {
                // 오프라인이면 캐시에서 제공
                return caches.match(event.request);
            })
    );
});

// 새 버전 감지 시 클라이언트에 메시지 전송
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
