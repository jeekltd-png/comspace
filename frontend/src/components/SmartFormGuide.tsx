'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiHelpCircle, FiX, FiChevronRight, FiCheck, FiAlertTriangle, FiInfo, FiZap } from 'react-icons/fi';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FormGuideStep {
  /** Unique field/section identifier */
  id: string;
  /** Field label displayed to user */
  label: string;
  /** Short guidance text */
  hint: string;
  /** Detailed explanation shown on expand */
  details?: string;
  /** Example value */
  example?: string;
  /** Validation tips or common mistakes */
  tips?: string[];
  /** Whether this field is required */
  required?: boolean;
  /** Group/section this field belongs to */
  section?: string;
}

export interface SmartFormGuideProps {
  /** Title of the form being filled */
  formTitle: string;
  /** Ordered list of field guides */
  steps: FormGuideStep[];
  /** Currently active/focused field ID */
  activeFieldId?: string;
  /** Callback when user clicks a field guide (to focus the field) */
  onFieldClick?: (fieldId: string) => void;
  /** Map of field IDs to their completion status */
  completionMap?: Record<string, boolean>;
  /** Map of field IDs to their error messages */
  errorMap?: Record<string, string>;
  /** Whether to show the panel collapsed initially */
  defaultCollapsed?: boolean;
  /** Position of the guide panel */
  position?: 'right' | 'bottom' | 'floating';
}

// ─── Smart Form Guide Panel ────────────────────────────────────────────────

