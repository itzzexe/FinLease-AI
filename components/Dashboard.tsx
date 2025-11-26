import React, { useMemo } from 'react';
import { LeaseContract } from '../types';
import { calculatePV, formatCurrency } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  leases: LeaseContract[];
}

const Dashboard: React.FC<DashboardProps> = ({ leases }) => {
  const kpi = useMemo(() => {
    let totalLiability = 0;
    let monthlyBurn = 0;
    
    leases.forEach(l => {
      totalLiability += calculatePV(l); // simplified: initial liability
      if(l.status === 'Active') {
        monthlyBurn += l.paymentFrequency === 12 ? l.paymentAmount : l.paymentAmount / (12/l.paymentFrequency);
      }
    });

    return {
      activeLeases: leases.filter(l => l.status === 'Active').length,
      totalLiability,
      monthlyBurn,
      compliantCount: leases.length // Assuming all created are compliant for demo
    };
  }, [leases]);

  // Mock data for charts
  const maturityData = [
    { year: '2024', liability: 450000, asset: 420000 },
    { year: '2025', liability: 380000, asset: 360000 },
    { year: '2026', liability: 250000, asset: 240000 },
    { year: '2027', liability: 150000, asset: 140000 },
    { year: '2028', liability: 50000, asset: 45000 },
  ];

  const portfolioMix = [
    { name: 'Real Estate', value: 65 },
    { name: 'Vehicles', value: 20 },
    { name: 'Equipment', value: 15 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Liability (PV)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(kpi.totalLiability, 'USD')}</h3>
            </div>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <span className="text-xs text-red-600 mt-2 block">+4.5% from last month</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Contracts</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{kpi.activeLeases}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">12 pending approval</span>
        </div>

         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Est. Monthly Cash Out</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(kpi.monthlyBurn, 'USD')}</h3>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Wallet size={20} />
            </div>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">Forecast for next 30 days</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Audit Risks</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">Low</h3>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertCircle size={20} />
            </div>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">Data integrity check pass</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-96">
          <h4 className="text-lg font-semibold text-slate-900 mb-6">Liability vs ROU Asset Run-off</h4>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={maturityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value, 'USD')} />
              <Legend />
              <Area type="monotone" dataKey="liability" stackId="1" stroke="#0ea5e9" fill="#e0f2fe" name="Lease Liability" />
              <Area type="monotone" dataKey="asset" stackId="2" stroke="#10b981" fill="#d1fae5" name="ROU Asset" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-96">
          <h4 className="text-lg font-semibold text-slate-900 mb-6">Amortization Schedule Projection</h4>
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={maturityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => formatCurrency(value, 'USD')} />
              <Legend />
              <Bar dataKey="liability" fill="#0f172a" radius={[4, 4, 0, 0]} name="Interest Expense" />
              <Bar dataKey="asset" fill="#64748b" radius={[4, 4, 0, 0]} name="Principal Repayment" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;