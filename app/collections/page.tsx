'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PhoneIcon, CreditCardIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';
import CollectionsCall from '@/components/CollectionsCall';
import PaymentForm from '@/components/PaymentForm';
import AccountSummary from '@/components/AccountSummary';

export default function CollectionsPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [accountData, setAccountData] = useState<any>(null);
  const [showCallInterface, setShowCallInterface] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [verificationData, setVerificationData] = useState({
    lastFourSSN: '',
    dateOfBirth: '',
  });

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/collections/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationData),
      });

      if (response.ok) {
        const data = await response.json();
        setAccountData(data.account);
        setIsVerified(true);
        toast.success('Account verified successfully');
      } else {
        toast.error('Verification failed. Please check your information.');
      }
    } catch (error) {
      toast.error('An error occurred during verification');
    }
  };

  const handleStartCall = () => {
    setShowCallInterface(true);
    setShowPaymentForm(false);
  };

  const handleMakePayment = () => {
    setShowPaymentForm(true);
    setShowCallInterface(false);
  };

  const handlePaymentComplete = (paymentData: any) => {
    toast.success(`Payment of $${paymentData.amount} processed successfully!`);
    // Update account balance
    setAccountData((prev: any) => ({
      ...prev,
      balance: prev.balance - paymentData.amount,
      pastDue: Math.max(0, prev.pastDue - paymentData.amount),
    }));
    setShowPaymentForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Resolution Center</h1>
          <p className="text-gray-600 mt-2">Secure, convenient payment solutions</p>
        </header>

        {!isVerified ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Verify Your Account</h2>
              <form onSubmit={handleVerification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last 4 digits of SSN
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    pattern="\d{4}"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verificationData.lastFourSSN}
                    onChange={(e) => setVerificationData({ ...verificationData, lastFourSSN: e.target.value })}
                    placeholder="1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verificationData.dateOfBirth}
                    onChange={(e) => setVerificationData({ ...verificationData, dateOfBirth: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                >
                  Verify Account
                </button>
              </form>
              <div className="mt-4 text-sm text-gray-500 text-center">
                <p>Demo accounts: Use SSN 1234 or 5678</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <AccountSummary account={accountData} />
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleStartCall}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition duration-200"
                >
                  <PhoneIcon className="h-5 w-5" />
                  Speak with AI Assistant
                </button>
                
                <button
                  onClick={handleMakePayment}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  <CreditCardIcon className="h-5 w-5" />
                  Make a Payment
                </button>
                
                <button
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition duration-200"
                >
                  <CalendarIcon className="h-5 w-5" />
                  Set Up Payment Plan
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              {showCallInterface && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <CollectionsCall
                    accountData={accountData}
                    onCallEnd={() => setShowCallInterface(false)}
                  />
                </motion.div>
              )}

              {showPaymentForm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <PaymentForm
                    account={accountData}
                    onPaymentComplete={handlePaymentComplete}
                    onCancel={() => setShowPaymentForm(false)}
                  />
                </motion.div>
              )}

              {!showCallInterface && !showPaymentForm && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Payment Options Available</h2>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">Pay in Full</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Save 10% by paying your full balance today
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ${(accountData.balance * 0.9).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500 line-through">
                            ${accountData.balance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">3-Month Plan</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Split your balance into 3 easy payments
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            ${(accountData.balance / 3).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">per month</p>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">6-Month Plan</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Lower monthly payments over 6 months
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            ${(accountData.balance / 6).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">per month</p>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 hover:shadow-md transition bg-blue-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">Settlement Offer</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            One-time settlement at 60% of balance
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            ${(accountData.balance * 0.6).toFixed(2)}
                          </p>
                          <p className="text-sm text-green-600">
                            Save ${(accountData.balance * 0.4).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}