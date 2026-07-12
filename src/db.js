// Database helper using IndexedDB for offline persistence
const DB_NAME = 'AuroraAppDB';
const DB_VERSION = 1;

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store for session logs (metrics, activity history)
      if (!db.objectStoreNames.contains('logs')) {
        db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
      }

      // Store for application settings and configuration
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Store for custom routines (First/After)
      if (!db.objectStoreNames.contains('routines')) {
        db.createObjectStore('routines', { keyPath: 'id', autoIncrement: true });
      }

      // Store for custom pictograms
      if (!db.objectStoreNames.contains('pictograms')) {
        db.createObjectStore('pictograms', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

export async function saveLog(logEntry) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['logs'], 'readwrite');
    const store = transaction.objectStore('logs');
    const request = store.add({
      timestamp: new Date().toISOString(),
      ...logEntry
    });

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getLogs() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['logs'], 'readonly');
    const store = transaction.objectStore('logs');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function saveSetting(key, value) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    const request = store.put({ key, value });

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getSetting(key, defaultValue = null) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result ? request.result.value : defaultValue);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function clearAllLogs() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['logs'], 'readwrite');
    const store = transaction.objectStore('logs');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}
