// src/components/Logo.jsx
export default function Logo() {
  return (
    <div className="flex flex-col items-center justify-center mx-auto mb-6">
      <img
        src="/img/logo-animaltris.png"
        alt="Animaltris"
        className="inline-block w-34 h-auto max-w-none "
    
      />
      <p className="text-orange-600 font-bold mt-2">
        ¡Crea tu animal fantástico!
      </p>
  
    </div>
  );
}
