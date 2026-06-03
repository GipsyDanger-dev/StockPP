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
    <div className="min-h-screen bg-[var(--dark-bg)] text-white">
      <header className="bg-[var(--dark-surface)] px-6 lg:px-12 py-10 border-b border-[var(--dark-border)]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-4 tracking-tighter">
              Reports Management
            </h1>
            <p className="text-[var(--gray-mid)] text-xl lg:text-2xl">
              View, download, and manage your analytical reports.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              disabled={filteredReports.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-lg hover:bg-[#222] transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export CSV</span>
            </button>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-lg hover:bg-[#222] transition-colors disabled:opacity-50"
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
              className="w-full bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-lg py-4 px-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg text-white placeholder-[var(--gray-mid)]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-4 text-[var(--gray-mid)]" size={24} />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex items-center justify-center gap-3 bg-[var(--dark-navy)] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#1a2540] cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Processing">Processing</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard title="TOTAL REPORTS" value={totalReports.toString()} color="text-white" />
          <StatCard title="COMPLETED" value={completedReports.toString()} color="text-emerald-400" />
          <StatCard title="PROCESSING" value={processingReports.toString()} color="text-blue-400" />
        </div>

        <div className="bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-xl overflow-hidden">
          {isFetching && !isLoading && (
            <div className="bg-blue-900/20 border-b border-blue-800 px-4 py-2 flex items-center gap-2">
              <Loader className="w-3 h-3 animate-spin text-blue-400" />
              <span className="text-blue-400 text-xs">Refreshing data...</span>
            </div>
          )}
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <Loader className="animate-spin text-indigo-500" size={40} />
              <p className="text-[var(--gray-mid)]">Loading training reports from Supabase...</p>
            </div>
          ) : isError ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4 bg-red-900/20">
              <AlertCircle className="text-red-400" size={40} />
              <p className="text-red-400 font-bold">Error loading reports</p>
              <p className="text-red-400 text-sm">{error?.message || 'Unable to fetch reports from database'}</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4 bg-amber-900/20">
              <FileText className="text-amber-400" size={40} />
              <p className="text-amber-400 font-bold">No training reports yet</p>
              <p className="text-amber-400 text-sm">Train a model to generate training reports. Reports will automatically appear here.</p>
            </div>
          ) : (
            <>
              <div className="bg-[var(--dark-bg)] grid grid-cols-4 p-6 border-b border-[var(--dark-border)] font-bold text-[var(--gray-mid)] tracking-widest text-sm">
                <div className="col-span-2 md:col-span-1">REPORT NAME</div>
                <div className="hidden md:block">METRICS</div>
                <div className="hidden md:block">STATUS</div>
                <div className="text-right md:text-left">DATE</div>
              </div>

              <div className="divide-y divide-[var(--dark-border)]">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => navigate(`/analytics/${report.ticker}`)}
                    className="grid grid-cols-4 p-6 items-center hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
                  >
                    <div className="col-span-2 md:col-span-1 flex items-center gap-4">
                      <div className="p-3 bg-[var(--dark-bg)] rounded-lg">
                        <FileText size={24} className="text-[var(--gray-mid)]" />
                      </div>
                      <div>
                        <p className="font-bold text-lg leading-tight">
                          {report.report_name}
                        </p>
                        <p className="text-sm text-[var(--gray-mid)]">Ticker: {report.ticker}</p>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <div className="text-xs text-[var(--gray-mid)] space-y-1">
                        <p>RMSE: {report.rmse?.toFixed(4) || 'N/A'}</p>
                        <p>MAE: {report.mae?.toFixed(4) || 'N/A'}</p>
                        <p>R²: {report.r_square?.toFixed(4) || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <span
                        className={`px-4 py-1 rounded-md font-bold text-sm border ${
                          report.status === "Completed"
                            ? "bg-emerald-900/20 text-emerald-400 border-emerald-800"
                            : report.status === "Processing"
                            ? "bg-blue-900/20 text-blue-400 border-blue-800"
                            : "bg-red-900/20 text-red-400 border-red-800"
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <div className="text-right md:text-left text-sm text-[var(--gray-mid)] flex items-center gap-2">
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                      <ChevronRight className="w-4 h-4 text-[var(--dark-border)] group-hover:text-indigo-400 transition-colors hidden md:block" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-[var(--dark-border)] flex items-center bg-[var(--dark-bg)]">
                <p className="text-[var(--gray-mid)]">Showing {filteredReports.length} of {totalReports}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div className="bg-[var(--dark-surface)] border border-[var(--dark-border)] p-8 rounded-xl">
    <p className="text-[var(--gray-mid)] font-bold text-xs tracking-widest mb-4">
      {title}
    </p>
    <p className={`text-6xl font-bold ${color}`}>{value}</p>
  </div>
);

export default Reports;
