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
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-blue-700 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-float-delayed"></div>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One:wght@400&family=Inter:wght@300;400;500;600;700&display=swap');
        .font-brand { font-family: 'Fredoka One', cursive; }
        .font-modern { font-family: 'Inter', system-ui, sans-serif; }
        .text-stroke { 
          -webkit-text-stroke: 3px #f97316; 
          text-stroke: 3px #f97316; 
          text-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .selection-container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: -4s;
        }
        .gradient-border {
          position: relative;
        }
        .gradient-border::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 2px;
          background: linear-gradient(45deg, #8b5cf6, #06b6d4, #10b981);
          border-radius: inherit;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: xor;
        }
      `}</style>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-modern">
        <div className="w-full max-w-6xl">
          <Logo />

          {/* Contenedor de selección mejorado */}
          <div className="mt-8 mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                🎨 Crea tu Animal Único
              </h2>
              <p className="text-xl text-white/90 font-medium max-w-2xl mx-auto leading-relaxed">
                Combina diferentes partes para generar criaturas increíbles con inteligencia artificial
              </p>
            </div>
            
            <div className="selection-container rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-6">
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
                </div>
                <div className="space-y-6">
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
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón generar mejorado */}
        <div className="text-center mb-8">
          <button
            onClick={handleGenerateImage}
            disabled={!canGenerate || isLoading}
            className={`
              font-brand text-2xl sm:text-3xl px-12 py-5 rounded-2xl shadow-2xl
              transform transition-all duration-500 relative overflow-hidden group
              ${
                canGenerate && !isLoading
                  ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white hover:scale-105 hover:shadow-emerald-500/25 cursor-pointer"
                  : "bg-gray-500/50 text-gray-300 cursor-not-allowed"
              }
              ${isLoading ? "animate-pulse" : "hover:animate-none"}
            `}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-75"></div>
            )}
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando Magia...
                </>
              ) : (
                <>
                  ✨ ¡Crear AnimalTris!
                </>
              )}
            </span>
            {!isLoading && canGenerate && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            )}
          </button>
          
          {!canGenerate && !isLoading && (
            <p className="mt-4 text-white/80 text-lg">
              Selecciona todas las opciones para continuar
            </p>
          )}
        </div>

        {/* Errores globales mejorados */}
        {globalError && (
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="glass-card rounded-2xl p-6 border-l-4 border-red-400">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">¡Oops!</h3>
                  <p className="text-red-100 font-medium">{globalError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grid de resultados mejorado */}
        {hasAnyResult && (
          <div className="mt-12 w-full max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                🎉 ¡Tus Criaturas Están Listas!
              </h3>
              <p className="text-white/80 text-lg">
                Compara los resultados de diferentes modelos de IA
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              {results.map((r, index) => (
                <div
                  key={r.modelId}
                  className="glass-card rounded-3xl p-6 shadow-2xl transform transition-all duration-500 hover:scale-105 w-full max-w-sm"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Header de la tarjeta */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
                      <h4 className="font-bold text-lg text-white">{r.label}</h4>
                    </div>
                    {r.status === "done" && (
                      <div className="flex items-center gap-1 text-green-300 text-sm font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        {r.ms} ms
                      </div>
                    )}
                  </div>

                  {/* Contenido de la tarjeta */}
                  <div className="min-h-[200px] flex flex-col items-center justify-center">
                    {r.status === "loading" && (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-blue-200/30 rounded-full"></div>
                          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-medium mb-1">Generando...</p>
                          <p className="text-white/70 text-sm">Esto puede tomar unos momentos</p>
                        </div>
                      </div>
                    )}

                    {r.status === "error" && (
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                          <span className="text-3xl">😞</span>
                        </div>
                        <div>
                          <p className="text-red-300 font-medium mb-2">Error al generar</p>
                          <p className="text-red-200 text-sm break-words max-w-xs mx-auto leading-relaxed">
                            {r.error}
                          </p>
                        </div>
                      </div>
                    )}

                    {r.status === "done" && r.url && (
                      <div className="w-full space-y-4">
                        <div className="relative group overflow-hidden rounded-2xl">
                          <img
                            src={r.url}
                            alt={`Resultado ${r.label}`}
                            className="w-full h-auto max-h-80 object-cover rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-2xl"></div>
                        </div>
                        
                        <div className="flex gap-3">
                          <a
                            href={r.url}
                            download={`animaltris-${r.label}-${Date.now()}.png`}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 text-center hover:scale-105 shadow-lg"
                          >
                            📥 Descargar
                          </a>
                          <button
                            onClick={() => window.open(r.url, '_blank')}
                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105"
                          >
                            🔍 Ver
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón Reset mejorado */}
        {(hasAnyResult || globalError) && (
          <div className="text-center mt-12 mb-8">
            <button
              onClick={handleReset}
              className="font-brand text-xl text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 px-8 py-4 rounded-2xl shadow-2xl transition-all duration-500 transform hover:scale-105 hover:rotate-1 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                🔄 Crear Otra Criatura
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
