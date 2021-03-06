const dbPromise = idb.open('posts-store', 1, db => {
  if (!db.objectStoreNames.contains('posts'))
    db.createObjectStore('posts', { keyPath: 'id' });

  if (!db.objectStoreNames.contains('sync-posts'))
    db.createObjectStore('sync-posts', { keyPath: 'id' });
});

writeData = (store, data) => {
  return dbPromise.then(db => {
    const tx = db.transaction(store, 'readwrite');
    const st = tx.objectStore(store);
    st.put(data);
    return tx.complete;
  });
};

readAllData = store => {
  return dbPromise.then(db => {
    const tx = db.transaction(store, 'readonly');
    const st = tx.objectStore(store);
    return st.getAll();
  });
};

clearAllData = store => {
  return dbPromise.then(db => {
    const tx = db.transaction(store, 'readwrite');
    const st = tx.objectStore(store);
    st.clear();
    return tx.complete;
  });
};

deleteItemFromData = (store, id) => {
  return dbPromise
    .then(db => {
      const tx = db.transaction(store, 'readwrite');
      const st = tx.objectStore(store);
      st.delete(id);
      return tx.complete;
    })
    .then(() => {
      console.log('Item deleted!');
    });
};

urlBase64ToUint8Array = base64String => {
  var padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  var base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};
