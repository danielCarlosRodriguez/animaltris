import { useState, useRef } from "react";
import CanvasView from "./CanvasView";
import Controls from "./Controls";
import "./styles.css";

export default function AntColony() {
  const [config, setConfig] = useState({
    width: 900,
    height: 600,
    ants: 250,
    antSpeed: 1.6,
    turnAngle: 0.3,
    sensorOffset: 10,
    sensorAngle: 0.5,
    evaporation: 0.005,
    diffusion: 0.15,
    depositCarry: 0.9,
    depositSearch: 0.02,
    trailBlur: 1,
    cellSize: 3,
    nestRadius: 14,
    foodRadius: 10,
    showPheromones: true,
    showAnts: true,
  });

  const [running, setRunning] = useState(true);
  const canvasViewRef = useRef(null); // referencia al hijo para llamar métodos

  const handleRestart = () => {
    if (canvasViewRef.current?.restartSimulation) {
      canvasViewRef.current.restartSimulation();
    }
  };

  return (
    <div className="ant-colony-wrap">
      <div className="topbar">
        <h2>🐜 Ant Colony — visual</h2>
        <div className="actions">
          <button onClick={() => setRunning((r) => !r)}>
            {running ? "Pausar" : "Reanudar"}
          </button>
          <button onClick={handleRestart} style={{ marginLeft: "8px" }}>
            Reiniciar
          </button>
        </div>
      </div>

      <div className="colony-grid">
        <CanvasView ref={canvasViewRef} config={config} running={running} />
        <Controls config={config} setConfig={setConfig} />
      </div>

      <p className="hint">
        💡 Click en el canvas para agregar comida. Shift+Click para quitar.
      </p>
    </div>
  );
}
