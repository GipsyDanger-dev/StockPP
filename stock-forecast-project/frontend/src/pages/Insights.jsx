import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, BarChart3, PieChart, Lightbulb, FileText, Clock, Lock } from 'lucide-react';

const Insights = () => {
  const navigate = useNavigate();

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
          <NavItem icon={<BarChart3 size={20}/>} label="Market" onClick={() => navigate('/market')} />
          <NavItem icon={<PieChart size={20}/>} label="Analytics" onClick={() => navigate('/analytics/AAPL')} />
          <NavItem icon={<Lightbulb size={20}/>} label="Insights" active />
          <NavItem icon={<FileText size={20}/>} label="Reports" onClick={() => navigate('/reports')} />
        </nav>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <header className="bg-[#F7F9FB] px-6 lg:px-12 py-10 border-b border-[#E0E3E5]">
          <h1 className="text-5xl lg:text-7xl font-bold text-black mb-4 tracking-tighter">Market Insights</h1>
          <p className="text-[#45464D] text-xl lg:text-2xl max-w-4xl">
            Professional analysis and deep dives into macroeconomic trends, emerging technologies, and sector performance.
          </p>
        </header>

        <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-12">
          {/* FEATURED POST */}
          <div className="bg-white border-2 border-[#C6C6CD] rounded-2xl overflow-hidden shadow-sm">
            <div className="h-96 bg-slate-200 relative">
               <img src="https://images.unsplash.com/photo-1526303328184-97596f51a0ae?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover" alt="macro" />
               <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-6 py-2 rounded-lg font-bold border-2 border-[#C6C6CD]">MACRO</div>
            </div>
            <div className="p-10">
              <div className="flex gap-4 text-[#45464D] mb-6 font-medium">
                <span>Oct 24, 2023</span> <span>•</span> <span>12 min read</span>
              </div>
              <h2 className="text-5xl font-bold text-black leading-tight">The Ripple Effect: Analyzing Global Supply Chain Shifts in Q4</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* AI TRENDS */}
            <div className="bg-white border-2 border-[#C6C6CD] rounded-2xl overflow-hidden shadow-sm">
              <div className="h-64 bg-slate-200 relative">
                <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover" alt="ai" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-1 rounded-lg font-bold border-2 border-[#C6C6CD]">AI TRENDS</div>
              </div>
              <div className="p-8">
                 <h3 className="text-3xl font-bold mb-4">Compute as Currency: The New Infrastructure Race</h3>
                 <p className="text-[#45464D]">Evaluating the scarcity of GPU compute and its impact on valuation...</p>
              </div>
            </div>

            {/* EQUITIES REPORT */}
            <div className="bg-white border-2 border-[#C6C6CD] rounded-2xl p-10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-8">
                  <span className="px-4 py-1 border-2 border-[#C6C6CD] rounded-md font-bold text-[#505F76]">Equities</span>
                  <span className="text-[#45464D]">5 min read</span>
                </div>
                <h3 className="text-4xl font-bold mb-6">Sector Rotation Strategies for a Plateauing Rate Environment</h3>
                <p className="text-[#45464D] text-lg">Evaluating historical precedents to model potential outperformance in defensive vs cyclical sectors.</p>
              </div>
              <p className="mt-12 text-[#45464D]">Oct 20, 2023</p>
            </div>
          </div>

          {/* PREMIUM REPORT CARD */}
          <div className="bg-black text-white rounded-2xl p-12 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
            <div className="max-w-2xl">
              <span className="px-4 py-1 border-2 border-white/30 rounded-md font-bold text-white mb-6 inline-block uppercase text-xs">Premium Report</span>
              <h2 className="text-5xl font-bold mb-6">Q4 Institutional Sentiment Index</h2>
              <p className="text-slate-400 text-xl leading-relaxed">Exclusive access to our proprietary index tracking positioning among top tier asset managers.</p>
              <button className="mt-10 flex items-center gap-3 font-bold text-2xl hover:text-indigo-400 transition-colors">
                Unlock Full Report <Lock size={24}/>
              </button>
            </div>
            <div className="w-48 h-48 bg-slate-800 rounded-2xl flex items-center justify-center">
               <FileText size={80} className="text-slate-600" />
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

export default Insights;