import OptionSection from "./OptionSection";

export default function HeadSelector({ options, selectedValue, onSelect }) {
  return (
    <OptionSection
      title="1. Elige una Cabeza"
      options={options}
      selectedValue={selectedValue}
      onSelect={(val) => onSelect("head", val)}
    />
  );
}
