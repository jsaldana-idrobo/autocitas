import React from "react";

export function InputField({
  name,
  label,
  type = "text",
  placeholder,
  defaultValue,
  className
}: Readonly<{
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  className?: string;
}>) {
  return (
    <label className={`block text-sm font-medium ${className ?? ""}`}>
      {label}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
      />
    </label>
  );
}
