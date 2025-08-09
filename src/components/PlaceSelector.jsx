import OptionSection from "./OptionSection";

export default function PlaceSelector({ options, selectedValue, onSelect }) {
  return (
    <OptionSection
      title="4. Elige un Lugar"
      options={options}
      selectedValue={selectedValue}
      onSelect={(val) => onSelect("place", val)}
    />
  );
}
