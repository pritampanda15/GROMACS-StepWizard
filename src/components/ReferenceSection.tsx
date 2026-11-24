import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Check, Copy, Search, Sparkles, Terminal } from 'lucide-react';
import { CLI_FLAGS_REFERENCE, CliCategory } from '../data/cliReference';
import { MDP_PARAM_DOCS } from '../data/mdpPresets';
import { SegmentedControl } from './UiPrimitives';

type RefTab = 'cli' | 'mdp';

const CLI_CATEGORIES: ('All' | CliCategory)[] = [
  'All',
  'mdrun (Simulation & GPU)',
  'NVIDIA GPU & Env Vars',
  'NVIDIA NGC / MPS / MIG',
  'Setup (pdb2gmx / editconf / solvate / genion)',
  'Preprocessing (grompp / convert-tpr)',
  'Trajectory & Post-Processing (trjconv / rms)',
  'PCA, FEL & Binding Energy (covar / anaeig / sham / gmx_MMPBSA)',
];

export const ReferenceSection: React.FC = () => {
  const [refTab, setRefTab] = useState<RefTab>('cli');
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | CliCategory>('All');
  const [copiedFlag, setCopiedFlag] = useState<string | null>(null);

  const filteredCli = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CLI_FLAGS_REFERENCE.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        item.flag.toLowerCase().includes(q) ||
        item.command.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, selectedCategory]);

  const filteredMdp = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MDP_PARAM_DOCS.filter((item) => {
      if (!q) return true;
      return (
        item.param.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.tip && item.tip.toLowerCase().includes(q))
      );
    });
  }, [query]);

  const copyExample = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback ignored
    }
    setCopiedFlag(key);
    setTimeout(() => setCopiedFlag(null), 1600);
  };

  return (
    <section className="space-y-6">
      <div className="surface-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-blue)]">
              Unified Documentation Inspector
            </span>
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.025em] text-[var(--text-primary)]">
              GROMACS CLI, NVIDIA GPU & MDP Reference
            </h2>
            <p className="text-[13.5px] text-[var(--text-secondary)] mt-1">
              Instant Spotlight search across official GROMACS flags, NVIDIA CUDA/cuFFTMp/NGC/MPS/MIG controls, and MDP parameters.
            </p>
          </div>

          <SegmentedControl<RefTab>
            layoutId="ref-mode-seg"
            value={refTab}
            onChange={setRefTab}
            options={[
              {
                value: 'cli',
                label: `CLI & GPU Flags (${CLI_FLAGS_REFERENCE.length})`,
                icon: <Terminal className="w-3.5 h-3.5" />,
              },
              {
                value: 'mdp',
                label: `MDP Options (${MDP_PARAM_DOCS.length})`,
                icon: <BookOpen className="w-3.5 h-3.5" />,
              },
            ]}
          />
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              refTab === 'cli'
                ? 'Search flags like -update gpu, GMX_ENABLE_DIRECT_GPU_COMM, cuFFTMp, trjconv, gmx_MMPBSA...'
                : 'Search MDP options like nstlist, constraints, C-rescale, semiisotropic...'
            }
            className="ui-input w-full pl-11 pr-4 py-3 text-[14px]"
          />
        </div>

        {refTab === 'cli' && (
          <div className="flex flex-wrap gap-1.5">
            {CLI_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-[var(--accent-blue)] text-white'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {refTab === 'cli' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCli.map((item) => {
            const key = `${item.command}-${item.flag}`;
            const isNvidia = item.source === 'NVIDIA GROMACS Docs';
            return (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="surface-card p-5 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                        {item.command}
                      </span>
                      <h3 className="font-mono text-[15px] font-semibold text-[var(--accent-blue)] break-all mt-0.5">
                        {item.flag}
                      </h3>
                    </div>
                    <span
                      className={`shrink-0 text-[10.5px] font-semibold px-2.5 py-1 rounded-full ${
                        isNvidia
                          ? 'bg-[#30d158]/15 text-[#248a3d] dark:text-[#30d158]'
                          : item.source === 'Molecular-Dynamics Repo'
                          ? 'bg-[#5856d6]/15 text-[#5856d6] dark:text-[#bf5af2]'
                          : 'bg-[#0071e3]/12 text-[var(--accent-blue)]'
                      }`}
                    >
                      {item.source}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11.5px] font-mono text-[var(--text-tertiary)]">
                    <span className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)]">
                      {item.argType}
                    </span>
                    {item.defaultVal && (
                      <span className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)]">
                        default: {item.defaultVal}
                      </span>
                    )}
                  </div>

                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mt-3">
                    {item.summary}
                  </p>
                </div>

                <div className="rounded-xl bg-[var(--bg-code)] text-[#e6edf3] px-3.5 py-2.5 flex items-center justify-between gap-3 border border-white/10">
                  <code className="text-[11.5px] font-mono text-[#a5d6ff] overflow-x-auto whitespace-nowrap">
                    {item.example}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyExample(key, item.example)}
                    className="shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    aria-label={`Copy example for ${item.flag}`}
                  >
                    {copiedFlag === key ? (
                      <Check className="w-3.5 h-3.5 text-[#30d158]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMdp.map((doc) => (
            <div key={doc.param} className="surface-card p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-mono text-[15px] font-semibold text-[var(--accent-blue)]">
                  {doc.param}
                </h3>
                <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                  {doc.category}
                </span>
              </div>
              <div className="text-[12px] font-mono text-[var(--text-tertiary)]">
                Recommended: <span className="text-[var(--text-primary)]">{doc.defaultValue}</span>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                {doc.description}
              </p>
              {doc.tip && (
                <div className="flex items-start gap-2 pt-1 text-[12px] text-[#248a3d] dark:text-[#30d158] bg-[#30d158]/[0.08] px-3 py-2 rounded-xl">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{doc.tip}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
