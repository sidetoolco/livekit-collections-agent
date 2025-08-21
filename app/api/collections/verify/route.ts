import { NextRequest, NextResponse } from 'next/server';

// Mock database - replace with actual database
const mockAccounts = {
  '1234': {
    accountNumber: 'ACC-001234',
    customerName: 'John Doe',
    balance: 2500.00,
    pastDue: 450.00,
    daysOverdue: 45,
    lastPaymentDate: '2024-06-15',
    minimumPayment: 150.00,
    phoneNumber: '+1234567890',
    email: 'john.doe@example.com',
    status: 'delinquent'
  },
  '5678': {
    accountNumber: 'ACC-005678',
    customerName: 'Jane Smith',
    balance: 1200.00,
    pastDue: 200.00,
    daysOverdue: 30,
    lastPaymentDate: '2024-07-01',
    minimumPayment: 75.00,
    phoneNumber: '+1987654321',
    email: 'jane.smith@example.com',
    status: 'delinquent'
  }
};

export async function POST(request: NextRequest) {
  try {
    const { accountNumber, dateOfBirth, lastFourSSN } = await request.json();

    // Simple mock verification
    const account = mockAccounts[lastFourSSN] || mockAccounts[accountNumber];

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Mock DOB verification (in production, verify against actual DOB)
    if (!dateOfBirth) {
      return NextResponse.json(
        { error: 'Date of birth required for verification' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verified: true,
      account: {
        ...account,
        // Don't send sensitive info to frontend
        lastFourSSN: undefined
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}