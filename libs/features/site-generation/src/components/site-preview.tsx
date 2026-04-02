'use client';

import React, { useState } from 'react';

export interface SitePreviewProps {
  url: string;
  businessName: string;
  className?: string;
}

export function SitePreview({ url, businessName, className }: SitePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(true);

  const widthMap: Record<string, string> = {
    desktop: 'w-full',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]',
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className ?? ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">
          Site Preview &mdash; {businessName}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('desktop')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'desktop'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => setViewMode('tablet')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'tablet'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tablet
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'mobile'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Mobile
          </button>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Open in new tab
        </a>
      </div>

      {/* Preview Area */}
      <div className="flex justify-center bg-slate-100 p-4 min-h-[500px]">
        <div
          className={`${widthMap[viewMode]} max-w-full bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300`}
        >
          {isLoading && (
            <div className="flex items-center justify-center h-[500px] text-slate-400">
              Loading preview...
            </div>
          )}
          <iframe
            src={url}
            title={`Site preview for ${businessName}`}
            className={`w-full h-[500px] border-0 ${isLoading ? 'hidden' : 'block'}`}
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>

      {/* URL bar */}
      <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-500 truncate">{url}</p>
      </div>
    </div>
  );
}