export function SmartFormGuide({
  formTitle,
  steps,
  activeFieldId,
  onFieldClick,
  completionMap = {},
  errorMap = {},
  defaultCollapsed = false,
  position = 'right',
}: SmartFormGuideProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const completedCount = steps.filter(s => completionMap[s.id]).length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
  const errorCount = Object.values(errorMap).filter(Boolean).length;

  // Auto-scroll to active field in guide
  useEffect(() => {
    if (activeFieldId && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeFieldId]);

  // Auto-expand active field's guide
  useEffect(() => {
    if (activeFieldId) {
      setExpandedStep(activeFieldId);
    }
  }, [activeFieldId]);

  // Suggest next incomplete field
  const nextIncomplete = steps.find(s => !completionMap[s.id] && s.required);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-brand-600 text-white p-3 rounded-full shadow-lg hover:bg-brand-700 transition-all hover:scale-105 group"
        title="Open Form Guide"
      >
        <FiHelpCircle className="w-6 h-6" />
        {errorCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {errorCount}
          </span>
        )}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Form Guide ({progress}% complete)
        </span>
      </button>
    );
  }

  const positionClasses = {
    right: 'fixed top-20 right-4 bottom-4 w-80 z-40',
    bottom: 'fixed bottom-0 left-0 right-0 max-h-[50vh] z-40',
    floating: 'fixed bottom-6 right-6 w-96 max-h-[70vh] z-50',
  };

  return (
    <div className={`${positionClasses[position]} bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl shadow-xl flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-surface-800 bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FiZap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Form Guide</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-200/50 dark:hover:bg-surface-700 transition-colors"
          >
            <FiX className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{formTitle}</p>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{progress}%</span>
        </div>

        {/* Status summary */}
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <FiCheck className="w-3 h-3" /> {completedCount}/{steps.length}
          </span>
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <FiAlertTriangle className="w-3 h-3" /> {errorCount} {errorCount === 1 ? 'issue' : 'issues'}
            </span>
          )}
        </div>
      </div>

      {/* Smart suggestion */}
      {nextIncomplete && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20">
          <button
            onClick={() => onFieldClick?.(nextIncomplete.id)}
            className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 hover:underline w-full"
          >
            <FiChevronRight className="w-3 h-3 shrink-0" />
            <span>Next: Fill in <strong>{nextIncomplete.label}</strong></span>
          </button>
        </div>
      )}

      {/* Steps list */}
      <div className="flex-1 overflow-y-auto p-2">
        {groupBySection(steps).map(([section, sectionSteps]) => (
          <div key={section || 'default'} className="mb-2">
            {section && (
              <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold px-2 py-1">
                {section}
              </p>
            )}
            {sectionSteps.map((step) => (
              <StepGuideItem
                key={step.id}
                step={step}
                isActive={activeFieldId === step.id}
                isCompleted={!!completionMap[step.id]}
                error={errorMap[step.id]}
                isExpanded={expandedStep === step.id}
                onToggle={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                onClick={() => onFieldClick?.(step.id)}
                ref={activeFieldId === step.id ? activeRef : undefined}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step Guide Item ────────────────────────────────────────────────────────

interface StepGuideItemProps {
  step: FormGuideStep;
  isActive: boolean;
  isCompleted: boolean;
  error?: string;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
}

const StepGuideItem = React.forwardRef<HTMLDivElement, StepGuideItemProps>(
  ({ step, isActive, isCompleted, error, isExpanded, onToggle, onClick }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl mb-1 transition-all ${
          isActive
            ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800'
            : error
            ? 'bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30'
            : 'border border-transparent hover:bg-gray-50 dark:hover:bg-surface-800'
        }`}
      >
        <button
          onClick={() => { onClick(); onToggle(); }}
          className="w-full p-2.5 flex items-start gap-2 text-left"
        >
          {/* Status icon */}
          <span className="mt-0.5 shrink-0">
            {isCompleted ? (
              <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <FiCheck className="w-3 h-3 text-green-600 dark:text-green-400" />
              </span>
            ) : error ? (
              <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FiAlertTriangle className="w-3 h-3 text-red-500" />
              </span>
            ) : (
              <span className={`w-5 h-5 rounded-full border-2 ${isActive ? 'border-brand-500' : 'border-gray-300 dark:border-gray-600'}`} />
            )}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${
                isCompleted
                  ? 'text-green-700 dark:text-green-400 line-through'
                  : 'text-gray-800 dark:text-gray-200'
              }`}>
                {step.label}
              </span>
              {step.required && !isCompleted && (
                <span className="text-red-400 text-xs">*</span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.hint}</p>
            {error && (
              <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>
            )}
          </div>

          <FiChevronRight className={`w-3 h-3 text-gray-400 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>

        {/* Expanded details */}
        {isExpanded && (
          <div className="px-10 pb-3 space-y-2">
            {step.details && (
              <div className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
                <FiInfo className="w-3 h-3 mt-0.5 shrink-0 text-blue-500" />
                <p>{step.details}</p>
              </div>
            )}
            {step.example && (
              <div className="bg-gray-100 dark:bg-surface-800 rounded-lg px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Example</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 font-mono">{step.example}</p>
              </div>
            )}
            {step.tips && step.tips.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">Tips</p>
                {step.tips.map((tip, i) => (
                  <p key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
                    <span className="text-brand-500 shrink-0">•</span> {tip}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);
StepGuideItem.displayName = 'StepGuideItem';

// ─── Inline Field Tooltip ───────────────────────────────────────────────────

interface FieldTooltipProps {
  hint: string;
  details?: string;
  example?: string;
  position?: 'top' | 'bottom' | 'right';
}

export function FieldTooltip({ hint, details, example, position = 'top' }: FieldTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2 left-0',
    bottom: 'top-full mt-2 left-0',
    right: 'left-full ml-2 top-0',
  };

  return (
    <span className="relative inline-flex ml-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-gray-400 hover:text-brand-500 transition-colors"
        aria-label="Field help"
      >
        <FiHelpCircle className="w-3.5 h-3.5" />
      </button>
      {isOpen && (
        <div className={`absolute ${positionClasses[position]} z-50 w-64 bg-gray-900 dark:bg-surface-800 text-white rounded-xl p-3 shadow-xl`}>
          <p className="text-xs">{hint}</p>
          {details && <p className="text-xs text-gray-400 mt-1">{details}</p>}
          {example && (
            <div className="mt-2 bg-gray-800 dark:bg-surface-700 rounded-lg px-2 py-1">
              <p className="text-[10px] text-gray-400">Example:</p>
              <p className="text-xs font-mono text-green-400">{example}</p>
            </div>
          )}
          <div className="absolute w-2 h-2 bg-gray-900 dark:bg-surface-800 rotate-45 -bottom-1 left-4" />
        </div>
      )}
    </span>
  );
}

// ─── Progress Stepper (for multi-step forms) ────────────────────────────────

interface FormStepperProps {
  steps: Array<{ id: string; label: string; description?: string }>;
  currentStep: number;
  completedSteps?: number[];
  onStepClick?: (stepIndex: number) => void;
}

export function FormStepper({ steps, currentStep, completedSteps = [], onStepClick }: FormStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => onStepClick?.(i)}
              disabled={!onStepClick}
              className={`flex flex-col items-center gap-1.5 group ${onStepClick ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  completedSteps.includes(i)
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : i === currentStep
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-900/50'
                    : 'bg-gray-100 dark:bg-surface-800 text-gray-400'
                }`}
              >
                {completedSteps.includes(i) ? <FiCheck className="w-5 h-5" /> : i + 1}
              </span>
              <span className={`text-xs font-medium text-center ${
                i === currentStep ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.label}
              </span>
              {step.description && (
                <span className="text-[10px] text-gray-400 text-center hidden sm:block">{step.description}</span>
              )}
            </button>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mt-[-20px]">
                <div className={`h-full rounded-full transition-all ${
                  completedSteps.includes(i) ? 'bg-green-400' : 'bg-gray-200 dark:bg-surface-700'
                }`} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Utility ────────────────────────────────────────────────────────────────

function groupBySection(steps: FormGuideStep[]): Array<[string, FormGuideStep[]]> {
  const groups = new Map<string, FormGuideStep[]>();
  for (const step of steps) {
    const section = step.section || '';
    const list = groups.get(section) || [];
    list.push(step);
    groups.set(section, list);
  }
  return Array.from(groups.entries());
}
