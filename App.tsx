import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LeaseWizard from './components/LeaseWizard';
import LeaseDetail from './components/LeaseDetail';
import AccountingEntries from './components/AccountingEntries';
import Reports from './components/Reports';
import Settings from './components/Settings';
import { LeaseContract, LeaseStandard, LeaseType, PaymentFrequency, Currency } from './types';
import { Plus, Search, Filter } from 'lucide-react';
import { formatCurrency } from './utils/calculations';

// Mock Initial Data
const initialLeases: LeaseContract[] = [
  {
    id: '1',
    contractNumber: 'LS-2024-001',
    lesseeName: 'Baghdad Main Branch',
    assetName: 'Headquarters Level 1',
    startDate: '2024-01-01',
    endDate: '2029-01-01',
    termMonths: 60,
    paymentAmount: 15000,
    paymentFrequency: PaymentFrequency.Monthly,
    incrementalBorrowingRate: 5.5,
    currency: Currency.USD,
    standard: LeaseStandard.IFRS16,
    classification: LeaseType.Finance,
    initialDirectCosts: 5000,
    leaseIncentives: 0,
    residualValue: 0,
    status: 'Active',
    modifications: []
  },
  {
    id: '2',
    contractNumber: 'LS-2024-045',
    lesseeName: 'Basra Operations',
    assetName: 'Fleet - Toyota Land Cruisers (x5)',
    startDate: '2024-03-01',
    endDate: '2027-03-01',
    termMonths: 36,
    paymentAmount: 8500000,
    paymentFrequency: PaymentFrequency.Monthly,
    incrementalBorrowingRate: 8.0,
    currency: Currency.IQD,
    standard: LeaseStandard.IQ_GAAP,
    classification: LeaseType.Finance,
    initialDirectCosts: 1000000,
    leaseIncentives: 0,
    residualValue: 20000000,
    status: 'Active',
    modifications: []
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leases, setLeases] = useState<LeaseContract[]>(initialLeases);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);

  const handleCreateLease = (newLease: LeaseContract) => {
    setLeases([...leases, newLease]);
    setIsWizardOpen(false);
    setSelectedLeaseId(newLease.id); // Automatically open the new lease to show generated schedule
  };

  const handleUpdateLease = (updatedLease: LeaseContract) => {
    setLeases(leases.map(l => l.id === updatedLease.id ? updatedLease : l));
  };

  const selectedLease = leases.find(l => l.id === selectedLeaseId);

  const renderContent = () => {
    if (selectedLeaseId && selectedLease) {
      return (
        <LeaseDetail 
          lease={selectedLease} 
          onBack={() => setSelectedLeaseId(null)} 
          onUpdate={handleUpdateLease}
        />
      );
    }

    if (isWizardOpen) {
      return <LeaseWizard onSave={handleCreateLease} onCancel={() => setIsWizardOpen(false)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard leases={leases} />;
      case 'leases':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Lease Portfolio</h2>
                <p className="text-slate-500">Manage contracts and view status</p>
              </div>
              <button 
                onClick={() => setIsWizardOpen(true)}
                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
              >
                <Plus size={20} /> New Contract
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input type="text" placeholder="Search contracts..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500" />
                    </div>
                    <button className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg flex items-center gap-2 hover:bg-slate-50">
                        <Filter size={18} /> Filter
                    </button>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium uppercase">
                    <tr>
                      <th className="px-6 py-4">Contract No</th>
                      <th className="px-6 py-4">Asset</th>
                      <th className="px-6 py-4">Term</th>
                      <th className="px-6 py-4">Payment</th>
                      <th className="px-6 py-4">Standard</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leases.map((lease) => (
                      <tr key={lease.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{lease.contractNumber}</td>
                        <td className="px-6 py-4 text-slate-600">{lease.assetName}</td>
                        <td className="px-6 py-4 text-slate-600">{lease.termMonths} Mo</td>
                        <td className="px-6 py-4 text-slate-900 font-medium">{formatCurrency(lease.paymentAmount, lease.currency)}</td>
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {lease.standard}
                            </span>
                        </td>
                         <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                              ${lease.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 
                                lease.status === 'Terminated' ? 'bg-red-100 text-red-800' : 
                                lease.status === 'Ended' ? 'bg-blue-100 text-blue-800' :
                                'bg-slate-100 text-slate-500'}`}>
                                {lease.status}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => setSelectedLeaseId(lease.id)}
                            className="text-brand-600 hover:text-brand-800 font-medium"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'accounting':
        return <AccountingEntries leases={leases} />;
      case 'reports':
        return <Reports leases={leases} />;
      case 'admin':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => {
        setActiveTab(tab);
        setSelectedLeaseId(null);
        setIsWizardOpen(false);
      }} />
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
           <div>
             <h1 className="text-xl font-bold text-slate-800">Welcome Back, Controller</h1>
             <p className="text-sm text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
           </div>
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium text-slate-600">System Operational</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
               <img src="https://picsum.photos/200/200" alt="User" className="w-full h-full object-cover" />
             </div>
           </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;