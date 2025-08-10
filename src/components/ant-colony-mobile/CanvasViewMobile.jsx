// src/components/ant-colony-mobile/CanvasViewMobile.jsx
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import useAntEngineMobile from "./useAntEngineMobile";

const CanvasViewMobile = forwardRef(({ config, running, mode }, ref) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const rafRef = useRef(null);
  const containerRef = useRef(null);
  const engine = useAntEngineMobile(config);
  engineRef.current = engine;

  // Exponer reinicio al padre
  useImperativeHandle(ref, () => ({
    restartSimulation() {
      engineRef.current.resetAnts(config.ants);
      engineRef.current.clearFood();
      engineRef.current.seedDefaultFood(); // arranca con semillas
    },
  }));

  // Resize responsivo con DPR
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const widthCSS = Math.floor(rect.width);
      // alto pensado para mobile: 62vh aprox mantenido por CSS; tomamos el alto real
      const heightCSS = Math.floor(rect.height);
      canvas.style.width = widthCSS + "px";
      canvas.style.height = heightCSS + "px";
      canvas.width = Math.floor(widthCSS * dpr);
      canvas.height = Math.floor(heightCSS * dpr);

      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // escalar para nítido
      engineRef.current.resize(widthCSS, heightCSS);
      engineRef.current.resetAnts(config.ants);
    });
    ro.observe(container);

    return () => ro.disconnect();
  }, [config.ants]);

  // React a cambios de cantidad de hormigas
  useEffect(() => {
    engineRef.current.resetAnts(config.ants);
  }, [config.ants]);

  // Loop de animación
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

  // Toque/tap para agregar o quitar comida
  useEffect(() => {
    const canvas = canvasRef.current;

    function pointFromEvent(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
      const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
      return { x, y };
    }

    function onPointerDown(e) {
      const { x, y } = pointFromEvent(e);
      if (mode === "erase") engineRef.current.removeFoodAt(x, y);
      else engineRef.current.addFoodAt(x, y);
    }

    canvas.addEventListener("pointerdown", onPointerDown, { passive: true });
    canvas.addEventListener("touchstart", onPointerDown, { passive: true });

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("touchstart", onPointerDown);
    };
  }, [mode]);

  return (
    <div ref={containerRef} className="am-canvas-wrap">
      <canvas ref={canvasRef} className="am-canvas" />
    </div>
  );
});

export default CanvasViewMobile;
