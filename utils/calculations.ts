
import { LeaseContract, AmortizationRow, JournalEntry, PaymentFrequency, Currency } from '../types';

// --- GL Account Configuration ---
export let GL_ACCOUNTS = {
  rouAsset: { code: '1600', name: 'Right-of-Use Asset' },
  leaseLiability: { code: '2100', name: 'Lease Liability' },
  accumDepreciation: { code: '1650', name: 'ROU Asset Accum Dep' },
  cash: { code: '1000', name: 'Cash/Bank' },
  interestExpense: { code: '6100', name: 'Interest Expense' },
  depreciationExpense: { code: '6200', name: 'Depreciation Expense' },
  shortTermExpense: { code: '6300', name: 'Rent Exp - Short Term' },
  lowValueExpense: { code: '6310', name: 'Rent Exp - Low Value' },
  variableExpense: { code: '6320', name: 'Variable Rent Expense' },
  modificationGainLoss: { code: '8000', name: 'Gain/Loss on Lease Mods' }
};

export const updateGLAccounts = (newAccounts: Partial<typeof GL_ACCOUNTS>) => {
    GL_ACCOUNTS = { ...GL_ACCOUNTS, ...newAccounts };
};

const getAccountString = (key: keyof typeof GL_ACCOUNTS) => {
    return `${GL_ACCOUNTS[key].code} - ${GL_ACCOUNTS[key].name}`;
};

