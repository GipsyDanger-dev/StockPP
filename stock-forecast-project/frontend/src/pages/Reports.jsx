import React, { useState } from "react";
import {
  Search,
  Filter,
  FileText,
  Download,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  LayoutDashboard,
  BarChart3,
  PieChart,
  Lightbulb,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Reports = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const reportsData = [
    {
      id: "RPT-2023-094",
      name: "Q3 Financial Overview",
      date: "Oct 15, 2023",
      status: "Completed",
    },
    {
      id: "RPT-2023-095",
      name: "Market Trend Analysis - APAC",
      date: "Oct 14, 2023",
      status: "Processing",
    },
    {
      id: "RPT-2023-092",
      name: "User Engagement Metrics",
      date: "Oct 12, 2023",
      status: "Completed",
    },
    {
      id: "RPT-2023-091",
      name: "Monthly Revenue Summary",
      date: "Oct 01, 2023",
      status: "Completed",
    },
  ];

  return (
    <div className="flex min-h-screen bg-white text-[#191C1E]">
      {/* --- SIDEBAR (Tetap Konsisten) --- */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#F7F9FB] border-r border-[#C6C6CD] p-6">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white" size={24} />
          </div>
          <span className="font-bold text-xl">PRECISION</span>
        </div>
        <nav className="space-y-2">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            onClick={() => navigate("/")}
          />
          <NavItem icon={<BarChart3 size={20} />} label="Market" />
          <NavItem
            icon={<PieChart size={20} />}
            label="Analytics"
            onClick={() => navigate("/analytics/AAPL")}
          />
          <NavItem
            icon={<FileText size={20} />}
            label="Reports"
            onClick={() => navigate("/reports")}
            active={window.location.pathname === "/reports"}
          />
          <NavItem icon={<Lightbulb size={20} />} label="Insights" />
          <NavItem icon={<FileText size={20} />} label="Reports" active />
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-x-hidden">
        {/* HEADER AREA */}
        <header className="bg-[#F7F9FB] px-6 lg:px-12 py-10 border-b border-[#E0E3E5]">
          <h1 className="text-5xl lg:text-7xl font-bold text-black mb-4">
            Reports Management
          </h1>
          <p className="text-[#45464D] text-xl lg:text-2xl">
            View, download, and manage your analytical reports.
          </p>
        </header>

        <div className="p-6 lg:p-12 max-w-7xl mx-auto">
          {/* SEARCH & FILTER BAR */}
          <div className="flex flex-col md:row gap-4 mb-10">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search reports..."
                className="w-full bg-white border-2 border-[#C6C6CD] rounded-lg py-4 px-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                className="absolute left-4 top-4.5 text-[#45464D]"
                size={24}
              />
            </div>
            <button className="flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-slate-800">
              <Filter size={20} /> Filter
            </button>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard title="TOTAL REPORTS" value="1,492" color="text-black" />
            <StatCard title="COMPLETED" value="1,480" color="text-indigo-600" />
            <StatCard title="PROCESSING" value="12" color="text-[#505F76]" />
          </div>

          {/* REPORTS TABLE */}
          <div className="bg-white border-2 border-[#E0E3E5] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F2F4F6] grid grid-cols-4 p-6 border-b border-[#E0E3E5] font-bold text-[#45464D] tracking-widest text-sm">
              <div className="col-span-2 md:col-span-1">REPORT NAME</div>
              <div className="hidden md:block">DATE</div>
              <div className="hidden md:block">STATUS</div>
              <div className="text-right md:text-left">ACTIONS</div>
            </div>

            <div className="divide-y divide-[#E0E3E5]">
              {reportsData.map((report, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 p-6 items-center hover:bg-slate-50 transition-colors"
                >
                  <div className="col-span-2 md:col-span-1 flex items-center gap-4">
                    <div className="p-3 bg-[#F7F9FB] rounded-lg">
                      <FileText size={24} className="text-[#45464D]" />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-tight">
                        {report.name}
                      </p>
                      <p className="text-sm text-[#45464D]">ID: {report.id}</p>
                    </div>
                  </div>
                  <div className="hidden md:block text-[#191C1E] font-medium">
                    {report.date}
                  </div>
                  <div className="hidden md:block">
                    <span
                      className={`px-4 py-1 rounded-md font-bold text-sm border-2 ${
                        report.status === "Completed"
                          ? "bg-[#F0FDF4] text-emerald-600 border-emerald-200"
                          : "bg-[#F7F9FB] text-[#505F76] border-[#D0E1FB]"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <div className="text-right md:text-left flex justify-end md:justify-start gap-4">
                    <button className="p-2 hover:bg-slate-200 rounded-full text-[#45464D]">
                      <Download size={20} />
                    </button>
                    <button className="p-2 hover:bg-slate-200 rounded-full text-[#45464D]">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* PAGINATION */}
            <div className="p-6 border-t border-[#E0E3E5] flex flex-col md:flex-row justify-between items-center gap-4 bg-[#F7F9FB]">
              <p className="text-[#45464D]">Showing 1 to 4 of 1,492</p>
              <div className="flex items-center gap-2">
                <PaginationBtn icon={<ChevronLeft size={20} />} />
                <PaginationBtn label="1" active />
                <PaginationBtn label="2" />
                <PaginationBtn label="3" />
                <span className="px-2">...</span>
                <PaginationBtn icon={<ChevronRight size={20} />} />
              </div>
            </div>
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
    className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
      active ? "bg-[#131B2E] text-white" : "text-[#45464D] hover:bg-slate-200"
    }`}
  >
    {icon}
    <span className="font-bold">{label}</span>
  </div>
);

const StatCard = ({ title, value, color }) => (
  <div className="bg-white border-2 border-[#E0E3E5] p-8 rounded-xl shadow-sm">
    <p className="text-[#45464D] font-bold text-xs tracking-widest mb-4">
      {title}
    </p>
    <p className={`text-6xl font-bold ${color}`}>{value}</p>
  </div>
);

const PaginationBtn = ({ icon, label, active = false }) => (
  <button
    className={`w-10 h-10 flex items-center justify-center rounded-md border-2 font-bold transition-all ${
      active
        ? "bg-black text-white border-black"
        : "bg-white border-[#E0E3E5] text-[#45464D] hover:bg-slate-100"
    }`}
  >
    {icon || label}
  </button>
);

export default Reports;
