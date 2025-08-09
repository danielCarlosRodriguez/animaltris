import OptionSection from "./OptionSection";

export default function BodySelector({ options, selectedValue, onSelect }) {
  return (
    <OptionSection
      title="2. Elige un Cuerpo"
      options={options}
      selectedValue={selectedValue}
      onSelect={(val) => onSelect("body", val)}
    />
  );
}