// Helper to format currency
export const formatCurrency = (amount: number, currency: string) => {
  if (amount === undefined || amount === null || isNaN(amount)) amount = 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

// Calculate End Date based on Start Date and Term
export const calculateEndDate = (startDateStr: string, termMonths: number): string => {
  if (!startDateStr || !termMonths) return '';
  const date = new Date(startDateStr);
  date.setMonth(date.getMonth() + termMonths);
  return date.toISOString().split('T')[0];
};

// Calculate PV of remaining stream
const calculateRemainingPV = (payment: number, ratePercent: number, freq: number, remainingMonths: number, paymentTiming: 'In Advance' | 'In Arrears' = 'In Arrears'): number => {
    // Safety checks for NaN
    if (isNaN(payment) || payment === undefined) payment = 0;
    if (isNaN(ratePercent) || ratePercent === undefined) ratePercent = 0;
    if (isNaN(freq) || !freq) freq = 12; // Default to monthly
    if (isNaN(remainingMonths) || remainingMonths <= 0) return 0;
    
    const ratePerPeriod = (ratePercent / 100) / (12 / freq); 
    const periods = remainingMonths / (12 / freq); 
    
    if (ratePerPeriod === 0) return payment * periods;

    // PV Annuity formula
    let pv = payment * ((1 - Math.pow(1 + ratePerPeriod, -periods)) / ratePerPeriod);

    // Adjustment for Annuity Due (In Advance)
    if (paymentTiming === 'In Advance') {
        pv = pv * (1 + ratePerPeriod);
    }

    return pv;
};

// Calculate PV for a full lease (used for Dashboard KPI)
export const calculatePV = (lease: LeaseContract): number => {
  return calculateRemainingPV(
      lease.paymentAmount || 0, 
      lease.incrementalBorrowingRate || 0, 
      lease.paymentFrequency || 12, 
      lease.termMonths || 0,
      lease.paymentTiming
  );
};

// Helper: Reconstruct initial state by unwinding modifications
const getInitialState = (lease: LeaseContract): LeaseContract => {
    const initial = { ...lease, modifications: [] }; // Deep copy basics
    
    // Sort mods descending by date (newest first) to unwind
    const sortedMods = [...(lease.modifications || [])].sort((a, b) => 
        new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );

    for (const mod of sortedMods) {
        if (mod.previousValues) {
             Object.assign(initial, mod.previousValues);
        }
    }
    return initial;
};

// Generate Amortization Schedule with Modification Support
export const generateSchedule = (lease: LeaseContract): AmortizationRow[] => {
  const schedule: AmortizationRow[] = [];
  
  // 1. Start with Inception State
  let currentState = getInitialState(lease);
  
  // Guard against invalid initial state
  currentState.paymentAmount = currentState.paymentAmount || 0;
  currentState.termMonths = currentState.termMonths || 0;
  currentState.incrementalBorrowingRate = currentState.incrementalBorrowingRate || 0;
  currentState.paymentFrequency = currentState.paymentFrequency || 12;
  const paymentTiming = currentState.paymentTiming || 'In Arrears';
  
  // Sort mods ascending (oldest first) to replay
  const mods = [...(lease.modifications || [])].sort((a, b) => 
      new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime()
  );

  // Initial Recognition Calculation
  let currentLiability = calculateRemainingPV(
      currentState.paymentAmount, 
      currentState.incrementalBorrowingRate, 
      currentState.paymentFrequency, 
      currentState.termMonths,
      paymentTiming
  );
  
  let initialROU = currentLiability + (currentState.initialDirectCosts || 0) - (currentState.leaseIncentives || 0);
  let currentROU = initialROU;
  let monthlyDepreciation = currentState.termMonths > 0 ? currentROU / currentState.termMonths : 0;

  const startDate = new Date(currentState.startDate);
  
  // Push Inception Row (Period 0)
  schedule.push({
      period: 0,
      date: startDate.toISOString().split('T')[0],
      payment: paymentTiming === 'In Advance' ? currentState.paymentAmount : 0, // Show payment if T0
      interestExpense: 0,
      principalRepayment: 0,
      leaseLiabilityClosing: currentLiability, // This will be adjusted in loop if T0 payment happens
      rouDepreciation: 0,
      rouAssetBalance: currentROU,
      event: 'Initial Recognition',
      modificationAdjustment: 0
  });

  // Adjust Liability for T0 payment if In Advance
  if (paymentTiming === 'In Advance') {
      const t0Payment = currentState.paymentAmount;
      currentLiability -= t0Payment;
      schedule[0].principalRepayment = t0Payment;
      schedule[0].leaseLiabilityClosing = currentLiability; 
  }

  // Run the timeline
  let month = 1;
  const maxSafetyLoop = 600; // Cap at 50 years to prevent infinite loops

  while (month <= currentState.termMonths && month <= maxSafetyLoop) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(startDate.getMonth() + month); // End of month date
    const currentDateStr = currentDate.toISOString().split('T')[0];
    
    // Check for modifications effective this month
    const activeMod = mods.find(m => {
        const modDate = new Date(m.effectiveDate);
        return modDate.getMonth() === currentDate.getMonth() && modDate.getFullYear() === currentDate.getFullYear();
    });

    let eventNote: string | undefined = undefined;
    let adjustmentAmount = 0;

    if (activeMod) {
        // Apply New Values (Term, Payment, Rate, etc.)
        if (activeMod.newValues) {
            Object.assign(currentState, activeMod.newValues);
        }
        
        // REMEASUREMENT LOGIC (IFRS 16)
        const remainingMonths = currentState.termMonths - (month - 1);
        
        // Calculate Revised Liability using new terms and new rate
        const newLiability = calculateRemainingPV(
            currentState.paymentAmount,
            currentState.incrementalBorrowingRate,
            currentState.paymentFrequency,
            remainingMonths,
            currentState.paymentTiming || 'In Arrears'
        );
        
        // Adjustment to Liability and ROU
        const adjustment = newLiability - currentLiability;
        
        currentLiability = newLiability;
        currentROU = Math.max(0, currentROU + adjustment); // ROU cannot go below 0 usually
        
        // Recalculate Depreciation for remaining useful life
        monthlyDepreciation = remainingMonths > 0 ? currentROU / remainingMonths : 0;
        
        eventNote = `Mod: ${activeMod.type}`;
        adjustmentAmount = adjustment;
    }

    // Standard Amortization Calculation for the period
    const rateMonthly = (currentState.incrementalBorrowingRate / 100) / 12;
    const interest = currentLiability * rateMonthly;
    
    // Payment Logic
    const monthsPerPayment = 12 / currentState.paymentFrequency;
    
    let payment = 0;
    
    if (paymentTiming === 'In Arrears') {
         const isPaymentMonth = (month) % monthsPerPayment === 0;
         payment = isPaymentMonth ? currentState.paymentAmount : 0;
    } else {
         const isPaymentMonth = (month) % monthsPerPayment === 0 && month < currentState.termMonths;
         payment = isPaymentMonth ? currentState.paymentAmount : 0;
    }
    
    let principal = 0;
    
    // Apply Payment to Liability
    if (payment > 0) {
        principal = payment - interest;
    } else {
        principal = -interest; 
    }

    // Update Balances
    currentLiability = currentLiability + interest - payment;
    currentROU = currentROU - monthlyDepreciation;

    // Safety clamps
    if (Math.abs(currentLiability) < 1) currentLiability = 0;
    if (Math.abs(currentROU) < 1) currentROU = 0;

    schedule.push({
      period: month,
      date: currentDateStr,
      payment,
      interestExpense: interest,
      principalRepayment: payment - interest,
      leaseLiabilityClosing: currentLiability,
      rouDepreciation: monthlyDepreciation,
      rouAssetBalance: currentROU,
      event: eventNote,
      modificationAdjustment: adjustmentAmount
    });

    month++;
  }

  return schedule;
};

