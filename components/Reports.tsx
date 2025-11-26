import React, { useMemo } from 'react';
import { LeaseContract } from '../types';
import { calculatePV, formatCurrency, generateSchedule } from '../utils/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { FileText, Printer, Share2 } from 'lucide-react';

interface ReportsProps {
  leases: LeaseContract[];
}

const Reports: React.FC<ReportsProps> = ({ leases }) => {
  
  // Aggregate Data for IFRS 16 Disclosure
  const reportData = useMemo(() => {
    let totalDepreciation = 0;
    let totalInterest = 0;
    let totalLiabilityClosing = 0;
    let totalROUClosing = 0;
    let expenseLowValue = 0;
    let expenseShortTerm = 0;

    leases.forEach(lease => {
        const schedule = generateSchedule(lease);
        // Sum up expenses for the current year (Simplified: taking full schedule for demo)
        const interest = schedule.reduce((sum, row) => sum + row.interestExpense, 0);
        const dep = schedule.reduce((sum, row) => sum + row.rouDepreciation, 0);
        
        totalInterest += interest;
        totalDepreciation += dep;
        
        // Get latest balances (simplified: last row of schedule)
        if(schedule.length > 0) {
             // In reality, this should be "As of Reporting Date"
             // Using start of lease PV for demonstration of total exposure
             totalLiabilityClosing += calculatePV(lease);
             totalROUClosing += calculatePV(lease); // approx
        }
    });

    return {
        totalDepreciation,
        totalInterest,
        totalLiabilityClosing,
        totalROUClosing,
        expenseLowValue,
        expenseShortTerm
    };
  }, [leases]);

  const assetClassData = useMemo(() => {
      const counts: Record<string, number> = {};
      leases.forEach(l => {
          // Rudimentary classification based on name
          let type = 'Other';
          if (l.assetName.toLowerCase().includes('building') || l.assetName.toLowerCase().includes('floor') || l.assetName.toLowerCase().includes('hq')) type = 'Real Estate';
          else if (l.assetName.toLowerCase().includes('car') || l.assetName.toLowerCase().includes('fleet') || l.assetName.toLowerCase().includes('truck')) type = 'Vehicles';
          else if (l.assetName.toLowerCase().includes('server') || l.assetName.toLowerCase().includes('laptop')) type = 'IT Equipment';
          
          counts[type] = (counts[type] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leases]);

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1'];

  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
          <p className="text-slate-500">IFRS 16 Disclosures and Portfolio Analysis</p>
        </div>
        <div className="flex gap-3">
             <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-slate-50">
                <Printer size={16} /> Print
            </button>
            <button className="px-4 py-2 bg-brand-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-brand-700">
                <FileText size={16} /> Export PDF
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* IFRS 16 Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">IFRS 16 Disclosure Summary</h3>
              
              <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-slate-600">Depreciation Charge for ROU Assets</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(reportData.totalDepreciation, 'USD')}</span>
                  </div>
                   <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-slate-600">Interest Expense on Lease Liabilities</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(reportData.totalInterest, 'USD')}</span>
                  </div>
                   <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-slate-600">Expense - Short-term Leases</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(reportData.expenseShortTerm, 'USD')}</span>
                  </div>
                   <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-slate-600">Expense - Low-value Assets</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(reportData.expenseLowValue, 'USD')}</span>
                  </div>
                   <div className="flex justify-between items-center py-2 pt-4">
                      <span className="text-slate-800 font-medium">Total Cash Outflow for Leases</span>
                      <span className="font-bold text-brand-600 text-lg">{formatCurrency(reportData.totalInterest + reportData.totalDepreciation, 'USD')}</span>
                  </div>
              </div>
          </div>

          {/* Portfolio Mix Chart */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">Portfolio Composition by Asset Class</h3>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={assetClassData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {assetClassData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
              </div>
          </div>
      </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
           <h3 className="text-lg font-bold text-slate-900 mb-6">Maturity Analysis (Undiscounted Cash Flows)</h3>
           <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                    data={[
                        { year: 'Year 1', amount: 540000 },
                        { year: 'Year 2', amount: 480000 },
                        { year: 'Year 3', amount: 320000 },
                        { year: 'Year 4', amount: 210000 },
                        { year: 'Year 5+', amount: 150000 },
                    ]}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                    >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(val: number) => formatCurrency(val, 'USD')} />
                    <Bar dataKey="amount" fill="#0284c7" name="Future Payments" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
           </div>
       </div>
    </div>
  );
};

export default Reports;