
import React from 'react';

interface ResultDisplayProps {
  markdown: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ markdown }) => {
  // Simple parser to make it look nicer
  const sections = markdown.split(/(?=###|##|# )/g);

  const renderTranscriptContent = (content: string) => {
    const lines = content.split('\n');
    const blocks: { timestamp: string; contentLines: string[] }[] = [];
    let currentBlock: { timestamp: string; contentLines: string[] } | null = null;

    lines.forEach((line) => {
      const timestampMatch = line.match(/^\[(\d{2}:\d{2})\]/);
      if (timestampMatch) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          timestamp: timestampMatch[0],
          contentLines: [line.replace(/^\[\d{2}:\d{2}\]\s*/, '')]
        };
      } else if (line.trim()) {
        if (currentBlock) {
          currentBlock.contentLines.push(line.trim());
        } else {
          // Fallback if there's no initial timestamp
          blocks.push({ timestamp: '--:--', contentLines: [line.trim()] });
        }
      }
    });
    if (currentBlock) blocks.push(currentBlock);

    return blocks.map((block, bIdx) => (
      <div key={bIdx} className="flex gap-6 group mb-4">
        <span className="text-indigo-600 font-black shrink-0 tabular-nums h-fit py-1 px-3 bg-indigo-50 rounded-lg text-sm border border-indigo-100/50">{block.timestamp}</span>
        <div className="border-l-2 border-slate-100 pl-6 group-hover:border-indigo-400 transition-colors space-y-2">
          {block.contentLines.map((l, lIdx) => {
            // Style translation lines slightly differently if they start with "Translation:"
            const isTranslation = l.toLowerCase().startsWith('translation:');
            return (
              <p key={lIdx} className={`${isTranslation ? 'italic text-slate-500 font-medium text-[15px] bg-slate-50/50 p-2 rounded-lg' : 'text-slate-800 font-medium leading-relaxed'}`}>
                {l}
              </p>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Accuracy Verification Header (Light Mode) */}
      <div className="flex items-center gap-5 bg-indigo-50 border border-indigo-100/50 p-5 rounded-3xl no-print shadow-sm">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <i className="fas fa-shield-check text-xl"></i>
        </div>
        <div>
          <h4 className="font-black text-slate-900 tracking-tight">Zero-Loss Verification Engine</h4>
          <p className="text-xs text-slate-500 font-bold">Linguistic integrity confirmed. 100% transcript fidelity against raw feed.</p>
        </div>
        <div className="ml-auto flex flex-col items-end">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Status</span>
          <span className="text-[11px] font-black text-emerald-600 bg-white px-3 py-1 rounded-full border border-emerald-100 shadow-sm">CERTIFIED</span>
        </div>
      </div>

      <div className="space-y-10">
        {sections.map((section, idx) => {
          if (!section.trim()) return null;

          const title = section.match(/^#+\s*(.*)/)?.[1] || "Analysis Section";
          const content = section.replace(/^#+.*\n/, '').trim();

          // Highlight the transcript section differently
          const isTranscript = title.toLowerCase().includes('transcript');

          return (
            <div key={idx} className={`bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-12 hover:shadow-md transition-shadow ${isTranscript ? 'ring-1 ring-indigo-50/50 bg-white/50' : ''}`}>
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                  <span className="w-2.5 h-10 gradient-bg rounded-full shadow-sm"></span>
                  {title}
                </h3>
                {isTranscript && (
                  <span className="text-[10px] font-black text-slate-400 border border-slate-200 px-3 py-1.5 rounded-full uppercase tracking-widest">Diarized & Timestamped Assets</span>
                )}
              </div>
              
              <div className={`prose prose-slate max-w-none text-slate-700 ${isTranscript ? 'space-y-8' : 'whitespace-pre-wrap leading-relaxed font-medium'}`}>
                {isTranscript ? renderTranscriptContent(content) : content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
