'use client';

import React from 'react';

export interface GenerationStatusProps {
  status: string;
  repositoryUrl?: string | null;
  vercelUrl?: string | null;
  className?: string;
}

interface PipelineStep {
  key: string;
  label: string;
  description: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    key: 'PENDING',
    label: 'Queued',
    description: 'Job is in the queue waiting to be processed',
  },
  {
    key: 'GENERATING',
    label: 'Generating Code',
    description: 'AI is generating the website code',
  },
  {
    key: 'BUILDING',
    label: 'Building & Deploying',
    description: 'Code pushed to GitHub, Vercel deployment in progress',
  },
  {
    key: 'DEPLOYED',
    label: 'Deployed',
    description: 'Site is live and accessible',
  },
];

function getStepIndex(status: string): number {
  const normalizedStatus = status.toUpperCase();
  if (normalizedStatus === 'FAILED') return -1;
  const idx = PIPELINE_STEPS.findIndex((s) => s.key === normalizedStatus);
  return idx >= 0 ? idx : 0;
}

export function GenerationStatus({
  status,
  repositoryUrl,
  vercelUrl,
  className,
}: GenerationStatusProps) {
  const isFailed = status.toUpperCase() === 'FAILED';
  const currentStepIndex = getStepIndex(status);

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 ${className ?? ''}`}
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-6">
        Generation Pipeline
      </h3>

      {isFailed && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-700">
            Generation failed. You can retry from the prospect detail page.
          </p>
        </div>
      )}

      {/* Pipeline Steps */}
      <div className="space-y-0">
        {PIPELINE_STEPS.map((step, index) => {
          const isComplete = !isFailed && index < currentStepIndex;
          const isCurrent = !isFailed && index === currentStepIndex;
          const isPending = isFailed || index > currentStepIndex;

          let dotColor = 'bg-slate-300';
          let lineColor = 'bg-slate-200';
          let textColor = 'text-slate-400';

          if (isComplete) {
            dotColor = 'bg-green-500';
            lineColor = 'bg-green-300';
            textColor = 'text-slate-700';
          } else if (isCurrent) {
            dotColor = 'bg-blue-500 ring-4 ring-blue-100';
            textColor = 'text-slate-900 font-medium';
          }

          if (isFailed && index === 0) {
            dotColor = 'bg-red-500';
            textColor = 'text-red-700';
          }

          return (
            <div key={step.key} className="flex items-start gap-4">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${dotColor} transition-colors`}
                />
                {index < PIPELINE_STEPS.length - 1 && (
                  <div
                    className={`w-0.5 h-10 ${isComplete ? lineColor : 'bg-slate-200'} transition-colors`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className={`pb-6 ${isPending ? 'opacity-50' : ''}`}>
                <p className={`text-sm ${textColor}`}>{step.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {step.description}
                </p>
                {isCurrent && !isFailed && (
                  <p className="text-xs text-blue-600 mt-1 animate-pulse">
                    In progress...
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Links */}
      {(repositoryUrl || vercelUrl) && (
        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-4">
          {repositoryUrl && (
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              View Repository
            </a>
          )}
          {vercelUrl && (
            <a
              href={vercelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors"
            >
              View Live Site
            </a>
          )}
        </div>
      )}
    </div>
  );
}
