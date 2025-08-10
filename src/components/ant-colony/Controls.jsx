// src/components/ant-colony/Controls.jsx
export default function Controls({ config, setConfig }) {
  const B = ({ label, val, min, max, step = 1, prop }) => (
    <div className="control">
      <label>
        {label} <span>{val}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={(e) =>
          setConfig((c) => ({ ...c, [prop]: Number(e.target.value) }))
        }
      />
    </div>
  );

  const T = ({ label, val, step = 0.01, min = 0, max = 1, prop }) => (
    <div className="control">
      <label>
        {label} <span>{val.toFixed(3)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={(e) =>
          setConfig((c) => ({ ...c, [prop]: Number(e.target.value) }))
        }
      />
    </div>
  );

  const C = ({ label, prop }) => (
    <div className="control-row">
      <label>{label}</label>
      <input
        type="checkbox"
        checked={config[prop]}
        onChange={(e) => setConfig((c) => ({ ...c, [prop]: e.target.checked }))}
      />
    </div>
  );

  return (
    <aside className="controls">
      <h3>⚙️ Controles</h3>

      <B
        label="Hormigas"
        val={config.ants}
        min={10}
        max={500}
        step={10}
        prop="ants"
      />
      <B
        label="Velocidad"
        val={config.antSpeed}
        min={0.4}
        max={4}
        step={0.1}
        prop="antSpeed"
      />
      <T
        label="Giro máximo"
        val={config.turnAngle}
        min={0.05}
        max={0.7}
        step={0.01}
        prop="turnAngle"
      />
      <B
        label="Sensor offset"
        val={config.sensorOffset}
        min={4}
        max={30}
        step={1}
        prop="sensorOffset"
      />
      <T
        label="Ángulo sensor"
        val={config.sensorAngle}
        min={0.1}
        max={1.2}
        step={0.01}
        prop="sensorAngle"
      />

      <T
        label="Evaporación"
        val={config.evaporation}
        min={0.001}
        max={0.02}
        step={0.001}
        prop="evaporation"
      />
      <T
        label="Difusión"
        val={config.diffusion}
        min={0.0}
        max={0.35}
        step={0.01}
        prop="diffusion"
      />
      <T
        label="Depósito (cargando)"
        val={config.depositCarry}
        min={0.1}
        max={2}
        step={0.05}
        prop="depositCarry"
      />
      <T
        label="Depósito (buscando)"
        val={config.depositSearch}
        min={0}
        max={0.2}
        step={0.01}
        prop="depositSearch"
      />

      <B
        label="Trail blur"
        val={config.trailBlur}
        min={0}
        max={2}
        step={1}
        prop="trailBlur"
      />
      <B
        label="Tamaño celda"
        val={config.cellSize}
        min={2}
        max={6}
        step={1}
        prop="cellSize"
      />
      <B
        label="Radio nido"
        val={config.nestRadius}
        min={6}
        max={24}
        step={1}
        prop="nestRadius"
      />
      <B
        label="Radio comida"
        val={config.foodRadius}
        min={6}
        max={20}
        step={1}
        prop="foodRadius"
      />

      <C label="Ver feromonas" prop="showPheromones" />
      <C label="Ver hormigas" prop="showAnts" />
    </aside>
  );
}
