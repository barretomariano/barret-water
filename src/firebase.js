// Conexión a Firebase Realtime Database con el SDK oficial (tiempo real, sin polling).
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

export const firebaseConfig = {
  apiKey: "AIzaSyAlxZ1FVhsfNEnYpamiQkQ9152rl65N-zQ",
  authDomain: "barretwater.firebaseapp.com",
  databaseURL: "https://barretwater-default-rtdb.firebaseio.com",
  projectId: "barretwater",
  storageBucket: "barretwater.firebasestorage.app",
  messagingSenderId: "268110919054",
  appId: "1:268110919054:web:67018d89c9c8da0f11e0df",
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Se mantiene bajo "barretwater/" porque las reglas actuales de la base solo habilitan esa rama.
export const BASE = "barretwater";
// Datos del CRM de eventos (separados de los datos viejos del negocio de agua).
export const ROOT = `${BASE}/eventos_v1`;
