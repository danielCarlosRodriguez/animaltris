import OptionSection from "./OptionSection";

export default function AccessorySelector({
  options,
  selectedValue,
  onSelect,
}) {
  return (
    <OptionSection
      title="3. Elige un Accesorio"
      options={options}
      selectedValue={selectedValue}
      onSelect={(val) => onSelect("accessory", val)}
    />
  );
}
