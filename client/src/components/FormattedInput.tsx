import { useState, useEffect } from "react";

interface FormattedInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  formatter: (value: string) => string;
  placeholder: string;
  className?: string;
  maxLength?: number;
}

export default function FormattedInput({
  id,
  value,
  onChange,
  formatter,
  placeholder,
  className = "",
  maxLength,
}: FormattedInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  
  useEffect(() => {
    setDisplayValue(formatter(value));
  }, [value, formatter]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    onChange(input);
  };
  
  return (
    <input
      id={id}
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      maxLength={maxLength}
    />
  );
}
