// src/Menu.jsx
import { useEffect, useMemo, useState } from "react";
import AntColony from "./components/ant-colony/AntColony";
import AntColonyMobile from "./components/ant-colony-mobile/AntColonyMobile";
import Animaltris from "./components/animaltirs/Animaltris";
import Triangles from "./components/triangles/Triangles";

export default function Menu() {
  const [isMobile, setIsMobile] = useState(false);
  const [selected, setSelected] = useState(null);

  // Detección simple de mobile vs desktop
  useEffect(() => {
    const detect = () =>
      setIsMobile(
        window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent)
      );
    detect();
    window.addEventListener("resize", detect);
    return () => window.removeEventListener("resize", detect);
  }, []);

  // Items según dispositivo
  const items = useMemo(() => {
    if (isMobile) {
      return [
        {
          key: "animaltris",
          label: "Animaltris",
          desc: "Juego móvil",
          emoji: "🎮",
        },
        {
          key: "ant-colony-mobile",
          label: "Ant Colony (Mobile)",
          desc: "Optimizado táctil",
          emoji: "🐜",
        },
        {
          key: "triangles",
          label: "Triángulos",
          desc: "Formas geométricas",
          emoji: "🔺",
        },
      ];
    }
    return [
      {
        key: "animaltris",
        label: "Animaltris",
        desc: "Juego de piezas",
        emoji: "🎮",
      },
      {
        key: "ant-colony",
        label: "Ant Colony (Desktop)",
        desc: "Vista completa",
        emoji: "🐜",
      },
      {
        key: "triangles",
        label: "Triángulos",
        desc: "Formas geométricas",
        emoji: "🔺",
      },
    ];
  }, [isMobile]);

  // Render del seleccionado
  if (selected) {
    if (selected === "animaltris") return <Animaltris />;
    if (selected === "ant-colony") return <AntColony />;
    if (selected === "ant-colony-mobile") return <AntColonyMobile />;
    if (selected === "triangles") return <Triangles />;
    return null;
  }

  // Menú (solo botones)
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-6">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-xl font-bold mb-4 tracking-tight">Menú</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => setSelected(item.key)}
              className="group w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-left bg-white/70 dark:bg-slate-900/60 backdrop-blur
                         hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-900 transition focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <span className="text-2xl leading-none">{item.emoji}</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.desc}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition text-slate-400 dark:text-slate-300">
                  ➜
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
