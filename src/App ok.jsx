import { useState } from "react";

// --- Datos de las Opciones ---
const optionsData = {
  heads: [
    { name: "León", emoji: "🦁" },
    { name: "Mono", emoji: "🐵" },
    { name: "Oso", emoji: "🐻" },
    { name: "Perro", emoji: "🐶" },
    { name: "Tigre", emoji: "🐯" },
    { name: "Vaca", emoji: "🐮" },
  ],
  bodies: [
    { name: "Elefante", emoji: "🐘" },
    { name: "Pez", emoji: "🐠" },
    { name: "Cangrejo", emoji: "🦀" },
    { name: "Gallo", emoji: "🐔" },
    { name: "Tortuga", emoji: "🐢" },
    { name: "Pingüino", emoji: "🐧" },
  ],
  accessories: [
    { name: "Lentes de sol", emoji: "😎" },
    { name: "Sombrero de copa", emoji: "🎩" },
    { name: "Corona", emoji: "👑" },
    { name: "Monóculo", emoji: "🧐" },
    { name: "Guitarra", emoji: "🎸" },
    { name: "Patineta", emoji: "🛹" },
  ],
  places: [
    { name: "la playa", emoji: "🏖️" },
    { name: "la luna", emoji: "🌕" },
    { name: "un desierto", emoji: "🏜️" },
    { name: "un volcán", emoji: "🌋" },
    { name: "una ciudad de noche", emoji: "🌃" },
    { name: "el bosque", emoji: "🌲" },
  ],
};

// --- Componente de Botón de Selección ---
const SelectionButton = ({ item, onClick, isSelected }) => (
  <button
    onClick={onClick}
    className={`
      relative w-28 h-28 md:w-36 md:h-36 rounded-xl flex flex-col items-center justify-center
      bg-white shadow-md cursor-pointer transition-transform duration-200 hover:scale-105
      focus:outline-none
      ${isSelected ? "ring-4 ring-yellow-500" : ""}
    `}
  >
    <span className="text-4xl md:text-5xl">{item.emoji}</span>
    <span className="absolute bottom-2 text-xs md:text-sm font-semibold text-gray-700">
      {item.name}
    </span>
  </button>
);

// --- Componente de la Sección de Opciones ---
const OptionSection = ({ title, options, selectedValue, onSelect }) => (
  <div className="w-full bg-orange-400 p-6 rounded-2xl shadow-inner mb-6">
    {" "}
    {/* Ajustado para coincidir con el diseño */}
    <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-4">
      {title}
    </h2>{" "}
    {/* Título centrado y blanco */}
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 justify-items-center">
      {" "}
      {/* Centrar elementos en el grid */}
      {options.map((item) => (
        <SelectionButton
          key={item.name}
          item={item}
          isSelected={selectedValue === item.name} // Propiedad corregida
          onClick={() => onSelect(item.name)}
        />
      ))}
    </div>
  </div>
);

// --- Componente Principal de la Aplicación ---
export default function App() {
  const [selections, setSelections] = useState({
    head: null,
    body: null,
    accessory: null,
    place: null,
  });
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelect = (category, value) => {
    setSelections((prev) => ({ ...prev, [category]: value }));
  };

  const handleReset = () => {
    setSelections({ head: null, body: null, accessory: null, place: null });
    setGeneratedImage(null);
    setError(null);
    setIsLoading(false);
  };

  const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
  const HF_MODEL =
    import.meta.env.VITE_HF_MODEL || "black-forest-labs/FLUX.1-schnell";
  const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;


  const handleGenerateImage = async () => {
    setError(null);
    setGeneratedImage(null);

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

    const prompt = `Crear una imagen de un animal fantástico con cabeza de ${selections.head} y cuerpo de ${selections.body}, usando ${selections.accessory}. El animal está en ${selections.place}. Estilo de dibujos animados 3D como Disney Pixar, colores muy vibrantes, adorable, para niños, fondo detallado.`;

    // Pequeña función helper para reintentos si el modelo está "cold" (503)
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

      // Cuando el modelo se está calentando, HF suele responder 503 con JSON
      if (res.status === 503) {
        // Esperamos un poquito y reintentamos
        await new Promise((r) => setTimeout(r, 2500));
        return callHF(signal);
      }

      if (!res.ok) {
        // Intentamos leer texto para ver detalle de error
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      return res.blob(); // <- imagen binaria
    };

    try {
      // Timeout defensivo (60s)
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 60000);

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
        msg = "Límite de uso alcanzado. Esperá un momento y reintentá.";
      } else if (low.includes("abort")) {
        msg = "Tiempo de espera agotado. Reintentá.";
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };
  
  const isGenerationComplete = generatedImage || error;
  const canGenerate = Object.values(selections).every(Boolean);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
        .font-brand { font-family: 'Fredoka One', cursive; }
        /* Para el efecto de contorno del texto del título */
        .text-stroke {
          -webkit-text-stroke: 3px #f97316; /* Webkit (Chrome, Safari) */
          text-stroke: 3px #f97316; /* Estándar */
        }
      `}</style>
      <div className="min-h-screen bg-teal-200 flex flex-col items-center p-4 sm:p-6 text-gray-800">
        <header className="w-full max-w-4xl text-center mb-6">
          <h1 className="font-brand text-5xl sm:text-7xl text-white text-stroke">
            Animaltris
          </h1>
          <p className="text-orange-600 font-bold text-lg sm:text-xl mt-1">
            ¡Crea tu animal fantástico!
          </p>
        </header>

        <main className="w-full max-w-4xl">
          {!isGenerationComplete ? (
            <>
              <OptionSection
                title="1. Elige una Cabeza"
                options={optionsData.heads}
                selectedValue={selections.head}
                onSelect={(val) => handleSelect("head", val)}
              />
              <OptionSection
                title="2. Elige un Cuerpo"
                options={optionsData.bodies}
                selectedValue={selections.body}
                onSelect={(val) => handleSelect("body", val)}
              />
              <OptionSection
                title="3. Elige un Accesorio"
                options={optionsData.accessories}
                selectedValue={selections.accessory}
                onSelect={(val) => handleSelect("accessory", val)}
              />
              <OptionSection
                title="4. Elige un Lugar"
                options={optionsData.places}
                selectedValue={selections.place}
                onSelect={(val) => handleSelect("place", val)}
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
                  {isLoading ? "Creando..." : "¡Crear Magia!"}
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
    </>
  );
}
