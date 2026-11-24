import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileCode2, FolderGit2, RotateCcw, Search, Sliders } from 'lucide-react';
import { REPO_SCRIPTS, RepoScript, ScriptCategory } from '../data/scriptsVault';
import { UI_SPRING, CodeShowcase } from './UiPrimitives';

const CATEGORIES: ScriptCategory[] = [
  'All',
  'NVIDIA GPU',
  'HPC & SLURM',
  'Workflows',
  'Umbrella Sampling',
  'Post-Processing',
  'PCA & FEL',
  'MM-PBSA / GBSA',
];

function getDefaultValues(script: RepoScript): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of script.params) {
    out[p.key] = p.defaultValue;
  }
  return out;
}

export const ScriptVaultSection: React.FC = () => {
  const [category, setCategory] = useState<ScriptCategory>('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(REPO_SCRIPTS[0].id);
  const [paramStore, setParamStore] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {};
    for (const s of REPO_SCRIPTS) {
      initial[s.id] = getDefaultValues(s);
    }
    return initial;
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REPO_SCRIPTS.filter((s) => {
      if (category !== 'All' && s.category !== category) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.filename.toLowerCase().includes(q) ||
        s.badges.some((b) => b.toLowerCase().includes(q))
      );
    });
  }, [category, query]);

  const activeScript = useMemo(() => {
    const inFiltered = filtered.find((s) => s.id === selectedId);
    return inFiltered ?? filtered[0] ?? REPO_SCRIPTS[0];
  }, [filtered, selectedId]);

  const activeParams = paramStore[activeScript.id] ?? getDefaultValues(activeScript);
  const renderedCode = useMemo(
    () => activeScript.renderContent(activeParams),
    [activeScript, activeParams]
  );

  const updateParam = (key: string, val: string) => {
    setParamStore((prev) => ({
      ...prev,
      [activeScript.id]: {
        ...(prev[activeScript.id] ?? getDefaultValues(activeScript)),
        [key]: val,
      },
    }));
  };

  const resetParams = () => {
    setParamStore((prev) => ({
      ...prev,
      [activeScript.id]: getDefaultValues(activeScript),
    }));
  };

  return (
    <section className="space-y-6">
      <div className="surface-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-blue)] inline-flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5" /> Molecular-Dynamics Script Vault
            </span>
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.025em] text-[var(--text-primary)]">
              Parameterized HPC, GPU & Analysis Scripts
            </h2>
            <p className="text-[13.5px] text-[var(--text-secondary)] mt-1">
              Curated directly from <span className="font-mono text-[12px]">Molecular-Dynamics</span> — customize cluster & simulation variables live and export ready-to-run files.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter SLURM, MPS, PCA, MMPBSA..."
              className="ui-input w-full pl-10 pr-4 py-2.5 text-[13px]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = cat === category;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`relative px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition-colors cursor-pointer ${
                  active
                    ? 'text-white'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="vault-cat-pill"
                    transition={UI_SPRING}
                    className="absolute inset-0 rounded-full bg-[var(--accent-blue)]"
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Script List */}
        <div className="lg:col-span-4 space-y-2.5">
          {filtered.map((script) => {
            const active = script.id === activeScript.id;
            return (
              <motion.button
                key={script.id}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => setSelectedId(script.id)}
                className={`w-full text-left p-4 rounded-[20px] border transition-all cursor-pointer ${
                  active
                    ? 'surface-card border-[var(--accent-blue)] ring-1 ring-[var(--accent-blue)]/30'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-hairline)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileCode2
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-[var(--accent-blue)]' : 'text-[var(--text-tertiary)]'
                      }`}
                    />
                    <span className="font-mono text-[11.5px] text-[var(--text-secondary)]">
                      {script.filename}
                    </span>
                  </div>
                  <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                    {script.category}
                  </span>
                </div>
                <div className="text-[14.5px] font-semibold text-[var(--text-primary)] mt-1.5 leading-snug">
                  {script.title}
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {script.subtitle}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {script.badges.map((b) => (
                    <span
                      key={b}
                      className="text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[var(--text-tertiary)]"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </motion.button>
            );
          })}

          {filtered.length === 0 && (
            <div className="surface-card p-6 text-center text-[13px] text-[var(--text-secondary)]">
              No scripts match "{query}". Try clearing your filter.
            </div>
          )}
        </div>

        {/* Right Live Parameterizer + Code */}
        <div className="lg:col-span-8 space-y-4">
          <div className="surface-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--accent-blue)]" />
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                  Customize Variables — {activeScript.filename}
                </h3>
              </div>
              <button
                type="button"
                onClick={resetParams}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activeScript.params.map((p) => (
                <div key={p.key}>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)] block truncate">
                    {p.label}
                  </label>
                  <input
                    value={activeParams[p.key] ?? p.defaultValue}
                    onChange={(e) => updateParam(p.key, e.target.value)}
                    placeholder={p.placeholder ?? p.defaultValue}
                    className="ui-input w-full px-3 py-1.5 text-[12.5px] font-mono mt-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <CodeShowcase
            title={activeScript.filename}
            subtitle={activeScript.sourcePath}
            code={renderedCode}
            filename={activeScript.filename}
            language={activeScript.language}
            maxHeight="520px"
          />
        </div>
      </div>
    </section>
  );
};
