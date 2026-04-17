import { useState } from "react";
import { LoginPage } from "./LoginPage";
import { OtpPage } from "./OtpPage";

interface AuthFlowProps {
  onAuthenticated: () => void;
}

type AuthStep = "phone" | "otp";

export function AuthFlow({ onAuthenticated }: AuthFlowProps) {
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");

  if (step === "otp") {
    return <OtpPage phone={phone} onVerified={onAuthenticated} onBack={() => setStep("phone")} />;
  }

  return (
    <LoginPage
      onOtpSent={(p) => {
        setPhone(p);
        setStep("otp");
      }}
    />
  );
}
