import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Save, Eye, Send, Clock, Tag, Folder,
  Bold, Italic, List, Heading2, Quote, Code, Minus,
  Image, Link2, Loader, Check, AlertCircle, X, Upload,
  Camera, Trash2
} from 'lucide-react';
import * as apiService from '../services/apiService';
import MarkdownRenderer from '../components/MarkdownRenderer';

const CATEGORIES = [
  'Market Analysis',
  'Model Update',
  'Trading Strategy',
  'Tech Deep Dive',
  'System Report'
];

const ArticleEditor = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!articleId;

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'Market Analysis',
    summary: '',
    status: 'draft',
    tags: '',
    header_image: '',
    thumbnail: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [showPreview, setShowPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(null); // 'header' | 'thumbnail' | 'inline' | null
  const [imagePreview, setImagePreview] = useState({ header: null, thumbnail: null });

  const headerInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const inlineImageInputRef = useRef(null);

  // Fetch article if editing
  useEffect(() => {
    if (isEditing) {
      const fetchArticle = async () => {
        try {
          setLoading(true);
          const data = await apiService.getArticle(articleId);
          setForm({
            title: data.title || '',
            content: data.content || '',
            category: data.category || 'Market Analysis',
            summary: data.summary || '',
            status: data.status || 'draft',
            tags: data.tags?.join(', ') || '',
            header_image: data.header_image || '',
            thumbnail: data.thumbnail || ''
          });
          setImagePreview({
            header: data.header_image || null,
            thumbnail: data.thumbnail || null
          });
        } catch (err) {
          console.error('Error fetching article:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchArticle();
    }
  }, [articleId, isEditing]);

  // Update word/char count
  useEffect(() => {
    const words = form.content.trim().split(/\s+/).filter(Boolean).length;
    const chars = form.content.length;
    setWordCount(words);
    setCharCount(chars);
  }, [form.content]);

  const handleImageUpload = async (file, imageType) => {
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload JPG, PNG, GIF, or WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    setUploadingImage(imageType);

    try {
      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (imageType === 'header') {
          setImagePreview(prev => ({ ...prev, header: reader.result }));
        } else if (imageType === 'thumbnail') {
          setImagePreview(prev => ({ ...prev, thumbnail: reader.result }));
        }
      };
      reader.readAsDataURL(file);

      // Upload to server
      const result = await apiService.uploadArticleImage(file, articleId, imageType);

      if (imageType === 'header') {
        setForm(prev => ({ ...prev, header_image: result.url }));
      } else if (imageType === 'thumbnail') {
        setForm(prev => ({ ...prev, thumbnail: result.url }));
      } else if (imageType === 'inline') {
        // Insert inline image markdown at cursor position
        const textarea = document.getElementById('content-editor');
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const imageMarkdown = `\n![Image](${result.url})\n`;
          const newContent = form.content.substring(0, start) + imageMarkdown + form.content.substring(end);
          setForm(prev => ({ ...prev, content: newContent }));

          // Restore cursor position after image
          setTimeout(() => {
            textarea.focus();
            const newPos = start + imageMarkdown.length;
            textarea.setSelectionRange(newPos, newPos);
          }, 0);
        }
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleRemoveImage = (imageType) => {
    if (imageType === 'header') {
      setForm(prev => ({ ...prev, header_image: '' }));
      setImagePreview(prev => ({ ...prev, header: null }));
    } else if (imageType === 'thumbnail') {
      setForm(prev => ({ ...prev, thumbnail: '' }));
      setImagePreview(prev => ({ ...prev, thumbnail: null }));
    }
  };

  const handleSave = async (status = null) => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const data = {
        ...form,
        status: status || form.status,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      if (isEditing) {
        await apiService.updateArticle(articleId, data);
      } else {
        const result = await apiService.createArticle(data);
        // Navigate to edit mode for the new article
        if (result?.id) {
          navigate(`/admin/editor/${result.id}`, { replace: true });
        }
      }

      queryClient.invalidateQueries(['articles']);
      queryClient.invalidateQueries(['articleStats']);
      queryClient.invalidateQueries(['insights']);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Error saving article:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = () => handleSave('published');
  const handleSaveDraft = () => handleSave('draft');

  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = document.getElementById('content-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = form.content.substring(start, end);
    const newText = form.content.substring(0, start) + prefix + selectedText + suffix + form.content.substring(end);

    setForm({ ...form, content: newText });

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const formatTime = () => {
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-[#E6E8EA]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 text-[#45464D] hover:text-black transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <div className="h-6 w-px bg-[#E6E8EA]" />
            <span className="text-[#45464D] text-sm">
              {isEditing ? 'Editing Article' : 'New Article'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Save Status */}
            {saveStatus === 'success' && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Check className="w-4 h-4" />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                Error
              </span>
            )}

            {/* Word Count */}
            <span className="text-[#45464D] text-sm">
              {wordCount} words &middot; {formatTime()}
            </span>

            {/* Preview Toggle */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2 rounded-lg transition-colors ${showPreview ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-[#F7F9FB] text-[#45464D]'}`}
            >
              <Eye className="w-5 h-5" />
            </button>

            {/* Save Draft */}
            <button
              onClick={handleSaveDraft}
              disabled={saving || !form.title}
              className="flex items-center gap-2 px-4 py-2 text-[#45464D] hover:bg-[#F7F9FB] rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm">Save Draft</span>
            </button>

            {/* Publish */}
            <button
              onClick={handlePublish}
              disabled={saving || !form.title || !form.content}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="text-sm">Publish</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Editor Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            {showPreview ? (
              /* Preview Mode */
              <div className="prose prose-lg max-w-none">
                {form.header_image && (
                  <img
                    src={form.header_image}
                    alt="Header"
                    className="w-full h-64 object-cover rounded-xl mb-8"
                  />
                )}
                <h1 className="text-4xl font-bold text-black mb-4">{form.title || 'Untitled'}</h1>
                {form.summary && (
                  <p className="text-xl text-[#45464D] mb-8 font-medium">{form.summary}</p>
                )}
                <div className="border-b border-[#E6E8EA] mb-8" />
                <MarkdownRenderer content={form.content} />
              </div>
            ) : (
              /* Edit Mode */
              <div>
                {/* Title */}
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Article title..."
                  className="w-full text-4xl font-bold text-black placeholder-gray-300 outline-none mb-4 border-none"
                />

                {/* Summary */}
                <input
                  type="text"
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Write a brief summary..."
                  className="w-full text-xl text-[#45464D] placeholder-gray-300 outline-none mb-8 border-none"
                />

                {/* Divider */}
                <div className="border-b border-[#E6E8EA] mb-6" />

                {/* Formatting Toolbar */}
                <div className="flex items-center gap-1 mb-4 pb-4 border-b border-[#E6E8EA]">
                  <button
                    onClick={() => insertMarkdown('**', '**')}
                    className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown('*', '*')}
                    className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown('## ')}
                    className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
                    title="Heading"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown('- ')}
                    className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
                    title="List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown('> ')}
                    className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
                    title="Quote"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown('`', '`')}
                    className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
                    title="Code"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                  <div className="h-4 w-px bg-[#E6E8EA] mx-1" />
                  <button
                    onClick={() => inlineImageInputRef.current?.click()}
                    className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
                    title="Insert Image"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown('\n---\n')}
                    className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
                    title="Divider"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>

                {/* Content Textarea */}
                <textarea
                  id="content-editor"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Tell your story..."
                  className="w-full min-h-[60vh] text-lg text-[#191C1E] placeholder-gray-300 outline-none resize-none leading-relaxed border-none"
                />
              </div>
            )}
          </div>

          {/* Sidebar Settings */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Header Image */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#45464D] mb-2">
                  <Camera className="w-4 h-4" />
                  Header Image
                </label>
                <div className="border-2 border-dashed border-[#C6C6CD] rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
                  {imagePreview.header ? (
                    <div className="relative">
                      <img
                        src={imagePreview.header}
                        alt="Header preview"
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                      <button
                        onClick={() => handleRemoveImage('header')}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => headerInputRef.current?.click()}
                      className="cursor-pointer py-4"
                    >
                      {uploadingImage === 'header' ? (
                        <Loader className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-[#C6C6CD] mx-auto mb-2" />
                          <p className="text-xs text-[#45464D]">Click to upload header image</p>
                          <p className="text-[10px] text-[#45464D] mt-1">JPG, PNG, GIF, WebP (max 5MB)</p>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={headerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files[0], 'header')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#45464D] mb-2">
                  <Image className="w-4 h-4" />
                  Thumbnail
                </label>
                <div className="border-2 border-dashed border-[#C6C6CD] rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
                  {imagePreview.thumbnail ? (
                    <div className="relative">
                      <img
                        src={imagePreview.thumbnail}
                        alt="Thumbnail preview"
                        className="w-full h-24 object-cover rounded-lg mb-2"
                      />
                      <button
                        onClick={() => handleRemoveImage('thumbnail')}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="cursor-pointer py-4"
                    >
                      {uploadingImage === 'thumbnail' ? (
                        <Loader className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-[#C6C6CD] mx-auto mb-2" />
                          <p className="text-xs text-[#45464D]">Click to upload thumbnail</p>
                          <p className="text-[10px] text-[#45464D] mt-1">JPG, PNG, GIF, WebP (max 5MB)</p>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files[0], 'thumbnail')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Inline Image Upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#45464D] mb-2">
                  <Link2 className="w-4 h-4" />
                  Insert Image in Content
                </label>
                <button
                  onClick={() => inlineImageInputRef.current?.click()}
                  disabled={uploadingImage === 'inline'}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-[#C6C6CD] rounded-lg hover:bg-[#F7F9FB] transition-colors text-sm text-[#45464D] disabled:opacity-50"
                >
                  {uploadingImage === 'inline' ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Image className="w-4 h-4" />
                      <span>Insert Image</span>
                    </>
                  )}
                </button>
                <input
                  ref={inlineImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleImageUpload(e.target.files[0], 'inline');
                    e.target.value = ''; // Reset input
                  }}
                  className="hidden"
                />
                <p className="text-xs text-[#45464D] mt-1">Adds image at cursor position</p>
              </div>

              {/* Category */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#45464D] mb-2">
                  <Folder className="w-4 h-4" />
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-[#C6C6CD] rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#45464D] mb-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="lstm, stocks, prediction"
                  className="w-full px-3 py-2 border border-[#C6C6CD] rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                />
                <p className="text-xs text-[#45464D] mt-1">Comma separated</p>
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#45464D] mb-2">
                  <Clock className="w-4 h-4" />
                  Status
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm({ ...form, status: 'draft' })}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      form.status === 'draft'
                        ? 'bg-yellow-50 text-yellow-700 border-2 border-yellow-200'
                        : 'bg-[#F7F9FB] text-[#45464D] border-2 border-transparent'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    onClick={() => setForm({ ...form, status: 'published' })}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      form.status === 'published'
                        ? 'bg-green-50 text-green-700 border-2 border-green-200'
                        : 'bg-[#F7F9FB] text-[#45464D] border-2 border-transparent'
                    }`}
                  >
                    Published
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-[#F7F9FB] rounded-lg p-4">
                <h4 className="text-sm font-medium text-[#45464D] mb-3">Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#45464D]">Words</span>
                    <span className="text-black font-medium">{wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#45464D]">Characters</span>
                    <span className="text-black font-medium">{charCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#45464D]">Read time</span>
                    <span className="text-black font-medium">{formatTime()}</span>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-indigo-700 mb-2">Writing Tips</h4>
                <ul className="text-xs text-indigo-600 space-y-1">
                  <li>Use ## for headings</li>
                  <li>Use - for bullet points</li>
                  <li>Use **text** for bold</li>
                  <li>Use *text* for italic</li>
                  <li>Keep paragraphs concise</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
