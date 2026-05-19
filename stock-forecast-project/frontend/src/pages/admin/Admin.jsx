import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  Settings,
  Search,
  TrendingUp,
  TrendingDown,
  Zap,
  Server,
  Database,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Send,
  BookOpen,
  Loader,
  Users,
  Shield,
  UserCheck,
  Crown,
  X,
} from 'lucide-react';
import { useModelsStatus, useHealth, useArticles, useArticleStats } from '../../hooks/useApi';
import * as apiService from '../../services/apiService';

const KPICard = ({ title, value, subtitle, trend, icon: Icon, color = 'blue', loading = false }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
    green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-500' }
  };
  const colors = colorMap[color] || colorMap.blue;

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-[#C6C6CD] animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
        <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-40" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-[#C6C6CD]">
      <div className="flex items-start justify-between mb-4">
        <span className="text-[#45464D] text-xs uppercase tracking-wide">{title}</span>
        {Icon && (
          <div className={`${colors.bg} p-2 rounded-lg`}>
            <Icon className={`w-4 h-4 ${colors.icon}`} />
          </div>
        )}
      </div>
      <div className="mb-1">
        <span className="text-3xl font-bold text-black">{value}</span>
      </div>
      {subtitle && (
        <div className="flex items-center gap-1">
          {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
          <span className="text-[#505F76] text-xs">{subtitle}</span>
        </div>
      )}
    </div>
  );
};

const ServiceStatusRow = ({ name, status, latency }) => (
  <div className="flex items-center border-b border-[#E6E8EA] last:border-0">
    <div className="flex-1 py-3 pl-6">
      <span className="text-black text-sm">{name}</span>
    </div>
    <div className="w-28 py-3 pl-6 flex items-center gap-1.5">
      {status === 'online' ? (
        <>
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span className="text-green-700 text-[11px]">ONLINE</span>
        </>
      ) : status === 'warning' ? (
        <>
          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
          <span className="text-yellow-700 text-[11px]">DEGRADED</span>
        </>
      ) : (
        <>
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
          <span className="text-red-700 text-[11px]">OFFLINE</span>
        </>
      )}
    </div>
    <div className="w-24 py-3 pl-6">
      <span className="text-[#45464D] text-sm">{latency}</span>
    </div>
  </div>
);

