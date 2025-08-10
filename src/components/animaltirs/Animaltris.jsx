import { useEffect, useState } from "react";
import Logo from "./Logo";
import HeadSelector from "./HeadSelector";
import BodySelector from "./BodySelector";
import AccessorySelector from "./AccessorySelector";
import PlaceSelector from "./PlaceSelector";
import { optionsData } from "./data/optionsData";

// arriba de todo, antes del componente
const MODELS = (() => {
  const fromEnv = import.meta.env.VITE_HF_MODELS?.split(",").map(s => s.trim()).filter(Boolean);
  const ids = fromEnv?.length ? fromEnv : [
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-xl-base-1.0",

  ];
  // etiqueta linda
  return ids.map(id => ({ id, label: id.split("/")[1] || id }));
})();


export default function Animaltris() {
  // --- Estado principal ---
  const [selections, setSelections] = useState({
    head: null,
    body: null,
    accessory: null,
    place: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  // resultados por modelo: { modelId, label, status, url?, error?, ms? }
  const [results, setResults] = useState([]);

  // --- Helpers ---
  const handleSelect = (category, value) => {
    setSelections((prev) => ({ ...prev, [category]: value }));
  };

  const handleReset = () => {
    setSelections({ head: null, body: null, accessory: null, place: null });
    setResults([]);
    setGlobalError(null);
    setIsLoading(false);
  };

  useEffect(() => {
    console.log("✅ App montado con componentes completos");
  }, []);

  // --- Hugging Face (frontend-only) ---
  const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;

  // Helper: una llamada a HF para un modelo concreto (con reintentos 503)
  const generateWithModel = async (modelId, prompt, signal) => {
    const url = `https://api-inference.huggingface.co/models/${modelId}`;

    // backoff simple: 2.5s cada vez si 503
    const callOnce = async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "image/png",
        },
        body: JSON.stringify({ inputs: prompt }),
        signal,
      });

      if (res.status === 503) {
        await new Promise((r) => setTimeout(r, 2500));
        return callOnce(); // reintenta
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      if (res.status === 404) {
        throw new Error(
          "404: Este repo no expone Inference API (usa Diffusers/Spaces)."
        );
      }
      if (res.status === 400) {
        throw new Error(
          "400: Solicitud inválida o acceso requerido (gated). Acepta los términos del modelo."
        );
      }
      return res.blob();
    };

    const t0 = performance.now();
    const blob = await callOnce();
    const ms = Math.round(performance.now() - t0);
    const urlObj = URL.createObjectURL(blob);
    return { url: urlObj, ms };
  };

  const handleGenerateImage = async () => {
    setGlobalError(null);
    setResults([]);

    // Validaciones
    if (
      !selections.head ||
      !selections.body ||
      !selections.accessory ||
      !selections.place
    ) {
      setGlobalError(
        "Faltan opciones. Elegí cabeza, cuerpo, accesorio y lugar 🙂"
      );
      return;
    }
    if (!HF_TOKEN) {
      setGlobalError(
        "No se encontró VITE_HF_TOKEN. Configurá tu token en el .env."
      );
      return;
    }

    setIsLoading(true);

    // Prompt único para comparar entre modelos
    const prompt = `Full body view, centered. Hybrid animal: ${selections.head} head + ${selections.body} body, clearly fused. ${selections.body} body must be obvious (scales, fins, tail, texture), no ${selections.head} torso. Wearing ${selections.accessory}. Scene: ${selections.place}. Cute 3D cartoon (Pixar-like), vibrant colors, detailed background.`;

    console.log("Prompt generado:", prompt);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000); // 90s para múltiples modelos

    try {
      // Inicializa tarjetas en "loading"
      setResults(
        MODELS.map((m) => ({
          modelId: m.id,
          label: m.label,
          status: "loading",
        }))
      );

      const promises = MODELS.map(async (m) => {
        try {
          const { url, ms } = await generateWithModel(
            m.id,
            prompt,
            controller.signal
          );
          return {
            modelId: m.id,
            label: m.label,
            status: "done",
            url,
            ms,
          };
        } catch (err) {
          const msg = (err?.message || "Error").slice(0, 180);
          return {
            modelId: m.id,
            label: m.label,
            status: "error",
            error: msg,
          };
        }
      });

      const settled = await Promise.allSettled(promises);

      // Combina resultados
      const finalResults = settled.map((r, i) => {
        if (r.status === "fulfilled") return r.value;
        return {
          modelId: MODELS[i].id,
          label: MODELS[i].label,
          status: "error",
          error: (r.reason?.message || String(r.reason) || "Error").slice(
            0,
            180
          ),
        };
      });

      setResults(finalResults);
    } catch (err) {
      console.error("Error global al generar:", err);
      setGlobalError("Ocurrió un error general al generar. Probá de nuevo.");
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  };

  const canGenerate = Object.values(selections).every(Boolean);
  const hasAnyResult = results.length > 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#7008e7",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
        .font-brand { font-family: 'Fredoka One', cursive; }
        .text-stroke { -webkit-text-stroke: 3px #f97316; text-stroke: 3px #f97316; }
      `}</style>

      <main className="w-full max-w-4xl p-4 sm:p-6 text-gray-800">
        <Logo />

        {/* Sección de selección */}
        <HeadSelector
          options={optionsData.heads}
          selectedValue={selections.head}
          onSelect={handleSelect}
        />
        <BodySelector
          options={optionsData.bodies}
          selectedValue={selections.body}
          onSelect={handleSelect}
        />
        <AccessorySelector
          options={optionsData.accessories}
          selectedValue={selections.accessory}
          onSelect={handleSelect}
        />
        <PlaceSelector
          options={optionsData.places}
          selectedValue={selections.place}
          onSelect={handleSelect}
        />

        {/* Botón generar */}
        <div className="text-center mt-6">
          <button
            onClick={handleGenerateImage}
            disabled={!canGenerate || isLoading}
            className={`
              font-brand text-2xl sm:text-3xl text-white px-10 py-4 rounded-full shadow-lg
              transform transition-all duration-300 cursor-pointer
              ${
                canGenerate
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-400 cursor-not-allowed"
              }
              ${isLoading ? "animate-pulse" : ""}
            `}
          >
            {isLoading ? "Creando..." : "¡Crear AnimalTris (Multi-modelo)!"}
          </button>
        </div>

        {/* Errores globales */}
        {globalError && (
          <div className="mt-4 text-center text-red-600 font-bold">
            {globalError}
          </div>
        )}

        {/* Grid de resultados por modelo */}
        {hasAnyResult && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {results.map((r) => (
              <div
                key={r.modelId}
                className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-xl text-center flex flex-col items-center"
              >
                <div className="font-bold text-lg mb-2">{r.label}</div>

                {r.status === "loading" && (
                  <div className="flex flex-col items-center p-8">
                    <div className="w-12 h-12 border-8 border-dashed rounded-full animate-spin border-orange-500"></div>
                    <p className="mt-3 text-orange-600">Generando…</p>
                  </div>
                )}

                {r.status === "error" && (
                  <div className="p-6">
                    <p className="text-4xl mb-2">😢</p>
                    <p className="text-red-600 text-sm break-words">
                      {r.error}
                    </p>
                  </div>
                )}

                {r.status === "done" && r.url && (
                  <>
                    <img
                      src={r.url}
                      alt={`Resultado ${r.label}`}
                      className="rounded-xl shadow max-w-full h-auto border-4 border-white"
                    />
                    <div className="mt-2 text-sm text-gray-600">{r.ms} ms</div>
                    <a
                      href={r.url}
                      download={`${r.label}.png`}
                      className="mt-3 inline-block bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm"
                    >
                      Descargar PNG
                    </a>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reset */}
        {(hasAnyResult || globalError) && (
          <div className="text-center mt-6">
            <button
              onClick={handleReset}
              className="font-brand text-2xl text-white bg-blue-500 hover:bg-blue-600 px-10 py-3 rounded-full shadow-lg transition-all"
            >
              Crear Otro
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
