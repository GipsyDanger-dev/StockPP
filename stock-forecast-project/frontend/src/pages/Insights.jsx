import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, BarChart3, PieChart, Lightbulb, FileText, TrendingUp, TrendingDown, RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useInsights } from '../hooks/useApi';

const Insights = () => {
  const navigate = useNavigate();
  const { data: insightsData, isLoading, isError, error } = useInsights(true);

  // Dynamic data from API
  const featured = insightsData?.featured;
  const insightCards = insightsData?.insights || [];
  const summary = insightsData?.summary;

  // Icon mapping based on insight card icon field
  const getIcon = (iconName) => {
    switch(iconName) {
      case 'activity': return <Activity size={24} />;
      case 'bar-chart': return <BarChart3 size={24} />;
      case 'trending-up': return <TrendingUp size={24} />;
      case 'refresh': return <RefreshCw size={24} />;
      case 'check-circle': return <CheckCircle size={24} />;
      default: return <Lightbulb size={24} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-[#191C1E]">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#F7F9FB] border-r border-[#C6C6CD] p-6">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white" size={24} />
          </div>
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
            AI-driven analysis powered by your LSTM models. Insights generated from real model performance data and market coverage.
          </p>
          
          {/* SUMMARY BAR */}
          {summary && (
            <div className="flex flex-wrap gap-4 mt-8">
              <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold border-2 border-indigo-200">
                Models: {summary.total_models}
              </span>
              <span className={`px-4 py-2 rounded-lg font-bold border-2 ${
                summary.models_needing_retrain > 0 
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {summary.models_needing_retrain > 0 
                  ? `${summary.models_needing_retrain} need retraining` 
                  : 'All models up to date'}
              </span>
              {summary.avg_rmse > 0 && (
                <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold border-2 border-slate-200">
                  Avg RMSE: {summary.avg_rmse}
                </span>
              )}
            </div>
          )}
        </header>

        {isLoading ? (
          <div className="p-6 lg:p-12 flex flex-col items-center justify-center gap-4">
            <Loader className="animate-spin text-indigo-600" size={40} />
            <p className="text-[#45464D] text-lg font-medium">Loading AI insights...</p>
          </div>
        ) : isError ? (
          <div className="p-6 lg:p-12 max-w-7xl mx-auto">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-12 text-center">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-700 mb-2">Unable to load insights</h2>
              <p className="text-red-600">{error?.message || 'Please ensure the backend server is running.'}</p>
            </div>
          </div>
        ) : (
          <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-12">

            {/* FEATURED INSIGHT */}
            {featured && (
              <div className="bg-white border-2 border-[#C6C6CD] rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-[#0D1C2F] to-indigo-900 p-10 lg:p-14">
                  <span className="inline-block bg-white/10 backdrop-blur text-white border border-white/20 px-4 py-1 rounded-lg font-bold text-sm mb-6">
                    {featured.category}
                  </span>
                  <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                    {featured.title}
                  </h2>
                  <p className="text-slate-300 text-xl leading-relaxed max-w-4xl">
                    {featured.summary}
                  </p>
                  <div className="flex gap-4 text-slate-400 mt-8 font-medium">
                    <span>{featured.date}</span>
                    <span>•</span>
                    <span>{featured.read_time}</span>
                  </div>
                </div>
              </div>
            )}

            {/* INSIGHT CARDS GRID */}
            {insightCards.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {insightCards.map((card) => (
                  <div key={card.id} className="bg-white border-2 border-[#C6C6CD] rounded-2xl p-8 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-[#F7F9FB] rounded-lg text-[#45464D]">
                        {getIcon(card.icon)}
                      </div>
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 border-2 border-indigo-200 rounded-md font-bold text-xs">
                        {card.category}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-black mb-4">{card.title}</h3>
                    <p className="text-[#45464D] text-lg leading-relaxed">{card.content}</p>
                    <p className="text-slate-400 text-sm mt-6">{card.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-12 text-center">
                <Lightbulb size={48} className="text-yellow-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-yellow-800 mb-2">No insights available yet</h2>
                <p className="text-yellow-700 text-lg">Train a model on the Dashboard to generate AI-powered insights.</p>
                <button 
                  onClick={() => navigate('/')}
                  className="mt-6 px-8 py-3 bg-black text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            )}

            {/* BOTTOM CTA */}
            <div className="bg-black text-white rounded-2xl p-10 lg:p-12 flex flex-col lg:flex-row justify-between items-center gap-8 shadow-2xl">
              <div className="max-w-2xl">
                <span className="px-4 py-1 border-2 border-white/20 rounded-md font-bold text-white mb-4 inline-block uppercase text-xs">AI Engine</span>
                <h2 className="text-4xl lg:text-5xl font-bold mb-4">Train More Models</h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  The more models you train, the richer your insights become. Each trained model contributes performance data, market coverage, and trend analysis to your personalized AI dashboard.
                </p>
                <button 
                  onClick={() => navigate('/')}
                  className="mt-8 px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-slate-200 transition-colors inline-flex items-center gap-3"
                >
                  <LayoutDashboard size={24} /> Start Training
                </button>
              </div>
              <div className="w-40 h-40 bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-slate-700">
                <Activity size={64} className="text-slate-600" />
              </div>
            </div>
          </div>
        )}
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