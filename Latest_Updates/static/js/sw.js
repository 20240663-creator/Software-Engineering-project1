// sw.js - Service Worker for Smart Wallet PWA
const CACHE_NAME = 'smart-wallet-v1.0.0';
const STATIC_CACHE = 'smart-wallet-static-v1.0.0';
const DYNAMIC_CACHE = 'smart-wallet-dynamic-v1.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/login.html',
    '/register.html',
    '/dashboard.html',
    '/budget.html',
    '/saving_goals.html',
    '/transactions.html',
    '/advisor.html',
    '/profile.html',
    '/static/css/style.min.css',
    '/static/js/config.min.js',
    '/static/js/auth.min.js',
    '/static/js/wallet.min.js',
    '/static/js/dashboard.min.js',
    '/static/images/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('SW: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('SW: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('SW: Activating...');
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Only handle HTTP/HTTPS requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip API requests - let them go to network
    if (url.pathname.startsWith('/api/') || url.pathname.includes('127.0.0.1:8000')) {
        return;
    }

    // Strategy: Cache First for static assets, Network First for HTML
    if (request.destination === 'document' || request.destination === 'navigate') {
        event.respondWith(networkFirstStrategy(request));
    } else {
        event.respondWith(cacheFirstStrategy(request));
    }
});

// Cache First Strategy
async function cacheFirstStrategy(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache First Strategy failed:', error);
        return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Network First Strategy
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', error);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.destination === 'document' || request.destination === 'navigate') {
            return caches.match('/index.html') || new Response('Offline - Please check your connection', {
                status: 503,
                statusText: 'Service Unavailable'
            });
        }
        
        return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(syncOfflineData());
    }
});

// Sync offline data
async function syncOfflineData() {
    try {
        const offlineActions = await getOfflineActions();
        
        for (const action of offlineActions) {
            try {
                await fetch(action.url, {
                    method: action.method,
                    headers: action.headers,
                    body: action.body
                });
                
                // Remove synced action from offline storage
                await removeOfflineAction(action.id);
            } catch (error) {
                console.error('Failed to sync action:', action, error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'New notification from Smart Wallet',
        icon: '/static/images/icon-192x192.png',
        badge: '/static/images/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Open App',
                icon: '/static/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/static/images/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Smart Wallet', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Helper functions for offline storage
async function getOfflineActions() {
    // This would integrate with IndexedDB or localStorage
    return [];
}

async function removeOfflineAction(id) {
    // Remove synced action from storage
    return Promise.resolve();
}

// Cache cleanup
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
        // Clear dynamic cache when app updates
        caches.delete(DYNAMIC_CACHE);
    }
});
