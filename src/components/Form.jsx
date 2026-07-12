"use client";

import { useState } from "react";

export default function Form({
  label,
  type = "text",
  name,
  id,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = "",
  accept, // Khusus untuk input file (misal: "image/*")
  rows = 4, // Khusus untuk textarea
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  // 1. Base Input Classes
  const baseInputClasses = `
    w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 placeholder-gray-400 
    transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
  `;

  // 2. Border Color (Merah jika error, abu-abu jika normal)
  const borderClasses = error
    ? "border-red-300 focus:ring-red-500"
    : "border-gray-300 focus:ring-blue-500 hover:border-gray-400";

  // 3. Render berdasarkan Type
  const renderInput = () => {
    // --- TEXTAREA ---
    if (type === "textarea") {
      return (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={`${baseInputClasses} ${borderClasses} resize-none ${className}`}
          {...props}
        />
      );
    }

    // --- FILE UPLOAD (Custom UI) ---
    if (type === "file") {
      return (
        <label
          htmlFor={id}
          className={`
            flex flex-col items-center justify-center w-full p-6 cursor-pointer 
            border-2 border-dashed rounded-lg transition-colors
            ${error ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}
            ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          <input
            type="file"
            id={id}
            name={name}
            onChange={onChange}
            accept={accept}
            disabled={disabled}
            className="hidden"
            {...props}
          />
          <svg
            className="w-8 h-8 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-600 font-medium">
            {value && value.name ? value.name : "Klik untuk upload foto"}
          </p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG hingga 5MB</p>
        </label>
      );
    }

    // --- PASSWORD (Dengan Toggle Show/Hide) ---
    if (type === "password") {
      return (
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`${baseInputClasses} ${borderClasses} pr-10 ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            tabIndex="-1"
          >
            {showPassword ? (
              // Icon Hide
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              // Icon Show
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
      );
    }

    // --- DEFAULT (text, email, url, dll) ---
    return (
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`${baseInputClasses} ${borderClasses} ${className}`}
        {...props}
      />
    );
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Label */}
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Area */}
      {renderInput()}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
