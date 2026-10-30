// This registration uses a separate scope so it does not replace Flutter's cache worker.
window.famliPush = {
  async enable(publicKey) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      throw new Error('unsupported');
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('permission_denied');
    const scope = new URL('push/', document.baseURI);
    const registration = await navigator.serviceWorker.register(new URL('push-worker.js', document.baseURI), {scope: scope.href});
    if (!registration.active) {
      const worker = registration.installing || registration.waiting;
      if (!worker) throw new Error('worker_unavailable');
      await new Promise((resolve, reject) => {
        const check = () => {
          if (worker.state === 'activated') resolve();
          else if (worker.state === 'redundant') reject(new Error('worker_unavailable'));
        };
        worker.addEventListener('statechange', check);
        check();
      });
    }
    const bytes = Uint8Array.from(atob(publicKey.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(publicKey.length / 4) * 4, '=')), c => c.charCodeAt(0));
    const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: bytes});
    return JSON.stringify(subscription.toJSON());
  },
  async disable() {
    if (!('serviceWorker' in navigator)) return null;
    const scope = new URL('push/', document.baseURI);
    const registration = await navigator.serviceWorker.getRegistration(scope.href);
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return null;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    return endpoint;
  }
};

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration(new URL('push/', document.baseURI).href)
    .then(registration => registration?.update()).catch(() => {});
}
