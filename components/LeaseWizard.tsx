import React, { useState } from 'react';
import { LeaseContract, LeaseStandard, LeaseType, PaymentFrequency, Currency } from '../types';
import { calculateEndDate } from '../utils/calculations';
import { ArrowRight, Save, Calculator, AlertCircle } from 'lucide-react';

interface LeaseWizardProps {
  onSave: (lease: LeaseContract) => void;
  onCancel: () => void;
}

const LeaseWizard: React.FC<LeaseWizardProps> = ({ onSave, onCancel }) => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<LeaseContract>>({
    contractNumber: `LS-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
    startDate: new Date().toISOString().split('T')[0],
    currency: Currency.USD,
    standard: LeaseStandard.IFRS16,
    classification: LeaseType.Finance,
    paymentFrequency: 12, // Default to Monthly
    initialDirectCosts: 0,
    leaseIncentives: 0,
    residualValue: 0,
    status: 'Active',
    modifications: [],
    // Initialize as undefined to show placeholder
    totalContractValue: undefined,
    paymentAmount: undefined
  });

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!formData.contractNumber?.trim()) newErrors.contractNumber = 'Contract Number is required';
      if (!formData.lesseeName?.trim()) newErrors.lesseeName = 'Lessee Entity is required';
      if (!formData.assetName?.trim()) newErrors.assetName = 'Asset Name is required';
    }
    
    if (currentStep === 2) {
      if (!formData.startDate) newErrors.startDate = 'Start Date is required';
      
      if (formData.termMonths === undefined || formData.termMonths === null) {
          newErrors.termMonths = 'Lease Term is required';
      } else if (Number(formData.termMonths) <= 0) {
          newErrors.termMonths = 'Term must be greater than 0';
      } else if (!Number.isInteger(Number(formData.termMonths))) {
           newErrors.termMonths = 'Term must be a whole number';
      }

      if (formData.paymentAmount === undefined) {
           newErrors.paymentAmount = 'Payment Amount is required';
      } else if (Number(formData.paymentAmount) < 0) {
           newErrors.paymentAmount = 'Amount cannot be negative';
      }

      if (formData.incrementalBorrowingRate === undefined) {
          newErrors.incrementalBorrowingRate = 'Rate is required';
      } else if (Number(formData.incrementalBorrowingRate) < 0 || Number(formData.incrementalBorrowingRate) > 100) {
          newErrors.incrementalBorrowingRate = 'Rate must be between 0 and 100';
      }

      if (formData.totalContractValue !== undefined && Number(formData.totalContractValue) < 0) {
           newErrors.totalContractValue = 'Value cannot be negative';
      }
    }
    
    if (currentStep === 3) {
        if ((formData.initialDirectCosts ?? 0) < 0) newErrors.initialDirectCosts = 'Cannot be negative';
        if ((formData.leaseIncentives ?? 0) < 0) newErrors.leaseIncentives = 'Cannot be negative';
        if ((formData.residualValue ?? 0) < 0) newErrors.residualValue = 'Cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear validation error for this field
    if (errors[name]) {
        setErrors(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
    }

    setFormData(prev => {
      let newValue: any = value;
      let updates: any = {};

      if (['paymentAmount', 'termMonths', 'incrementalBorrowingRate', 'initialDirectCosts', 'leaseIncentives', 'residualValue', 'totalContractValue'].includes(name)) {
        // Allow empty string to reset to undefined (shows placeholder)
        newValue = value === '' ? undefined : parseFloat(value);
      } else if (name === 'paymentFrequency') {
        newValue = parseInt(value, 10);
      }

      updates[name] = newValue;

      // Sync Logic: If Payment Amount changes, update Total Contract Value
      if (name === 'paymentAmount') {
         const payment = newValue || 0;
         const term = prev.termMonths || 0;
         const freq = prev.paymentFrequency || 12;
         const monthsPerPayment = 12 / freq;
         const numPayments = term > 0 ? Math.ceil(term / monthsPerPayment) : 0;
         updates.totalContractValue = parseFloat((payment * numPayments).toFixed(2));
      }
      
      // Sync Logic: If Term or Frequency changes, update Total based on Payment
      if (name === 'termMonths' || name === 'paymentFrequency') {
         const term = name === 'termMonths' ? newValue : (prev.termMonths || 0);
         const freq = name === 'paymentFrequency' ? newValue : (prev.paymentFrequency || 12);
         const payment = prev.paymentAmount || 0;
         
         const monthsPerPayment = 12 / freq;
         const numPayments = (term && term > 0) ? Math.ceil(term / monthsPerPayment) : 0;
         updates.totalContractValue = parseFloat((payment * numPayments).toFixed(2));
      }

      return { ...prev, ...updates };
    });
  };

  const handleTotalCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const total = value === '' ? undefined : parseFloat(value);
      
      // Clear errors if present
      if (errors.totalContractValue || errors.paymentAmount) {
         setErrors(prev => {
             const next = { ...prev };
             delete next.totalContractValue;
             delete next.paymentAmount;
             return next;
         });
      }
      
      setFormData(prev => {
          const term = prev.termMonths || 0;
          const freq = prev.paymentFrequency || 12;
          const monthsPerPayment = 12 / freq;
          const numPayments = term > 0 ? Math.ceil(term / monthsPerPayment) : 0;
          
          let newPayment = prev.paymentAmount;
          // Only calculate if we have a valid total
          if (total !== undefined && numPayments > 0) {
              newPayment = parseFloat((total / numPayments).toFixed(2));
          } else if (total === undefined) {
              // Optional: Clear payment if total is cleared? Or keep it?
              // Keeping it usually safer, but let's recalculate to keep sync strict
              // newPayment = undefined; 
          }

          return { 
              ...prev, 
              totalContractValue: total,
              paymentAmount: newPayment
          };
      });
  };

  const handleNext = () => {
      if (validateStep(step)) {
          setStep(step + 1);
      }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    
    // Ensure robust fallbacks for numbers
    const termMonths = formData.termMonths || 0;
    const startDate = formData.startDate || new Date().toISOString().split('T')[0];
    
    // Auto-calculate End Date
    const endDate = calculateEndDate(startDate, termMonths);

    const newLease: LeaseContract = {
      id: crypto.randomUUID(),
      contractNumber: formData.contractNumber || 'DRAFT',
      lesseeName: formData.lesseeName || 'Unknown Entity',
      assetName: formData.assetName || 'Unspecified Asset',
      startDate: startDate,
      endDate: endDate,
      termMonths: termMonths,
      totalContractValue: formData.totalContractValue || 0,
      paymentAmount: formData.paymentAmount || 0,
      paymentFrequency: formData.paymentFrequency || 12,
      incrementalBorrowingRate: formData.incrementalBorrowingRate || 0,
      currency: formData.currency || Currency.USD,
      standard: formData.standard || LeaseStandard.IFRS16,
      classification: formData.classification || LeaseType.Finance,
      initialDirectCosts: formData.initialDirectCosts || 0,
      leaseIncentives: formData.leaseIncentives || 0,
      residualValue: formData.residualValue || 0,
      status: 'Active',
      modifications: []
    };

    onSave(newLease);
  };

  const getInputClass = (fieldName: string) => {
    const base = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900";
    if (errors[fieldName]) return `${base} border-red-500 bg-red-50 focus:ring-red-500`;
    return `${base} border-slate-300`;
  };

  const ErrorMsg = ({ field }: { field: string }) => {
    if (!errors[field]) return null;
    return (
        <div className="flex items-center gap-1 mt-1 text-xs text-red-600 animate-fadeIn">
            <AlertCircle size={12} />
            <span>{errors[field]}</span>
        </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-4xl mx-auto">
      <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">New Lease Contract Wizard</h2>
        <div className="text-sm text-slate-500">Step {step} of 3</div>
      </div>

      <form onSubmit={handleSave} className="p-8">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-slate-800 mb-4">Contract Identification</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contract Number</label>
                <input required name="contractNumber" value={formData.contractNumber} onChange={handleChange} className={getInputClass('contractNumber')} />
                <ErrorMsg field="contractNumber" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lessee Entity</label>
                <input required name="lesseeName" placeholder="e.g. Baghdad Branch HQ" value={formData.lesseeName || ''} onChange={handleChange} className={getInputClass('lesseeName')} />
                <ErrorMsg field="lesseeName" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asset Name/Description</label>
                <input required name="assetName" placeholder="e.g. Office Building Floor 4" value={formData.assetName || ''} onChange={handleChange} className={getInputClass('assetName')} />
                <ErrorMsg field="assetName" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Accounting Standard</label>
                <select name="standard" value={formData.standard} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900">
                  <option value={LeaseStandard.IFRS16}>IFRS 16 (International)</option>
                  <option value={LeaseStandard.ASC842}>ASC 842 (US GAAP)</option>
                  <option value={LeaseStandard.IQ_GAAP}>Iraqi GAAP (Local)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-slate-800 mb-4">Financial Terms</h3>
            <div className="grid grid-cols-2 gap-6">
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input required type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={getInputClass('startDate')} />
                <ErrorMsg field="startDate" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lease Term (Months)</label>
                <input required type="number" name="termMonths" value={formData.termMonths ?? ''} onChange={handleChange} className={getInputClass('termMonths')} />
                <ErrorMsg field="termMonths" />
              </div>
            </div>

            {/* Cost Calculator Section */}
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 space-y-3">
                 <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm uppercase tracking-wide">
                    <Calculator size={16} />
                    <span>Cost Calculator</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Contract Value</label>
                         <div className="relative">
                            <input 
                                type="number" 
                                name="totalContractValue"
                                value={formData.totalContractValue ?? ''} 
                                onChange={handleTotalCostChange} 
                                placeholder="0.00"
                                className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white text-slate-900 ${errors.totalContractValue ? 'border-red-500' : 'border-slate-300'}`}
                            />
                            <span className="absolute left-3 top-2.5 text-slate-500 pointer-events-none">$</span>
                        </div>
                        <ErrorMsg field="totalContractValue" />
                        <p className="text-xs text-slate-500 mt-1">Enter total cost to auto-calculate periodic payment.</p>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Calculated Periodic Payment</label>
                         <div className="relative">
                            <input 
                                required 
                                type="number" 
                                name="paymentAmount" 
                                value={formData.paymentAmount ?? ''} 
                                onChange={handleChange}
                                placeholder="0.00"
                                className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-semibold text-brand-700 bg-white ${errors.paymentAmount ? 'border-red-500' : 'border-slate-300'}`}
                            />
                            <span className="absolute left-3 top-2.5 text-slate-500 pointer-events-none">$</span>
                        </div>
                        <ErrorMsg field="paymentAmount" />
                         <p className="text-xs text-slate-500 mt-1">Amount per period (Month/Quarter/Year).</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                <select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900">
                  <option value={Currency.USD}>USD - US Dollar</option>
                  <option value={Currency.IQD}>IQD - Iraqi Dinar</option>
                  <option value={Currency.EUR}>EUR - Euro</option>
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Frequency</label>
                <select name="paymentFrequency" value={formData.paymentFrequency} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900">
                  <option value={12}>Monthly</option>
                  <option value={4}>Quarterly</option>
                  <option value={1}>Annually</option>
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discount Rate (IBR %)</label>
                <input required type="number" step="0.01" name="incrementalBorrowingRate" value={formData.incrementalBorrowingRate ?? ''} onChange={handleChange} className={getInputClass('incrementalBorrowingRate')} />
                <ErrorMsg field="incrementalBorrowingRate" />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-slate-800 mb-4">Adjustments & Classification</h3>
            <div className="grid grid-cols-2 gap-6">
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Direct Costs</label>
                <input type="number" name="initialDirectCosts" value={formData.initialDirectCosts ?? ''} onChange={handleChange} className={getInputClass('initialDirectCosts')} />
                <ErrorMsg field="initialDirectCosts" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lease Incentives Received</label>
                <input type="number" name="leaseIncentives" value={formData.leaseIncentives ?? ''} onChange={handleChange} className={getInputClass('leaseIncentives')} />
                <ErrorMsg field="leaseIncentives" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Classification Logic</label>
                <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
                    <p>Based on IFRS 16, this contract transfers the right to control the use of an identified asset for a period of time.</p>
                    <p className="mt-2 font-semibold text-brand-700">Recommended: Finance Lease</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={step === 1 ? onCancel : () => setStep(step - 1)}
            className="px-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step < 3 ? (
             <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 flex items-center gap-2"
            >
              Next <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 flex items-center gap-2"
            >
              <Save size={18} /> Create Lease
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default LeaseWizard;