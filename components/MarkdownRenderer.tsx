import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n');
  
  const renderLine = (line: string, index: number) => {
    // List items
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return (
        <li key={index} className="ml-4 pl-2 text-[#A5B5AF] mb-2 list-disc marker:text-[#0E9B62] font-clinical text-sm">
          {formatText(line.trim().substring(2))}
        </li>
      );
    }

    // Numbered lists
    if (/^\d+\.\s/.test(line.trim())) {
      return (
        <div key={index} className="flex gap-3 mb-2 font-clinical text-sm text-[#A5B5AF]">
          <span className="text-[#0E9B62] font-bold">{line.trim().split('.')[0]}.</span>
          <span>{formatText(line.trim().replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
    }

    // Empty lines
    if (line.trim() === '') return <div key={index} className="h-3"></div>;

    // Paragraphs
    return <p key={index} className="text-[#A5B5AF] leading-relaxed mb-2 font-clinical text-sm">{formatText(line)}</p>;
  };

  const formatText = (text: string) => {
    // Handle **bold**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-[#E5ECEA]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return <div className="max-w-none">{lines.map((line, i) => renderLine(line, i))}</div>;
};
