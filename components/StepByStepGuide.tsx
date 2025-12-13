import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Circle } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  completed?: boolean;
}

interface StepByStepGuideProps {
  title: string;
  steps: Step[];
  collapsible?: boolean;
}

export const StepByStepGuide: React.FC<StepByStepGuideProps> = ({
  title,
  steps,
  collapsible = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div
        className={`p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 ${
          collapsible ? 'cursor-pointer' : ''
        }`}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-slate-600 font-medium">
                {completedCount}/{steps.length}
              </span>
            </div>
          </div>
          {collapsible && (
            <button className="ml-4 text-slate-600 hover:text-slate-800 transition-colors">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Steps */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {step.completed ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : (
                  <Circle className="text-slate-300" size={20} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-500">
                    STEP {index + 1}
                  </span>
                  {step.completed && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Completed
                    </span>
                  )}
                </div>
                <h4 className="font-medium text-slate-800 mb-1">{step.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
