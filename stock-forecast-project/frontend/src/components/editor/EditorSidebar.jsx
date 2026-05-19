import React from 'react';
import {
  Camera, Image, Link2, Folder, Tag, Clock, Loader,
} from 'lucide-react';
import ImageDropzone from './ImageDropzone';

const CATEGORIES = [
  'Market Analysis',
  'Model Update',
  'Trading Strategy',
  'Tech Deep Dive',
  'System Report'
];

const EditorSidebar = ({
  form, setForm, imagePreview, uploadingImage,
  onImageUpload, onRemoveImage,
  headerInputRef, thumbnailInputRef, inlineImageInputRef,
  wordCount, charCount, formatTime
}) => {
  return (
    <div className="lg:col-span-1">
      <div className="sticky top-24 space-y-6">
        <ImageDropzone
          label="Header Image"
          icon={Camera}
          preview={imagePreview.header}
          uploading={uploadingImage === 'header'}
          uploadLabel="Click to upload header image"
          onUpload={(file) => onImageUpload(file, 'header')}
          onRemove={() => onRemoveImage('header')}
          inputRef={headerInputRef}
          aspectRatio="h-32"
        />

        <ImageDropzone
          label="Thumbnail"
          icon={Image}
          preview={imagePreview.thumbnail}
          uploading={uploadingImage === 'thumbnail'}
          uploadLabel="Click to upload thumbnail"
          onUpload={(file) => onImageUpload(file, 'thumbnail')}
          onRemove={() => onRemoveImage('thumbnail')}
          inputRef={thumbnailInputRef}
          aspectRatio="h-24"
        />

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
          <p className="text-xs text-[#45464D] mt-1">Adds image at cursor position</p>
        </div>

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
  );
};

export default EditorSidebar;
