import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, LayoutDashboard, BarChart3, Lightbulb, TrendingUp,
  RefreshCw, CheckCircle, AlertCircle, Loader, FileText, Clock,
  ChevronRight, BookOpen, Tag, X
} from 'lucide-react';
import { useInsights, useArticles } from '../hooks/useApi';

const Insights = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { data: insightsData, isLoading, isError, error } = useInsights(true);
  const { data: articlesData, isLoading: articlesLoading } = useArticles('published', 20, true);

  const featured = insightsData?.featured;
  const insightCards = insightsData?.insights || [];
  const summary = insightsData?.summary;
  const articles = articlesData?.articles || [];

  const categories = useMemo(() => {
    const cats = [...new Set(articles.map(a => a.category).filter(Boolean))];
    return cats;
  }, [articles]);

  const filteredArticles = useMemo(() => {
    if (!selectedCategory) return articles;
    return articles.filter(a => a.category === selectedCategory);
  }, [articles, selectedCategory]);

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

  const getCategoryColor = (category) => {
    const colors = {
      'Market Analysis': 'bg-blue-900/20 text-blue-400 border-blue-800',
      'Model Update': 'bg-green-900/20 text-green-400 border-green-800',
      'Trading Strategy': 'bg-purple-900/20 text-purple-400 border-purple-800',
      'Tech Deep Dive': 'bg-orange-900/20 text-orange-400 border-orange-800',
      'System Report': 'bg-[#111] text-[var(--gray-mid)] border-[var(--dark-border)]',
    };
    return colors[category] || 'bg-indigo-900/20 text-indigo-400 border-indigo-800';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[var(--dark-bg)] text-white">
      <header className="bg-[var(--dark-surface)] px-6 lg:px-12 py-10 border-b border-[var(--dark-border)]">
        <h1 className="text-5xl lg:text-7xl font-bold text-white mb-4 tracking-tighter">Market Insights</h1>
        <p className="text-[var(--gray-mid)] text-xl lg:text-2xl max-w-4xl">
          AI-driven analysis powered by your LSTM models and expert articles from our team.
        </p>

        {summary && (
          <div className="flex flex-wrap gap-4 mt-8">
            <span className="px-4 py-2 bg-indigo-900/20 text-indigo-400 rounded-lg font-bold border border-indigo-800">
              Models: {summary.total_models}
            </span>
            <span className={`px-4 py-2 rounded-lg font-bold border ${
              summary.models_needing_retrain > 0
                ? 'bg-amber-900/20 text-amber-400 border-amber-800'
                : 'bg-emerald-900/20 text-emerald-400 border-emerald-800'
            }`}>
              {summary.models_needing_retrain > 0
                ? `${summary.models_needing_retrain} need retraining`
                : 'All models up to date'}
            </span>
            {summary.avg_rmse > 0 && (
              <span className="px-4 py-2 bg-[#111] text-[var(--gray-mid)] rounded-lg font-bold border border-[var(--dark-border)]">
                Avg RMSE: {summary.avg_rmse}
              </span>
            )}
            {articles.length > 0 && (
              <span className="px-4 py-2 bg-green-900/20 text-green-400 rounded-lg font-bold border border-green-800">
                {articles.length} Article{articles.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </header>

      {isLoading && articlesLoading ? (
        <div className="p-6 lg:p-12 flex flex-col items-center justify-center gap-4">
          <Loader className="animate-spin text-indigo-500" size={40} />
          <p className="text-[var(--gray-mid)] text-lg font-medium">Loading insights...</p>
        </div>
      ) : isError ? (
        <div className="p-6 lg:p-12 max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-12 text-center">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-400 mb-2">Market API is currently down or undergoing maintenance.</h2>
          </div>
        </div>
      ) : (
        <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-12">
          {featured && (
            <div className="bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-xl overflow-hidden">
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
                  <span>&bull;</span>
                  <span>{featured.read_time}</span>
                </div>
              </div>
            </div>
          )}

          {articles.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-6 h-6 text-[var(--gray-mid)]" />
                <h2 className="text-3xl font-bold text-white">Latest Articles</h2>
              </div>

              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      !selectedCategory
                        ? 'bg-[var(--dark-navy)] text-white'
                        : 'bg-[var(--dark-surface)] text-[var(--gray-mid)] border border-[var(--dark-border)] hover:bg-[#222]'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === cat
                          ? 'bg-[var(--dark-navy)] text-white'
                          : 'bg-[var(--dark-surface)] text-[var(--gray-mid)] border border-[var(--dark-border)] hover:bg-[#222]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => navigate(`/insights/${article.id}`)}
                    className="bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-xl overflow-hidden hover:border-indigo-800 transition-all cursor-pointer group"
                  >
                    {(article.thumbnail || article.header_image) && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={article.thumbnail || article.header_image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(selectedCategory === article.category ? null : article.category);
                          }}
                          className={`px-3 py-1 rounded-md font-bold text-xs border cursor-pointer hover:opacity-80 transition-opacity ${getCategoryColor(article.category)}`}
                        >
                          {article.category}
                        </span>
                        <div className="flex items-center gap-1 text-[var(--gray-mid)] text-sm">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{article.read_time || '5 min read'}</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors">{article.title}</h3>
                      <p className="text-[var(--gray-mid)] text-lg leading-relaxed mb-4">
                        {article.summary || article.content?.substring(0, 200) + '...'}
                      </p>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {article.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="flex items-center gap-1 text-xs text-[var(--gray-mid)] bg-[var(--dark-bg)] px-2 py-1 rounded-full">
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--dark-border)]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[var(--dark-navy)] rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {article.author?.charAt(0) || 'A'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{article.author || 'Admin'}</p>
                            <p className="text-[var(--gray-mid)] text-xs">{formatDate(article.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-indigo-400 text-sm font-medium group-hover:gap-2 transition-all">
                          <span>Read more</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insightCards.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-8">
                <Activity className="w-6 h-6 text-[var(--gray-mid)]" />
                <h2 className="text-3xl font-bold text-white">AI Model Insights</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {insightCards.map((card) => (
                  <div key={card.id} className="bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-[var(--dark-bg)] rounded-lg text-[var(--gray-mid)]">
                        {getIcon(card.icon)}
                      </div>
                      <span className="px-3 py-1 bg-indigo-900/20 text-indigo-400 border border-indigo-800 rounded-md font-bold text-xs">
                        {card.category}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{card.title}</h3>
                    <p className="text-[var(--gray-mid)] text-lg leading-relaxed">{card.content}</p>
                    <p className="text-[var(--gray-mid)] text-sm mt-6">{card.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {articles.length === 0 && insightCards.length === 0 && (
            <div className="bg-amber-900/20 border border-amber-800 rounded-xl p-12 text-center">
              <Lightbulb size={48} className="text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-400 mb-2">No insights available yet</h2>
              <p className="text-amber-400 text-lg">Train a model or publish an article to see insights here.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-6 px-8 py-3 bg-[var(--dark-navy)] text-white rounded-lg font-bold hover:bg-[#1a2540] transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          <div className="bg-[var(--dark-navy)] text-white rounded-xl p-10 lg:p-12 flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="max-w-2xl">
              <span className="px-4 py-1 border border-white/20 rounded-md font-bold text-white mb-4 inline-block uppercase text-xs">AI Engine</span>
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">Train More Models</h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                The more models you train, the richer your insights become. Each trained model contributes performance data, market coverage, and trend analysis to your personalized AI dashboard.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-8 px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-slate-200 transition-colors inline-flex items-center gap-3"
              >
                <LayoutDashboard size={24} /> Start Training
              </button>
            </div>
            <div className="w-40 h-40 bg-[#111] rounded-xl flex items-center justify-center border border-[var(--dark-border)]">
              <Activity size={64} className="text-[var(--gray-mid)]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insights;
