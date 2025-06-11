const CACHE_NAME = 'nindra-chatbot-v1.0.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// API endpoints to cache with network-first strategy
const API_ENDPOINTS = [
  '/api/dashboard',
  '/api/contacts',
  '/api/settings'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
  
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Different strategies for different types of requests
  if (request.method === 'GET') {
    // Static assets - cache first
    if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
      event.respondWith(cacheFirst(request));
    }
    // API calls - network first with fallback
    else if (API_ENDPOINTS.some(endpoint => request.url.includes(endpoint))) {
      event.respondWith(networkFirst(request));
    }
    // Images and other assets - cache first
    else if (request.destination === 'image' || request.url.includes('/assets/')) {
      event.respondWith(cacheFirst(request));
    }
    // Default - network first
    else {
      event.respondWith(networkFirst(request));
    }
  }
});

// Cache first strategy
async function cacheFirst(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('[SW] Serving from cache:', request.url);
      return cached;
    }
    
    const response = await fetch(request);
    
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Cache first error:', error);
    return new Response('Offline - content not available', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network first strategy with cache fallback
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineCache = await caches.open(STATIC_CACHE);
      const offlinePage = await offlineCache.match('/');
      return offlinePage || new Response('Offline', { status: 503 });
    }
    
    return new Response('Offline - content not available', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background sync for chat messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'chat-message-sync') {
    event.waitUntil(syncChatMessages());
  }
});

async function syncChatMessages() {
  try {
    // Get pending messages from IndexedDB
    const pendingMessages = await getPendingMessages();
    
    for (const message of pendingMessages) {
      try {
        await fetch('/api/chat/messages', {
          method: 'POST',
          body: JSON.stringify(message),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Remove from pending messages
        await removePendingMessage(message.id);
      } catch (error) {
        console.error('[SW] Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New message received',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: 'chat-notification',
    actions: [
      { action: 'open', title: 'Open Chat' },
      { action: 'close', title: 'Close' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Nindra Chatbot', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/chat')
    );
  }
});

// Helper functions for IndexedDB operations
async function getPendingMessages() {
  // Implement IndexedDB logic to get pending messages
  return [];
}

async function removePendingMessage(messageId) {
  // Implement IndexedDB logic to remove pending message
  return true;
} 