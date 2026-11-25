import React, { useMemo, useState } from 'react';
import { Container, Cpu, Layers, Network, Server, Zap } from 'lucide-react';
import { ToggleSwitch, CodeShowcase, SegmentedControl } from './UiPrimitives';
import { GpuOffloadDiagram, GpuPipelineState } from './GpuOffloadDiagram';

type GpuScenario = 'single' | 'multigpu' | 'cufftmp' | 'ngc' | 'mps' | 'mig';

export const NvidiaGpuStudio: React.FC = () => {
  const [scenario, setScenario] = useState<GpuScenario>('single');
  const [pipeline, setPipeline] = useState<GpuPipelineState>({
    nb: 'gpu',
    pme: 'gpu',
    bonded: 'gpu',
    update: 'gpu',
    directComm: true,
    pmeDecomp: false,
    cudaGraph: true,
    gpus: 1,
  });

  const [ntomp, setNtomp] = useState(8);
  const [deffnm, setDeffnm] = useState('md_0_1');
  const [ngcRuntime, setNgcRuntime] = useState<'docker' | 'singularity'>('docker');
  const [ngcTag, setNgcTag] = useState('2023.2');
  const [mpsCount, setMpsCount] = useState(4);
  const [mpsMode, setMpsMode] = useState<'multidir' | 'independent'>('multidir');
  const [migProfile, setMigProfile] = useState<'1g.10gb' | '2g.20gb' | '3g.40gb'>('1g.10gb');
  const [legacyVars, setLegacyVars] = useState(false);

  const selectScenario = (s: GpuScenario) => {
    setScenario(s);
    if (s === 'single') {
      setPipeline((p) => ({
        ...p,
        nb: 'gpu',
        pme: 'gpu',
        bonded: 'gpu',
        update: 'gpu',
        gpus: 1,
        pmeDecomp: false,
        cudaGraph: true,
      }));
    } else if (s === 'multigpu') {
      setPipeline((p) => ({
        ...p,
        nb: 'gpu',
        pme: 'gpu',
        bonded: 'gpu',
        update: 'gpu',
        gpus: 4,
        directComm: true,
        pmeDecomp: false,
        cudaGraph: false,
      }));
    } else if (s === 'cufftmp') {
      setPipeline((p) => ({
        ...p,
        nb: 'gpu',
        pme: 'gpu',
        bonded: 'gpu',
        update: 'gpu',
        gpus: 8,
        directComm: true,
        pmeDecomp: true,
        cudaGraph: false,
      }));
    }
  };

  const toggleTask = (task: 'nb' | 'pme' | 'bonded' | 'update') => {
    setPipeline((prev) => ({
      ...prev,
      [task]: prev[task] === 'gpu' ? 'cpu' : 'gpu',
    }));
  };

  const generatedScript = useMemo(() => {
    const offloadFlags = `-nb ${pipeline.nb} -pme ${pipeline.pme} -bonded ${pipeline.bonded} -update ${pipeline.update}`;
    const envBlock: string[] = [];
    if (pipeline.directComm) {
      envBlock.push('export GMX_ENABLE_DIRECT_GPU_COMM=1');
    }
    if (legacyVars) {
      envBlock.push('export GMX_GPU_DD_COMMS=true');
      envBlock.push('export GMX_GPU_PME_PP_COMMS=true');
      envBlock.push('export GMX_FORCE_UPDATE_DEFAULT_GPU=true');
    }
    if (pipeline.pmeDecomp && pipeline.gpus > 1) {
      envBlock.push('export GMX_GPU_PME_DECOMPOSITION=1');
    }
    if (pipeline.cudaGraph && pipeline.gpus === 1 && pipeline.update === 'gpu') {
      envBlock.push('export GMX_CUDA_GRAPH=1');
    }

    if (scenario === 'single') {
      return [
        `# Single-GPU Fully GPU-Resident GROMACS (NVIDIA Optimized)`,
        ...envBlock,
        ``,
        `gmx mdrun -v -deffnm ${deffnm} \\`,
        `    -ntmpi 1 -ntomp ${ntomp} \\`,
        `    ${offloadFlags} \\`,
        `    -nstlist 100 -pin on`,
      ].join('\n');
    }

    if (scenario === 'multigpu') {
      return [
        `# Multi-GPU Single-Node Run (${pipeline.gpus} GPUs: ${Math.max(1, pipeline.gpus - 1)} PP + 1 Dedicated PME Rank)`,
        ...envBlock,
        ``,
        `gmx mdrun -v -deffnm ${deffnm} \\`,
        `    -ntmpi ${pipeline.gpus} -ntomp ${ntomp} -npme 1 \\`,
        `    ${offloadFlags} \\`,
        `    -nstlist 100 -pin on`,
      ].join('\n');
    }

    if (scenario === 'cufftmp') {
      const npme = Math.max(2, Math.floor(pipeline.gpus / 4));
      return [
        `# Multi-Node / Large-Scale GPU PME Decomposition via NVIDIA cuFFTMp + NVSHMEM`,
        `# Build prerequisite: cmake .. -DGMX_GPU=CUDA -DGMX_MPI=ON -DGMX_USE_CUFFTMP=ON -DcuFFTMp_ROOT=$HPCSDK_LIBDIR`,
        `export GMX_ENABLE_DIRECT_GPU_COMM=1`,
        `export GMX_GPU_PME_DECOMPOSITION=1`,
        ``,
        `mpirun -np ${pipeline.gpus} gmx_mpi mdrun -v -deffnm ${deffnm} \\`,
        `    -ntomp ${ntomp} -npme ${npme} \\`,
        `    ${offloadFlags} \\`,
        `    -nstlist 100 -pin on`,
      ].join('\n');
    }

    if (scenario === 'ngc') {
      if (ngcRuntime === 'docker') {
        return [
          `# Official NVIDIA NGC GROMACS Container (Docker + NVIDIA Container Toolkit)`,
          `export GROMACS_TAG=${ngcTag}`,
          ``,
          `docker run --gpus ${pipeline.gpus > 1 ? 'all' : '\'"device=0"\''} --ipc=host --rm \\`,
          `    -e GMX_ENABLE_DIRECT_GPU_COMM=1 \\`,
          `    -v "\${PWD}:/host_pwd" \\`,
          `    --workdir /host_pwd \\`,
          `    "nvcr.io/hpc/gromacs:\${GROMACS_TAG}" \\`,
          `    gmx mdrun -v -deffnm ${deffnm} -ntmpi ${pipeline.gpus} -ntomp ${ntomp}${pipeline.gpus > 1 ? ' -npme 1' : ''} \\`,
          `    ${offloadFlags} -pin on`,
        ].join('\n');
      }
      return [
        `# Official NVIDIA NGC GROMACS Container (Singularity / Apptainer for Rootless HPC)`,
        `export GROMACS_TAG=${ngcTag}`,
        ``,
        `# One-time image pull & build:`,
        `singularity build "gromacs_\${GROMACS_TAG}.sif" "docker://nvcr.io/hpc/gromacs:\${GROMACS_TAG}"`,
        ``,
        `# Execute with GPU passthrough (--nv):`,
        `export GMX_ENABLE_DIRECT_GPU_COMM=1`,
        `singularity run --nv \\`,
        `    -B "\${PWD}:/host_pwd" \\`,
        `    --pwd /host_pwd \\`,
        `    "gromacs_\${GROMACS_TAG}.sif" \\`,
        `    gmx mdrun -v -deffnm ${deffnm} -ntmpi ${pipeline.gpus} -ntomp ${ntomp}${pipeline.gpus > 1 ? ' -npme 1' : ''} \\`,
        `    ${offloadFlags} -pin on`,
      ].join('\n');
    }

    if (scenario === 'mps') {
      const dirs = Array.from({ length: mpsCount }, (_, i) => `sim_${i}`).join(' ');
      if (mpsMode === 'multidir') {
        return [
          `# NVIDIA CUDA MPS + GROMACS -multidir (${mpsCount} Concurrent Simulations on 1 GPU)`,
          `export CUDA_VISIBLE_DEVICES=0`,
          `export CUDA_MPS_PIPE_DIRECTORY=/tmp/nvidia-mps`,
          `export CUDA_MPS_LOG_DIRECTORY=/tmp/nvidia-log`,
          `mkdir -p "\${CUDA_MPS_PIPE_DIRECTORY}" "\${CUDA_MPS_LOG_DIRECTORY}"`,
          `nvidia-cuda-mps-control -d`,
          ``,
          `mpirun -np ${mpsCount} gmx_mpi mdrun \\`,
          `    -multidir ${dirs} \\`,
          `    -deffnm ${deffnm} -ntomp ${Math.min(ntomp, 4)} \\`,
          `    ${offloadFlags} -pin on`,
          ``,
          `echo quit | nvidia-cuda-mps-control`,
        ].join('\n');
      }
      return [
        `# NVIDIA CUDA MPS + Independent Processes with Non-Overlapping -pinoffset`,
        `export CUDA_VISIBLE_DEVICES=0`,
        `export CUDA_MPS_PIPE_DIRECTORY=/tmp/nvidia-mps`,
        `export CUDA_MPS_LOG_DIRECTORY=/tmp/nvidia-log`,
        `mkdir -p "\${CUDA_MPS_PIPE_DIRECTORY}" "\${CUDA_MPS_LOG_DIRECTORY}"`,
        `nvidia-cuda-mps-control -d`,
        ``,
        `NTOMP=${Math.min(ntomp, 4)}`,
        `for i in $(seq 0 ${mpsCount - 1}); do`,
        `    offset=$((i * NTOMP))`,
        `    (cd "sim_\${i}" && gmx mdrun -deffnm ${deffnm} -ntmpi 1 -ntomp "\${NTOMP}" ${offloadFlags} -pin on -pinoffset "\${offset}") &`,
        `done`,
        `wait`,
        `echo quit | nvidia-cuda-mps-control`,
      ].join('\n');
    }

    // MIG
    const sliceCount = migProfile === '1g.10gb' ? 4 : migProfile === '2g.20gb' ? 2 : 2;
    const profileList = Array(sliceCount).fill(migProfile).join(',');
    return [
      `# NVIDIA Multi-Instance GPU (MIG) Hardware Partitioning (A100 / H100 / H200)`,
      `# 1. Enable MIG mode & create ${sliceCount} hardware-isolated ${migProfile} instances (admin)`,
      `sudo nvidia-smi -i 0 -mig 1`,
      `nvidia-smi mig -lgip`,
      `sudo nvidia-smi mig -i 0 -cgi ${profileList} -C`,
      `nvidia-smi -L   # Copy the MIG-<uuid> identifiers below`,
      ``,
      `# 2. Launch isolated GROMACS replicas with non-overlapping -pinoffset`,
      `CUDA_VISIBLE_DEVICES="MIG-<uuid-0>" gmx mdrun -s sim_0/${deffnm}.tpr -deffnm sim_0/${deffnm} \\`,
      `    -ntmpi 1 -ntomp 4 ${offloadFlags} -pin on -pinoffset 0 &`,
      `CUDA_VISIBLE_DEVICES="MIG-<uuid-1>" gmx mdrun -s sim_1/${deffnm}.tpr -deffnm sim_1/${deffnm} \\`,
      `    -ntmpi 1 -ntomp 4 ${offloadFlags} -pin on -pinoffset 4 &`,
      `wait`,
      ``,
      `# 3. Reset MIG partitions when finished (admin)`,
      `# sudo nvidia-smi mig -i 0 -dci && sudo nvidia-smi mig -i 0 -dgi && sudo nvidia-smi -i 0 -mig 0`,
    ].join('\n');
  }, [scenario, pipeline, ntomp, deffnm, ngcRuntime, ngcTag, mpsCount, mpsMode, migProfile, legacyVars]);

  return (
    <section className="space-y-6">
      <div className="surface-card p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#248a3d] dark:text-[#30d158]">
              NVIDIA GPU & NGC Acceleration Studio
            </span>
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.025em] text-[var(--text-primary)]">
              Maximize ns/day on NVIDIA CUDA Hardware
            </h2>
            <p className="text-[13.5px] text-[var(--text-secondary)] mt-1">
              Interactive offload architecture & launch generator built from NVIDIA GROMACS Docs and{' '}
              <span className="font-mono text-[12px]">Molecular-Dynamics/hpc/nvidia-gpu/</span>.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <SegmentedControl<GpuScenario>
            layoutId="nvidia-scenario-seg"
            wrap
            className="w-fit max-w-full"
            value={scenario}
            onChange={selectScenario}
            options={[
              { value: 'single', label: 'Single GPU', icon: <Zap className="w-3.5 h-3.5" /> },
              { value: 'multigpu', label: 'Multi-GPU Direct', icon: <Network className="w-3.5 h-3.5" /> },
              { value: 'cufftmp', label: 'cuFFTMp PME', icon: <Server className="w-3.5 h-3.5" /> },
              { value: 'ngc', label: 'NGC Container', icon: <Container className="w-3.5 h-3.5" /> },
              { value: 'mps', label: 'CUDA MPS', icon: <Layers className="w-3.5 h-3.5" /> },
              { value: 'mig', label: 'A100/H100 MIG', icon: <Cpu className="w-3.5 h-3.5" /> },
            ]}
          />
        </div>
      </div>

      {/* Signature Interactive GPU Offload Architecture Motion Graphic */}
      <GpuOffloadDiagram state={pipeline} onToggleTask={toggleTask} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Configuration Panel */}
        <div className="lg:col-span-5 surface-card p-5 sm:p-6 space-y-4">
          <h3 className="text-[16px] font-semibold tracking-[-0.02em]">
            Hardware & Runtime Parameters
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                TPR Prefix (-deffnm)
              </label>
              <input
                value={deffnm}
                onChange={(e) => setDeffnm(e.target.value)}
                className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                OpenMP Threads / Rank
              </label>
              <input
                type="number"
                min={1}
                max={32}
                value={ntomp}
                onChange={(e) => setNtomp(Math.max(1, Number(e.target.value)))}
                className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
              />
            </div>
          </div>

          {(scenario === 'multigpu' || scenario === 'cufftmp' || scenario === 'ngc') && (
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] font-medium flex justify-between">
                <span>GPU Count</span>
                <span className="font-mono text-[var(--text-primary)]">{pipeline.gpus} GPUs</span>
              </label>
              <input
                type="range"
                min={scenario === 'ngc' ? 1 : 2}
                max={scenario === 'cufftmp' ? 32 : 8}
                step={scenario === 'cufftmp' ? 2 : 1}
                value={pipeline.gpus}
                onChange={(e) =>
                  setPipeline((p) => ({ ...p, gpus: Number(e.target.value) }))
                }
                className="ui-slider w-full mt-2"
              />
            </div>
          )}

          {scenario === 'ngc' && (
            <div className="space-y-3 pt-1">
              <SegmentedControl<'docker' | 'singularity'>
                layoutId="ngc-runtime-seg"
                size="sm"
                value={ngcRuntime}
                onChange={setNgcRuntime}
                options={[
                  { value: 'docker', label: 'Docker (Workstation / Cloud)' },
                  { value: 'singularity', label: 'Singularity / Apptainer (HPC)' },
                ]}
              />
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  NGC Tag (nvcr.io/hpc/gromacs)
                </label>
                <input
                  value={ngcTag}
                  onChange={(e) => setNgcTag(e.target.value)}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
            </div>
          )}

          {scenario === 'mps' && (
            <div className="space-y-3 pt-1">
              <SegmentedControl<'multidir' | 'independent'>
                layoutId="mps-mode-seg"
                size="sm"
                value={mpsMode}
                onChange={setMpsMode}
                options={[
                  { value: 'multidir', label: 'MPI -multidir' },
                  { value: 'independent', label: 'Independent + -pinoffset' },
                ]}
              />
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium flex justify-between">
                  <span>Concurrent Simulations on 1 GPU</span>
                  <span className="font-mono text-[var(--text-primary)]">{mpsCount} sims</span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={8}
                  value={mpsCount}
                  onChange={(e) => setMpsCount(Number(e.target.value))}
                  className="ui-slider w-full mt-2"
                />
              </div>
            </div>
          )}

          {scenario === 'mig' && (
            <div>
              <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                A100 / H100 MIG Slice Profile
              </label>
              <select
                value={migProfile}
                onChange={(e) =>
                  setMigProfile(e.target.value as '1g.10gb' | '2g.20gb' | '3g.40gb')
                }
                className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
              >
                <option value="1g.10gb">1g.10gb (4+ slices — small soluble proteins)</option>
                <option value="2g.20gb">2g.20gb (2–3 slices — medium complexes)</option>
                <option value="3g.40gb">3g.40gb (2 slices — large membranes)</option>
              </select>
            </div>
          )}

          <div className="divide-y divide-[var(--border-hairline)] pt-2">
            <ToggleSwitch
              checked={pipeline.directComm}
              onChange={(v) => setPipeline((p) => ({ ...p, directComm: v }))}
              label="GMX_ENABLE_DIRECT_GPU_COMM=1"
              description="Direct GPU-to-GPU halo & PME-PP comms (GROMACS 2022+)"
              accent="green"
            />
            <ToggleSwitch
              checked={pipeline.cudaGraph}
              onChange={(v) => setPipeline((p) => ({ ...p, cudaGraph: v }))}
              label="GMX_CUDA_GRAPH=1"
              description="Reduces CUDA kernel launch overhead on single-GPU runs (2023+)"
              accent="green"
            />
            <ToggleSwitch
              checked={pipeline.pmeDecomp}
              onChange={(v) => setPipeline((p) => ({ ...p, pmeDecomp: v }))}
              label="GMX_GPU_PME_DECOMPOSITION=1"
              description="Distributes 3D PME FFT across multiple GPUs with cuFFTMp"
              accent="green"
            />
            <ToggleSwitch
              checked={legacyVars}
              onChange={setLegacyVars}
              label="Include GROMACS 2020–2021 Legacy Vars"
              description="GMX_GPU_DD_COMMS, GMX_GPU_PME_PP_COMMS, GMX_FORCE_UPDATE_DEFAULT_GPU"
            />
          </div>
        </div>

        {/* Output Script */}
        <div className="lg:col-span-7 space-y-4">
          <CodeShowcase
            title={`nvidia_${scenario}_gromacs.sh`}
            subtitle="Copy or download executable NVIDIA GPU script"
            code={generatedScript}
            filename={`nvidia_${scenario}_gromacs.sh`}
            language="bash"
            maxHeight="420px"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="surface-card p-4">
              <div className="text-[12px] font-semibold text-[#248a3d] dark:text-[#30d158]">
                MPS vs. MIG Quick Rule
              </div>
              <p className="text-[12.5px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                Use <strong>CUDA MPS</strong> on any NVIDIA GPU for flexible oversubscription (2–8 replicas/GPU). Use <strong>MIG</strong> on A100/H100 when you need strict hardware SM & VRAM isolation.
              </p>
            </div>
            <div className="surface-card p-4">
              <div className="text-[12px] font-semibold text-[var(--accent-blue)]">
                Required .mdp Pairing
              </div>
              <p className="text-[12.5px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                Pair <code className="font-mono">-update gpu</code> with{' '}
                <code className="font-mono">constraints = h-bonds</code> and{' '}
                <code className="font-mono">cutoff-scheme = Verlet</code>. Raise{' '}
                <code className="font-mono">-nstlist 100</code> to minimize neighbor searches.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
