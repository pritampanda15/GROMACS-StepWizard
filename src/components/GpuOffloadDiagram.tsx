import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, ArrowLeftRight, Layers } from 'lucide-react';
import { UI_SPRING } from './UiPrimitives';

export interface GpuPipelineState {
  nb: 'gpu' | 'cpu';
  pme: 'gpu' | 'cpu';
  bonded: 'gpu' | 'cpu';
  update: 'gpu' | 'cpu';
  directComm: boolean;
  pmeDecomp: boolean;
  cudaGraph: boolean;
  gpus: number;
}

const TASKS: { key: 'nb' | 'pme' | 'bonded' | 'update'; label: string; sub: string }[] = [
  { key: 'nb', label: 'Non-Bonded', sub: 'LJ + Short-Range' },
  { key: 'pme', label: 'PME Long-Range', sub: 'cuFFT / 3D FFT' },
  { key: 'bonded', label: 'Bonded Forces', sub: 'Bonds / Angles / Dihedrals' },
  { key: 'update', label: 'Update & LINCS', sub: 'Coordinates & Constraints' },
];

export const GpuOffloadDiagram: React.FC<{
  state: GpuPipelineState;
  onToggleTask?: (task: 'nb' | 'pme' | 'bonded' | 'update') => void;
}> = ({ state, onToggleTask }) => {
  const gpuCount = TASKS.filter((t) => state[t.key] === 'gpu').length;
  const fullGpuResident = gpuCount === 4;
  const pcieStalled = !fullGpuResident && gpuCount > 0;

  // Estimate relative throughput factor purely for illustrative visual telemetry
  const baseFactor =
    1 +
    (state.nb === 'gpu' ? 2.4 : 0) +
    (state.pme === 'gpu' ? 1.5 : 0) +
    (state.bonded === 'gpu' ? 0.6 : 0) +
    (state.update === 'gpu' ? 1.4 : 0) +
    (state.cudaGraph && fullGpuResident && state.gpus === 1 ? 0.7 : 0) +
    (state.directComm && state.gpus > 1 ? 1.6 : 0) +
    (state.pmeDecomp && state.gpus > 1 ? 1.1 : 0);

  return (
    <div className="surface-card p-5 sm:p-6 overflow-hidden relative">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-blue)]">
            <Layers className="w-3.5 h-3.5" /> Live Offload Telemetry
          </div>
          <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] mt-0.5">
            {fullGpuResident
              ? 'Fully GPU-Resident MD Loop Active'
              : gpuCount === 0
              ? 'CPU-Only Domain Decomposition'
              : 'Hybrid CPU ↔ GPU Split Pipeline'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-[12px] font-semibold tabular-nums border ${
              fullGpuResident
                ? 'bg-[#30d158]/14 border-[#30d158]/35 text-[#248a3d] dark:text-[#30d158]'
                : 'bg-[#0071e3]/12 border-[#0071e3]/30 text-[var(--accent-blue)]'
            }`}
          >
            ~{baseFactor.toFixed(1)}× Est. Pipeline Efficiency
          </span>
        </div>
      </div>

      {/* Interactive CPU <-> Bus <-> GPU architecture lanes */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
        {/* Host CPU Column */}
        <div className="rounded-[20px] p-4 border border-[var(--border-hairline)] bg-[var(--bg-subtle)] flex flex-col gap-2.5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0071e3]/12 text-[var(--accent-blue)] flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">Host CPU</div>
                <div className="text-[11px] text-[var(--text-secondary)]">OpenMP / Thread-MPI</div>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              {4 - gpuCount}/4 tasks
            </span>
          </div>

          <div className="space-y-2 min-h-[156px]">
            {TASKS.filter((t) => state[t.key] === 'cpu').map((task) => (
              <motion.button
                layoutId={`gpu-task-${task.key}`}
                key={task.key}
                type="button"
                transition={UI_SPRING}
                onClick={() => onToggleTask?.(task.key)}
                className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-[var(--bg-solid)] border border-[var(--border-hairline)] hover:border-[var(--accent-blue)] shadow-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                    {task.label}
                  </span>
                  <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                    -{task.key} cpu
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{task.sub}</div>
              </motion.button>
            ))}
            {fullGpuResident && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[130px] rounded-2xl border border-dashed border-[var(--border-strong)] flex flex-col items-center justify-center text-center p-4 text-[12px] text-[var(--text-secondary)]"
              >
                <span className="font-medium text-[var(--text-primary)]">Zero per-step force work</span>
                <span className="text-[11px] mt-1">
                  CPU handles only periodic I/O, logging & checkpoint orchestration.
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Animated Interconnect Bus */}
        <div className="flex md:flex-col items-center justify-center gap-2 py-2 px-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] text-center">
            {fullGpuResident
              ? state.gpus > 1 && state.directComm
                ? 'NVLink / GPUDirect'
                : 'Low PCIe Traffic'
              : 'PCIe Sync / Step'}
          </div>

          <div className="relative w-28 md:w-12 h-8 md:h-28 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-hairline)] flex items-center justify-center overflow-hidden">
            <ArrowLeftRight
              className={`w-4 h-4 z-10 ${
                pcieStalled
                  ? 'text-[#ff9f0a]'
                  : fullGpuResident
                  ? 'text-[#30d158]'
                  : 'text-[var(--text-tertiary)]'
              }`}
            />
            {pcieStalled && (
              <>
                <motion.span
                  animate={{ y: [-38, 38], opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                  className="hidden md:block absolute w-2 h-2 rounded-full bg-[#ff9f0a]"
                />
                <motion.span
                  animate={{ x: [-38, 38], opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                  className="md:hidden absolute w-2 h-2 rounded-full bg-[#ff9f0a]"
                />
              </>
            )}
            {fullGpuResident && (
              <motion.span
                animate={{ scale: [0.85, 1.35, 0.85], opacity: [0.25, 0.55, 0.25] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                className="absolute w-7 h-7 rounded-full bg-[#30d158]/30"
              />
            )}
          </div>

          <div className="text-[10.5px] font-medium text-center">
            {fullGpuResident ? (
              <span className="text-[#248a3d] dark:text-[#30d158]">GPU Resident</span>
            ) : pcieStalled ? (
              <span className="text-[#ff9f0a]">Host Copy Active</span>
            ) : (
              <span className="text-[var(--text-tertiary)]">Idle</span>
            )}
          </div>
        </div>

        {/* NVIDIA GPU Column */}
        <div
          className={`rounded-[20px] p-4 border flex flex-col gap-2.5 transition-colors ${
            fullGpuResident
              ? 'border-[#30d158]/40 bg-[#30d158]/[0.06]'
              : 'border-[var(--border-hairline)] bg-[var(--bg-subtle)]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#30d158]/16 text-[#248a3d] dark:text-[#30d158] flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                  NVIDIA GPU {state.gpus > 1 ? `× ${state.gpus}` : ''}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  CUDA{state.pmeDecomp && state.gpus > 1 ? ' + cuFFTMp' : ''}{state.cudaGraph && fullGpuResident ? ' + Graphs' : ''}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#248a3d] dark:text-[#30d158]">
              {gpuCount}/4 tasks
            </span>
          </div>

          <div className="space-y-2 min-h-[156px]">
            {TASKS.filter((t) => state[t.key] === 'gpu').map((task) => (
              <motion.button
                layoutId={`gpu-task-${task.key}`}
                key={task.key}
                type="button"
                transition={UI_SPRING}
                onClick={() => onToggleTask?.(task.key)}
                className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-[var(--bg-solid)] border border-[#30d158]/30 hover:border-[#30d158] shadow-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                    {task.label}
                  </span>
                  <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-[#30d158]/15 text-[#248a3d] dark:text-[#30d158]">
                    -{task.key} gpu
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{task.sub}</div>
              </motion.button>
            ))}
            {gpuCount === 0 && (
              <div className="h-full min-h-[130px] rounded-2xl border border-dashed border-[var(--border-strong)] flex flex-col items-center justify-center text-center p-4 text-[12px] text-[var(--text-secondary)]">
                Click any CPU task card to offload it to the NVIDIA GPU.
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-[11.5px] text-[var(--text-tertiary)] mt-4">
        Tip: Click any task tile above to animate offloading between Host CPU and NVIDIA GPU in real time.
      </p>
    </div>
  );
};
