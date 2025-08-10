import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import useAntEngine from "./useAntEngine";

const CanvasView = forwardRef(({ config, running }, ref) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const rafRef = useRef(null);

  const engine = useAntEngine(config);
  engineRef.current = engine;

  // Permite que el padre llame funciones internas
  useImperativeHandle(ref, () => ({
    restartSimulation() {
      engineRef.current.resetAnts(config.ants);
      engineRef.current.clearFood();
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = config.width;
    canvas.height = config.height;

    engineRef.current.resize(config.width, config.height);
    engineRef.current.resetAnts(config.ants);
  }, [config.width, config.height, config.ants]);

  useEffect(() => {
    engineRef.current.resetAnts(config.ants);
  }, [config.ants]);
  

  useEffect(() => {
  const ctx = canvasRef.current.getContext("2d");

  function frame() {
    if (running) {
      engineRef.current.step();
    }
    engineRef.current.draw(ctx);
    rafRef.current = requestAnimationFrame(frame);
  }

  rafRef.current = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafRef.current);
}, [running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    function onClick(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (e.shiftKey) {
        engine.removeFoodAt(x, y);
      } else {
        engine.addFoodAt(x, y);
      }
    }
    canvas.addEventListener("click", onClick);
    return () => canvas.removeEventListener("click", onClick);
  }, [engine]);

  return (
    <div className="canvas-wrap" style={{ width: config.width }}>
      <canvas ref={canvasRef} className="ant-canvas" />
    </div>
  );
});

export default CanvasView;
