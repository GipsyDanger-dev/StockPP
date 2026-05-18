import React, { useState } from "react";
import {
  Search,
  FileText,
  AlertCircle,
  Loader,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReportsHistory } from "../hooks/useApi";

const Reports = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const { data: reportsData, isLoading, isError, error } = useReportsHistory(null, 50, true);
  const reports = reportsData?.reports || [];

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.report_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.ticker.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "All" || report.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalReports = reports.length;
  const completedReports = reports.filter(r => r.status === "Completed").length;
  const processingReports = reports.filter(r => r.status === "Processing").length;

  return (
    <div className="bg-white text-[#191C1E]">
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
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search reports by name or ticker..."
              className="w-full bg-white border-2 border-[#C6C6CD] rounded-lg py-4 px-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-4 text-[#45464D]" size={24} />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-slate-800 cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Processing">Processing</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard title="TOTAL REPORTS" value={totalReports.toString()} color="text-black" />
          <StatCard title="COMPLETED" value={completedReports.toString()} color="text-emerald-600" />
          <StatCard title="PROCESSING" value={processingReports.toString()} color="text-blue-600" />
        </div>

        {/* REPORTS TABLE */}
        <div className="bg-white border-2 border-[#E0E3E5] rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <Loader className="animate-spin text-indigo-600" size={40} />
              <p className="text-[#45464D]">Loading training reports from Supabase...</p>
            </div>
          ) : isError ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4 bg-red-50">
              <AlertCircle className="text-red-600" size={40} />
              <p className="text-red-600 font-bold">Error loading reports</p>
              <p className="text-red-500 text-sm">{error?.message || 'Unable to fetch reports from database'}</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4 bg-yellow-50">
              <FileText className="text-yellow-700" size={40} />
              <p className="text-yellow-700 font-bold">No training reports yet</p>
              <p className="text-yellow-600 text-sm">Train a model to generate training reports. Reports will automatically appear here.</p>
            </div>
          ) : (
            <>
              <div className="bg-[#F2F4F6] grid grid-cols-4 p-6 border-b border-[#E0E3E5] font-bold text-[#45464D] tracking-widest text-sm">
                <div className="col-span-2 md:col-span-1">REPORT NAME</div>
                <div className="hidden md:block">METRICS</div>
                <div className="hidden md:block">STATUS</div>
                <div className="text-right md:text-left">DATE</div>
              </div>

              <div className="divide-y divide-[#E0E3E5]">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="grid grid-cols-4 p-6 items-center hover:bg-slate-50 transition-colors"
                  >
                    <div className="col-span-2 md:col-span-1 flex items-center gap-4">
                      <div className="p-3 bg-[#F7F9FB] rounded-lg">
                        <FileText size={24} className="text-[#45464D]" />
                      </div>
                      <div>
                        <p className="font-bold text-lg leading-tight">
                          {report.report_name}
                        </p>
                        <p className="text-sm text-[#45464D]">Ticker: {report.ticker}</p>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <div className="text-xs text-[#45464D] space-y-1">
                        <p>RMSE: {report.rmse?.toFixed(4) || 'N/A'}</p>
                        <p>MAE: {report.mae?.toFixed(4) || 'N/A'}</p>
                        <p>R²: {report.r_square?.toFixed(4) || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <span
                        className={`px-4 py-1 rounded-md font-bold text-sm border-2 ${
                          report.status === "Completed"
                            ? "bg-[#F0FDF4] text-emerald-600 border-emerald-200"
                            : report.status === "Processing"
                            ? "bg-[#EFF6FF] text-blue-600 border-blue-200"
                            : "bg-[#FEF2F2] text-red-600 border-red-200"
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <div className="text-right md:text-left text-sm text-[#45464D]">
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-[#E0E3E5] flex items-center bg-[#F7F9FB]">
                <p className="text-[#45464D]">Showing {filteredReports.length} of {totalReports}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div className="bg-white border-2 border-[#E0E3E5] p-8 rounded-xl shadow-sm">
    <p className="text-[#45464D] font-bold text-xs tracking-widest mb-4">
      {title}
    </p>
    <p className={`text-6xl font-bold ${color}`}>{value}</p>
  </div>
);

export default Reports;
