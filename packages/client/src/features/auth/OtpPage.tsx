import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { authClient } from "../../lib/auth";

interface OtpPageProps {
  phone: string;
  onVerified: () => void;
  onBack: () => void;
}

export function OtpPage({ phone, onVerified, onBack }: OtpPageProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const finalCode = otpCode || code.join("");
    if (finalCode.length !== 6) return;

    setError("");
    setLoading(true);

    try {
      const { error: authError } = await authClient.phoneNumber.verify({
        phoneNumber: phone,
        code: finalCode,
      });

      if (authError) {
        setError(authError.message || t("common.error"));
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      onVerified();
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-2">{t("auth.otp")}</h1>
        <p className="text-gray-500 text-center mb-8" dir="ltr">
          {phone}
        </p>

        <div className="flex gap-2 justify-center mb-6" dir="ltr">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <button
          onClick={() => handleVerify()}
          disabled={loading || code.join("").length !== 6}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
        >
          {loading ? t("common.loading") : t("auth.verify")}
        </button>

        <button
          onClick={onBack}
          className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
