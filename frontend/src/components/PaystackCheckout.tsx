"use client";

import { usePaystackPayment } from "react-paystack";
import { CreditCard, Loader2 } from "lucide-react";

export type PaystackCheckoutProps = {
  amount: number;
  email: string;
  publicKey: string;
  isDisabled: boolean;
  isLoading: boolean;
  onPaymentSuccess: (ref: string) => void;
  onPaymentClose: () => void;
};

export default function PaystackCheckout({
  amount,
  email,
  publicKey,
  isDisabled,
  isLoading,
  onPaymentSuccess,
  onPaymentClose,
}: PaystackCheckoutProps) {
  const config = {
    reference: new Date().getTime().toString(),
    email: email || `visitor-${Date.now()}@kickoff.com`,
    amount: amount * 100,
    publicKey,
    currency: "GHS",
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <button
      disabled={isDisabled || isLoading}
      onClick={() =>
        initializePayment({
          onSuccess: (res: { reference: string }) => onPaymentSuccess(res.reference),
          onClose: onPaymentClose,
        })
      }
      className="button-primary flex-1 py-5 text-lg disabled:opacity-50 shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" /> Securely Loading...
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" /> Pay GHS {amount.toLocaleString()}
        </>
      )}
    </button>
  );
}
