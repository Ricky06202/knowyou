import React from "react";
import ReactDOM from "react-dom/client";
import "@saurl/tauri-plugin-safe-area-insets-css-api";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
