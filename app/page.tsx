'use client';

import { useState } from 'react';
import { PhoneIcon, UserIcon, CurrencyDollarIcon, CalendarIcon } from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [callData, setCallData] = useState({
    phoneNumber: '',
    customerName: '',
    amountOwed: '',
    paymentDueDate: '',
  });
  const [activeCall, setActiveCall] = useState<any>(null);

  const formatPhoneNumber = (value: string) => {
    const phone = value.replace(/\D/g, '');
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setCallData({ ...callData, phoneNumber: formatted });
  };

  const initiateCall = async () => {
    // Validate inputs
    if (!callData.phoneNumber || !callData.customerName || !callData.amountOwed || !callData.paymentDueDate) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      // Call API to initiate outbound call
      const response = await fetch('/api/collections/initiate-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: callData.phoneNumber.replace(/\D/g, ''), // Remove formatting
          customerName: callData.customerName,
          amountOwed: parseFloat(callData.amountOwed),
          paymentDueDate: callData.paymentDueDate,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setActiveCall(result);
        toast.success(`Call initiated to ${callData.phoneNumber}`);
        
        // Clear form
        setCallData({
          phoneNumber: '',
          customerName: '',
          amountOwed: '',
          paymentDueDate: '',
        });
      } else {
        toast.error('Failed to initiate call');
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Error initiating call');
    } finally {
      setIsLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white mb-3">
              Collections Call Center
            </h1>
            <p className="text-gray-400">
              AI-powered outbound collections agent
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Initiate Collection Call
            </h2>

            <div className="space-y-5">
              {/* Phone Number */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <PhoneIcon className="h-4 w-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={callData.phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={14}
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="h-4 w-4" />
                  Customer Name
                </label>
                <input
                  type="text"
                  value={callData.customerName}
                  onChange={(e) => setCallData({ ...callData, customerName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Amount Owed */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  Amount Owed
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={callData.amountOwed}
                    onChange={(e) => setCallData({ ...callData, amountOwed: e.target.value })}
                    placeholder="2,500.00"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Payment Due Date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4" />
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={callData.paymentDueDate}
                  onChange={(e) => setCallData({ ...callData, paymentDueDate: e.target.value })}
                  min={today}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Call Button */}
              <button
                onClick={initiateCall}
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-3 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Initiating Call...
                  </>
                ) : (
                  <>
                    <PhoneIcon className="h-5 w-5" />
                    Start Collection Call
                  </>
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> The AI agent will call the customer to discuss their payment due on the specified date and attempt to secure a commitment.
              </p>
            </div>
          </div>

          {/* Active Calls Section */}
          {activeCall && (
            <div className="mt-6 bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Active Call</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Call ID:</span>
                  <span className="font-mono text-sm">{activeCall.callId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {activeCall.status || 'Connecting...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span>{activeCall.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span>${activeCall.amountOwed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span>{new Date(activeCall.paymentDueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-white">
              <h3 className="font-semibold mb-2">FDCPA Compliant</h3>
              <p className="text-sm text-gray-300">
                Professional, compliant collection practices
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-white">
              <h3 className="font-semibold mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-300">
                Natural conversations with GPT-4
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-white">
              <h3 className="font-semibold mb-2">Real-time</h3>
              <p className="text-sm text-gray-300">
                Monitor call progress live
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}