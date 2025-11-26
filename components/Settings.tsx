import React, { useState } from 'react';
import { Save, Building2, Globe, Shield, CreditCard, Layers, CheckCircle } from 'lucide-react';
import { GL_ACCOUNTS, updateGLAccounts } from '../utils/calculations';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('entity');
  const [showSaved, setShowSaved] = useState(false);

  // Initialize state from the central config in utils/calculations
  const [glMappings, setGlMappings] = useState([
    { id: 'rouAsset', event: 'ROU Asset Recognition', type: 'Asset (Debit)', ...GL_ACCOUNTS.rouAsset },
    { id: 'leaseLiability', event: 'Lease Liability Recognition', type: 'Liability (Credit)', ...GL_ACCOUNTS.leaseLiability },
    { id: 'accumDepreciation', event: 'Accumulated Depreciation', type: 'Contra Asset (Credit)', ...GL_ACCOUNTS.accumDepreciation },
    { id: 'cash', event: 'Cash Payment', type: 'Asset (Credit)', ...GL_ACCOUNTS.cash },
    { id: 'interestExpense', event: 'Interest Expense', type: 'Expense (Debit)', ...GL_ACCOUNTS.interestExpense },
    { id: 'depreciationExpense', event: 'Depreciation Expense', type: 'Expense (Debit)', ...GL_ACCOUNTS.depreciationExpense },
    { id: 'shortTermExpense', event: 'Short-Term Lease Expense', type: 'Expense (Debit)', ...GL_ACCOUNTS.shortTermExpense },
    { id: 'lowValueExpense', event: 'Low-Value Lease Expense', type: 'Expense (Debit)', ...GL_ACCOUNTS.lowValueExpense },
    { id: 'modificationGainLoss', event: 'Modification Gain/Loss', type: 'Gain/Loss', ...GL_ACCOUNTS.modificationGainLoss },
    { id: 'variableExpense', event: 'Variable Lease Expense', type: 'Expense (Debit)', ...GL_ACCOUNTS.variableExpense },
  ]);

  const handleMappingChange = (id: string, field: 'code' | 'name', value: string) => {
    setGlMappings(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const saveMappings = () => {
      // Convert list back to dictionary object
      const newConfig: any = {};
      glMappings.forEach(item => {
          newConfig[item.id] = { code: item.code, name: item.name };
      });
      
      // Update the singleton
      updateGLAccounts(newConfig);

      // Show feedback
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold text-slate-900">Settings & Configuration</h2>
          <p className="text-slate-500">Manage entity details, accounting policies, and system users.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex">
            {/* Settings Sidebar */}
            <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-2">
                <button 
                    onClick={() => setActiveTab('entity')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'entity' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <Building2 size={18} /> Entity Details
                </button>
                 <button 
                    onClick={() => setActiveTab('policies')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'policies' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <Layers size={18} /> Accounting Policies
                </button>
                 <button 
                    onClick={() => setActiveTab('coa')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'coa' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <CreditCard size={18} /> Chart of Accounts
                </button>
                 <button 
                    onClick={() => setActiveTab('users')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <Shield size={18} /> Access Control
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8">
                {activeTab === 'entity' && (
                    <div className="max-w-2xl space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Legal Entity Configuration</h3>
                        
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Company Legal Name</label>
                                <input type="text" defaultValue="FinLease Global Bank Ltd." className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID / TIN</label>
                                    <input type="text" defaultValue="TRX-99887766" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Functional Currency</label>
                                    <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500">
                                        <option>USD - US Dollar</option>
                                        <option>IQD - Iraqi Dinar</option>
                                        <option>EUR - Euro</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Headquarters Address</label>
                                <textarea rows={3} defaultValue="12 Financial District, Al-Jadriya, Baghdad, Iraq" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
                            </div>
                        </div>
                        <div className="pt-4">
                            <button className="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 flex items-center gap-2">
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </div>
                )}

                 {activeTab === 'policies' && (
                    <div className="max-w-2xl space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">IFRS 16 Policy Decisions</h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-brand-600 rounded focus:ring-brand-500" />
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Low Value Exemption</label>
                                    <p className="text-xs text-slate-500">Apply exemption for assets under $5,000 value (e.g. laptops, furniture).</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-brand-600 rounded focus:ring-brand-500" />
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Short-Term Exemption</label>
                                    <p className="text-xs text-slate-500">Apply exemption for leases with term less than 12 months.</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Portfolio Discount Rate Strategy</label>
                                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500">
                                    <option>Asset Specific Rate</option>
                                    <option>Portfolio Average Rate</option>
                                    <option>Entity Level IBR</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-4">
                            <button className="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 flex items-center gap-2">
                                <Save size={18} /> Save Policies
                            </button>
                        </div>
                    </div>
                )}

                 {activeTab === 'coa' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">GL Account Mapping (IFRS 16 Defaults)</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Configure the default General Ledger accounts used for automated journal entry generation. 
                            The system is pre-populated with standard IFRS 16 accounts.
                        </p>

                        <div className="overflow-hidden border border-slate-200 rounded-lg shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 font-medium text-slate-700 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3">System Event</th>
                                        <th className="px-4 py-3">Account Type</th>
                                        <th className="px-4 py-3 w-32">GL Code</th>
                                        <th className="px-4 py-3">Account Name</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {glMappings.map((mapping) => (
                                        <tr key={mapping.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-2 font-medium text-slate-800">{mapping.event}</td>
                                            <td className="px-4 py-2 text-slate-500 text-xs">{mapping.type}</td>
                                            <td className="px-4 py-2">
                                                <input 
                                                    type="text" 
                                                    value={mapping.code} 
                                                    onChange={(e) => handleMappingChange(mapping.id, 'code', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:border-brand-500 focus:bg-white outline-none py-1 font-mono text-slate-700"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input 
                                                    type="text" 
                                                    value={mapping.name} 
                                                    onChange={(e) => handleMappingChange(mapping.id, 'name', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:border-brand-500 focus:bg-white outline-none py-1 text-slate-700"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="flex justify-end pt-4 items-center gap-3">
                             {showSaved && (
                                 <span className="flex items-center gap-1 text-emerald-600 text-sm animate-fadeIn">
                                     <CheckCircle size={16} /> Changes Saved!
                                 </span>
                             )}
                             <button 
                                onClick={saveMappings}
                                className="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 flex items-center gap-2 shadow-sm transition-all"
                             >
                                <Save size={18} /> Update Mappings
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Settings;