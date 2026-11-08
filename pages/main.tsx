import { StrictMode, createElement } from "react";
import { createRoot } from "react-dom/client";
import { Route } from "../src/routes/index";
import "./styles.css";

// Reuse the actual application's Home component, data and storage logic.
const Home = Route.options.component!;
createRoot(document.getElementById("root")!).render(
  <StrictMode>{createElement(Home)}</StrictMode>,
);
