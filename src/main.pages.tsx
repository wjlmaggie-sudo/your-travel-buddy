import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";
import { NATIVE_APP, isNative } from "./lib/native-app";

if (NATIVE_APP) document.body.classList.add("native-host");
if (NATIVE_APP && !isNative()) document.documentElement.classList.add("native-preview");

if (NATIVE_APP && (!window.location.hash || window.location.hash === "#/")) {
  window.location.replace(`${window.location.pathname}${window.location.search}#/on-trip`);
}

const root = document.getElementById("root");
if (!root) throw new Error("The application root is missing.");
createRoot(root).render(
  <StrictMode>
    <RouterProvider router={getRouter()} />
  </StrictMode>,
);
