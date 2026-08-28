import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

/*
  Polyfill for window.storage, matching the get/set/list interface
  the app expects (originally backed by Claude's storage API).
  Backed by the browser's localStorage, namespaced so it doesn't
  collide with anything else on the domain.
*/
const NS = "dbeste:";

window.storage = {
  async get(key) {
    const raw = localStorage.getItem(NS + key);
    return raw === null ? null : { key, value: raw };
  },
  async set(key, value) {
    localStorage.setItem(NS + key, value);
    return { key, value };
  },
  async delete(key) {
    localStorage.removeItem(NS + key);
    return { key, deleted: true };
  },
  async list(prefix = "") {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NS)) {
        const bare = k.slice(NS.length);
        if (bare.startsWith(prefix)) keys.push(bare);
      }
    }
    return { keys };
  },
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

