// src/components/OptionSection.jsx
const SelectionButton = ({ item, onClick, isSelected }) => (
  <button
    onClick={onClick}
    className={`
      relative w-24 h-24 md:w-36 md:h-36 rounded-xl flex flex-col items-center justify-center
      bg-white shadow-md cursor-pointer transition-transform duration-200 hover:scale-105
      focus:outline-none ${isSelected ? "ring-4 ring-violet-700" : ""}
    `}
  >
    <span className="text-4xl md:text-5xl">{item.emoji}</span>
    <span className="absolute bottom-1 text-xs md:text-sm font-semibold text-gray-700">
      {item.name}
    </span>
  </button>
);

export default function OptionSection({
  title,
  options,
  selectedValue,
  onSelect,
}) {
  return (
    <div className="w-full bg-orange-400 p-6 rounded-2xl shadow-inner mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-4">
        {title}
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-6 gap-y-8 sm:gap-x-8 sm:gap-y-10 justify-items-center">
        {options.map((item) => (
          <SelectionButton
            key={item.name}
            item={item}
            isSelected={selectedValue === item.name}
            onClick={() => onSelect(item.name)}
          />
        ))}
      </div>
    </div>
  );
}
