// sw.js - Service Worker للإشعارات المنبثقة
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'إنجازك 🚀';
    const options = {
        body: data.body || 'عد إلينا يا بطل وتابع تقدمك اليومي!',
        icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // يمكنك تغيير رابط أيقونة موقعك هنا
        badge: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
