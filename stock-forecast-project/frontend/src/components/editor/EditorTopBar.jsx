import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Eye, Send, Check, AlertCircle, Loader,
} from 'lucide-react';

const EditorTopBar = ({ isEditing, saveStatus, wordCount, formatTime, showPreview, setShowPreview, onSaveDraft, onPublish, saving, form }) => {
  const navigate = useNavigate();

  return (
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

          <span className="text-[#45464D] text-sm">
            {wordCount} words &middot; {formatTime()}
          </span>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded-lg transition-colors ${showPreview ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-[#F7F9FB] text-[#45464D]'}`}
          >
            <Eye className="w-5 h-5" />
          </button>

          <button
            onClick={onSaveDraft}
            disabled={saving || !form.title}
            className="flex items-center gap-2 px-4 py-2 text-[#45464D] hover:bg-[#F7F9FB] rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span className="text-sm">Save Draft</span>
          </button>

          <button
            onClick={onPublish}
            disabled={saving || !form.title || !form.content}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="text-sm">Publish</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default EditorTopBar;
