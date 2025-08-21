'use client';

import { CheckCircleIcon, ExclamationTriangleIcon, CalendarIcon, CreditCardIcon } from '@heroicons/react/24/outline';

interface AccountSummaryProps {
  account: any;
}

export default function AccountSummary({ account }: AccountSummaryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'text-green-600 bg-green-50';
      case 'delinquent': return 'text-red-600 bg-red-50';
      case 'arrangement': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{account.customerName}</h2>
        <p className="text-sm text-gray-500">Account: {account.accountNumber}</p>
      </div>

      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(account.status)}`}>
        {account.status === 'delinquent' ? (
          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
        ) : (
          <CheckCircleIcon className="h-4 w-4 mr-1" />
        )}
        {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-sm text-gray-600">Current Balance</span>
          <span className="text-lg font-semibold">${account.balance.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-sm text-gray-600">Past Due Amount</span>
          <span className="text-lg font-semibold text-red-600">${account.pastDue.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-sm text-gray-600">Days Overdue</span>
          <span className="text-lg font-semibold">{account.daysOverdue}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-sm text-gray-600">Minimum Payment</span>
          <span className="text-lg font-semibold">${account.minimumPayment.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <CalendarIcon className="h-4 w-4" />
            Last Payment
          </span>
          <span className="text-sm">{new Date(account.lastPaymentDate).toLocaleDateString()}</span>
        </div>
      </div>

      {account.daysOverdue > 30 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> Your account is {account.daysOverdue} days past due. 
            Please make a payment or set up an arrangement to avoid further action.
          </p>
        </div>
      )}
    </div>
  );
}