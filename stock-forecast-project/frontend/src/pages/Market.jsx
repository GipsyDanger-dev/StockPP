import React, { useState } from 'react';
import { Search, Filter, ArrowUpRight, Activity, LayoutDashboard, BarChart3, PieChart, Lightbulb, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Market = () => {
  const navigate = useNavigate();
  const [activeSector, setActiveSector] = useState('All Sectors');

  const stocks = [
    { ticker: 'NVDA', name: 'NVIDIA Corporation', price: '875.28', change: '+2.4%' },
    { ticker: 'PLTR', name: 'Palantir Technologies Inc.', price: '24.53', change: '+1.8%' },
    { ticker: 'AMD', name: 'Advanced Micro Devices, Inc.', price: '178.60', change: '-0.5%' },
    { ticker: 'MSFT', name: 'Microsoft Corporation', price: '415.10', change: '+0.3%' },
    { ticker: 'AAPL', name: 'Apple Inc.', price: '170.85', change: '+1.2%' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', price: '138.50', change: '-0.2%' },
    { ticker: 'TSLA', name: 'Tesla, Inc.', price: '175.22', change: '-3.1%' },
  ];

  return (
    <div className="flex min-h-screen bg-white text-[#191C1E]">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#F7F9FB] border-r border-[#C6C6CD] p-6">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center"><Activity className="text-white" size={24} /></div>
          <span className="font-bold text-xl">PRECISION</span>
        </div>
        <nav className="space-y-2">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" onClick={() => navigate('/')} />
          <NavItem icon={<BarChart3 size={20}/>} label="Market" active />
          <NavItem icon={<PieChart size={20}/>} label="Analytics" onClick={() => navigate('/analytics/AAPL')} />
          <NavItem icon={<Lightbulb size={20}/>} label="Insights" onClick={() => navigate('/insights')} />
          <NavItem icon={<FileText size={20}/>} label="Reports" onClick={() => navigate('/reports')} />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-x-hidden">
        <header className="bg-[#F7F9FB] px-6 lg:px-12 py-10 border-b border-[#E0E3E5]">
          <h1 className="text-5xl lg:text-7xl font-bold text-black mb-4 tracking-tighter">Market Explorer</h1>
          <p className="text-[#45464D] text-xl lg:text-2xl">Real-time equities overview. High-density data view.</p>
          
          <div className="flex gap-4 mt-8">
            {['All Sectors', 'Technology', 'Healthcare'].map(sector => (
              <button 
                key={sector}
                onClick={() => setActiveSector(sector)}
                className={`px-8 py-3 rounded-full font-bold border-2 transition-all ${activeSector === sector ? 'bg-black text-white border-black' : 'bg-white text-black border-[#C6C6CD] hover:bg-slate-100'}`}
              >
                {sector}
              </button>
            ))}
          </div>
        </header>

        <div className="p-6 lg:p-12 max-w-7xl mx-auto">
          <div className="bg-white border-2 border-[#C6C6CD] rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 bg-[#F7F9FB] border-b border-[#C6C6CD]">
              <div className="relative max-w-xl">
                <input type="text" placeholder="Search tickers..." className="w-full py-4 px-12 border-2 border-[#C6C6CD] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <Search className="absolute left-4 top-4 text-slate-400" size={24} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#F7F9FB] text-[#45464D] font-bold text-sm tracking-widest uppercase border-b border-[#C6C6CD]">
                  <tr>
                    <th className="p-6">Ticker</th>
                    <th className="p-6">Company</th>
                    <th className="p-6">Price</th>
                    <th className="p-6 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stocks.map((stock) => (
                    <tr key={stock.ticker} onClick={() => navigate(`/analytics/${stock.ticker}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                      <td className="p-6 font-bold text-xl">{stock.ticker}</td>
                      <td className="p-6 text-[#45464D] text-lg">{stock.name}</td>
                      <td className="p-6 font-bold text-xl">${stock.price}</td>
                      <td className={`p-6 text-right font-bold text-lg ${stock.change.includes('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {stock.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-[#F7F9FB] flex justify-between items-center border-t border-[#C6C6CD]">
              <span className="text-[#45464D]">Showing 1-10 of 504 results</span>
              <div className="flex gap-2">
                <button className="p-2 border-2 rounded-lg bg-white"><ChevronLeft size={20}/></button>
                <button className="p-2 border-2 rounded-lg bg-white"><ChevronRight size={20}/></button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-[#131B2E] text-white' : 'text-[#45464D] hover:bg-slate-200'}`}>
    {icon} <span className="font-bold">{label}</span>
  </div>
);

export default Market;