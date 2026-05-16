import React, { useState } from 'react';
import { Search, Filter, ArrowUpRight, Activity, LayoutDashboard, BarChart3, PieChart, Lightbulb, FileText, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketSummary } from '../hooks/useApi';

const Market = () => {
  const navigate = useNavigate();
  const [activeSector, setActiveSector] = useState('All Sectors');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch market data from Supabase via new endpoint
  const { data: marketData, isLoading, isError, error } = useMarketSummary(true);
  
  // Use data from API if available, otherwise fallback to empty array
  const stocks = marketData?.tickers || [];
  
  // Filter stocks by search term and sector
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = activeSector === 'All Sectors' || stock.sector === activeSector;
    return matchesSearch && matchesSector;
  });

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
                <input 
                  type="text" 
                  placeholder="Search tickers..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-4 px-12 border-2 border-[#C6C6CD] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
                <Search className="absolute left-4 top-4 text-slate-400" size={24} />
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-4">
                <Loader className="animate-spin text-indigo-600" size={40} />
                <p className="text-[#45464D]">Loading market data from Supabase...</p>
              </div>
            ) : isError ? (
              <div className="p-12 flex flex-col items-center justify-center gap-4 bg-red-50">
                <p className="text-red-600 font-bold">Error loading market data</p>
                <p className="text-red-500 text-sm">{error?.message || 'Unable to fetch tickers from database'}</p>
              </div>
            ) : stocks.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center gap-4 bg-yellow-50">
                <p className="text-yellow-700 font-bold">No tickers available</p>
                <p className="text-yellow-600 text-sm">Make sure the Supabase database has been populated</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F7F9FB] text-[#45464D] font-bold text-sm tracking-widest uppercase border-b border-[#C6C6CD]">
                      <tr>
                        <th className="p-6">Ticker</th>
                        <th className="p-6">Company</th>
                        <th className="p-6">Sector</th>
                        <th className="p-6">Price</th>
                        <th className="p-6 text-right">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStocks.map((stock) => (
                        <tr key={stock.ticker} onClick={() => navigate(`/analytics/${stock.ticker}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                          <td className="p-6 font-bold text-xl">{stock.ticker}</td>
                          <td className="p-6 text-[#45464D] text-lg">{stock.name}</td>
                          <td className="p-6 text-[#45464D]">{stock.sector || 'N/A'}</td>
                          <td className="p-6 font-bold text-xl">${stock.price?.toFixed(2) || 'N/A'}</td>
                          <td className={`p-6 text-right font-bold text-lg ${stock.change_percent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent?.toFixed(2) || '0'}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-6 bg-[#F7F9FB] flex justify-between items-center border-t border-[#C6C6CD]">
                  <span className="text-[#45464D]">Showing 1-{filteredStocks.length} of {stocks.length} results</span>
                  <div className="flex gap-2">
                    <button className="p-2 border-2 rounded-lg bg-white"><ChevronLeft size={20}/></button>
                    <button className="p-2 border-2 rounded-lg bg-white"><ChevronRight size={20}/></button>
                  </div>
                </div>
              </>
            )}
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