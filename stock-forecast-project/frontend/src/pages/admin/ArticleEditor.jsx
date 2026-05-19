import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import * as apiService from '../../services/apiService';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import EditorTopBar from '../../components/editor/EditorTopBar';
import EditorToolbar from '../../components/editor/EditorToolbar';
import EditorSidebar from '../../components/editor/EditorSidebar';

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
  const [saveStatus, setSaveStatus] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [imagePreview, setImagePreview] = useState({ header: null, thumbnail: null });

  const headerInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const inlineImageInputRef = useRef(null);

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

  useEffect(() => {
    const words = form.content.trim().split(/\s+/).filter(Boolean).length;
    const chars = form.content.length;
    setWordCount(words);
    setCharCount(chars);
  }, [form.content]);

  const handleImageUpload = async (file, imageType) => {
    if (!file) return;

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
      const reader = new FileReader();
      reader.onloadend = () => {
        if (imageType === 'header') {
          setImagePreview(prev => ({ ...prev, header: reader.result }));
        } else if (imageType === 'thumbnail') {
          setImagePreview(prev => ({ ...prev, thumbnail: reader.result }));
        }
      };
      reader.readAsDataURL(file);

      const result = await apiService.uploadArticleImage(file, articleId, imageType);

      if (imageType === 'header') {
        setForm(prev => ({ ...prev, header_image: result.url }));
      } else if (imageType === 'thumbnail') {
        setForm(prev => ({ ...prev, thumbnail: result.url }));
      } else if (imageType === 'inline') {
        const textarea = document.getElementById('content-editor');
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const imageMarkdown = `\n![Image](${result.url})\n`;
          const newContent = form.content.substring(0, start) + imageMarkdown + form.content.substring(end);
          setForm(prev => ({ ...prev, content: newContent }));

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

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const handleInlineImage = (file) => {
    if (file) {
      handleImageUpload(file, 'inline');
    } else {
      inlineImageInputRef.current?.click();
    }
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
      <EditorTopBar
        isEditing={isEditing}
        saveStatus={saveStatus}
        wordCount={wordCount}
        formatTime={formatTime}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        saving={saving}
        form={form}
      />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {showPreview ? (
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
              <div>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Article title..."
                  className="w-full text-4xl font-bold text-black placeholder-gray-300 outline-none mb-4 border-none"
                />

                <input
                  type="text"
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Write a brief summary..."
                  className="w-full text-xl text-[#45464D] placeholder-gray-300 outline-none mb-8 border-none"
                />

                <div className="border-b border-[#E6E8EA] mb-6" />

                <EditorToolbar
                  onInsertMarkdown={insertMarkdown}
                  onInlineImage={handleInlineImage}
                  uploadingImage={uploadingImage}
                  inlineImageInputRef={inlineImageInputRef}
                />

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

          <EditorSidebar
            form={form}
            setForm={setForm}
            imagePreview={imagePreview}
            uploadingImage={uploadingImage}
            onImageUpload={handleImageUpload}
            onRemoveImage={handleRemoveImage}
            headerInputRef={headerInputRef}
            thumbnailInputRef={thumbnailInputRef}
            inlineImageInputRef={inlineImageInputRef}
            wordCount={wordCount}
            charCount={charCount}
            formatTime={formatTime}
          />
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
