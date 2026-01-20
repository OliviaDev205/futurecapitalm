"use client";
import React, { useState } from "react";
import { useUserData } from "../../../contexts/userrContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { CheckCircle, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import Image from "next/image";
import { useTheme } from "../../../contexts/themeContext";

export default function WithdrawalFeeModal({
  open,
  onOpenChange,
  withdrawalData,
  onPaymentSuccess,
}) {
  const { email, address, fetchDetails } = useUserData();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [paymentState, setPaymentState] = useState("payment"); // payment, processing, success

  // Payment methods data
  const deposits = [
    {
      coinName: "Bitcoin",
      short: "Bitcoin",
      image: "/assets/bitcoin.webp",
      address: address && address.Bitcoin,
    },
    {
      coinName: "Ethereum",
      short: "Ethereum",
      image: "/assets/ethereum.webp",
      address: address && address.Ethereum,
    },
    {
      coinName: "Tether USDT",
      short: "Tether",
      image: "/assets/Tether.webp",
      address: address && address.Tether,
    },
  ];

  const othermeans = [
    {
      coinName: "Binance",
      short: "binance",
      image: "/assets/bnb.webp",
      address: address && address.Binance,
    },
    {
      coinName: "Dogecoin",
      short: "Dogecoin",
      image: "/assets/dogecoin.webp",
      address: address && address.Dogecoin,
    },
    {
      coinName: "Tron",
      short: "Tron",
      image: "/assets/tron-logo.webp",
      address: address && address.Tron,
    },
  ];

  const handlePayment = async () => {
    if (
      !withdrawalData ||
      !withdrawalData.withdrawalFee ||
      withdrawalData.withdrawalFee <= 0
    ) {
      toast.error("Withdrawal fee not found. Please contact support.");
      return;
    }

    if (!selectedMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    setLoading(true);
    setPaymentState("processing");
    try {
      const response = await axios.post("/db/withdrawalFee/api", {
        email: email,
        amount: withdrawalData.withdrawalFee,
        withdrawalId: withdrawalData.id,
        paymentMethod: selectedMethod,
      });

      if (response.status === 200) {
        setPaymentState("success");
        toast.success("Withdrawal fee payment submitted successfully!");
        
        // Refresh user details
        if (fetchDetails) {
          fetchDetails();
        }
        
        // Notify parent component
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }
    } catch (error) {
      console.error("Error processing withdrawal fee payment:", error);
      toast.error("Failed to process payment. Please try again.");
      setPaymentState("payment");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (paymentState === "success") {
      onOpenChange(false);
      // Reset state for next use
      setPaymentState("payment");
      setSelectedMethod("");
    } else {
      onOpenChange(false);
    }
  };

  const getAddressForMethod = (method) => {
    if (method === "Bitcoin") return address?.Bitcoin;
    if (method === "Ethereum") return address?.Ethereum;
    if (method === "Tether") return address?.Tether;
    if (method === "binance") return address?.Binance;
    if (method === "Dogecoin") return address?.Dogecoin;
    if (method === "Tron") return address?.Tron;
    return null;
  };

  const getImageForMethod = (method) => {
    if (method === "Bitcoin") return "/assets/bitcoin.webp";
    if (method === "Ethereum") return "/assets/ethereum.webp";
    if (method === "Tether") return "/assets/Tether.webp";
    if (method === "binance") return "/assets/bnb.webp";
    if (method === "Dogecoin") return "/assets/dogecoin.webp";
    if (method === "Tron") return "/assets/tron-logo.webp";
    return "/assets/bitcoin.webp";
  };

  if (!withdrawalData) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={`max-w-2xl max-h-[90vh] overflow-y-auto ${
          isDarkMode ? "bg-[#111] border-gray-700" : "bg-white"
        }`}
      >
        {paymentState === "success" ? (
          // Success State
          <>
            <DialogHeader>
              <DialogTitle
                className={`flex items-center gap-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                <CheckCircle className="w-6 h-6 text-green-500" />
                Withdrawal Request Submitted
              </DialogTitle>
              <DialogDescription
                className={isDarkMode ? "text-gray-300" : "text-gray-600"}
              >
                Your withdrawal request is now under review
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div
                className={`rounded-lg p-6 text-center ${
                  isDarkMode
                    ? "bg-green-900/20 border border-green-700"
                    : "bg-green-50 border border-green-200"
                }`}
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    isDarkMode ? "text-green-300" : "text-green-900"
                  }`}
                >
                  Payment Request Submitted
                </h3>
                <p
                  className={`${
                    isDarkMode ? "text-green-200" : "text-green-700"
                  }`}
                >
                  Your withdrawal fee payment request has been submitted. Please make the deposit
                  to the address shown above using your selected payment method. Once you&apos;ve sent
                  the payment, our admin team will verify it and then process your withdrawal request.
                  You will be notified once your withdrawal is approved and processed.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleClose}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </>
        ) : paymentState === "processing" ? (
          // Processing State
          <>
            <DialogHeader>
              <DialogTitle
                className={`flex items-center gap-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                Processing Payment
              </DialogTitle>
              <DialogDescription
                className={isDarkMode ? "text-gray-300" : "text-gray-600"}
              >
                Please wait while we process your payment...
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-8">
              <div className="flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              </div>
            </div>
          </>
        ) : (
          // Payment State
          <>
            <DialogHeader>
              <DialogTitle
                className={`flex items-center gap-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                <CreditCard className="w-6 h-6" />
                Withdrawal Fee Payment
              </DialogTitle>
              <DialogDescription
                className={isDarkMode ? "text-gray-300" : "text-gray-600"}
              >
                Complete the payment to process your withdrawal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div
                className={`rounded-lg p-4 ${
                  isDarkMode
                    ? "bg-blue-900/20 border border-blue-700"
                    : "bg-blue-50 border border-blue-200"
                }`}
              >
                <h3
                  className={`font-semibold mb-2 ${
                    isDarkMode ? "text-blue-300" : "text-blue-900"
                  }`}
                >
                  Deposit Required for Withdrawal Fee
                </h3>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-blue-200" : "text-blue-800"
                  }`}
                >
                  To process your withdrawal, you need to make a deposit for the withdrawal
                  fee. This fee is 10% of your withdrawal amount. Please send the fee amount
                  to the address below using your selected payment method. Your withdrawal will
                  be processed after admin verifies your fee payment.
                </p>
              </div>

              <div
                className={`rounded-lg p-4 border ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <h4
                  className={`font-semibold mb-3 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Withdrawal Details
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Withdrawal Amount:
                    </span>
                    <span
                      className={`font-bold text-lg ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      ${withdrawalData.amount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Withdrawal Method:
                    </span>
                    <span
                      className={`font-medium ${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      {withdrawalData.withdrawMethod}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Account:
                    </span>
                    <span
                      className={`font-medium ${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      {withdrawalData.withdrawalAccount}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between items-center border-t pt-2 ${
                      isDarkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Withdrawal Fee (10%):
                    </span>
                    <span className="font-bold text-lg text-red-500">
                      ${withdrawalData.withdrawalFee}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4
                  className={`font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Choose Payment Method:
                </h4>

                <Select onValueChange={setSelectedMethod} value={selectedMethod}>
                  <SelectTrigger
                    className={`w-full ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <SelectValue placeholder="Select a payment method" />
                  </SelectTrigger>
                  <SelectContent
                    className={
                      isDarkMode
                        ? "bg-gray-800 border-gray-600"
                        : "bg-white"
                    }
                  >
                    <SelectGroup>
                      <SelectLabel
                        className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                      >
                        Recommended
                      </SelectLabel>
                      {deposits.map((option) => (
                        <SelectItem key={option.short} value={option.short}>
                          <div className="flex items-center gap-2">
                            <Image
                              src={option.image}
                              alt={option.coinName}
                              width={20}
                              height={20}
                            />
                            <span className="font-medium">
                              {option.coinName}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel
                        className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                      >
                        Other Assets
                      </SelectLabel>
                      {othermeans.map((option) => (
                        <SelectItem key={option.short} value={option.short}>
                          <div className="flex items-center gap-2">
                            <Image
                              src={option.image}
                              alt={option.coinName}
                              width={20}
                              height={20}
                            />
                            <span className="font-medium">
                              {option.coinName}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Payment Details */}
                {selectedMethod && (
                  <div
                    className={`rounded-lg p-4 border ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <h4
                      className={`font-semibold mb-3 ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Payment Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Image
                          src={getImageForMethod(selectedMethod)}
                          alt={selectedMethod}
                          width={24}
                          height={24}
                        />
                        <span
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {selectedMethod}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            Amount to Pay:
                          </span>
                          <span
                            className={`font-bold text-lg ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            ${withdrawalData.withdrawalFee}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <label
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            Send to this address:
                          </label>
                          <div
                            className={`rounded-lg p-3 border ${
                              isDarkMode
                                ? "bg-gray-900 border-gray-600"
                                : "bg-white border-gray-300"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <code
                                className={`text-xs break-all flex-1 ${
                                  isDarkMode
                                    ? "text-gray-300"
                                    : "text-gray-700"
                                }`}
                              >
                                {getAddressForMethod(selectedMethod) ||
                                  "Address not available"}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                className={
                                  isDarkMode
                                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                                    : "border-gray-300"
                                }
                                onClick={() => {
                                  const addressToCopy =
                                    getAddressForMethod(selectedMethod);
                                  if (addressToCopy) {
                                    navigator.clipboard.writeText(addressToCopy);
                                    toast.success("Address copied to clipboard!");
                                  }
                                }}
                              >
                                Copy
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`rounded-lg p-3 border ${
                            isDarkMode
                              ? "bg-yellow-900/20 border-yellow-700"
                              : "bg-yellow-50 border-yellow-200"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle
                              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                isDarkMode
                                  ? "text-yellow-400"
                                  : "text-yellow-600"
                              }`}
                            />
                            <div
                              className={`text-xs ${
                                isDarkMode
                                  ? "text-yellow-200"
                                  : "text-yellow-800"
                              }`}
                            >
                              <p className="font-semibold mb-1">Important:</p>
                              <ul className="space-y-1 text-xs">
                                <li>
                                  • Send exactly{" "}
                                  <strong>${withdrawalData.withdrawalFee}</strong>{" "}
                                  in {selectedMethod}
                                </li>
                                <li>
                                  • Double-check the address before sending
                                </li>
                                <li>
                                  • Payment confirmation may take 10-30 minutes
                                </li>
                                <li>
                                  • Contact support if you have any issues
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handlePayment}
                  disabled={loading || !selectedMethod}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {selectedMethod
                    ? `Pay $${withdrawalData.withdrawalFee} with ${selectedMethod}`
                    : "Select Payment Method"}
                </Button>
              </div>

              <div
                className={`text-xs text-center ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <p>
                  <strong>Important:</strong> You must make a deposit for the withdrawal fee amount.
                  This is not deducted from your balance. Send the exact amount shown above to the
                  address provided. Your withdrawal will remain pending until admin verifies your
                  fee payment deposit.
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

