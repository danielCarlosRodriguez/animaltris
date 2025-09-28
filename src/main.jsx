import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./Menu";
import Triangles from "./components/triangles/Triangles";
import Animaltris from "./components/animaltirs/Animaltris";
import AntColony from "./components/ant-colony/AntColony";
import AntColonyMobile from "./components/ant-colony-mobile/AntColonyMobile";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/triangulos" element={<Triangles />} />
        <Route path="/animaltris" element={<Animaltris />} />
        <Route path="/ant-colony" element={<AntColony />} />
        <Route path="/ant-colony-mobile" element={<AntColonyMobile />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
