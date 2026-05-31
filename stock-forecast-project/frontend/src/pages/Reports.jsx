import React, { useState } from "react";
import {
  Search,
  FileText,
  AlertCircle,
  Loader,
  RefreshCw,
  Download,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReportsHistory } from "../hooks/useApi";

const Reports = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const { data: reportsData, isLoading, isError, error, refetch, isFetching } = useReportsHistory(null, 50, true);
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

  const handleDownloadCSV = () => {
    if (filteredReports.length === 0) return;
    const headers = ['Report Name', 'Ticker', 'RMSE', 'MAE', 'R²', 'Status', 'Date'];
    const rows = filteredReports.map(r => [
      r.report_name,
      r.ticker,
      r.rmse?.toFixed(4) || 'N/A',
      r.mae?.toFixed(4) || 'N/A',
      r.r_square?.toFixed(4) || 'N/A',
      r.status,
      new Date(r.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white text-[var(--light-text)]">
      <header className="bg-[var(--light-surface)] px-6 lg:px-12 py-10 border-b border-[var(--light-border)]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-5xl lg:text-7xl font-bold text-black mb-4">
              Reports Management
            </h1>
            <p className="text-[var(--light-text-secondary)] text-xl lg:text-2xl">
              View, download, and manage your analytical reports.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              disabled={filteredReports.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[var(--light-border-alt)] rounded-lg hover:bg-[var(--light-surface)] transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export CSV</span>
            </button>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[var(--light-border-alt)] rounded-lg hover:bg-[var(--light-surface)] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 lg:p-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search reports by name or ticker..."
              className="w-full bg-white border-2 border-[var(--light-border-alt)] rounded-lg py-4 px-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-4 text-[var(--light-text-secondary)]" size={24} />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard title="TOTAL REPORTS" value={totalReports.toString()} color="text-black" />
          <StatCard title="COMPLETED" value={completedReports.toString()} color="text-emerald-600" />
          <StatCard title="PROCESSING" value={processingReports.toString()} color="text-blue-600" />
        </div>

        <div className="bg-white border-2 border-[var(--light-border)] rounded-xl overflow-hidden shadow-sm">
          {isFetching && !isLoading && (
            <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center gap-2">
              <Loader className="w-3 h-3 animate-spin text-blue-500" />
              <span className="text-blue-600 text-xs">Refreshing data...</span>
            </div>
          )}
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <Loader className="animate-spin text-indigo-600" size={40} />
              <p className="text-[var(--light-text-secondary)]">Loading training reports from Supabase...</p>
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
              <div className="bg-[var(--light-section)] grid grid-cols-4 p-6 border-b border-[var(--light-border)] font-bold text-[var(--light-text-secondary)] tracking-widest text-sm">
                <div className="col-span-2 md:col-span-1">REPORT NAME</div>
                <div className="hidden md:block">METRICS</div>
                <div className="hidden md:block">STATUS</div>
                <div className="text-right md:text-left">DATE</div>
              </div>

              <div className="divide-y divide-[var(--light-border)]">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => navigate(`/analytics/${report.ticker}`)}
                    className="grid grid-cols-4 p-6 items-center hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="col-span-2 md:col-span-1 flex items-center gap-4">
                      <div className="p-3 bg-[var(--light-surface)] rounded-lg">
                        <FileText size={24} className="text-[var(--light-text-secondary)]" />
                      </div>
                      <div>
                        <p className="font-bold text-lg leading-tight">
                          {report.report_name}
                        </p>
                        <p className="text-sm text-[var(--light-text-secondary)]">Ticker: {report.ticker}</p>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <div className="text-xs text-[var(--light-text-secondary)] space-y-1">
                        <p>RMSE: {report.rmse?.toFixed(4) || 'N/A'}</p>
                        <p>MAE: {report.mae?.toFixed(4) || 'N/A'}</p>
                        <p>R²: {report.r_square?.toFixed(4) || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <span
                        className={`px-4 py-1 rounded-md font-bold text-sm border-2 ${
                          report.status === "Completed"
                            ? "bg-[var(--light-section-alt)] text-emerald-600 border-emerald-200"
                            : report.status === "Processing"
                            ? "bg-[#EFF6FF] text-blue-600 border-blue-200"
                            : "bg-[#FEF2F2] text-red-600 border-red-200"
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <div className="text-right md:text-left text-sm text-[var(--light-text-secondary)] flex items-center gap-2">
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                      <ChevronRight className="w-4 h-4 text-[var(--light-border-alt)] group-hover:text-indigo-600 transition-colors hidden md:block" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-[var(--light-border)] flex items-center bg-[var(--light-surface)]">
                <p className="text-[var(--light-text-secondary)]">Showing {filteredReports.length} of {totalReports}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div className="bg-white border-2 border-[var(--light-border)] p-8 rounded-xl shadow-sm">
    <p className="text-[var(--light-text-secondary)] font-bold text-xs tracking-widest mb-4">
      {title}
    </p>
    <p className={`text-6xl font-bold ${color}`}>{value}</p>
  </div>
);

export default Reports;
