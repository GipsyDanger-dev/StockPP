import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Settings,
  LayoutDashboard,
  BarChart3,
  PieChart,
  Lightbulb,
  FileText,
  Search,
  Menu,
  X,
  Activity,
} from "lucide-react";
import { useForecast } from "../hooks/useApi";
import PriceChart from "../components/PriceChart";
import { formatCurrency, formatPercent } from "../utils/formatting";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [ticker, setTicker] = useState("NVDA"); // Default sesuai template kamu
  const [searchInput, setSearchInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Integrasi ke Backend AI
  const { data, isLoading, error } = useForecast(ticker, 7, "1y");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput) setTicker(searchInput.toUpperCase());
  };

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-bold text-slate-400">
        LOADING AI ENGINE...
      </div>
    );

  return (
    <div className="flex min-h-screen bg-[#FFFFFF] text-[#191C1E]">
      {/* --- SIDEBAR (Desktop) / MOBILE NAV --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#F7F9FB] border-r border-[#C6C6CD] transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform lg:translate-x-0 lg:static`}
      >
        <div className="p-6 flex items-center gap-4 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white" size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">PRECISION</span>
        </div>

        <nav className="px-4 space-y-2">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active
            onClick={() => navigate("/")}
          />
          <NavItem
            icon={<BarChart3 size={20} />}
            label="Market"
            onClick={() => navigate("/market")}
          />
          <NavItem
            icon={<PieChart size={20} />}
            label="Analytics"
            onClick={() => navigate(`/analytics/${ticker}`)}
          />
          <NavItem
            icon={<Lightbulb size={20} />}
            label="Insights"
            onClick={() => navigate("/insights")}
          />
          <NavItem
            icon={<FileText size={20} />}
            label="Reports"
            onClick={() => navigate("/reports")}
          />
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-x-hidden">
        {/* HEADER */}
        <header className="bg-[#F7F9FB] px-6 py-4 flex justify-between items-center border-b border-[#C6C6CD]">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu />
            </button>
            <span className="font-bold text-lg">PRECISION</span>
          </div>

          <form
            onSubmit={handleSearch}
            className="hidden md:flex relative w-96"
          >
            <input
              type="text"
              placeholder="Search assets..."
              className="w-full bg-white border border-[#C6C6CD] rounded-full py-2 px-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={18}
            />
          </form>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-400">
                PREMIUM ACCOUNT
              </p>
              <p className="text-sm font-bold">Adam Fairuz</p>
            </div>
            <div className="w-12 h-12 bg-[#131B2E] text-[#7C839B] rounded-full flex items-center justify-center font-bold">
              SA
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
          {/* HERO SECTION */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-5xl lg:text-7xl font-bold mb-4 tracking-tight">
                Market Insights
              </h1>
              <p className="text-[#45464D] text-xl lg:text-2xl max-w-2xl">
                AI-driven predictive analytics for active portfolios.
              </p>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-6 py-3 bg-[#F7F9FB] border-2 border-[#C6C6CD] rounded-lg font-bold">
                <Settings size={20} /> Parameters
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-bold">
                <Download size={20} /> Export Data
              </button>
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* PORTFOLIO CARD (Chart Area) */}
            <div className="lg:col-span-2 bg-white border-2 border-[#C6C6CD] rounded-2xl p-8 shadow-sm">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[#45464D] font-bold text-sm tracking-widest uppercase">
                    Current Price
                  </p>
                  <h2 className="text-4xl font-bold mt-1">
                    {formatCurrency(data.current_price)}
                  </h2>
                </div>
                <div className={`flex items-center gap-2 border-2 px-4 py-2 rounded-lg font-bold text-xl ${
                  data.change_percent >= 0 
                    ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]' 
                    : 'bg-rose-50 border-rose-200 text-rose-600'
                }`}>
                  {data.change_percent >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  {formatPercent(data.change_percent)}
                </div>
              </div>
              <div className="h-[400px]">
                <PriceChart
                  historical={data.historical}
                  forecast={data.forecast}
                />
              </div>
            </div>

            {/* AI PREDICTION CARD */}
            <div className="space-y-8">
              <div className="bg-[#0D1C2F] text-white rounded-2xl p-8 flex flex-col justify-between h-full shadow-xl">
                <div>
                  <p className="text-[#76859B] font-bold text-sm tracking-widest mb-6">
                    TOP AI PREDICTION
                  </p>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="bg-white text-black px-4 py-2 rounded font-bold text-2xl">
                      {data.ticker}
                    </div>
                    <div>
                      <p className="text-xl font-bold">{data.ticker}</p>
                      <p className="text-[#76859B]">{data.ticker === 'AAPL' ? 'Apple Inc.' : data.ticker === 'NVDA' ? 'NVIDIA Corp.' : data.ticker === 'TSLA' ? 'Tesla Inc.' : data.ticker === 'GOOGL' ? 'Alphabet Inc.' : data.ticker === 'MSFT' ? 'Microsoft Corp.' : 'Equity'}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-[#76859B] text-sm mb-2">
                        RMSE (Model Accuracy)
                      </p>
                      <div className="w-full bg-[#3A485C] h-4 rounded-full overflow-hidden">
                        <div className="bg-white h-full w-[92%] rounded-full"></div>
                      </div>
                      <p className="text-right mt-2 font-bold">{data.metrics?.rmse?.toFixed(4) || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[#76859B] text-sm mb-1">
                        Trend
                      </p>
                      <p className={`text-2xl font-bold ${data.trend === 'Bullish' ? 'text-emerald-400' : 'text-rose-400'}`}>{data.trend || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/analytics/${data.ticker}`)}
                  className="w-full bg-white text-black py-4 rounded-lg font-bold mt-8 hover:bg-slate-200 transition-colors"
                >
                  View Analysis
                </button>
              </div>
            </div>
          </div>

          {/* LATEST SIGNALS TABLE */}
          <div className="bg-white border-2 border-[#C6C6CD] rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-[#F2F4F6] p-6 border-b border-[#C6C6CD] flex justify-between items-center">
              <h3 className="font-bold tracking-widest text-[#45464D]">
                7-DAY FORECAST
              </h3>
              <Activity size={20} className="text-[#45464D]" />
            </div>
            {data.forecast && data.forecast.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#C6C6CD]">
                      <th className="text-left p-4 text-[#45464D] font-bold text-sm tracking-widest">DATE</th>
                      <th className="text-right p-4 text-[#45464D] font-bold text-sm tracking-widest">PREDICTED PRICE</th>
                      <th className="text-right p-4 text-[#45464D] font-bold text-sm tracking-widest">CHANGE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.forecast.map((point, i) => {
                      const prevPrice = i === 0 ? data.current_price : data.forecast[i - 1].price;
                      const change = ((point.price - prevPrice) / prevPrice) * 100;
                      return (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="p-4 font-medium">{point.date}</td>
                          <td className="p-4 text-right font-bold">{formatCurrency(point.price)}</td>
                          <td className={`p-4 text-right font-bold ${change >= 0 ? 'text-[#16A34A]' : 'text-rose-500'}`}>
                            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-[#45464D]">
                <Activity size={40} className="mb-4 text-slate-300" />
                <p className="text-lg font-medium">No forecast data available</p>
                <p className="text-sm text-slate-400 mt-2">Search for a ticker to generate predictions.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const NavItem = ({ icon, label, active = false, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors ${active ? "bg-[#131B2E] text-white" : "text-[#45464D] hover:bg-slate-200"}`}
  >
    {icon}
    <span className="font-bold">{label}</span>
  </div>
);

export default Dashboard;
