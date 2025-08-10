// src/components/ant-colony-mobile/AntColonyMobile.jsx
import { useRef, useState } from "react";
import CanvasViewMobile from "./CanvasViewMobile";
import ControlsMobile from "./ControlsMobile";
import "./styles-mobile.css";

export default function AntColonyMobile() {
  const [config, setConfig] = useState({
    // width/height se ajustan automáticamente por CanvasViewMobile (responsive)
    ants: 160, // menor por default para mobile
    antSpeed: 1.4,
    turnAngle: 0.32,
    sensorOffset: 10,
    sensorAngle: 0.5,
    evaporation: 0.007,
    diffusion: 0.12,
    depositCarry: 0.9,
    depositSearch: 0.02,
    trailBlur: 1,
    cellSize: 3,
    nestRadius: 12,
    foodRadius: 10,
    showPheromones: true,
    showAnts: true,
  });

  const [running, setRunning] = useState(true);
  const [mode, setMode] = useState("add"); // "add" | "erase"
  const viewRef = useRef(null);

  const handleRestart = () => {
    viewRef.current?.restartSimulation();
  };

  return (
    <div className="ant-mobile-wrap">
      <header className="am-topbar">
        <h2>🐜 Ant Colony (Mobile)</h2>
        <div className="am-actions">
          <button onClick={() => setRunning((r) => !r)}>
            {running ? "Pausar" : "Reanudar"}
          </button>
          <button onClick={handleRestart}>Reiniciar</button>
        </div>
      </header>

      <CanvasViewMobile
        ref={viewRef}
        config={config}
        running={running}
        mode={mode}
      />

      <div className="am-toolbar">
        <button
          className={mode === "add" ? "active" : ""}
          onClick={() => setMode("add")}
        >
          ➕ Comida
        </button>
        <button
          className={mode === "erase" ? "active" : ""}
          onClick={() => setMode("erase")}
        >
          🗑️ Quitar
        </button>
        <button
          onClick={() =>
            setConfig((c) => ({ ...c, showPheromones: !c.showPheromones }))
          }
        >
          {config.showPheromones ? "Ocultar feromonas" : "Ver feromonas"}
        </button>
      </div>

      <ControlsMobile config={config} setConfig={setConfig} />

      <p className="am-hint">
        👆 Toca el canvas para {mode === "add" ? "agregar" : "quitar"} comida.
      </p>
    </div>
  );
}
