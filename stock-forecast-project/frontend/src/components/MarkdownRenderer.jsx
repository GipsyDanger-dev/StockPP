import React from 'react';

const parseInlineMarkdown = (text) => {
  if (!text) return [text];

  const elements = [];
  let remaining = text;
  let key = 0;

  const patterns = [
    { regex: /!\[(.*?)\]\((.*?)\)/, type: 'image' },
    { regex: /\[(.*?)\]\((.*?)\)/, type: 'link' },
    { regex: /\*{3}(.+?)\*{3}/, type: 'bolditalic' },
    { regex: /\*{2}(.+?)\*{2}/, type: 'bold' },
    { regex: /\*(.+?)\*/, type: 'italic' },
    { regex: /`(.+?)`/, type: 'code' },
  ];

  while (remaining.length > 0) {
    let earliestMatch = null;
    let earliestIndex = Infinity;
    let matchedPattern = null;

    for (const pattern of patterns) {
      const match = remaining.match(pattern.regex);
      if (match && match.index < earliestIndex) {
        earliestMatch = match;
        earliestIndex = match.index;
        matchedPattern = pattern;
      }
    }

    if (!earliestMatch) {
      if (remaining) elements.push(remaining);
      break;
    }

    if (earliestIndex > 0) {
      elements.push(remaining.substring(0, earliestIndex));
    }

    const content = earliestMatch[1];
    const url = earliestMatch[2];

    switch (matchedPattern.type) {
      case 'image':
        elements.push(
          <img key={key++} src={url} alt={content || 'Image'} className="max-w-full rounded-lg my-2" />
        );
        break;
      case 'link':
        elements.push(
          <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
            {content}
          </a>
        );
        break;
      case 'bolditalic':
        elements.push(
          <strong key={key++}><em>{content}</em></strong>
        );
        break;
      case 'bold':
        elements.push(
          <strong key={key++}>{content}</strong>
        );
        break;
      case 'italic':
        elements.push(
          <em key={key++}>{content}</em>
        );
        break;
      case 'code':
        elements.push(
          <code key={key++} className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-red-600">
            {content}
          </code>
        );
        break;
    }

    remaining = remaining.substring(earliestIndex + earliestMatch[0].length);
  }

  return elements;
};

const renderLine = (line, index) => {
  const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
  if (imageMatch) {
    return (
      <img
        key={index}
        src={imageMatch[2]}
        alt={imageMatch[1] || 'Article image'}
        className="w-full rounded-xl my-6 shadow-sm"
        loading="lazy"
      />
    );
  }

  if (line.startsWith('### ')) {
    return (
      <h3 key={index} className="text-xl font-bold text-black mt-8 mb-3">
        {parseInlineMarkdown(line.replace('### ', ''))}
      </h3>
    );
  }
  if (line.startsWith('## ')) {
    return (
      <h2 key={index} className="text-2xl font-bold text-black mt-10 mb-4">
        {parseInlineMarkdown(line.replace('## ', ''))}
      </h2>
    );
  }

  if (line.startsWith('> ')) {
    return (
      <blockquote key={index} className="border-l-4 border-indigo-300 pl-4 py-2 my-4 bg-indigo-50 text-[#191C1E] text-lg italic">
        {parseInlineMarkdown(line.replace('> ', ''))}
      </blockquote>
    );
  }

  if (line.startsWith('- ')) {
    return (
      <li key={index} className="text-[#191C1E] text-lg leading-relaxed ml-6 mb-2 list-disc">
        {parseInlineMarkdown(line.replace('- ', ''))}
      </li>
    );
  }

  const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
  if (numberedMatch) {
    return (
      <li key={index} className="text-[#191C1E] text-lg leading-relaxed ml-6 mb-2 list-decimal">
        {parseInlineMarkdown(numberedMatch[2])}
      </li>
    );
  }

  if (line.match(/^[-*_]{3,}$/)) {
    return <hr key={index} className="my-8 border-t border-[#E6E8EA]" />;
  }

  if (line.startsWith('**') && line.endsWith('**')) {
    return (
      <p key={index} className="text-[#191C1E] text-lg leading-relaxed mb-4 font-bold">
        {parseInlineMarkdown(line.replace(/\*\*/g, ''))}
      </p>
    );
  }

  if (line.trim() === '') {
    return <div key={index} className="h-3" />;
  }

  return (
    <p key={index} className="text-[#191C1E] text-lg leading-relaxed mb-4">
      {parseInlineMarkdown(line)}
    </p>
  );
};

const MarkdownRenderer = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className={className}>
      {lines.map((line, index) => renderLine(line, index))}
    </div>
  );
};

export default MarkdownRenderer;
