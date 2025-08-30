// src/components/OptionSection.jsx
const SelectionButton = ({ item, onClick, isSelected }) => {

  return (
    <div className="flex flex-col items-center space-y-1 w-full">
      <button
        onClick={onClick}
        className={`
          relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center
          transition-all duration-300 transform hover:scale-105 cursor-pointer group
          focus:outline-none focus:ring-0
          ${isSelected 
            ? "bg-gradient-to-br from-white/95 to-white/80 backdrop-blur-sm shadow-xl border-2 border-emerald-400/60 ring-2 ring-emerald-400/30 scale-105" 
            : "bg-white/70 backdrop-blur-sm shadow-md border border-white/50 hover:bg-white/85 hover:shadow-lg hover:border-white/70"
          }
        `}
      >
        <div className={`transition-all duration-300 ${isSelected ? "scale-110" : "group-hover:scale-105"}`}>
          <span className="text-xl sm:text-2xl md:text-3xl drop-shadow-sm">{item.emoji}</span>
        </div>
        
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-md border border-white">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
          </div>
        )}
      </button>
      
      {/* Texto separado debajo del botón */}
      <span 
        className={`
          text-xs font-medium text-center leading-tight px-1
          transition-colors duration-300
          ${isSelected ? "text-emerald-200" : "text-white/90"}
        `}
      >
        {item.name}
      </span>
    </div>
  );
};

export default function OptionSection({
  title,
  options,
  selectedValue,
  onSelect,
}) {
  const selectedCount = selectedValue ? 1 : 0;
  const totalCount = options.length;

  return (
    <div className="w-full group">
      {/* Header mejorado */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
          {title}
        </h2>
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${
            selectedValue ? "bg-emerald-400 shadow-lg shadow-emerald-400/50" : "bg-white/30"
          }`}></div>
          <span className="font-medium">
            {selectedCount}/{totalCount > 6 ? "6+" : totalCount}
          </span>
        </div>
      </div>

      {/* Grid de opciones mejorado */}
      <div className="bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-7 lg:gap-x-3 lg:gap-y-6 justify-items-center items-start">
          {options.map((item, index) => (
            <div
              key={item.name}
              className="w-full flex justify-center transform transition-all duration-300 min-h-[85px] sm:min-h-[90px]"
              style={{ 
                animationDelay: `${index * 50}ms`
              }}
            >
              <SelectionButton
                item={item}
                isSelected={selectedValue === item.name}
                onClick={() => onSelect(item.name)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
