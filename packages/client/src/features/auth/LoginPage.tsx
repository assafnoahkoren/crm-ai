import { useState } from "react";
import { useTranslation } from "react-i18next";
import { authClient } from "../../lib/auth";

interface LoginPageProps {
  onOtpSent: (phone: string) => void;
}

export function LoginPage({ onOtpSent }: LoginPageProps) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await authClient.phoneNumber.sendOtp({
        phoneNumber: phone,
      });

      if (authError) {
        setError(authError.message || t("common.error"));
        return;
      }

      onOtpSent(phone);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-2">{t("app.name")}</h1>
        <p className="text-gray-500 text-center mb-8">{t("auth.login")}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              {t("auth.phone")}
            </label>
            <input
              id="phone"
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+972521234567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t("common.loading") : t("auth.sendCode")}
          </button>
        </form>
      </div>
    </div>
  );
}
