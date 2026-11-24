import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Atom,
  BookOpen,
  ChevronRight,
  Command,
  FileSearch,
  FolderGit2,
  Gauge,
  Moon,
  Sun,
  Terminal,
  Zap,
} from 'lucide-react';
import { UI_SPRING, SegmentedControl } from './components/UiPrimitives';
import { MdMoviePlayer } from './components/MdMoviePlayer';
import { StepWizardSection } from './components/StepWizardSection';
import { CommandBuilderSection } from './components/CommandBuilderSection';
import { NvidiaGpuStudio } from './components/NvidiaGpuStudio';
import { ScriptVaultSection } from './components/ScriptVaultSection';
import { AnalyzerSection } from './components/AnalyzerSection';
import { ReferenceSection } from './components/ReferenceSection';
import { SpotlightPalette, SpotlightTarget } from './components/SpotlightPalette';

type WorkspaceTab = SpotlightTarget;

const PIPELINE_STAGES: { label: string; cmd: string; target: WorkspaceTab }[] = [
  { label: 'Topology', cmd: 'pdb2gmx', target: 'cli' },
  { label: 'Box & Solvent', cmd: 'editconf + solvate', target: 'cli' },
  { label: 'Ions', cmd: 'genion', target: 'cli' },
  { label: 'Minimize & Equil', cmd: 'MDP + ZIP kit', target: 'wizard' },
  { label: 'GPU Production', cmd: 'mdrun -update gpu', target: 'gpu' },
  { label: 'Lint & Plot', cmd: '.mdp / .xvg / .log', target: 'inspector' },
  { label: 'PCA / FEL', cmd: 'covar + sham', target: 'scripts' },
  { label: 'ΔG_bind', cmd: 'gmx_MMPBSA', target: 'scripts' },
];

