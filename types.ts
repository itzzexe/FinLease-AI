
export enum LeaseStandard {
  IFRS16 = 'IFRS 16',
  ASC842 = 'ASC 842',
  IQ_GAAP = 'Iraqi GAAP'
}

export enum LeaseType {
  Finance = 'Finance',
  Operating = 'Operating'
}

export enum PaymentFrequency {
  Monthly = 12,
  Quarterly = 4,
  Annually = 1
}

export enum Currency {
  USD = 'USD',
  IQD = 'IQD',
  EUR = 'EUR'
}

export interface LeaseModification {
  id: string;
  date: string;
  effectiveDate: string;
  type: 'Extension' | 'Termination' | 'Payment Change' | 'Scope Decrease' | 'Other';
  description: string;
  previousValues: Partial<LeaseContract>;
  newValues: Partial<LeaseContract>;
}

export interface LeaseContract {
  id: string;
  contractNumber: string;
  lesseeName: string;
  assetName: string;
  startDate: string;
  endDate: string; // Calculated or inputs
  termMonths: number;
  totalContractValue?: number; // Total value of payments over term
  paymentAmount: number;
  paymentFrequency: PaymentFrequency;
  paymentTiming?: 'In Advance' | 'In Arrears';
  incrementalBorrowingRate: number; // Percent
  currency: Currency;
  standard: LeaseStandard;
  classification: LeaseType;
  initialDirectCosts: number;
  leaseIncentives: number;
  residualValue: number;
  status: 'Draft' | 'Active' | 'Terminated' | 'Ended' | 'Archived';
  modifications?: LeaseModification[];
}

export interface AmortizationRow {
  period: number;
  date: string;
  payment: number;
  interestExpense: number;
  principalRepayment: number;
  leaseLiabilityClosing: number;
  rouDepreciation: number;
  rouAssetBalance: number; // Carrying amount of the ROU Asset
  event?: string;
  modificationAdjustment?: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  leaseId: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  debitAmount: number;
  creditAmount: number;
  currency: Currency;
}

export interface KPIData {
  totalLeases: number;
  totalLiability: number;
  totalROU: number;
  monthlyCashOut: number;
}
