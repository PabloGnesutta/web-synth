const request = indexedDB.open("web_synth", 1); //version
let hasUpgraded = false;
let db;

request.onupgradeneeded = function () {
  // The database did not previously exist, so create object stores and indexes.
  const db = request.result;
  db.createObjectStore("projects");
  db.createObjectStore("projectIdCount");
  db.createObjectStore("project_data");
  db.createObjectStore("track_clips");
  db.createObjectStore("tracks");
  hasUpgraded = true;
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


export default {
  initDb(cb) {
    const numRequests = 2;
    var fulfilledRequests = 0;

    const tx = db.transaction('projects', "readwrite");
    const store = tx.objectStore('projects');

    //this.projects
    store.get('projects').onsuccess = (event) => {
      this.projects = event.target.result;
      onDbInitFinish();
    };
    //this.projectIdCount
    store.get('projectIdCount').onsuccess = (event) => {
      this.projectIdCount = event.target.result;
      console.log(this.projectIdCount);
      onDbInitFinish();
    };

    const onDbInitFinish = () => {
      fulfilledRequests++;
      if (fulfilledRequests >= numRequests) cb(this.projects);
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
    const tx = db.transaction('projects', "readwrite");
    const store = tx.objectStore('projects');

    store.put(data.projects, 'projects');
    store.put(data.idCount, 'projectIdCount');

    tx.oncomplete = function () { cb(); };
  }
};