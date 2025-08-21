'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCardIcon, BanknotesIcon, PhoneIcon } from '@heroicons/react/24/outline';

interface PaymentFormProps {
  account: any;
  onPaymentComplete: (paymentData: any) => void;
  onCancel: () => void;
}

export default function PaymentForm({ account, onPaymentComplete, onCancel }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentAmount, setPaymentAmount] = useState(account.minimumPayment);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });

  const [achDetails, setAchDetails] = useState({
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      onPaymentComplete({
        amount: paymentAmount,
        method: paymentMethod,
        timestamp: new Date().toISOString(),
        confirmationNumber: `CONF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      });
      setIsProcessing(false);
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + (v.length > 2 ? '/' + v.slice(2, 4) : '');
    }
    return v;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Make a Payment</h2>

      {/* Payment Amount Options */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Amount
        </label>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <button
            type="button"
            onClick={() => setPaymentAmount(account.minimumPayment)}
            className={`p-3 rounded-lg border ${
              paymentAmount === account.minimumPayment
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300'
            }`}
          >
            <p className="text-sm text-gray-600">Minimum</p>
            <p className="font-semibold">${account.minimumPayment.toFixed(2)}</p>
          </button>
          
          <button
            type="button"
            onClick={() => setPaymentAmount(account.pastDue)}
            className={`p-3 rounded-lg border ${
              paymentAmount === account.pastDue
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300'
            }`}
          >
            <p className="text-sm text-gray-600">Past Due</p>
            <p className="font-semibold">${account.pastDue.toFixed(2)}</p>
          </button>
          
          <button
            type="button"
            onClick={() => setPaymentAmount(account.balance)}
            className={`p-3 rounded-lg border ${
              paymentAmount === account.balance
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300'
            }`}
          >
            <p className="text-sm text-gray-600">Full Balance</p>
            <p className="font-semibold">${account.balance.toFixed(2)}</p>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Other Amount:</span>
          <input
            type="number"
            min="1"
            max={account.balance}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`p-3 rounded-lg border flex flex-col items-center ${
              paymentMethod === 'card'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300'
            }`}
          >
            <CreditCardIcon className="h-6 w-6 mb-1" />
            <span className="text-sm">Card</span>
          </button>
          
          <button
            type="button"
            onClick={() => setPaymentMethod('ach')}
            className={`p-3 rounded-lg border flex flex-col items-center ${
              paymentMethod === 'ach'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300'
            }`}
          >
            <BanknotesIcon className="h-6 w-6 mb-1" />
            <span className="text-sm">Bank</span>
          </button>
          
          <button
            type="button"
            onClick={() => setPaymentMethod('phone')}
            className={`p-3 rounded-lg border flex flex-col items-center ${
              paymentMethod === 'phone'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300'
            }`}
          >
            <PhoneIcon className="h-6 w-6 mb-1" />
            <span className="text-sm">Phone</span>
          </button>
        </div>
      </div>

      {/* Payment Details Form */}
      <form onSubmit={handleSubmit}>
        {paymentMethod === 'card' && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                required
                maxLength={19}
                value={cardDetails.number}
                onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })}
                  placeholder="123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                required
                value={cardDetails.name}
                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {paymentMethod === 'ach' && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <select
                value={achDetails.accountType}
                onChange={(e) => setAchDetails({ ...achDetails, accountType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Routing Number
              </label>
              <input
                type="text"
                required
                maxLength={9}
                value={achDetails.routingNumber}
                onChange={(e) => setAchDetails({ ...achDetails, routingNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="123456789"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                required
                value={achDetails.accountNumber}
                onChange={(e) => setAchDetails({ ...achDetails, accountNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="Account number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {paymentMethod === 'phone' && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              To make a payment by phone, please call our automated payment line at:
            </p>
            <p className="text-xl font-bold text-blue-900 mt-2">1-800-PAY-DEBT</p>
            <p className="text-sm text-blue-800 mt-2">
              Have your account number ready: {account.accountNumber}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          
          {paymentMethod !== 'phone' && (
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : `Pay $${paymentAmount.toFixed(2)}`}
            </button>
          )}
        </div>
      </form>

      {/* Security Notice */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Security:</strong> Your payment information is encrypted and processed securely. 
          We never store your full card or account numbers.
        </p>
      </div>
    </div>
  );
}