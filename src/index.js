// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";     // <-- note: react-dom/client, not react-dom
import App from "./App";
import "./assets/styles/global.scss";         // your global styles

// Create a root and render <App /> via the new API:
const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
