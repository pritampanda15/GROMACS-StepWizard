import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Copy,
  FileSearch,
  FolderGit2,
  Gauge,
  Search,
  Terminal,
  Zap,
} from 'lucide-react';
import { CLI_FLAGS_REFERENCE } from '../data/cliReference';
import { MDP_PRESETS } from '../data/mdpPresets';
import { REPO_SCRIPTS } from '../data/scriptsVault';

export type SpotlightTarget = 'wizard' | 'cli' | 'gpu' | 'scripts' | 'inspector' | 'reference';

interface SpotlightItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  kind: 'preset' | 'flag' | 'script' | 'tab';
  copyText?: string;
  tab: SpotlightTarget;
  presetId?: string;
}

export const SpotlightPalette: React.FC<{
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: SpotlightTarget, presetId?: string) => void;
}> = ({ open, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems = useMemo<SpotlightItem[]>(() => {
    const tabs: SpotlightItem[] = [
      { id: 'tab-wizard', title: 'Step & MDP Wizard', subtitle: 'Calculate nsteps, export .mdp & full ZIP simulation kit', badge: 'Workspace', kind: 'tab', tab: 'wizard' },
      { id: 'tab-cli', title: 'GROMACS CLI Builder', subtitle: 'Assemble mdrun, grompp, setup, trjconv, PCA & gmx_MMPBSA', badge: 'Workspace', kind: 'tab', tab: 'cli' },
      { id: 'tab-gpu', title: 'NVIDIA GPU & HPC Studio', subtitle: 'Single/Multi-GPU offload, cuFFTMp, NGC, CUDA MPS & MIG', badge: 'Workspace', kind: 'tab', tab: 'gpu' },
      { id: 'tab-scripts', title: 'Molecular-Dynamics Script Vault', subtitle: 'Parameterized SLURM, NVIDIA GPU, PCA/FEL & MMPBSA scripts', badge: 'Workspace', kind: 'tab', tab: 'scripts' },
      { id: 'tab-inspector', title: 'MDP Linter & XVG / md.log Analyzer', subtitle: 'Audit .mdp files with one-click fixes or plot .xvg curves', badge: 'Workspace', kind: 'tab', tab: 'inspector' },
      { id: 'tab-reference', title: 'Unified Docs & Flags Reference', subtitle: 'Search all GROMACS & NVIDIA GPU flags and MDP options', badge: 'Workspace', kind: 'tab', tab: 'reference' },
    ];

    const presets: SpotlightItem[] = MDP_PRESETS.map((p) => ({
      id: `preset-${p.id}`,
      title: p.name,
      subtitle: p.subtitle,
      badge: p.badge,
      kind: 'preset',
      tab: 'wizard',
      presetId: p.id,
    }));

    const scripts: SpotlightItem[] = REPO_SCRIPTS.map((s) => ({
      id: `script-${s.id}`,
      title: `${s.filename} — ${s.title}`,
      subtitle: s.subtitle,
      badge: s.category,
      kind: 'script',
      tab: 'scripts',
    }));

    const flags: SpotlightItem[] = CLI_FLAGS_REFERENCE.map((f, idx) => ({
      id: `flag-${idx}`,
      title: `${f.command} ${f.flag}`,
      subtitle: f.summary,
      badge: f.source === 'NVIDIA GROMACS Docs' ? 'NVIDIA GPU' : 'CLI Flag',
      kind: 'flag',
      copyText: f.example,
      tab: 'reference',
    }));

    return [...tabs, ...presets, ...scripts, ...flags];
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems.slice(0, 10);
    return allItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.badge.toLowerCase().includes(q) ||
          (item.copyText && item.copyText.toLowerCase().includes(q))
      )
      .slice(0, 14);
  }, [allItems, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const executeItem = (item: SpotlightItem) => {
    onNavigate(item.tab, item.presetId);
    onClose();
  };

  const copyCommand = async (e: React.MouseEvent, item: SpotlightItem) => {
    e.stopPropagation();
    if (!item.copyText) return;
    try {
      await navigator.clipboard.writeText(item.copyText);
    } catch {
      // ignore
    }
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault();
      executeItem(results[activeIdx]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-md flex items-start justify-center pt-[11vh] px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-label="Spotlight Command Palette"
            className="w-full max-w-2xl rounded-[24px] overflow-hidden glass-surface shadow-[0_32px_90px_rgba(0,0,0,0.45)] border border-[var(--border-strong)]"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-hairline)]">
              <Search className="w-5 h-5 text-[var(--accent-blue)] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to MDP preset, NVIDIA flag, SLURM script, or tool..."
                className="w-full bg-transparent text-[16px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
              />
              <kbd className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border border-[var(--border-hairline)]">
                ESC
              </kbd>
            </div>

            <div className="max-h-[54vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="py-10 text-center text-[13.5px] text-[var(--text-secondary)]">
                  No matches for &ldquo;{query}&rdquo;. Try <code className="font-mono">cufftmp</code>,{' '}
                  <code className="font-mono">charmm</code>, <code className="font-mono">trjconv</code>, or{' '}
                  <code className="font-mono">mmpbsa</code>.
                </div>
              ) : (
                results.map((item, idx) => {
                  const active = idx === activeIdx;
                  const Icon =
                    item.kind === 'preset'
                      ? Gauge
                      : item.kind === 'script'
                      ? FolderGit2
                      : item.kind === 'flag'
                      ? item.badge === 'NVIDIA GPU'
                        ? Zap
                        : Terminal
                      : FileSearch;
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => executeItem(item)}
                      className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl cursor-pointer transition-colors ${
                        active ? 'bg-[#0071e3] text-white' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-[var(--bg-subtle)] text-[var(--accent-blue)]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-semibold truncate">{item.title}</div>
                          <div
                            className={`text-[11.5px] truncate ${
                              active ? 'text-white/80' : 'text-[var(--text-secondary)]'
                            }`}
                          >
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.copyText && (
                          <button
                            type="button"
                            onClick={(e) => copyCommand(e, item)}
                            title="Copy example command"
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              active
                                ? 'bg-white/20 hover:bg-white/30 text-white'
                                : 'bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-[#30d158]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <span
                          className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-5 py-2.5 border-t border-[var(--border-hairline)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
              <span>↑↓ Navigate · ↵ Open · Click Copy icon on CLI flags</span>
              <span className="font-mono">⌘K Spotlight</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
