"use client";
import { useState, useRef, useEffect } from "react";

export default function OTPInput({ length = 6, onComplete, disabled = false }) {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < length - 1) inputRefs.current[index + 1].focus();
    const otpString = newOtp.join("");
    if (otpString.length === length && newOtp.every((d) => d !== ""))
      onComplete(otpString);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1].focus();
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pastedData)) return;
    const newOtp = [...otp];
    for (let i = 0; i < length && i < pastedData.length; i++)
      newOtp[i] = pastedData[i];
    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex].focus();
    const otpString = newOtp.join("");
    if (otpString.length === length && newOtp.every((d) => d !== ""))
      onComplete(otpString);
  };

  return (
    <div className="flex gap-3 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-300 outline-none shadow-sm ${digit ? "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-md shadow-blue-500/10 scale-105" : "border-gray-300 bg-white text-gray-900 hover:border-gray-400"} focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed`}
        />
      ))}
    </div>
  );
}
