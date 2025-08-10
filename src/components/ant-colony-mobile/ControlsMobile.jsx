// src/components/ant-colony-mobile/ControlsMobile.jsx
export default function ControlsMobile({ config, setConfig }) {
  const R = ({ label, prop, min, max, step = 1, format = (v) => v }) => (
    <div className="am-control">
      <label>
        {label} <span>{format(config[prop])}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={config[prop]}
        onChange={(e) =>
          setConfig((c) => ({ ...c, [prop]: Number(e.target.value) }))
        }
      />
    </div>
  );

  const C = ({ label, prop }) => (
    <div className="am-toggle">
      <label>{label}</label>
      <input
        type="checkbox"
        checked={config[prop]}
        onChange={(e) => setConfig((c) => ({ ...c, [prop]: e.target.checked }))}
      />
    </div>
  );

  return (
    <section className="am-controls">
      <R label="Hormigas" prop="ants" min={60} max={400} step={10} />
      <R label="Velocidad" prop="antSpeed" min={0.6} max={3.2} step={0.1} />
      <R
        label="Giro máx"
        prop="turnAngle"
        min={0.05}
        max={0.7}
        step={0.01}
        format={(v) => v.toFixed(2)}
      />
      <R
        label="Evaporación"
        prop="evaporation"
        min={0.001}
        max={0.02}
        step={0.001}
        format={(v) => v.toFixed(3)}
      />
      <R
        label="Difusión"
        prop="diffusion"
        min={0.0}
        max={0.35}
        step={0.01}
        format={(v) => v.toFixed(2)}
      />
      <C label="Ver hormigas" prop="showAnts" />
      <C label="Ver feromonas" prop="showPheromones" />
    </section>
  );
}