const Admin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('model-performance');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(null);

  const { data: modelsData, isLoading: modelsLoading, refetch: refetchModels } = useModelsStatus(true);
  const { data: healthData, isLoading: healthLoading } = useHealth(true);
  const { data: articlesData, isLoading: articlesLoading, refetch: refetchArticles } = useArticles(null, 50, true);
  const { data: articleStatsData } = useArticleStats(true);

  const models = modelsData?.models ? Object.values(modelsData.models) : [];
  const totalModels = modelsData?.total_models || 0;
  const modelsNeedingRetrain = modelsData?.models_needing_retrain || 0;

  const avgAccuracy = models.length > 0
    ? (models.reduce((sum, m) => sum + (100 - (m.metrics?.rmse || 0) * 100), 0) / models.length).toFixed(2)
    : '0.00';

  const articles = articlesData?.articles || [];
  const articleStats = articleStatsData?.stats || { total: 0, published: 0, draft: 0 };

  const q = searchQuery.toLowerCase().trim();
  const filteredModels = q
    ? models.filter(m => m.ticker?.toLowerCase().includes(q))
    : models;
  const filteredArticles = q
    ? articles.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q)
      )
    : articles;
  const filteredUsers = q
    ? users.filter(u =>
        u.email?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
      )
    : users;

  const sections = [
    { id: 'model-performance', label: 'Model Performance', icon: BarChart3 },
    { id: 'system-health', label: 'System Health', icon: Server },
    { id: 'articles', label: 'Content Manager', icon: FileText },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'settings', label: 'System Info', icon: Settings },
  ];

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSetRole = async (userId, newRole) => {
    setRoleUpdating(userId);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${API_URL}/users/set-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      const data = await response.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      console.error('Error setting role:', err);
    } finally {
      setRoleUpdating(null);
    }
  };

  useEffect(() => {
    if (activeSection === 'users' && users.length === 0) {
      fetchUsers();
    }
  }, [activeSection]);

  const apiHealthy = healthData?.status === 'API is running';
  const services = [
    { name: 'FastAPI Backend', status: apiHealthy ? 'online' : 'offline', latency: apiHealthy ? 'Connected' : 'Unreachable' },
    { name: 'LSTM Inference Engine', status: totalModels > 0 ? 'online' : 'warning', latency: totalModels > 0 ? `${totalModels} model${totalModels !== 1 ? 's' : ''} loaded` : 'No models' },
    { name: 'Supabase Database', status: apiHealthy ? 'online' : 'unknown', latency: apiHealthy ? 'Connected' : 'Unknown' },
  ];

  const handleDeleteArticle = async (articleId) => {
    setActionLoading(articleId);
    try {
      await apiService.deleteArticle(articleId);
      queryClient.invalidateQueries(['articles']);
      queryClient.invalidateQueries(['articleStats']);
      queryClient.invalidateQueries(['insights']);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting article:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishToggle = async (article) => {
    setActionLoading(article.id);
    try {
      const newStatus = article.status === 'published' ? 'draft' : 'published';
      await apiService.updateArticle(article.id, { status: newStatus });
      queryClient.invalidateQueries(['articles']);
      queryClient.invalidateQueries(['articleStats']);
      queryClient.invalidateQueries(['insights']);
    } catch (err) {
      console.error('Error updating article status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white text-[#191C1E] min-h-screen">
      {/* Header */}
      <header className="bg-[#F7F9FB] px-6 lg:px-12 py-6 border-b border-[#E0E3E5]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-black tracking-tight">Admin Control Panel</h1>
            <p className="text-[#45464D] text-sm mt-1">Manage models, system health, and content.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border border-[#C6C6CD] py-2 px-4 gap-2 rounded-lg">
              <Search className="w-4 h-4 text-[#45464D]" />
              <input
                type="text"
                placeholder={
                  activeSection === 'model-performance' ? 'Filter models...' :
                  activeSection === 'articles' ? 'Filter articles...' :
                  activeSection === 'users' ? 'Filter users...' : 'Search...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-[#45464D] placeholder-[#76777D] outline-none w-40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#76777D] hover:text-[#191C1E] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 mt-6">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => { setActiveSection(section.id); setSearchQuery(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-black text-white'
                    : 'bg-white text-[#45464D] border border-[#C6C6CD] hover:bg-[#F7F9FB]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content Area */}
      <div className="p-6 lg:p-12 max-w-7xl mx-auto">
        {/* MODEL PERFORMANCE SECTION */}
        {activeSection === 'model-performance' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <KPICard
                title="AGGREGATE MODEL ACCURACY"
                value={`${avgAccuracy}%`}
                subtitle={models.length > 0 ? `Based on ${models.length} models` : 'No models trained'}
                trend={models.length > 0 ? 'up' : undefined}
                icon={Zap}
                color="blue"
                loading={modelsLoading}
              />
              <KPICard
                title="ACTIVE MODELS"
                value={totalModels.toString()}
                subtitle={modelsNeedingRetrain > 0 ? `${modelsNeedingRetrain} need retraining` : 'All models healthy'}
                trend={modelsNeedingRetrain > 0 ? 'down' : 'up'}
                icon={Database}
                color="green"
                loading={modelsLoading}
              />
              <KPICard
                title="ARTICLES PUBLISHED"
                value={articleStats.published.toString()}
                subtitle={`${articleStats.draft} drafts pending`}
                icon={BookOpen}
                color="purple"
              />
            </div>

            <div className="bg-white rounded-xl border border-[#C6C6CD]">
              <div className="flex justify-between items-center p-6 border-b border-[#E6E8EA]">
                <div>
                  <h3 className="text-black text-xl font-bold">Model Registry</h3>
                  <p className="text-[#45464D] text-sm mt-1">All trained LSTM models and their performance metrics.</p>
                </div>
                <button
                  onClick={() => refetchModels()}
                  className="flex items-center gap-2 bg-[#F7F9FB] py-2 px-4 rounded-lg border border-[#C6C6CD] hover:bg-[#E6E8EA] transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span className="text-[#191C1E] text-xs">Refresh</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <div className="flex items-center bg-[#F2F4F6] text-[#45464D] text-xs uppercase tracking-wide min-w-[600px]">
                  <div className="flex-1 py-3 pl-6">Ticker</div>
                  <div className="w-28 py-3 pl-6">RMSE</div>
                  <div className="w-28 py-3 pl-6">MAE</div>
                  <div className="w-28 py-3 pl-6">Accuracy</div>
                  <div className="w-32 py-3 pl-6">Age (hours)</div>
                  <div className="w-32 py-3 pl-6">Status</div>
                </div>
                {modelsLoading ? (
                  <div className="py-12 text-center">
                    <Loader className="w-6 h-6 text-[#C6C6CD] mx-auto mb-2 animate-spin" />
                    <p className="text-[#45464D] text-sm">Loading models...</p>
                  </div>
                ) : filteredModels.length > 0 ? (
                  filteredModels.map((model, index) => {
                    const accuracy = (100 - (model.metrics?.rmse || 0) * 100).toFixed(2);
                    const needsRetrain = model.age_hours > 24;
                    return (
                      <div key={index} className="flex items-center border-b border-[#E6E8EA] last:border-0 hover:bg-[#F7F9FB] transition-colors min-w-[600px]">
                        <div className="flex-1 py-4 pl-6">
                          <span className="text-black text-sm font-bold">{model.ticker}</span>
                        </div>
                        <div className="w-28 py-4 pl-6">
                          <span className="text-[#45464D] text-sm">{(model.metrics?.rmse || 0).toFixed(4)}</span>
                        </div>
                        <div className="w-28 py-4 pl-6">
                          <span className="text-[#45464D] text-sm">{(model.metrics?.mae || 0).toFixed(4)}</span>
                        </div>
                        <div className="w-28 py-4 pl-6">
                          <span className={`text-sm font-medium ${parseFloat(accuracy) >= 95 ? 'text-green-600' : parseFloat(accuracy) >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {accuracy}%
                          </span>
                        </div>
                        <div className="w-32 py-4 pl-6">
                          <span className="text-[#45464D] text-sm">{model.age_hours?.toFixed(1) || '-'}</span>
                        </div>
                        <div className="w-32 py-4 pl-6 flex items-center gap-1.5">
                          {needsRetrain ? (
                            <>
                              <AlertCircle className="w-3 h-3 text-yellow-500" />
                              <span className="text-yellow-700 text-[11px]">NEEDS RETRAIN</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span className="text-green-700 text-[11px]">HEALTHY</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center">
                    <Database className="w-12 h-12 text-[#C6C6CD] mx-auto mb-3" />
                    <p className="text-[#45464D] text-sm">No models trained yet</p>
                    <p className="text-[#45464D] text-xs mt-1">Train your first model to see metrics here</p>
                  </div>
                )}
              </div>
              {filteredModels.length > 0 && (
                <div className="flex justify-between items-center bg-[#F2F4F6] py-4 px-4 rounded-b-xl">
                  <span className="text-[#45464D] text-[11px]">
                    Showing {filteredModels.length} of {models.length} model{models.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* SYSTEM HEALTH SECTION */}
        {activeSection === 'system-health' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-[#C6C6CD]">
              <div className="flex justify-between items-center p-6 border-b border-[#E6E8EA]">
                <h3 className="text-black text-xl font-bold">Service Status</h3>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                  apiHealthy ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${apiHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`text-[10px] font-medium ${apiHealthy ? 'text-green-700' : 'text-red-700'}`}>
                    {apiHealthy ? 'ALL SYSTEMS OPERATIONAL' : 'SYSTEM ISSUES DETECTED'}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center bg-[#F2F4F6] text-[#45464D] text-xs uppercase tracking-wide">
                  <div className="flex-1 py-3 pl-6">Service</div>
                  <div className="w-28 py-3 pl-6">Status</div>
                  <div className="w-24 py-3 pl-6">Latency</div>
                </div>
                {services.map((service, index) => (
                  <ServiceStatusRow key={index} {...service} />
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#C6C6CD]">
              <h3 className="text-black text-xl font-bold mb-6">System Activity</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#45464D] text-xs uppercase tracking-wide">TOTAL MODELS</p>
                    <p className="text-[#191C1E] text-2xl font-bold">{totalModels}</p>
                  </div>
                  <div className="bg-[#F7F9FB] px-4 py-2 rounded-lg">
                    <Database className="w-5 h-5 text-[#45464D]" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#45464D] text-xs uppercase tracking-wide">MODELS NEEDING RETRAIN</p>
                    <p className="text-[#191C1E] text-2xl font-bold">{modelsNeedingRetrain}</p>
                  </div>
                  <div className="bg-[#F7F9FB] px-4 py-2 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-[#45464D]" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#45464D] text-xs uppercase tracking-wide">AVG RMSE</p>
                    <p className="text-[#191C1E] text-2xl font-bold">
                      {models.length > 0
                        ? (models.reduce((sum, m) => sum + (m.metrics?.rmse || 0), 0) / models.length).toFixed(4)
                        : '0.0000'
                      }
                    </p>
                  </div>
                  <div className="bg-[#F7F9FB] px-4 py-2 rounded-lg">
                    <Activity className="w-5 h-5 text-[#45464D]" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#45464D] text-xs uppercase tracking-wide">ARTICLES</p>
                    <p className="text-[#191C1E] text-2xl font-bold">{articleStats.total}</p>
                  </div>
                  <div className="bg-[#F7F9FB] px-4 py-2 rounded-lg">
                    <FileText className="w-5 h-5 text-[#45464D]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ARTICLES/CONTENT MANAGER SECTION */}
        {activeSection === 'articles' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <KPICard
                title="TOTAL ARTICLES"
                value={articleStats.total.toString()}
                subtitle="All content"
                icon={FileText}
                color="blue"
              />
              <KPICard
                title="PUBLISHED"
                value={articleStats.published.toString()}
                subtitle="Visible to users"
                icon={Send}
                color="green"
              />
              <KPICard
                title="DRAFTS"
                value={articleStats.draft.toString()}
                subtitle="Pending review"
                icon={Edit2}
                color="orange"
              />
            </div>

            <div className="bg-white rounded-xl border border-[#C6C6CD]">
              <div className="flex justify-between items-center p-6 border-b border-[#E6E8EA]">
                <div>
                  <h3 className="text-black text-xl font-bold">Articles & Insights</h3>
                  <p className="text-[#45464D] text-sm mt-1">Manage content that appears in the Insights page.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => refetchArticles()}
                    className="flex items-center gap-2 bg-[#F7F9FB] py-2 px-4 rounded-lg border border-[#C6C6CD] hover:bg-[#E6E8EA] transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span className="text-[#191C1E] text-xs">Refresh</span>
                  </button>
                  <button
                    onClick={() => navigate('/admin/editor')}
                    className="flex items-center gap-2 bg-black py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="w-3 h-3 text-white" />
                    <span className="text-white text-xs">New Article</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="flex items-center bg-[#F2F4F6] text-[#45464D] text-xs uppercase tracking-wide min-w-[700px]">
                  <div className="flex-1 py-3 pl-6">Title</div>
                  <div className="w-32 py-3 pl-6">Category</div>
                  <div className="w-24 py-3 pl-6">Status</div>
                  <div className="w-32 py-3 pl-6">Date</div>
                  <div className="w-32 py-3 pl-6">Actions</div>
                </div>
                {articlesLoading ? (
                  <div className="py-12 text-center">
                    <Loader className="w-6 h-6 text-[#C6C6CD] mx-auto mb-2 animate-spin" />
                    <p className="text-[#45464D] text-sm">Loading articles...</p>
                  </div>
                ) : filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => (
                    <div key={article.id} className="flex items-center border-b border-[#E6E8EA] last:border-0 hover:bg-[#F7F9FB] transition-colors min-w-[700px]">
                      <div className="flex-1 py-4 pl-6 pr-4">
                        <p className="text-black text-sm font-medium truncate">{article.title}</p>
                        <p className="text-[#45464D] text-xs truncate mt-0.5">{article.summary || 'No summary'}</p>
                      </div>
                      <div className="w-32 py-4 pl-6">
                        <span className="text-[#45464D] text-xs">{article.category}</span>
                      </div>
                      <div className="w-24 py-4 pl-6">
                        {article.status === 'published' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[11px] rounded-full border border-green-200">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[11px] rounded-full border border-yellow-200">
                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="w-32 py-4 pl-6">
                        <span className="text-[#45464D] text-xs">{formatDate(article.created_at)}</span>
                      </div>
                      <div className="w-32 py-4 pl-6 flex items-center gap-1">
                        <button
                          onClick={() => handlePublishToggle(article)}
                          disabled={actionLoading === article.id}
                          className="p-1.5 hover:bg-[#E6E8EA] rounded transition-colors"
                          title={article.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {article.status === 'published' ? (
                            <Eye className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-[#45464D]" />
                          )}
                        </button>
                        <button
                          onClick={() => navigate(`/admin/editor/${article.id}`)}
                          className="p-1.5 hover:bg-[#E6E8EA] rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#45464D]" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(article.id)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <FileText className="w-12 h-12 text-[#C6C6CD] mx-auto mb-3" />
                    <p className="text-[#45464D] text-sm">No articles yet</p>
                    <p className="text-[#45464D] text-xs mt-1">Create your first article to see it in Insights</p>
                    <button
                      onClick={() => navigate('/admin/editor')}
                      className="mt-4 inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Create Article</span>
                    </button>
                  </div>
                )}
              </div>
              {filteredArticles.length > 0 && (
                <div className="flex justify-between items-center bg-[#F2F4F6] py-4 px-4 rounded-b-xl">
                  <span className="text-[#45464D] text-[11px]">
                    Showing {filteredArticles.length} of {articles.length} article{articles.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* USER MANAGEMENT SECTION */}
        {activeSection === 'users' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <KPICard
                title="TOTAL USERS"
                value={users.length.toString()}
                subtitle="Registered accounts"
                icon={Users}
                color="blue"
                loading={usersLoading}
              />
              <KPICard
                title="ADMINISTRATORS"
                value={users.filter(u => u.role === 'admin').length.toString()}
                subtitle="With full access"
                icon={Crown}
                color="purple"
                loading={usersLoading}
              />
              <KPICard
                title="REGULAR USERS"
                value={users.filter(u => u.role !== 'admin').length.toString()}
                subtitle="Standard access"
                icon={UserCheck}
                color="green"
                loading={usersLoading}
              />
            </div>

            <div className="bg-white rounded-xl border border-[#C6C6CD]">
              <div className="flex justify-between items-center p-6 border-b border-[#E6E8EA]">
                <div>
                  <h3 className="text-black text-xl font-bold">User Directory</h3>
                  <p className="text-[#45464D] text-sm mt-1">Manage user roles and access permissions.</p>
                </div>
                <button
                  onClick={fetchUsers}
                  className="flex items-center gap-2 bg-[#F7F9FB] py-2 px-4 rounded-lg border border-[#C6C6CD] hover:bg-[#E6E8EA] transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span className="text-[#191C1E] text-xs">Refresh</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <div className="flex items-center bg-[#F2F4F6] text-[#45464D] text-xs uppercase tracking-wide min-w-[600px]">
                  <div className="flex-1 py-3 pl-6">User</div>
                  <div className="w-40 py-3 pl-6">Email</div>
                  <div className="w-28 py-3 pl-6">Role</div>
                  <div className="w-40 py-3 pl-6">Joined</div>
                  <div className="w-32 py-3 pl-6">Actions</div>
                </div>
                {usersLoading ? (
                  <div className="py-12 text-center">
                    <Loader className="w-6 h-6 text-[#C6C6CD] mx-auto mb-2 animate-spin" />
                    <p className="text-[#45464D] text-sm">Loading users...</p>
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <div key={u.id} className="flex items-center border-b border-[#E6E8EA] last:border-0 hover:bg-[#F7F9FB] transition-colors min-w-[600px]">
                      <div className="flex-1 py-4 pl-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#131B2E] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            {(u.full_name || u.email || '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="text-black text-sm font-medium truncate">
                          {u.full_name || 'No name'}
                        </span>
                      </div>
                      <div className="w-40 py-4 pl-6">
                        <span className="text-[#45464D] text-xs truncate block">{u.email}</span>
                      </div>
                      <div className="w-28 py-4 pl-6">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] rounded-full border border-indigo-200">
                            <Shield size={10} />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-600 text-[11px] rounded-full border border-gray-200">
                            User
                          </span>
                        )}
                      </div>
                      <div className="w-40 py-4 pl-6">
                        <span className="text-[#45464D] text-xs">{formatDate(u.created_at)}</span>
                      </div>
                      <div className="w-32 py-4 pl-6">
                        {u.role === 'admin' ? (
                          <button
                            onClick={() => handleSetRole(u.id, 'user')}
                            disabled={roleUpdating === u.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50"
                          >
                            {roleUpdating === u.id ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserCheck size={12} />
                            )}
                            Demote
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSetRole(u.id, 'admin')}
                            disabled={roleUpdating === u.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                          >
                            {roleUpdating === u.id ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <Crown size={12} />
                            )}
                            Promote
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <Users className="w-12 h-12 text-[#C6C6CD] mx-auto mb-3" />
                    <p className="text-[#45464D] text-sm">No users found</p>
                  </div>
                )}
              </div>
              {filteredUsers.length > 0 && (
                <div className="flex justify-between items-center bg-[#F2F4F6] py-4 px-4 rounded-b-xl">
                  <span className="text-[#45464D] text-[11px]">
                    Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* SETTINGS SECTION */}
        {activeSection === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-[#C6C6CD]">
              <h3 className="text-black text-xl font-bold mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-[#E6E8EA]">
                  <div>
                    <p className="text-black text-sm font-medium">API Status</p>
                    <p className="text-[#45464D] text-xs">Backend health check</p>
                  </div>
                  <span className={`text-sm font-medium ${apiHealthy ? 'text-green-600' : 'text-red-600'}`}>
                    {healthData?.status || 'Checking...'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-[#E6E8EA]">
                  <div>
                    <p className="text-black text-sm font-medium">API Version</p>
                    <p className="text-[#45464D] text-xs">Backend version</p>
                  </div>
                  <span className="text-[#45464D] text-sm">{healthData?.version || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-[#E6E8EA]">
                  <div>
                    <p className="text-black text-sm font-medium">Total Models</p>
                    <p className="text-[#45464D] text-xs">Trained LSTM models</p>
                  </div>
                  <span className="text-[#45464D] text-sm">{totalModels}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-[#E6E8EA]">
                  <div>
                    <p className="text-black text-sm font-medium">Models Needing Retrain</p>
                    <p className="text-[#45464D] text-xs">Older than 24 hours</p>
                  </div>
                  <span className={`text-sm font-medium ${modelsNeedingRetrain > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {modelsNeedingRetrain}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-black text-sm font-medium">Published Articles</p>
                    <p className="text-[#45464D] text-xs">Visible in Insights</p>
                  </div>
                  <span className="text-[#45464D] text-sm">{articleStats.published}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#C6C6CD]">
              <h3 className="text-black text-xl font-bold mb-4">Model Details</h3>
              {models.length > 0 ? (
                <div className="space-y-4">
                  {models.map((model, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-[#E6E8EA] last:border-0">
                      <div>
                        <p className="text-black text-sm font-bold">{model.ticker}</p>
                        <p className="text-[#45464D] text-xs">RMSE: {(model.metrics?.rmse || 0).toFixed(4)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#45464D] text-sm">{model.age_hours?.toFixed(1) || '-'}h old</p>
                        <p className={`text-xs ${model.age_hours > 24 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {model.age_hours > 24 ? 'Needs retrain' : 'Healthy'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Database className="w-8 h-8 text-[#C6C6CD] mx-auto mb-2" />
                  <p className="text-[#45464D] text-sm">No models loaded</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Delete Article</h3>
            <p className="text-[#45464D] text-sm mb-6">Are you sure you want to delete this article? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-[#45464D] hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteArticle(deleteConfirm)}
                disabled={actionLoading === deleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === deleteConfirm ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
