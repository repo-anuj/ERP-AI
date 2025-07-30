// Service Worker for ERP Real-time Notifications
const CACHE_NAME = 'erp-notifications-v1';
const urlsToCache = [
  '/',
  '/favicon.ico',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push event handler
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'ERP Notification',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'erp-notification',
    requireInteraction: false,
    actions: []
  };

  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push data:', data);
      
      notificationData = {
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || `erp-${data.type || 'notification'}-${Date.now()}`,
        requireInteraction: data.requiresAction || data.priority === 'urgent',
        data: {
          url: data.actionUrl || data.url || '/',
          taskId: data.taskId,
          projectId: data.projectId,
          type: data.type,
          priority: data.priority
        },
        actions: []
      };

      // Add actions based on notification type
      if (data.type === 'task' && data.requiresAction) {
        notificationData.actions = [
          {
            action: 'view',
            title: 'View Task',
            icon: '/favicon.ico'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/favicon.ico'
          }
        ];
      } else if (data.type === 'approval') {
        notificationData.actions = [
          {
            action: 'approve',
            title: 'Approve',
            icon: '/favicon.ico'
          },
          {
            action: 'view',
            title: 'View Details',
            icon: '/favicon.ico'
          }
        ];
      } else {
        notificationData.actions = [
          {
            action: 'view',
            title: 'View',
            icon: '/favicon.ico'
          }
        ];
      }

      // Set vibration pattern based on priority
      if (data.priority === 'urgent') {
        notificationData.vibrate = [200, 100, 200, 100, 200];
      } else if (data.priority === 'high') {
        notificationData.vibrate = [200, 100, 200];
      }

    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  if (action === 'dismiss') {
    return;
  }

  let url = data.url || '/';
  
  if (action === 'view' || !action) {
    // Default action - open the URL
    if (data.taskId) {
      url = `/projects?taskId=${data.taskId}`;
    } else if (data.projectId) {
      url = `/projects/${data.projectId}`;
    }
  } else if (action === 'approve' && data.taskId) {
    // Quick approve action
    url = `/projects/approvals?taskId=${data.taskId}&action=approve`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(url.split('?')[0]) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'task-approval') {
    event.waitUntil(
      // Handle offline task approvals
      handleOfflineTaskApprovals()
    );
  }
});

// Handle offline task approvals
async function handleOfflineTaskApprovals() {
  try {
    // Get pending approvals from IndexedDB or localStorage
    const pendingApprovals = await getPendingApprovals();
    
    for (const approval of pendingApprovals) {
      try {
        const response = await fetch('/api/projects/tasks/approval', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(approval)
        });
        
        if (response.ok) {
          // Remove from pending list
          await removePendingApproval(approval.id);
          
          // Show success notification
          self.registration.showNotification('Task Approved', {
            body: `Task "${approval.taskName}" has been approved`,
            icon: '/favicon.ico',
            tag: 'approval-success'
          });
        }
      } catch (error) {
        console.error('Failed to sync approval:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for offline storage
async function getPendingApprovals() {
  // In a real implementation, this would use IndexedDB
  return [];
}

async function removePendingApproval(id) {
  // In a real implementation, this would remove from IndexedDB
  console.log('Removing pending approval:', id);
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event for caching (optional)
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

console.log('Service Worker loaded successfully');
