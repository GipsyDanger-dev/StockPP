import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, User, Calendar, Tag, Share2,
  BookOpen, Loader, AlertCircle, ChevronUp
} from 'lucide-react';
import * as apiService from '../services/apiService';
import MarkdownRenderer from '../components/MarkdownRenderer';

const ArticleDetail = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readProgress, setReadProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const data = await apiService.getArticle(articleId);
        setArticle(data);
      } catch (err) {
        setError('Article not found');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [articleId]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setReadProgress(progress);
      setShowScrollTop(scrollTop > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Market Analysis': 'bg-blue-50 text-blue-700',
      'Model Update': 'bg-green-50 text-green-700',
      'Trading Strategy': 'bg-purple-50 text-purple-700',
      'Tech Deep Dive': 'bg-orange-50 text-orange-700',
      'System Report': 'bg-slate-100 text-slate-700',
    };
    return colors[category] || 'bg-indigo-50 text-indigo-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
          <p className="text-[#45464D] text-lg">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-black mb-2">Article not found</h2>
          <p className="text-[#45464D] mb-6">{error || 'The article you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/insights')}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Insights
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-100">
        <div
          className="h-full bg-indigo-600 transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E6E8EA]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/insights')}
            className="flex items-center gap-2 text-[#45464D] hover:text-black transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Insights</span>
          </button>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-[#F7F9FB] rounded-lg transition-colors">
              <Share2 className="w-5 h-5 text-[#45464D]" />
            </button>
            <button className="p-2 hover:bg-[#F7F9FB] rounded-lg transition-colors">
              <BookOpen className="w-5 h-5 text-[#45464D]" />
            </button>
          </div>
        </div>
      </nav>

      {/* Header Image */}
      {article.header_image && (
        <div className="max-w-5xl mx-auto px-6 pt-8">
          <img
            src={article.header_image}
            alt={article.title}
            className="w-full h-[400px] object-cover rounded-2xl"
          />
        </div>
      )}

      {/* Article Header */}
      <header className="pt-12 pb-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Category Badge */}
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-6 ${getCategoryColor(article.category)}`}>
            {article.category}
          </span>

          {/* Title */}
          <h1 className="text-4xl lg:text-5xl font-bold text-black leading-tight mb-6 tracking-tight">
            {article.title}
          </h1>

          {/* Summary */}
          {article.summary && (
            <p className="text-xl text-[#45464D] leading-relaxed mb-8 font-medium">
              {article.summary}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 pb-8 border-b border-[#E6E8EA]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#191C1E] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {article.author?.charAt(0) || 'A'}
                </span>
              </div>
              <div>
                <p className="text-black font-medium">{article.author || 'Admin'}</p>
                <p className="text-[#45464D] text-sm">{formatDate(article.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[#45464D] text-sm">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {article.read_time || '5 min read'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <article className="px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {article.tags.map((tag, index) => (
                <span key={index} className="flex items-center gap-1 px-3 py-1.5 bg-[#F7F9FB] text-[#45464D] text-sm rounded-full">
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Content Body */}
          <MarkdownRenderer content={article.content} className="prose prose-lg max-w-none" />

          {/* Author Card */}
          <div className="mt-16 pt-8 border-t border-[#E6E8EA]">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#191C1E] rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {article.author?.charAt(0) || 'A'}
                </span>
              </div>
              <div>
                <p className="text-black text-lg font-bold">{article.author || 'Admin'}</p>
                <p className="text-[#45464D]">Precision Analytics Team</p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all z-50"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default ArticleDetail;
