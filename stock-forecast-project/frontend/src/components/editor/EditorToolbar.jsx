import React from 'react';
import {
  Bold, Italic, List, Heading2, Quote, Code, Minus, Image,
} from 'lucide-react';

const EditorToolbar = ({ onInsertMarkdown, onInlineImage, uploadingImage, inlineImageInputRef }) => {
  return (
    <div className="flex items-center gap-1 mb-4 pb-4 border-b border-[#E6E8EA]">
      <button
        onClick={() => onInsertMarkdown('**', '**')}
        className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => onInsertMarkdown('*', '*')}
        className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => onInsertMarkdown('## ')}
        className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
        title="Heading"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => onInsertMarkdown('- ')}
        className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
        title="List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onInsertMarkdown('> ')}
        className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        onClick={() => onInsertMarkdown('`', '`')}
        className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
        title="Code"
      >
        <Code className="w-4 h-4" />
      </button>
      <div className="h-4 w-px bg-[#E6E8EA] mx-1" />
      <button
        onClick={onInlineImage}
        disabled={uploadingImage === 'inline'}
        className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
        title="Insert Image"
      >
        <Image className="w-4 h-4" />
      </button>
      <button
        onClick={() => onInsertMarkdown('\n---\n')}
        className="p-2 hover:bg-[#F7F9FB] rounded transition-colors text-[#45464D]"
        title="Divider"
      >
        <Minus className="w-4 h-4" />
      </button>
      <input
        ref={inlineImageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          onInlineImage(e.target.files[0]);
          e.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );
};

export default EditorToolbar;
