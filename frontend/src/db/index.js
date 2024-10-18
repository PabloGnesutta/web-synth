const request = indexedDB.open("web_synth", 1); //version
var hasUpgraded = false;
var db = null;

request.onupgradeneeded = function () {
  // The database did not previously exist, so create object stores and indexes.
  hasUpgraded = true;
  const db = request.result;
  db.createObjectStore("projects");
  db.createObjectStore("project_data");
  db.createObjectStore("track_clips");
  db.createObjectStore("tracks");
};

request.onsuccess = function () {
  db = request.result;
  if (hasUpgraded) {
    // furst run
    const tx = db.transaction('projects', "readwrite");
    const store = tx.objectStore('projects');
    store.put({}, 'projects');
    store.put(0, 'projectIdCount');
  }
};

// TODO: Promisify

module.exports = {
  initDb(cb) {
    const numRequests = 2;
    var projects = {};
    var projectIdCount = 0;
    let fulfilledRequests = 0;

    const tx = db.transaction('projects', "readwrite");
    const store = tx.objectStore('projects');

    store.get('projectIdCount').onsuccess = (event) => {
      projectIdCount = event.target.result;
      onDbInitFinish();
    };
    store.get('projects').onsuccess = (event) => {
      projects = event.target.result;
      onDbInitFinish();
    };

    const onDbInitFinish = () => {
      fulfilledRequests++;
      if (fulfilledRequests >= numRequests) cb({
        projects,
        projectIdCount
      });
    };
  },

  save(projectId, storeName, data, cb) {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.put(data, projectId);
    tx.oncomplete = function () { cb(); };
  },

  get(projectId, storeName, cb) {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    let result;
    store.get(projectId).onsuccess = (event) => {
      result = event.target.result;
    };
    tx.oncomplete = function () { cb(result); };
  },

  updateProjectsList(data, cb) {
    console.log('update data', data);
    const tx = db.transaction('projects', "readwrite");
    const store = tx.objectStore('projects');

    store.put(data.projects, 'projects');
    store.put(data.idCount, 'projectIdCount');

    tx.oncomplete = function () { cb(); };
  }
};
