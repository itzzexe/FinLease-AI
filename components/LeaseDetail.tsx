import React, { useState, useMemo } from 'react';
import { LeaseContract, AmortizationRow, LeaseModification } from '../types';
import { generateSchedule, formatCurrency, generateEntriesForPeriod } from '../utils/calculations';
import { analyzeLeaseContract } from '../services/geminiService';
import { Calendar, DollarSign, Activity, Sparkles, Download, ArrowLeft, History, Edit3, X, Save, AlertTriangle, FileText, MoreHorizontal, CheckCircle, Archive, Trash2 } from 'lucide-react';

interface LeaseDetailProps {
  lease: LeaseContract;
  onBack: () => void;
  onUpdate: (lease: LeaseContract) => void;
}

const LeaseDetail: React.FC<LeaseDetailProps> = ({ lease, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'entries' | 'analysis' | 'history'>('schedule');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  // Modification Modal State
  const [isModModalOpen, setIsModModalOpen] = useState(false);
  const [modForm, setModForm] = useState<{
    effectiveDate: string;
    type: string;
    description: string;
    termMonths: number;
    paymentAmount: number;
    incrementalBorrowingRate: number;
  }>({
    effectiveDate: new Date().toISOString().split('T')[0],
    type: 'Payment Change',
    description: '',
    termMonths: lease.termMonths,
    paymentAmount: lease.paymentAmount,
    incrementalBorrowingRate: lease.incrementalBorrowingRate
  });

  const schedule = useMemo(() => generateSchedule(lease), [lease]);

  const handleRunAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzeLeaseContract(lease);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const handleStatusChange = (newStatus: LeaseContract['status']) => {
    const updatedLease = { ...lease, status: newStatus };
    onUpdate(updatedLease);
    setShowActionMenu(false);
  };

  const handleModificationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setModForm(prev => ({
        ...prev,
        [name]: ['termMonths', 'paymentAmount', 'incrementalBorrowingRate'].includes(name) 
          ? parseFloat(value) 
          : value
    }));
  };

  const saveModification = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Identify changes
    const previousValues: Partial<LeaseContract> = {};
    const newValues: Partial<LeaseContract> = {};
    
    if (modForm.termMonths !== lease.termMonths) {
        previousValues.termMonths = lease.termMonths;
        newValues.termMonths = modForm.termMonths;
    }
    if (modForm.paymentAmount !== lease.paymentAmount) {
        previousValues.paymentAmount = lease.paymentAmount;
        newValues.paymentAmount = modForm.paymentAmount;
    }
     if (modForm.incrementalBorrowingRate !== lease.incrementalBorrowingRate) {
        previousValues.incrementalBorrowingRate = lease.incrementalBorrowingRate;
        newValues.incrementalBorrowingRate = modForm.incrementalBorrowingRate;
    }

    // Handle Termination logic
    if (modForm.type === 'Termination') {
      previousValues.status = lease.status;
      newValues.status = 'Terminated';
    }

    const modification: LeaseModification = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        effectiveDate: modForm.effectiveDate,
        type: modForm.type as any,
        description: modForm.description,
        previousValues,
        newValues
    };

    const updatedLease: LeaseContract = {
        ...lease,
        ...newValues,
        modifications: [modification, ...(lease.modifications || [])]
    };

    onUpdate(updatedLease);
    setIsModModalOpen(false);
    // Reset AI analysis as context has changed
    setAiAnalysis('');
  };

  const renderValue = (val: any) => {
    if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val);
    }
    return val;
  };

  return (
    <div className="space-y-6 relative">
      {/* Modification Modal */}
      {isModModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-slate-900">Modify Lease Contract</h3>
                    <button onClick={() => setIsModModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={saveModification} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Effective Date</label>
                            <input required type="date" name="effectiveDate" value={modForm.effectiveDate} onChange={handleModificationChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Modification Type</label>
                            <select name="type" value={modForm.type} onChange={handleModificationChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500">
                                <option value="Extension">Term Extension</option>
                                <option value="Payment Change">Payment Change</option>
                                <option value="Rate Adjustment">Rate Adjustment</option>
                                <option value="Termination">Early Termination</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Description</label>
                        <textarea required name="description" value={modForm.description} onChange={handleModificationChange} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500" placeholder="Describe the reason for modification..."></textarea>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-900 mb-3">Update Contract Terms</h4>
                         <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-slate-500 uppercase font-medium mb-1">New Monthly Payment</label>
                                <div className="relative">
                                     <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                                     <input type="number" name="paymentAmount" value={modForm.paymentAmount} onChange={handleModificationChange} className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-500 uppercase font-medium mb-1">New Term (Months)</label>
                                    <input type="number" name="termMonths" value={modForm.termMonths} onChange={handleModificationChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 uppercase font-medium mb-1">New Discount Rate %</label>
                                    <input type="number" step="0.01" name="incrementalBorrowingRate" value={modForm.incrementalBorrowingRate} onChange={handleModificationChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm" />
                                </div>
                            </div>
                         </div>
                    </div>

                    <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg flex gap-2">
                        <AlertTriangle size={16} className="shrink-0" />
                        Saving this modification will automatically trigger a remeasurement of the Lease Liability and ROU Asset in the amortization schedule.
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsModModalOpen(false)} className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-600 text-white font-medium hover:bg-brand-700 rounded-lg flex items-center gap-2">
                            <Save size={18} /> Confirm Modification
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={20} />
        </button>
        <div>
            <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">{lease.assetName}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${lease.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 
                      lease.status === 'Terminated' ? 'bg-red-100 text-red-800' : 
                      lease.status === 'Ended' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-500'}`}>
                    {lease.status}
                </span>
            </div>
            <p className="text-slate-500 text-sm">Contract: {lease.contractNumber} • {lease.lesseeName}</p>
        </div>
        <div className="ml-auto flex gap-3">
             <button 
                onClick={() => setIsModModalOpen(true)}
                disabled={lease.status !== 'Active'}
                className={`px-4 py-2 border border-slate-300 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${lease.status === 'Active' ? 'text-slate-700 hover:bg-slate-50 hover:text-brand-600' : 'text-slate-300 cursor-not-allowed'}`}
             >
                <Edit3 size={16} /> Modify Contract
            </button>
             <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-slate-50">
                <Download size={16} /> Export Excel
            </button>
             <button 
                onClick={() => { setActiveTab('analysis'); handleRunAnalysis(); }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg transition-all"
             >
                <Sparkles size={16} /> AI Insight
            </button>
            <div className="relative">
                <button 
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg flex items-center gap-2 hover:bg-slate-50 hover:text-slate-900 transition-colors bg-white"
                >
                    <MoreHorizontal size={20} />
                </button>
                {showActionMenu && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowActionMenu(false)}></div>
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-2">
                            <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lifecycle Actions</span>
                            </div>
                            {lease.status === 'Active' && (
                                <button 
                                    onClick={() => handleStatusChange('Ended')}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                >
                                    <CheckCircle size={16} className="text-emerald-500"/> 
                                    <span>Mark as Ended</span>
                                </button>
                            )}
                            {lease.status === 'Active' && (
                                <button 
                                    onClick={() => handleStatusChange('Terminated')}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                >
                                    <Trash2 size={16} className="text-red-500"/> 
                                    <span>Terminate Early</span>
                                </button>
                            )}
                            <button 
                                onClick={() => handleStatusChange('Archived')}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                            >
                                <Archive size={16} className="text-slate-500"/> 
                                <span>Archive Contract</span>
                            </button>
                             {lease.status !== 'Active' && (
                                <button 
                                    onClick={() => handleStatusChange('Active')}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 border-t border-slate-50 mt-1"
                                >
                                    <Activity size={16} className="text-blue-500"/> 
                                    <span>Re-Activate</span>
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={18} /></div>
                <span className="text-sm text-slate-500 font-medium">Current Term</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{lease.termMonths} Months</div>
            <div className="text-xs text-slate-400 mt-1">{lease.startDate} to {lease.endDate}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={18} /></div>
                <span className="text-sm text-slate-500 font-medium">Monthly Payment</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{formatCurrency(lease.paymentAmount, lease.currency)}</div>
            <div className="text-xs text-slate-400 mt-1">{lease.paymentFrequency === 12 ? 'Monthly' : 'Quarterly'}</div>
        </div>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Activity size={18} /></div>
                <span className="text-sm text-slate-500 font-medium">Discount Rate</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{lease.incrementalBorrowingRate}%</div>
            <div className="text-xs text-slate-400 mt-1">Incremental Borrowing Rate</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('schedule')}
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'schedule' ? 'border-b-2 border-brand-500 text-brand-600 bg-brand-50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Amortization Schedule
            </button>
             <button 
                onClick={() => setActiveTab('entries')}
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'entries' ? 'border-b-2 border-brand-500 text-brand-600 bg-brand-50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Journal Entries
            </button>
             <button 
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'history' ? 'border-b-2 border-brand-500 text-brand-600 bg-brand-50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Modification History
            </button>
            <button 
                 onClick={() => { setActiveTab('analysis'); if(!aiAnalysis) handleRunAnalysis(); }}
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'analysis' ? 'border-b-2 border-brand-500 text-brand-600 bg-brand-50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                AI Analysis
            </button>
        </div>

        <div className="p-6">
            {activeTab === 'schedule' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                            <tr>
                                <th className="px-4 py-3">Period</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Event</th>
                                <th className="px-4 py-3 text-right">Payment</th>
                                <th className="px-4 py-3 text-right">Interest Exp</th>
                                <th className="px-4 py-3 text-right">Principal Repayment</th>
                                <th className="px-4 py-3 text-right">Liability Balance</th>
                                <th className="px-4 py-3 text-right">ROU Asset Bal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {schedule.map((row) => (
                                <tr key={row.period} className={`hover:bg-slate-50 ${row.event ? 'bg-amber-50' : ''}`}>
                                    <td className="px-4 py-3 font-medium text-slate-900">{row.period}</td>
                                    <td className="px-4 py-3 text-slate-600">{row.date}</td>
                                    <td className="px-4 py-3 text-slate-900 font-medium text-xs">
                                        {row.event && <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full">{row.event}</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(row.payment, lease.currency)}</td>
                                    <td className="px-4 py-3 text-right text-red-600">{formatCurrency(row.interestExpense, lease.currency)}</td>
                                    <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(row.principalRepayment, lease.currency)}</td>
                                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(row.leaseLiabilityClosing, lease.currency)}</td>
                                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(row.rouAssetBalance, lease.currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'entries' && (
                <div>
                   <div className="mb-4 bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
                        <FileText className="text-blue-600 shrink-0 mt-1" size={18} />
                        <div>
                            <h4 className="text-sm font-semibold text-blue-900">Auto-Generated Journal Entries</h4>
                            <p className="text-xs text-blue-700">These entries are automatically calculated based on the amortization schedule. The 'Initial Recognition' entry represents the setup of the lease on the balance sheet.</p>
                        </div>
                   </div>
                   <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium uppercase">
                          <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Account</th>
                            <th className="px-6 py-3 text-right">Debit</th>
                            <th className="px-6 py-3 text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {schedule.flatMap(row => generateEntriesForPeriod(lease, row)).map((entry, idx) => (
                             <React.Fragment key={`${entry.id}-${idx}`}>
                                <tr className="hover:bg-slate-50">
                                  <td className="px-6 py-2 text-slate-600 font-medium whitespace-nowrap">{entry.date}</td>
                                  <td className="px-6 py-2 text-slate-800">{entry.description}</td>
                                  <td className="px-6 py-2 text-slate-700 font-mono text-xs">{entry.debitAccount}</td>
                                  <td className="px-6 py-2 text-right text-slate-900 font-medium">{formatCurrency(entry.debitAmount, entry.currency)}</td>
                                  <td className="px-6 py-2 text-right text-slate-400">-</td>
                                </tr>
                                 <tr className="hover:bg-slate-50 bg-slate-50/50">
                                  <td className="px-6 py-2 border-b border-slate-100"></td>
                                  <td className="px-6 py-2 border-b border-slate-100"></td>
                                  <td className="px-6 py-2 text-slate-700 font-mono text-xs border-b border-slate-100 pl-12">{entry.creditAccount}</td>
                                  <td className="px-6 py-2 text-right text-slate-400 border-b border-slate-100">-</td>
                                  <td className="px-6 py-2 text-right text-slate-900 font-medium border-b border-slate-100">{formatCurrency(entry.debitAmount, entry.currency)}</td>
                                </tr>
                              </React.Fragment>
                           ))}
                        </tbody>
                      </table>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div>
                     {(!lease.modifications || lease.modifications.length === 0) ? (
                        <div className="text-center py-12 text-slate-400">
                            <History size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No modifications recorded for this contract.</p>
                        </div>
                     ) : (
                        <div className="space-y-4">
                            {lease.modifications.map((mod) => (
                                <div key={mod.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-2">
                                                {mod.type}
                                            </span>
                                            <h4 className="text-sm font-semibold text-slate-900 ml-2 inline-block">Effective: {mod.effectiveDate}</h4>
                                        </div>
                                        <span className="text-xs text-slate-500">Recorded: {new Date(mod.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-3">{mod.description}</p>
                                    <div className="bg-slate-100 rounded p-3 text-xs text-slate-700 grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="block font-medium text-slate-500 mb-1">Previous Values</span>
                                            {Object.entries(mod.previousValues).map(([key, val]) => (
                                                <div key={key}><span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>: {renderValue(val)}</div>
                                            ))}
                                        </div>
                                        <div>
                                            <span className="block font-medium text-slate-500 mb-1">New Values</span>
                                            {Object.entries(mod.newValues).map(([key, val]) => (
                                                <div key={key} className="font-semibold text-slate-900"><span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>: {renderValue(val)}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     )}
                </div>
            )}

            {activeTab === 'analysis' && (
                <div className="max-w-3xl">
                    {loadingAi ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mb-4"></div>
                            <p className="text-slate-500">Consulting Gemini for financial analysis...</p>
                        </div>
                    ) : (
                        <div className="prose prose-slate max-w-none">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Sparkles className="text-purple-600" size={20} />
                                Executive Summary (AI Generated)
                            </h3>
                            <div className="bg-purple-50 p-6 rounded-lg border border-purple-100 text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {aiAnalysis || "Click to generate analysis."}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LeaseDetail;