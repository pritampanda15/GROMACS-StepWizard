import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Atom,
  BookOpen,
  ChevronRight,
  FolderGit2,
  Gauge,
  Moon,
  Sun,
  Terminal,
  Zap,
} from 'lucide-react';
import { APPLE_SPRING, SegmentedControl } from './components/ApplePrimitives';
import { MdMoviePlayer } from './components/MdMoviePlayer';
import { StepWizardSection } from './components/StepWizardSection';
import { CommandBuilderSection } from './components/CommandBuilderSection';
import { NvidiaGpuStudio } from './components/NvidiaGpuStudio';
import { ScriptVaultSection } from './components/ScriptVaultSection';
import { ReferenceSection } from './components/ReferenceSection';

type WorkspaceTab = 'wizard' | 'cli' | 'gpu' | 'scripts' | 'reference';

const PIPELINE_STAGES: { label: string; cmd: string; target: WorkspaceTab }[] = [
  { label: 'Topology', cmd: 'pdb2gmx', target: 'cli' },
  { label: 'Box & Solvent', cmd: 'editconf + solvate', target: 'cli' },
  { label: 'Ions', cmd: 'genion', target: 'cli' },
  { label: 'Minimize & Equil', cmd: 'MDP presets', target: 'wizard' },
  { label: 'GPU Production', cmd: 'mdrun -update gpu', target: 'gpu' },
  { label: 'PBC & RMSD', cmd: 'trjconv + rms', target: 'scripts' },
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const jumpToWorkspace = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    const el = document.getElementById('workspace-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Apple Translucent Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-hairline)] apple-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-[#0071e3] to-[#5ac8fa] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(0,113,227,0.35)] group-hover:scale-105 transition-transform">
              <Atom className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                GROMACS StepWizard
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                MD Studio • NVIDIA GPU & HPC
              </div>
            </div>
          </button>

          <div className="hidden lg:block">
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
                { value: 'reference', label: 'Docs & Flags', icon: <BookOpen className="w-3.5 h-3.5" /> },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={() => setDark((d) => !d)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
              aria-label="Toggle Light and Dark appearance"
              title={dark ? 'Switch to Apple Light Studio' : 'Switch to Apple Pro Dark'}
            >
              {dark ? <Sun className="w-4 h-4 text-[#ffd60a]" /> : <Moon className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Bar */}
        <div className="lg:hidden px-4 pb-2.5 overflow-x-auto">
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
              { value: 'reference', label: 'Reference' },
            ]}
          />
        </div>
      </header>

      {/* Hero Section with Interactive Molecular Dynamics Motion Graphic */}
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[460px] rounded-full blur-3xl opacity-45"
          style={{
            background: dark
              ? 'radial-gradient(ellipse at center, rgba(41,151,255,0.22), rgba(48,209,88,0.08) 55%, transparent 75%)'
              : 'radial-gradient(ellipse at center, rgba(0,113,227,0.14), rgba(90,200,250,0.09) 55%, transparent 75%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-14 sm:pb-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-6 space-y-5"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full apple-glass text-[12px] font-medium text-[var(--text-secondary)]">
                <span className="w-2 h-2 rounded-full bg-[#30d158]" />
                <span>GROMACS 2024+ • NVIDIA CUDA / NGC / cuFFTMp • Molecular-Dynamics Suite</span>
              </div>

              <h1 className="text-[38px] sm:text-[50px] font-semibold tracking-[-0.035em] leading-[1.06] text-[var(--text-primary)]">
                Molecular dynamics,{' '}
                <span className="bg-gradient-to-r from-[#0071e3] via-[#5ac8fa] to-[#30d158] bg-clip-text text-transparent">
                  precision engineered.
                </span>
              </h1>

              <p className="text-[16px] sm:text-[17.5px] leading-[1.55] text-[var(--text-secondary)] max-w-xl">
                Calculate exact <code className="font-mono text-[14.5px] text-[var(--text-primary)]">nsteps</code>, generate OPLS &amp; CHARMM36 <code className="font-mono text-[14.5px] text-[var(--text-primary)]">.mdp</code> files, assemble NVIDIA GPU-resident <code className="font-mono text-[14.5px] text-[var(--text-primary)]">gmx mdrun</code> flags, and customize production SLURM, MPS/MIG, PCA/FEL, and <code className="font-mono text-[14.5px] text-[var(--text-primary)]">gmx_MMPBSA</code> scripts — entirely in your browser.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => jumpToWorkspace('wizard')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[14px] font-medium shadow-[0_8px_22px_rgba(0,113,227,0.3)] transition-colors cursor-pointer"
                >
                  Launch StepWizard <ChevronRight className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => jumpToWorkspace('gpu')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full apple-glass text-[14px] font-medium text-[var(--text-primary)] hover:border-[var(--accent-blue)] transition-colors cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-[#30d158]" /> NVIDIA GPU Studio
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
              className="lg:col-span-6"
            >
              <MdMoviePlayer dtFs={heroDtFs} temperatureK={heroTempK} />
            </motion.div>
          </div>

          {/* Interactive 8-Stage MD Lifecycle Ribbon */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mt-8 apple-card p-3 sm:p-3.5"
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
            transition={APPLE_SPRING}
          >
            {activeTab === 'wizard' && (
              <StepWizardSection
                onTelemetryChange={(dtFs, tempK) => {
                  setHeroDtFs(dtFs);
                  setHeroTempK(tempK);
                }}
              />
            )}
            {activeTab === 'cli' && <CommandBuilderSection />}
            {activeTab === 'gpu' && <NvidiaGpuStudio />}
            {activeTab === 'scripts' && <ScriptVaultSection />}
            {activeTab === 'reference' && <ReferenceSection />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Apple-style Minimal Footer */}
      <footer className="border-t border-[var(--border-hairline)] py-8 text-[12.5px] text-[var(--text-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <strong className="text-[var(--text-primary)] font-medium">GROMACS StepWizard 2.0</strong>{' '}
            — Created by Pritam Kumar Panda, Stanford University. Integrated with{' '}
            <span className="font-mono text-[11.5px]">Molecular-Dynamics</span>, Official GROMACS Docs &amp; NVIDIA NGC/CUDA Guides.
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
              href="https://github.com/pritampanda15"
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
