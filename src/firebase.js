import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAlxZ1FVhsfNEnYpamiQkQ9152rl65N-zQ",
  authDomain: "barretwater.firebaseapp.com",
  databaseURL: "https://barretwater-default-rtdb.firebaseio.com",
  projectId: "barretwater",
  storageBucket: "barretwater.firebasestorage.app",
  messagingSenderId: "268110919054",
  appId: "1:268110919054:web:67018d89c9c8da0f11e0df"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);
const ROOT = "barretwater";

export const storage = {
  async get(key) {
    try {
      const snap = await get(ref(db, `${ROOT}/${key}`));
      if (!snap.exists()) return null;
      const raw = snap.val();
      // Si Firebase devuelve objeto/array nativo, lo re-serializamos
      // para que sget pueda hacer JSON.parse normalmente
      const value = typeof raw === "string" ? raw : JSON.stringify(raw);
      return { key, value };
    } catch (e) {
      console.error("storage.get error", e);
      return null;
    }
  },

  async set(key, value) {
    try {
      // value llega como JSON string desde sset.
      // Lo parseamos para guardar el objeto nativo en Firebase
      let parsed;
      try { parsed = JSON.parse(value); } catch { parsed = value; }
      await set(ref(db, `${ROOT}/${key}`), parsed);
      return { key, value };
    } catch (e) {
      console.error("storage.set error", e);
      return null;
    }
  },

  async delete(key) {
    try {
      await remove(ref(db, `${ROOT}/${key}`));
      return { key, deleted: true };
    } catch (e) {
      console.error("storage.delete error", e);
      return null;
    }
  },

  async list(prefix) {
    try {
      const snap = await get(ref(db, ROOT));
      if (!snap.exists()) return { keys: [] };
      const keys = Object.keys(snap.val()).filter(k => !prefix || k.startsWith(prefix));
      return { keys };
    } catch (e) {
      console.error("storage.list error", e);
      return { keys: [] };
    }
  }
};