export default function App() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('wizard');
  const [heroDtFs, setHeroDtFs] = useState<number>(2);
  const [heroTempK, setHeroTempK] = useState<number>(300);
  const [spotlightOpen, setSpotlightOpen] = useState<boolean>(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const jumpToWorkspace = (tab: WorkspaceTab, presetId?: string) => {
    setActiveTab(tab);
    if (presetId) setSelectedPresetId(presetId);
    const el = document.getElementById('workspace-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SpotlightPalette
        open={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        onNavigate={jumpToWorkspace}
      />

      {/* Sticky Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-hairline)] glass-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 text-left cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-[#0071e3] to-[#5ac8fa] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(0,113,227,0.35)] group-hover:scale-105 transition-transform">
              <Atom className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                GROMACS StepWizard
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                MD Setup · NVIDIA GPU &amp; HPC
              </div>
            </div>
          </button>

          <div className="hidden xl:block">
            <SegmentedControl<WorkspaceTab>
              layoutId="top-nav-pill"
              size="sm"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: 'wizard', label: 'Step & MDP', icon: <Gauge className="w-3.5 h-3.5" /> },
                { value: 'cli', label: 'CLI Builder', icon: <Terminal className="w-3.5 h-3.5" /> },
                { value: 'gpu', label: 'NVIDIA GPU', icon: <Zap className="w-3.5 h-3.5" /> },
                { value: 'scripts', label: 'Script Vault', icon: <FolderGit2 className="w-3.5 h-3.5" /> },
                { value: 'inspector', label: 'Inspector', icon: <FileSearch className="w-3.5 h-3.5" /> },
                { value: 'reference', label: 'Docs & Flags', icon: <BookOpen className="w-3.5 h-3.5" /> },
              ]}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setSpotlightOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-hairline)] hover:border-[var(--accent-blue)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Open Quick Search (⌘K / Ctrl+K)"
            >
              <Command className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-[var(--bg-solid)] border border-[var(--border-hairline)] text-[var(--text-tertiary)]">
                ⌘K
              </kbd>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={() => setDark((d) => !d)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
              aria-label="Toggle Light and Dark theme"
              title={dark ? 'Switch to Light theme' : 'Switch to Dark theme'}
            >
              {dark ? <Sun className="w-4 h-4 text-[#ffd60a]" /> : <Moon className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Bar */}
        <div className="xl:hidden px-4 pb-2.5 overflow-x-auto">
          <SegmentedControl<WorkspaceTab>
            layoutId="mobile-nav-pill"
            size="sm"
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: 'wizard', label: 'Step & MDP' },
              { value: 'cli', label: 'CLI Builder' },
              { value: 'gpu', label: 'NVIDIA GPU' },
              { value: 'scripts', label: 'Scripts' },
              { value: 'inspector', label: 'Inspector' },
              { value: 'reference', label: 'Reference' },
            ]}
          />
        </div>
      </header>

      {/* Top Overview Section */}
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[440px] rounded-full blur-3xl opacity-45"
          style={{
            background: dark
              ? 'radial-gradient(ellipse at center, rgba(41,151,255,0.2), rgba(48,209,88,0.08) 55%, transparent 75%)'
              : 'radial-gradient(ellipse at center, rgba(0,113,227,0.12), rgba(90,200,250,0.08) 55%, transparent 75%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12 sm:pb-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-6 space-y-5"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-surface text-[12px] font-medium text-[var(--text-secondary)]">
                <span className="w-2 h-2 rounded-full bg-[#30d158]" />
                <span>GROMACS 2024+ · NVIDIA CUDA / NGC / cuFFTMp · Client-Side Studio</span>
              </div>

              <h1 className="text-[36px] sm:text-[48px] font-semibold tracking-[-0.035em] leading-[1.08] text-[var(--text-primary)]">
                GROMACS simulation setup,{' '}
                <span className="bg-gradient-to-r from-[#0071e3] via-[#5ac8fa] to-[#30d158] bg-clip-text text-transparent">
                  engineered for clarity.
                </span>
              </h1>

              <p className="text-[16px] sm:text-[17px] leading-[1.58] text-[var(--text-secondary)] max-w-xl">
                Calculate exact <code className="font-mono text-[14.5px] text-[var(--text-primary)]">nsteps</code>, export complete <code className="font-mono text-[14.5px] text-[var(--text-primary)]">.zip</code> simulation kits, assemble NVIDIA GPU-resident <code className="font-mono text-[14.5px] text-[var(--text-primary)]">gmx mdrun</code> flags, lint <code className="font-mono text-[14.5px] text-[var(--text-primary)]">.mdp</code> files, and inspect <code className="font-mono text-[14.5px] text-[var(--text-primary)]">.xvg</code> / <code className="font-mono text-[14.5px] text-[var(--text-primary)]">md.log</code> outputs directly in your browser.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => jumpToWorkspace('wizard')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[14px] font-medium shadow-[0_8px_22px_rgba(0,113,227,0.3)] transition-colors cursor-pointer"
                >
                  Open Step Calculator <ChevronRight className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => jumpToWorkspace('gpu')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass-surface text-[14px] font-medium text-[var(--text-primary)] hover:border-[var(--accent-blue)] transition-colors cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-[#30d158]" /> NVIDIA GPU Studio
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => jumpToWorkspace('inspector')}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-full glass-surface text-[14px] font-medium text-[var(--text-primary)] hover:border-[var(--accent-blue)] transition-colors cursor-pointer"
                >
                  <FileSearch className="w-4 h-4 text-[var(--accent-blue)]" /> Lint .mdp / Plot .xvg
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
              className="lg:col-span-6"
            >
              <MdMoviePlayer dtFs={heroDtFs} temperatureK={heroTempK} />
            </motion.div>
          </div>

          {/* Interactive 8-Stage MD Lifecycle Ribbon */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="mt-8 surface-card p-3 sm:p-3.5"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
              {PIPELINE_STAGES.map((stage, idx) => (
                <button
                  key={stage.label}
                  type="button"
                  onClick={() => jumpToWorkspace(stage.target)}
                  className="group flex items-center gap-2 px-2.5 py-2 rounded-2xl hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer min-w-0"
                >
                  <span className="w-5 h-5 shrink-0 rounded-full bg-[#0071e3]/12 text-[var(--accent-blue)] text-[10.5px] font-semibold flex items-center justify-center tabular-nums">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors truncate">
                      {stage.label}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-tertiary)] truncate">
                      {stage.cmd}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Active Workspace Stage */}
      <main id="workspace-anchor" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pb-16 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={UI_SPRING}
          >
            {activeTab === 'wizard' && (
              <StepWizardSection
                externalPresetId={selectedPresetId}
                onTelemetryChange={(dtFs, tempK) => {
                  setHeroDtFs(dtFs);
                  setHeroTempK(tempK);
                }}
              />
            )}
            {activeTab === 'cli' && <CommandBuilderSection />}
            {activeTab === 'gpu' && <NvidiaGpuStudio />}
            {activeTab === 'scripts' && <ScriptVaultSection />}
            {activeTab === 'inspector' && <AnalyzerSection />}
            {activeTab === 'reference' && <ReferenceSection />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-hairline)] py-8 text-[12.5px] text-[var(--text-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <strong className="text-[var(--text-primary)] font-medium">GROMACS StepWizard</strong>{' '}
            — Created by Pritam Kumar Panda, Stanford University. Integrated with{' '}
            <span className="font-mono text-[11.5px]">Molecular-Dynamics</span>, GROMACS Docs &amp; NVIDIA NGC/CUDA Guides.
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://manual.gromacs.org/current/index.html"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--accent-blue)] transition-colors"
            >
              GROMACS Manual
            </a>
            <a
              href="https://catalog.ngc.nvidia.com/orgs/hpc/containers/gromacs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--accent-blue)] transition-colors"
            >
              NVIDIA NGC
            </a>
            <a
              href="https://github.com/pritampanda15/GROMACS-StepWizard"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--accent-blue)] transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
