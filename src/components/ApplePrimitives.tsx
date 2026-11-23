import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Check, Copy, Download, Terminal } from 'lucide-react';

export const APPLE_SPRING = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 32,
  mass: 0.8,
};

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  className = '',
  size = 'md',
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (val: T) => void;
  layoutId: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className={`inline-flex items-center p-1 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-subtle)] ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap ${
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-[13px]'
            } ${
              active
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={APPLE_SPRING}
                className="absolute inset-0 rounded-full bg-[var(--bg-solid)] shadow-[0_2px_8px_rgba(0,0,0,0.09)] border border-[var(--border-hairline)]"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function AppleSwitch({
  checked,
  onChange,
  label,
  description,
  accent = 'blue',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  accent?: 'blue' | 'green';
}) {
  const activeBg = accent === 'green' ? 'bg-[#30d158]' : 'bg-[#0071e3]';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 py-2.5 text-left group cursor-pointer"
    >
      <div className="min-w-0">
        <div className="text-[14px] font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
          {label}
        </div>
        {description && (
          <div className="text-[12px] text-[var(--text-secondary)] leading-snug mt-0.5">
            {description}
          </div>
        )}
      </div>
      <div
        className={`relative shrink-0 w-[46px] h-[28px] rounded-full p-[3px] transition-colors duration-250 ${
          checked ? activeBg : 'bg-[var(--border-strong)]'
        }`}
      >
        <motion.div
          layout
          transition={APPLE_SPRING}
          className="w-[22px] h-[22px] rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.22)]"
          style={{ marginLeft: checked ? 'auto' : 0 }}
        />
      </div>
    </button>
  );
}

export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  className = '',
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const spring = useSpring(value, { stiffness: 180, damping: 26, mass: 0.6 });
  const display = useTransform(spring, (latest) => format(latest));
  const [rendered, setRendered] = useState(() => format(value));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return display.on('change', (v) => setRendered(v));
  }, [display]);

  return <span className={`tabular-nums ${className}`}>{rendered}</span>;
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function highlightLine(line: string, language: 'mdp' | 'bash' | 'csh' | 'ini'): React.ReactNode {
  const trimmed = line.trim();
  if (
    (language === 'mdp' && trimmed.startsWith(';')) ||
    (language !== 'mdp' && trimmed.startsWith('#'))
  ) {
    return <span className="text-[#6e7681] italic">{line}</span>;
  }

  if (language === 'mdp') {
    const commentIdx = line.indexOf(';');
    const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : '';
    const eqIdx = codePart.indexOf('=');
    if (eqIdx > 0) {
      const key = codePart.slice(0, eqIdx);
      const val = codePart.slice(eqIdx + 1);
      return (
        <>
          <span className="text-[#79c0ff]">{key}</span>
          <span className="text-[#8b949e]">=</span>
          <span className="text-[#a5d6ff]">{val}</span>
          {commentPart && <span className="text-[#6e7681] italic">{commentPart}</span>}
        </>
      );
    }
  }

  if (language === 'bash' || language === 'csh') {
    if (trimmed.startsWith('#SBATCH')) {
      return <span className="text-[#d2a8ff] font-medium">{line}</span>;
    }
    const tokens = line.split(/(\s+)/);
    return tokens.map((tok, i) => {
      if (tok.startsWith('--') || (tok.startsWith('-') && tok.length > 1 && !/^-\d/.test(tok))) {
        return (
          <span key={i} className="text-[#7ee787]">
            {tok}
          </span>
        );
      }
      if (/^(gmx|gmx_mpi|mpirun|mpprun|docker|singularity|apptainer|export|nvidia-cuda-mps-control|nvidia-smi|gmx_MMPBSA|gmx_MMPBSA_ana|sbatch|cmake)$/.test(tok)) {
        return (
          <span key={i} className="text-[#79c0ff] font-medium">
            {tok}
          </span>
        );
      }
      if (/^(GMX_[A-Z0-9_]+|CUDA_[A-Z0-9_]+)=/.test(tok)) {
        const [k, ...rest] = tok.split('=');
        return (
          <span key={i}>
            <span className="text-[#ffa657]">{k}</span>
            <span className="text-[#8b949e]">=</span>
            <span className="text-[#a5d6ff]">{rest.join('=')}</span>
          </span>
        );
      }
      return <span key={i}>{tok}</span>;
    });
  }

  return line;
}

export function CodeShowcase({
  title,
  subtitle,
  code,
  filename,
  language = 'bash',
  maxHeight = '420px',
  compact = false,
}: {
  title: string;
  subtitle?: string;
  code: string;
  filename?: string;
  language?: 'mdp' | 'bash' | 'csh' | 'ini';
  maxHeight?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const area = document.createElement('textarea');
      area.value = code;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const lines = code.split('\n');

  return (
    <div className="rounded-[20px] overflow-hidden border border-white/10 bg-[var(--bg-code)] text-[#e6edf3] shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white/[0.04] border-b border-white/[0.08]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Terminal className="w-3.5 h-3.5 text-white/45 shrink-0" />
            <span className="text-[12.5px] font-medium text-white/90 truncate">{title}</span>
            {subtitle && (
              <span className="hidden sm:inline text-[11px] text-white/45 truncate">
                — {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-white/10 hover:bg-white/16 text-white transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#30d158]" />
                <span className="text-[#30d158]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white/75" />
                <span>Copy</span>
              </>
            )}
          </motion.button>
          {filename && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={() => downloadTextFile(filename, code)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </motion.button>
          )}
        </div>
      </div>

      <div
        className={`overflow-auto font-mono ${compact ? 'text-[12px] p-4' : 'text-[12.5px] p-5'} leading-[1.65]`}
        style={{ maxHeight }}
      >
        <pre className="m-0">
          {lines.map((line, idx) => (
            <div key={idx} className="flex gap-4 hover:bg-white/[0.03] px-1 rounded">
              {!compact && (
                <span className="select-none text-right w-7 shrink-0 text-white/25 tabular-nums">
                  {idx + 1}
                </span>
              )}
              <code className="whitespace-pre">{highlightLine(line, language)}</code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
