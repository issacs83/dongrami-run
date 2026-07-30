// 동그라미 런 Service Worker v3.16.0
const CACHE_VERSION = 'v3.16.0';
const CACHE_NAME = 'dongrami-run-' + CACHE_VERSION;
const ASSETS = [
    '/dongrami-run/',
    '/dongrami-run/index.html',
    '/dongrami-run/manifest.json',
    '/dongrami-run/og-image.png'
];

// 설치 시 핵심 파일 캐시 (HTTP 캐시 우회를 위해 cache: 'reload')
// ※ skipWaiting은 install에서 자동 호출하지 않음 — 게임 도중 강제 새로고침 방지.
//    새 버전은 업데이트 배너를 탭했을 때(메시지 수신 시) 활성화된다.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' }))))
    );
});

// 활성화 시 이전 버전 캐시 모두 삭제 + 즉시 제어권 획득
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim()) // 모든 탭 즉시 제어
    );
});

// Network First: 항상 서버에서 최신 버전 가져오기, 실패 시에만 캐시
self.addEventListener('fetch', event => {
    if (!event.request.url.startsWith(self.location.origin)) return;
    // navigation 요청 (HTML 페이지)은 항상 네트워크 우선
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }
    // 기타 리소스도 네트워크 우선
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// 메시지 처리
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    if (event.data === 'getVersion') {
        event.ports[0].postMessage(CACHE_VERSION);
    }
});
