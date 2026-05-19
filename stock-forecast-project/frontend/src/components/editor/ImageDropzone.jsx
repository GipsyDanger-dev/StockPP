import React from 'react';
import { Upload, Loader, X } from 'lucide-react';

const ImageDropzone = ({ label, icon: Icon, preview, uploading, uploadLabel, onUpload, onRemove, inputRef, aspectRatio = 'h-32' }) => {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-[#45464D] mb-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>
      <div className="border-2 border-dashed border-[#C6C6CD] rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt={`${label} preview`}
              className={`w-full ${aspectRatio} object-cover rounded-lg mb-2`}
            />
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer py-4"
          >
            {uploading ? (
              <Loader className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-[#C6C6CD] mx-auto mb-2" />
                <p className="text-xs text-[#45464D]">{uploadLabel}</p>
                <p className="text-[10px] text-[#45464D] mt-1">JPG, PNG, GIF, WebP (max 5MB)</p>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => onUpload(e.target.files[0])}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageDropzone;