// Generate Journal Entries for a specific period
export const generateEntriesForPeriod = (lease: LeaseContract, row: AmortizationRow): JournalEntry[] => {
  const entries: JournalEntry[] = [];
  const baseId = `${lease.id}-${row.period}`;

  // 0. Initial Recognition
  if (row.event === 'Initial Recognition') {
      const paymentAtT0 = row.payment; // In P0 row, payment field holds T0 payment
      const grossLiability = row.leaseLiabilityClosing + paymentAtT0;
      
      entries.push({
          id: `${baseId}-INIT-LIAB`,
          date: row.date,
          leaseId: lease.id,
          description: 'Initial Recognition - ROU Asset & Lease Liability',
          debitAccount: getAccountString('rouAsset'),
          creditAccount: getAccountString('leaseLiability'),
          debitAmount: grossLiability, 
          creditAmount: grossLiability,
          currency: lease.currency
      });

      // Entry 1.5: If T0 Payment (Advance)
      if (paymentAtT0 > 0) {
          entries.push({
              id: `${baseId}-INIT-PMT`,
              date: row.date,
              leaseId: lease.id,
              description: 'Initial Lease Payment (Advance)',
              debitAccount: getAccountString('leaseLiability'),
              creditAccount: getAccountString('cash'),
              debitAmount: paymentAtT0,
              creditAmount: paymentAtT0,
              currency: lease.currency
          });
      }

      // Entry 2: Initial Direct Costs (Dr ROU, Cr Cash)
      if (lease.initialDirectCosts > 0) {
          entries.push({
              id: `${baseId}-INIT-COST`,
              date: row.date,
              leaseId: lease.id,
              description: 'Initial Direct Costs Capitalization',
              debitAccount: getAccountString('rouAsset'),
              creditAccount: getAccountString('cash'),
              debitAmount: lease.initialDirectCosts,
              creditAmount: lease.initialDirectCosts,
              currency: lease.currency
          });
      }

      // Entry 3: Lease Incentives Received (Dr Cash, Cr ROU)
      if (lease.leaseIncentives > 0) {
          entries.push({
              id: `${baseId}-INIT-INC`,
              date: row.date,
              leaseId: lease.id,
              description: 'Lease Incentives Received',
              debitAccount: getAccountString('cash'),
              creditAccount: getAccountString('rouAsset'),
              debitAmount: lease.leaseIncentives,
              creditAmount: lease.leaseIncentives,
              currency: lease.currency
          });
      }

      return entries;
  }

  // 1. Modification / Remeasurement Entry
  if (row.modificationAdjustment && Math.abs(row.modificationAdjustment) > 0.01) {
     const amount = Math.abs(row.modificationAdjustment);
     const isLiabilityIncrease = row.modificationAdjustment > 0;
     
     entries.push({
      id: `${baseId}-MOD`,
      date: row.date,
      leaseId: lease.id,
      description: `Lease Modification Adjustment (${row.event})`,
      debitAccount: isLiabilityIncrease ? getAccountString('rouAsset') : getAccountString('leaseLiability'),
      creditAccount: isLiabilityIncrease ? getAccountString('leaseLiability') : getAccountString('rouAsset'),
      debitAmount: amount,
      creditAmount: amount,
      currency: lease.currency
    });
  }

  // 2. Interest Expense
  if (row.interestExpense > 0) {
    entries.push({
      id: `${baseId}-INT`,
      date: row.date,
      leaseId: lease.id,
      description: `Interest Expense - Period ${row.period}`,
      debitAccount: getAccountString('interestExpense'),
      creditAccount: getAccountString('leaseLiability'),
      debitAmount: row.interestExpense,
      creditAmount: row.interestExpense,
      currency: lease.currency
    });
  }

  // 3. Depreciation
  if (row.rouDepreciation > 0) {
    entries.push({
        id: `${baseId}-DEP`,
        date: row.date,
        leaseId: lease.id,
        description: `ROU Depreciation - Period ${row.period}`,
        debitAccount: getAccountString('depreciationExpense'),
        creditAccount: getAccountString('accumDepreciation'),
        debitAmount: row.rouDepreciation,
        creditAmount: row.rouDepreciation,
        currency: lease.currency
    });
  }

  // 4. Payment (Cash)
  if (row.payment > 0) {
    entries.push({
      id: `${baseId}-PMT`,
      date: row.date,
      leaseId: lease.id,
      description: `Lease Payment - Period ${row.period}`,
      debitAccount: getAccountString('leaseLiability'),
      creditAccount: getAccountString('cash'),
      debitAmount: row.payment,
      creditAmount: row.payment,
      currency: lease.currency
    });
  }

  return entries;
};

// --- Currency Conversion Utilities ---

// Default Exchange Rates (Base: USD)
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  [Currency.USD]: 1,
  [Currency.IQD]: 1310,  // Example: 1 USD = 1310 IQD
  [Currency.EUR]: 0.92,  // Example: 1 USD = 0.92 EUR
};

export const getExchangeRate = (
  from: string | Currency, 
  to: string | Currency, 
  rates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): number => {
  const fromRate = rates[from as string];
  const toRate = rates[to as string];

  if (fromRate === undefined || toRate === undefined) {
    console.warn(`Exchange rate missing for ${from} or ${to}. Returning 1:1.`);
    return 1;
  }
  return toRate / fromRate;
};

export const convertCurrency = (
  amount: number, 
  from: string | Currency, 
  to: string | Currency, 
  rates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): number => {
  if (!amount) return 0;
  if (from === to) return amount;
  
  const rate = getExchangeRate(from, to, rates);
  return parseFloat((amount * rate).toFixed(2));
};
