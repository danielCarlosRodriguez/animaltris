// src/App.jsx
import { useEffect, useState } from "react";
import Logo from "./components/Logo";
import HeadSelector from "./components/HeadSelector";
import BodySelector from "./components/BodySelector";
import AccessorySelector from "./components/AccessorySelector";
import PlaceSelector from "./components/PlaceSelector";
import { optionsData } from "./data/optionsData";

export default function App() {
  // --- Estado principal ---
  const [selections, setSelections] = useState({
    head: null,
    body: null,
    accessory: null,
    place: null,
  });
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Helpers ---
  const handleSelect = (category, value) => {
    setSelections((prev) => ({ ...prev, [category]: value }));
  };

  const handleReset = () => {
    setSelections({ head: null, body: null, accessory: null, place: null });
    setGeneratedImage(null);
    setError(null);
    setIsLoading(false);
  };

  useEffect(() => {
    console.log("✅ App montado con componentes completos");
  }, []);

  // --- Hugging Face (frontend-only) ---
  const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
  const HF_MODEL =
    import.meta.env.VITE_HF_MODEL || "black-forest-labs/FLUX.1-schnell";
  const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

  const handleGenerateImage = async () => {
    setError(null);
    setGeneratedImage(null);

    // Validaciones
    if (
      !selections.head ||
      !selections.body ||
      !selections.accessory ||
      !selections.place
    ) {
      setError("Faltan opciones. Elegí cabeza, cuerpo, accesorio y lugar 🙂");
      return;
    }
    if (!HF_TOKEN) {
      setError("No se encontró VITE_HF_TOKEN. Configurá tu token en el .env.");
      return;
    }

    setIsLoading(true);

    const prompt = `Full body view, centered. Hybrid animal: dog head + ${selections.body} body, clearly fused. ${selections.body} body must be obvious (scales, fins, tail), no dog torso. Wearing ${selections.accessory}. Scene: ${selections.place}. Cute 3D cartoon (Pixar-like), vibrant colors, detailed background.`;




    console.log("Prompt generado:", prompt);

    // Reintentos para 503 (modelo "cold")
    const callHF = async (signal) => {
      
      const res = await fetch(HF_URL, {
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
        return callHF(signal);
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      return res.blob();
    };

    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 60000); // 60s

      const blob = await callHF(controller.signal);
      clearTimeout(t);

      const url = URL.createObjectURL(blob);
      setGeneratedImage(url);
    } catch (err) {
      console.error("Error al generar la imagen:", err);
      let msg = "No pudimos crear la imagen. Probá de nuevo en unos segundos.";
      const low = (err?.message || "").toLowerCase();
      if (low.includes("unauthorized") || low.includes("token")) {
        msg = "Token inválido o faltante. Verificá VITE_HF_TOKEN.";
      } else if (low.includes("rate") || low.includes("too many")) {
        msg = "Límite de uso alcanzado. Esperá un momento y reintenta.";
      } else if (low.includes("abort")) {
        msg = "Tiempo de espera agotado. Reintentá.";
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const canGenerate = Object.values(selections).every(Boolean);
  const isGenerationComplete = generatedImage || error;

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
      {/* estilos utilitarios para fuente/contorno del Logo */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
        .font-brand { font-family: 'Fredoka One', cursive; }
        .text-stroke { -webkit-text-stroke: 3px #f97316; text-stroke: 3px #f97316; }
      `}</style>

      <main className="w-full max-w-4xl p-4 sm:p-6 text-gray-800">
        <Logo />

        {!isGenerationComplete ? (
          <>
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

            <div className="text-center mt-6">
              <button
                onClick={handleGenerateImage}
                disabled={!canGenerate || isLoading}
                className={`
                  font-brand text-2xl sm:text-3xl text-white px-10 py-4 rounded-full shadow-lg
                  transform transition-all duration-300
                  ${
                    canGenerate
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-gray-400 cursor-not-allowed"
                  }
                  ${isLoading ? "animate-pulse" : ""}
                `}
              >
                {isLoading ? "Creando..." : "¡Crear AnimalTris!"}
              </button>
            </div>
          </>
        ) : (
          <div className="w-full bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl text-center flex flex-col items-center">
            {isLoading && (
              <div className="flex flex-col items-center justify-center p-10">
                <div className="w-16 h-16 border-8 border-dashed rounded-full animate-spin border-orange-500"></div>
                <p className="font-bold text-xl text-orange-600 mt-6">
                  Un momento, la magia está en proceso...
                </p>
              </div>
            )}

            {error && (
              <div className="p-10">
                <p className="text-5xl mb-4">😢</p>
                <p className="text-red-600 font-bold text-xl">{error}</p>
              </div>
            )}

            {generatedImage && (
              <>
                <h2 className="font-brand text-4xl text-orange-500 mb-4">
                  ¡Aquí está tu creación!
                </h2>
                <img
                  src={generatedImage}
                  alt="Animal fantástico generado por IA"
                  className="rounded-2xl shadow-2xl max-w-full h-auto border-4 border-white"
                />
                <a
                  href={generatedImage}
                  download="animaltris.png"
                  className="mt-6 inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full"
                >
                  Descargar PNG
                </a>
              </>
            )}

            <button
              onClick={handleReset}
              className="mt-8 font-brand text-2xl text-white bg-blue-500 hover:bg-blue-600 px-10 py-4 rounded-full shadow-lg transform transition-all duration-300"
            >
              Crear Otro
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
