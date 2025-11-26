import React, { useMemo, useState } from 'react';
import { LeaseContract, JournalEntry } from '../types';
import { generateSchedule, generateEntriesForPeriod, formatCurrency } from '../utils/calculations';
import { Search, Filter, Download, ArrowDownUp } from 'lucide-react';

interface AccountingEntriesProps {
  leases: LeaseContract[];
}

const AccountingEntries: React.FC<AccountingEntriesProps> = ({ leases }) => {
  const [filterAccount, setFilterAccount] = useState('');
  const [filterLease, setFilterLease] = useState('');

  // Generate all entries across all leases
  const allEntries = useMemo(() => {
    let entries: (JournalEntry & { contractNumber: string, assetName: string })[] = [];
    
    leases.forEach(lease => {
      const schedule = generateSchedule(lease);
      schedule.forEach(row => {
        const periodEntries = generateEntriesForPeriod(lease, row);
        // Enhance with contract info for display
        const enhancedEntries = periodEntries.map(e => ({
          ...e,
          contractNumber: lease.contractNumber,
          assetName: lease.assetName
        }));
        entries = [...entries, ...enhancedEntries];
      });
    });

    // Sort by Date Descending
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [leases]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      const matchesAccount = filterAccount === '' || 
        entry.debitAccount.toLowerCase().includes(filterAccount.toLowerCase()) || 
        entry.creditAccount.toLowerCase().includes(filterAccount.toLowerCase());
      
      const matchesLease = filterLease === '' || 
        entry.contractNumber.toLowerCase().includes(filterLease.toLowerCase());

      return matchesAccount && matchesLease;
    });
  }, [allEntries, filterAccount, filterLease]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Accounting Entries</h2>
          <p className="text-slate-500">General Ledger Journal Posting Log</p>
        </div>
        <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-slate-50">
            <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4 flex-wrap">
            <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Filter by Account..." 
                  value={filterAccount}
                  onChange={(e) => setFilterAccount(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 text-sm" 
                />
            </div>
             <div className="relative w-64">
                <Filter className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Filter by Contract No..." 
                  value={filterLease}
                  onChange={(e) => setFilterLease(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 text-sm" 
                />
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-500 font-medium uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Date <ArrowDownUp size={12} className="inline ml-1"/></th>
                <th className="px-6 py-3">Journal ID</th>
                <th className="px-6 py-3">Contract</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Account</th>
                <th className="px-6 py-3 text-right">Debit</th>
                <th className="px-6 py-3 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.slice(0, 100).map((entry, index) => (
                <React.Fragment key={`${entry.id}-${index}`}>
                   {/* Debit Line */}
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-2 text-slate-600 font-medium whitespace-nowrap">{entry.date}</td>
                    <td className="px-6 py-2 text-slate-500 text-xs">{entry.id}</td>
                    <td className="px-6 py-2 text-slate-600">{entry.contractNumber}</td>
                    <td className="px-6 py-2 text-slate-800">{entry.description}</td>
                    <td className="px-6 py-2 text-slate-700 font-mono text-xs">{entry.debitAccount}</td>
                    <td className="px-6 py-2 text-right text-slate-900 font-medium">{formatCurrency(entry.debitAmount, entry.currency)}</td>
                    <td className="px-6 py-2 text-right text-slate-400">-</td>
                  </tr>
                  {/* Credit Line */}
                   <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="px-6 py-2 border-b border-slate-100"></td>
                    <td className="px-6 py-2 border-b border-slate-100"></td>
                    <td className="px-6 py-2 border-b border-slate-100"></td>
                    <td className="px-6 py-2 border-b border-slate-100"></td>
                    <td className="px-6 py-2 text-slate-700 font-mono text-xs border-b border-slate-100 pl-12">{entry.creditAccount}</td>
                    <td className="px-6 py-2 text-right text-slate-400 border-b border-slate-100">-</td>
                    <td className="px-6 py-2 text-right text-slate-900 font-medium border-b border-slate-100">{formatCurrency(entry.debitAmount, entry.currency)}</td> 
                    {/* Note: Credit amount usually equals debit amount in single line journal representation logic here */}
                  </tr>
                </React.Fragment>
              ))}
              {filteredEntries.length === 0 && (
                  <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">No journal entries found matching filters.</td>
                  </tr>
              )}
            </tbody>
          </table>
          {filteredEntries.length > 100 && (
            <div className="p-4 text-center text-slate-500 text-sm border-t border-slate-200">
                Showing first 100 of {filteredEntries.length} entries. Use filters to narrow down.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountingEntries;