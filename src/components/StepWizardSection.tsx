import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Cpu,
  Flame,
  Gauge,
  HardDrive,
  Layers,
  PackageCheck,
  Server,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  MDP_PRESETS,
  MdpConfig,
  generateMdpText,
} from '../data/mdpPresets';
import {
  UI_SPRING,
  AnimatedNumber,
  CodeShowcase,
  SegmentedControl,
} from './UiPrimitives';
import { downloadSimulationKitZip } from '../utils/simulationKit';

type TimeUnit = 'ps' | 'ns' | 'us';

const QUICK_TIMES_NS = [
  { label: '100 ps', ns: 0.1 },
  { label: '1 ns', ns: 1 },
  { label: '10 ns', ns: 10 },
  { label: '50 ns', ns: 50 },
  { label: '100 ns', ns: 100 },
  { label: '500 ns', ns: 500 },
  { label: '1 µs', ns: 1000 },
  { label: '5 µs', ns: 5000 },
];

interface HardwareProfile {
  id: string;
  label: string;
  short: string;
  /** Approximate ns/day for a 50,000-atom system at dt=2 fs */
  nsPerDayAt50k: number;
}

const HARDWARE_PROFILES: HardwareProfile[] = [
  { id: 'h100', label: 'NVIDIA H100 (80GB)', short: 'H100', nsPerDayAt50k: 520 },
  { id: 'a100', label: 'NVIDIA A100 (80GB)', short: 'A100', nsPerDayAt50k: 340 },
  { id: '4090', label: 'NVIDIA RTX 4090', short: 'RTX 4090', nsPerDayAt50k: 390 },
  { id: '4xa100', label: '4× NVIDIA A100 (Direct Comm)', short: '4× A100', nsPerDayAt50k: 780 },
  { id: 'cpu64', label: '64-Core HPC CPU Node', short: '64c CPU', nsPerDayAt50k: 65 },
];

const SYSTEM_SIZES = [
  { label: '30k (Peptide)', atoms: 30000 },
  { label: '65k (Protein)', atoms: 65000 },
  { label: '150k (Complex)', atoms: 150000 },
  { label: '250k (Membrane)', atoms: 250000 },
  { label: '500k (Assembly)', atoms: 500000 },
  { label: '1M (Capsid)', atoms: 1000000 },
];

export const StepWizardSection: React.FC<{
  onTelemetryChange?: (dtFs: number, tempK: number) => void;
  externalPresetId?: string | null;
}> = ({ onTelemetryChange, externalPresetId }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(MDP_PRESETS[0].id);
  const [unit, setUnit] = useState<TimeUnit>('ns');
  const [timeNs, setTimeNs] = useState<number>(100);
  const [dt, setDt] = useState<number>(0.002);
  const [temperature, setTemperature] = useState<number>(300);
  const [nstlist, setNstlist] = useState<number>(20);
  const [saveIntervalPs, setSaveIntervalPs] = useState<number>(10);
  const [tcoupl, setTcoupl] = useState<string>('V-rescale');
  const [pcoupl, setPcoupl] = useState<string>('Parrinello-Rahman');
  const [constraints, setConstraints] = useState<string>('h-bonds');
  const [pullGroup1, setPullGroup1] = useState<string>('Chain_B');
  const [pullGroup2, setPullGroup2] = useState<string>('Chain_A');
  const [pullRate, setPullRate] = useState<number>(0.01);
  const [pullK, setPullK] = useState<number>(1000);
  const [pullDim, setPullDim] = useState<string>('N N Y');
  const [fepMoltype, setFepMoltype] = useState<string>('LIG');
  const [fepLambdaState, setFepLambdaState] = useState<number>(0);
  const [fepScAlpha, setFepScAlpha] = useState<number>(0.5);
  const [awhStart, setAwhStart] = useState<number>(0.4);
  const [awhEnd, setAwhEnd] = useState<number>(3.0);
  const [awhK, setAwhK] = useState<number>(12800);
  const [awhShare, setAwhShare] = useState<'yes' | 'no'>('yes');

  // HPC Walltime & Storage Estimator state
  const [atoms, setAtoms] = useState<number>(65000);
  const [hardwareId, setHardwareId] = useState<string>('a100');
  const [queueHours, setQueueHours] = useState<number>(24);
  const [exportingZip, setExportingZip] = useState<boolean>(false);
  const [zipToast, setZipToast] = useState<string | null>(null);

  const preset = useMemo(
    () => MDP_PRESETS.find((p) => p.id === selectedPresetId) ?? MDP_PRESETS[0],
    [selectedPresetId]
  );

  const applyPreset = (id: string) => {
    const p = MDP_PRESETS.find((item) => item.id === id);
    if (!p) return;
    setSelectedPresetId(id);
    setTimeNs(p.defaultTimeNs);
    setDt(p.config.dt);
    setTemperature(p.config.temperature);
    setNstlist(p.config.nstlist);
    setTcoupl(p.config.tcoupl);
    setPcoupl(p.config.pcoupl);
    setConstraints(p.config.constraints);
    if (p.config.nstxoutCompressed > 0) {
      setSaveIntervalPs(Math.max(1, Math.round(p.config.nstxoutCompressed * p.config.dt)));
    }
    if (p.config.pull) {
      setPullGroup1(p.config.pull.group1);
      setPullGroup2(p.config.pull.group2);
      setPullRate(p.config.pull.rate);
      setPullK(p.config.pull.k);
      setPullDim(p.config.pull.dim);
    }
    if (p.config.fep) {
      setFepMoltype(p.config.fep.coupleMoltype);
      setFepLambdaState(p.config.fep.initLambdaState);
      setFepScAlpha(p.config.fep.scAlpha);
    }
    if (p.config.awh) {
      setAwhStart(p.config.awh.start);
      setAwhEnd(p.config.awh.end);
      setAwhK(p.config.awh.forceConstant);
      setAwhShare(p.config.awh.shareMultisim);
    }
    if (id === 'charmm36-lipid-bilayer') setAtoms(250000);
    onTelemetryChange?.(p.config.dt * 1000, p.config.temperature);
  };

  React.useEffect(() => {
    if (externalPresetId && externalPresetId !== selectedPresetId) {
      applyPreset(externalPresetId);
    }
  }, [externalPresetId]);

  const isEM = preset.config.integrator === 'steep';

  const displayTime = useMemo(() => {
    if (unit === 'ps') return Math.round(timeNs * 1000);
    if (unit === 'us') return Number((timeNs / 1000).toFixed(4));
    return Number(timeNs.toFixed(3));
  }, [timeNs, unit]);

  const handleTimeInput = (raw: number) => {
    if (Number.isNaN(raw) || raw < 0) return;
    let nextNs = raw;
    if (unit === 'ps') nextNs = raw / 1000;
    if (unit === 'us') nextNs = raw * 1000;
    setTimeNs(Math.min(5000, Math.max(0.001, nextNs)));
  };

  const timePs = Math.round(timeNs * 1000);
  const nsteps = isEM ? Math.max(1000, Math.round(timePs * 5)) : Math.max(1, Math.round(timePs / dt));
  const nstxoutCompressed = Math.max(1, Math.round(saveIntervalPs / dt));
  const totalFrames = isEM ? 0 : Math.floor(nsteps / nstxoutCompressed);

  // Realistic .xtc compressed trajectory footprint (~4.2 bytes / atom / frame)
  const estSizeGb = (totalFrames * atoms * 4.2) / 1e9;
  const gpuResidentReady = constraints === 'h-bonds' && preset.config.cutoffScheme === 'Verlet';

  // Realistic throughput & walltime estimation
  const hw = HARDWARE_PROFILES.find((h) => h.id === hardwareId) ?? HARDWARE_PROFILES[1];
  const dtScale = dt / 0.002;
  const gpuPenalty = gpuResidentReady || hw.id === 'cpu64' ? 1 : 0.72;
  const estNsPerDay = Math.max(
    1,
    hw.nsPerDayAt50k * Math.pow(50000 / atoms, 0.88) * dtScale * gpuPenalty
  );
  const estWallHours = isEM ? 0.05 : (timeNs / estNsPerDay) * 24;
  const slurmMaxh = Math.max(0.5, Number((queueHours * 0.98).toFixed(1)));
  const slurmSegments = Math.max(1, Math.ceil(estWallHours / slurmMaxh));

  const mdpConfig: MdpConfig = useMemo(
    () => ({
      ...preset.config,
      dt,
      nsteps,
      timePs,
      temperature,
      nstlist,
      tcoupl,
      pcoupl,
      constraints,
      nstxoutCompressed,
      pull: preset.config.pull
        ? {
            ...preset.config.pull,
            group1: pullGroup1,
            group2: pullGroup2,
            rate: pullRate,
            k: pullK,
            dim: pullDim,
          }
        : undefined,
      fep: preset.config.fep
        ? {
            ...preset.config.fep,
            coupleMoltype: fepMoltype,
            initLambdaState: fepLambdaState,
            scAlpha: fepScAlpha,
          }
        : undefined,
      awh: preset.config.awh
        ? {
            ...preset.config.awh,
            start: awhStart,
            end: awhEnd,
            forceConstant: awhK,
            shareMultisim: awhShare,
          }
        : undefined,
    }),
    [
      preset,
      dt,
      nsteps,
      timePs,
      temperature,
      nstlist,
      tcoupl,
      pcoupl,
      constraints,
      nstxoutCompressed,
      pullGroup1,
      pullGroup2,
      pullRate,
      pullK,
      pullDim,
      fepMoltype,
      fepLambdaState,
      fepScAlpha,
      awhStart,
      awhEnd,
      awhK,
      awhShare,
    ]
  );

  const mdpText = useMemo(() => generateMdpText(mdpConfig), [mdpConfig]);

  const mdpFilename =
    preset.id === 'charmm36-lipid-bilayer'
      ? 'step7_production.mdp'
      : preset.id === 'steered-md-pull'
      ? 'md_pull.mdp'
      : preset.id === 'umbrella-sampling-window'
      ? 'md_umbrella.mdp'
      : preset.id === 'fep-alchemical-decoupling'
      ? 'fep_lambda.mdp'
      : preset.id === 'awh-adaptive-bias'
      ? 'awh_md.mdp'
      : preset.id === 'martini3-coarse-grained'
      ? 'martini3_prod.mdp'
      : preset.id === 'hmr-4fs-production'
      ? 'production_hmr_4fs.mdp'
      : preset.id === 'energy-minimization'
      ? 'minim.mdp'
      : preset.id === 'nvt-equilibration'
      ? 'nvt.mdp'
      : preset.id === 'npt-equilibration'
      ? 'npt.mdp'
      : 'production.mdp';

  const companionCmd = isEM
    ? `gmx grompp -f ${mdpFilename} -c solv_ions.gro -p topol.top -o em.tpr\ngmx mdrun -v -deffnm em`
    : preset.config.fep
    ? `gmx grompp -f ${mdpFilename} -c npt.gro -t npt.cpt -p topol.top -o fep_${fepLambdaState}.tpr\ngmx mdrun -v -deffnm fep_${fepLambdaState} -dhdl dhdl_${fepLambdaState}.xvg -nb gpu -pme gpu -bonded gpu -pin on`
    : preset.config.awh
    ? `mpirun -np 4 gmx_mpi mdrun -multidir walker_{0..3} -deffnm awh -nb gpu -pme gpu -bonded gpu -update gpu -pin on\ngmx_mpi awh -f walker_0/awh.edr -s walker_0/awh.tpr -o pmf.xvg -more`
    : preset.config.pull
    ? `gmx grompp -f ${mdpFilename} -c npt.gro -r npt.gro -t npt.cpt -p topol.top -n index.ndx -o ${preset.id === 'steered-md-pull' ? 'pull' : 'umbrella0'}.tpr\ngmx mdrun -v -deffnm ${preset.id === 'steered-md-pull' ? 'pull' : 'umbrella0'} -pf pullf.xvg -px pullx.xvg -nb gpu -pme gpu -bonded gpu -update gpu -pin on`
    : preset.id === 'martini3-coarse-grained'
    ? `gmx grompp -f ${mdpFilename} -c em.gro -p topol.top -o md_cg.tpr -maxwarn 1\ngmx mdrun -v -deffnm md_cg -nb gpu -bonded gpu -update gpu -nstlist 40 -pin on`
    : `gmx grompp -f ${mdpFilename} -c npt.gro -t npt.cpt -p topol.top -o md_0_1.tpr\ngmx mdrun -v -deffnm md_0_1 -nb gpu -pme gpu -bonded gpu -update gpu -nstlist ${Math.max(nstlist, 40)} -pin on -maxh ${slurmMaxh}`;

  const handleDownloadKit = async () => {
    setExportingZip(true);
    try {
      const filename = await downloadSimulationKitZip({
        productionConfig: mdpConfig,
        presetName: preset.name,
        mdpFilename,
        slurmMaxh,
        estimatedNsPerDay: estNsPerDay,
      });
      setZipToast(`Exported ${filename} (8 files)`);
      setTimeout(() => setZipToast(null), 3200);
    } finally {
      setExportingZip(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Preset Strip + One-Click ZIP Bundle Export */}
      <div className="surface-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-blue)]">
              Force-Field & Stage Templates
            </span>
            <h2 className="text-[20px] sm:text-[22px] font-semibold tracking-[-0.025em] text-[var(--text-primary)]">
              Choose an MDP Protocol Preset
            </h2>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {zipToast && (
              <span className="text-[12px] font-medium text-[#248a3d] dark:text-[#30d158] bg-[#30d158]/14 px-3 py-1.5 rounded-full">
                {zipToast}
              </span>
            )}
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              disabled={exportingZip}
              onClick={handleDownloadKit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium shadow-[0_6px_18px_rgba(0,113,227,0.28)] transition-colors cursor-pointer disabled:opacity-60"
            >
              <PackageCheck className="w-4 h-4" />
              <span>{exportingZip ? 'Packaging ZIP...' : 'Download Full MD Kit (.zip)'}</span>
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {MDP_PRESETS.map((p) => {
            const active = p.id === selectedPresetId;
            return (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`relative text-left p-3.5 rounded-[18px] border transition-all cursor-pointer ${
                  active
                    ? 'border-[var(--accent-blue)] bg-[#0071e3]/[0.07] shadow-[0_6px_20px_rgba(0,113,227,0.12)]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                      p.badge === 'NVIDIA GPU'
                        ? 'bg-[#30d158]/15 text-[#248a3d] dark:text-[#30d158]'
                        : active
                        ? 'bg-[#0071e3] text-white'
                        : 'bg-[var(--bg-solid)] text-[var(--text-secondary)] border border-[var(--border-hairline)]'
                    }`}
                  >
                    {p.badge}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="active-preset-dot"
                      transition={UI_SPRING}
                      className="w-2 h-2 rounded-full bg-[var(--accent-blue)]"
                    />
                  )}
                </div>
                <div className="text-[13.5px] font-semibold text-[var(--text-primary)] leading-snug">
                  {p.name}
                </div>
                <div className="text-[11.5px] text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                  {p.subtitle}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Animated KPI Telemetry Bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[12px] font-medium">
            <span>Calculated nsteps</span>
            <Gauge className="w-4 h-4 text-[var(--accent-blue)]" />
          </div>
          <div className="mt-2 text-[26px] sm:text-[30px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            <AnimatedNumber value={nsteps} />
          </div>
          <div className="mt-1 text-[11.5px] text-[var(--text-tertiary)] font-mono">
            {isEM ? 'Steepest-descent cap' : `${timePs.toLocaleString()} ps / ${dt} ps`}
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[12px] font-medium">
            <span>Simulation Duration</span>
            <Clock className="w-4 h-4 text-[#5856d6]" />
          </div>
          <div className="mt-2 text-[26px] sm:text-[30px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            <AnimatedNumber
              value={timeNs}
              format={(v) =>
                v >= 1000
                  ? `${(v / 1000).toFixed(2)} µs`
                  : v < 1
                  ? `${Math.round(v * 1000)} ps`
                  : `${v.toFixed(v % 1 === 0 ? 0 : 1)} ns`
              }
            />
          </div>
          <div className="mt-1 text-[11.5px] text-[var(--text-tertiary)] tabular-nums">
            {timePs.toLocaleString()} picoseconds
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[12px] font-medium">
            <span>Compressed .xtc Frames</span>
            <Layers className="w-4 h-4 text-[#ff9f0a]" />
          </div>
          <div className="mt-2 text-[26px] sm:text-[30px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            <AnimatedNumber value={totalFrames} />
          </div>
          <div className="mt-1 text-[11.5px] text-[var(--text-tertiary)] tabular-nums">
            {isEM
              ? 'Minimization coordinates only'
              : `Every ${saveIntervalPs} ps (~${estSizeGb.toFixed(2)} GB @ ${(atoms / 1000).toFixed(0)}k atoms)`}
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[12px] font-medium">
            <span>GPU-Resident Ready</span>
            <CheckCircle2
              className={`w-4 h-4 ${gpuResidentReady ? 'text-[#30d158]' : 'text-[#ff9f0a]'}`}
            />
          </div>
          <div
            className={`mt-2 text-[22px] sm:text-[26px] font-semibold tracking-[-0.03em] ${
              gpuResidentReady ? 'text-[#248a3d] dark:text-[#30d158]' : 'text-[#ff9f0a]'
            }`}
          >
            {gpuResidentReady ? 'Compatible' : 'CPU Update'}
          </div>
          <div className="mt-1 text-[11.5px] text-[var(--text-tertiary)]">
            {gpuResidentReady
              ? 'Verlet + h-bonds supports -update gpu'
              : 'Switch constraints to h-bonds for -update gpu'}
          </div>
        </div>
      </div>

      {/* Main Split: Controls + Live MDP Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 surface-card p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[var(--accent-blue)]" />
              <h3 className="text-[16px] font-semibold tracking-[-0.02em]">
                Step & Ensemble Controls
              </h3>
            </div>
            <SegmentedControl<TimeUnit>
              layoutId="time-unit-seg"
              size="sm"
              value={unit}
              onChange={setUnit}
              options={[
                { value: 'ps', label: 'ps' },
                { value: 'ns', label: 'ns' },
                { value: 'us', label: 'µs' },
              ]}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <label htmlFor="sim-time-input" className="font-medium text-[var(--text-primary)]">
                Simulation Time ({unit})
              </label>
              <span className="text-[12px] text-[var(--text-secondary)] tabular-nums">
                Range: 1 ps – 5,000 ns (5 µs)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="sim-time-input"
                type="number"
                step={unit === 'us' ? '0.05' : unit === 'ns' ? '1' : '100'}
                min="0"
                max={unit === 'ps' ? 5000000 : unit === 'ns' ? 5000 : 5}
                value={displayTime}
                onChange={(e) => handleTimeInput(parseFloat(e.target.value))}
                className="ui-input w-full px-4 py-3 text-[18px] font-semibold tabular-nums"
              />
              <span className="text-[13px] font-mono text-[var(--text-secondary)] shrink-0">
                {unit}
              </span>
            </div>

            <input
              type="range"
              aria-label="Simulation duration logarithmic slider"
              min={0}
              max={1000}
              value={Math.round(((Math.log10(Math.max(0.001, timeNs)) + 3) / 6.699) * 1000)}
              onChange={(e) => {
                const frac = Number(e.target.value) / 1000;
                const valNs = Math.pow(10, frac * 6.699 - 3);
                const rounded = valNs >= 10 ? Math.round(valNs) : Number(valNs.toFixed(2));
                setTimeNs(Math.min(5000, Math.max(0.001, rounded)));
              }}
              className="ui-slider w-full"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_TIMES_NS.map((q) => {
                const active = Math.abs(timeNs - q.ns) < 0.0001;
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setTimeNs(q.ns)}
                    className={`px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-[var(--accent-blue)] text-white shadow-xs'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-[var(--border-hairline)]" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[12.5px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-blue)]" /> Integration Step (dt)
              </label>
              <SegmentedControl<string>
                layoutId="dt-seg"
                size="sm"
                className="w-full justify-between"
                value={String(dt)}
                onChange={(val) => {
                  const n = parseFloat(val);
                  setDt(n);
                  onTelemetryChange?.(n * 1000, temperature);
                }}
                options={[
                  { value: '0.001', label: '1 fs' },
                  { value: '0.002', label: '2 fs' },
                  { value: '0.004', label: '4 fs' },
                  { value: '0.02', label: '20 fs CG' },
                ]}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[12.5px] font-medium text-[var(--text-secondary)] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#ff9f0a]" /> Temperature
                </span>
                <span className="font-mono text-[var(--text-primary)]">{temperature} K</span>
              </label>
              <input
                type="range"
                min={250}
                max={400}
                step={0.5}
                value={temperature}
                onChange={(e) => {
                  const t = parseFloat(e.target.value);
                  setTemperature(t);
                  onTelemetryChange?.(dt * 1000, t);
                }}
                className="ui-slider w-full mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[var(--text-secondary)]">
                Thermostat (tcoupl)
              </label>
              <select
                value={tcoupl}
                onChange={(e) => setTcoupl(e.target.value)}
                className="ui-input w-full px-3 py-2 text-[13px]"
              >
                <option value="V-rescale">V-rescale (Recommended)</option>
                <option value="Nose-Hoover">Nose-Hoover (Membranes)</option>
                <option value="berendsen">berendsen (Equil only)</option>
                <option value="no">no (NVE / EM)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[var(--text-secondary)]">
                Barostat (pcoupl)
              </label>
              <select
                value={pcoupl}
                onChange={(e) => setPcoupl(e.target.value)}
                className="ui-input w-full px-3 py-2 text-[13px]"
              >
                <option value="Parrinello-Rahman">Parrinello-Rahman</option>
                <option value="C-rescale">C-rescale (GROMACS 2021+)</option>
                <option value="berendsen">berendsen (Equil only)</option>
                <option value="no">no (NVT / EM)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[var(--text-secondary)]">
                Constraints
              </label>
              <select
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                className="ui-input w-full px-3 py-2 text-[13px]"
              >
                <option value="h-bonds">h-bonds (GPU-Resident)</option>
                <option value="all-bonds">all-bonds (CPU Update)</option>
                <option value="none">none</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Neighbor List (nstlist)
              </label>
              <select
                value={nstlist}
                onChange={(e) => setNstlist(Number(e.target.value))}
                className="ui-input w-full px-3 py-2 text-[13px]"
              >
                <option value={10}>10 (Classic CPU)</option>
                <option value={20}>20 (Standard Verlet)</option>
                <option value={40}>40 (Balanced GPU)</option>
                <option value={100}>100 (NVIDIA A100/H100)</option>
                <option value={200}>200 (Max GPU Throughput)</option>
              </select>
            </div>
          </div>

          {!isEM && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="font-medium text-[var(--text-secondary)]">
                  Save .xtc Trajectory Every
                </span>
                <span className="font-mono text-[var(--text-primary)] tabular-nums">
                  {saveIntervalPs} ps ({nstxoutCompressed.toLocaleString()} steps)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={saveIntervalPs}
                onChange={(e) => setSaveIntervalPs(Number(e.target.value))}
                className="ui-slider w-full"
              />
            </div>
          )}

          {preset.config.pull && (
            <div className="pt-2 border-t border-[var(--border-hairline)] space-y-3">
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-blue)]">
                COM Pull / Umbrella Parameters
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">
                    Ref Group (group1)
                  </label>
                  <input
                    value={pullGroup1}
                    onChange={(e) => setPullGroup1(e.target.value)}
                    className="ui-input w-full px-3 py-1.5 text-[12.5px] font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">
                    Pull Group (group2)
                  </label>
                  <input
                    value={pullGroup2}
                    onChange={(e) => setPullGroup2(e.target.value)}
                    className="ui-input w-full px-3 py-1.5 text-[12.5px] font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">
                    Pull Rate (nm/ps)
                  </label>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    max="0.1"
                    value={pullRate}
                    onChange={(e) => setPullRate(Number(e.target.value))}
                    className="ui-input w-full px-3 py-1.5 text-[12.5px] font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">
                    Force k (kJ/mol/nm²)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="100"
                    max="5000"
                    value={pullK}
                    onChange={(e) => setPullK(Number(e.target.value))}
                    className="ui-input w-full px-3 py-1.5 text-[12.5px] font-mono mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">
                    Pull Axis (pull-coord1-dim)
                  </label>
                  <select
                    value={pullDim}
                    onChange={(e) => setPullDim(e.target.value)}
                    className="ui-input w-full px-3 py-1.5 text-[12.5px] font-mono mt-1"
                  >
                    <option value="N N Y">N N Y (Z-axis only — membrane / aligned)</option>
                    <option value="Y Y Y">Y Y Y (3D radial distance)</option>
                    <option value="Y N N">Y N N (X-axis only)</option>
                    <option value="N Y N">N Y N (Y-axis only)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {preset.config.fep && (
            <div className="pt-2 border-t border-[var(--border-hairline)] space-y-3">
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-blue)]">
                Alchemical FEP / ABFE Parameters
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">
                    couple-moltype
                  </label>
                  <input
                    value={fepMoltype}
                    onChange={(e) => setFepMoltype(e.target.value)}
                    className="ui-input w-full px-3 py-1.5 text-[12.5px] font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">
                    λ State (0–20)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={fepLambdaState}
                    onChange={(e) => setFepLambdaState(Math.min(20, Math.max(0, Number(e.target.value))))}
                    className="ui-input w-full px-3 py-1.5 text-[12.5px] font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">
                    sc-alpha
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={1}
                    value={fepScAlpha}
                    onChange={(e) => setFepScAlpha(Number(e.target.value))}
                    className="ui-input w-full px-3 py-1.5 text-[12.5px] font-mono mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {preset.config.awh && (
            <div className="pt-2 border-t border-[var(--border-hairline)] space-y-3">
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-blue)]">
                AWH Adaptive Biasing Range
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">
                    Start (nm)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={awhStart}
                    onChange={(e) => setAwhStart(Number(e.target.value))}
                    className="ui-input w-full px-3 py-1.5 text-[12.5px] font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">
                    End (nm)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={awhEnd}
                    onChange={(e) => setAwhEnd(Number(e.target.value))}
                    className="ui-input w-full px-3 py-1.5 text-[12.5px] font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">
                    Force k (kJ/mol/nm²)
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={awhK}
                    onChange={(e) => setAwhK(Number(e.target.value))}
                    className="ui-input w-full px-3 py-1.5 text-[12.5px] font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">
                    Share Multisim
                  </label>
                  <select
                    value={awhShare}
                    onChange={(e) => setAwhShare(e.target.value as 'yes' | 'no')}
                    className="ui-input w-full px-3 py-1.5 text-[12.5px] font-mono mt-1"
                  >
                    <option value="yes">yes (-multidir walkers)</option>
                    <option value="no">no (single walker)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 space-y-4">
          <CodeShowcase
            title={mdpFilename}
            subtitle={`${nsteps.toLocaleString()} steps • ${preset.name}`}
            code={mdpText}
            filename={mdpFilename}
            language="mdp"
            maxHeight="460px"
          />

          <CodeShowcase
            title="Companion GROMACS Run Commands"
            subtitle="Preprocess .tpr & launch GPU-accelerated mdrun"
            code={companionCmd}
            language="bash"
            compact
            maxHeight="140px"
          />
        </div>
      </div>

      {/* HPC Walltime, SLURM -maxh & Storage Estimator */}
      <div className="surface-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#248a3d] dark:text-[#30d158] inline-flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> HPC Capacity & Queue Planner
            </span>
            <h3 className="text-[18px] sm:text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] mt-0.5">
              Walltime, SLURM <code className="font-mono text-[16px]">-maxh</code> &amp; Storage Estimator
            </h3>
          </div>
          <span className="text-[12px] text-[var(--text-secondary)]">
            Illustrative scaling estimates for planning SLURM allocations
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-[var(--text-secondary)]">
                  Target Compute Hardware
                </label>
                <select
                  value={hardwareId}
                  onChange={(e) => setHardwareId(e.target.value)}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1"
                >
                  {HARDWARE_PROFILES.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-medium text-[var(--text-secondary)]">
                  SLURM Queue Limit (hours)
                </label>
                <select
                  value={queueHours}
                  onChange={(e) => setQueueHours(Number(e.target.value))}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                >
                  <option value={12}>12 hours (-maxh 11.8)</option>
                  <option value={24}>24 hours (-maxh 23.5)</option>
                  <option value={48}>48 hours (-maxh 47.0)</option>
                  <option value={72}>72 hours (-maxh 70.6)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="font-medium text-[var(--text-secondary)]">
                  System Atom Count (Protein + Solvent + Ions)
                </span>
                <span className="font-mono font-semibold text-[var(--text-primary)] tabular-nums">
                  {atoms.toLocaleString()} atoms
                </span>
              </div>
              <input
                type="range"
                min={10000}
                max={1000000}
                step={5000}
                value={atoms}
                onChange={(e) => setAtoms(Number(e.target.value))}
                className="ui-slider w-full"
              />
              <div className="flex flex-wrap gap-1.5">
                {SYSTEM_SIZES.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setAtoms(s.atoms)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                      atoms === s.atoms
                        ? 'bg-[var(--accent-blue)] text-white'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-[18px] bg-[var(--bg-subtle)] border border-[var(--border-hairline)]">
              <div className="text-[11.5px] text-[var(--text-secondary)] font-medium">
                Est. Throughput ({hw.short})
              </div>
              <div className="mt-1 text-[24px] font-semibold tracking-[-0.025em] text-[#248a3d] dark:text-[#30d158]">
                <AnimatedNumber value={estNsPerDay} format={(v) => `${Math.round(v)} ns/d`} />
              </div>
              <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                @ dt = {dt * 1000} fs
              </div>
            </div>

            <div className="p-4 rounded-[18px] bg-[var(--bg-subtle)] border border-[var(--border-hairline)]">
              <div className="text-[11.5px] text-[var(--text-secondary)] font-medium">
                Est. Wall-Clock Time
              </div>
              <div className="mt-1 text-[24px] font-semibold tracking-[-0.025em] text-[var(--text-primary)]">
                <AnimatedNumber
                  value={estWallHours}
                  format={(h) => (h >= 48 ? `${(h / 24).toFixed(1)} days` : `${h.toFixed(1)} hrs`)}
                />
              </div>
              <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                For {timeNs >= 1000 ? `${(timeNs / 1000).toFixed(2)} µs` : `${timeNs} ns`}
              </div>
            </div>

            <div className="p-4 rounded-[18px] bg-[var(--bg-subtle)] border border-[var(--border-hairline)]">
              <div className="text-[11.5px] text-[var(--text-secondary)] font-medium">
                SLURM Chained Segments
              </div>
              <div className="mt-1 text-[24px] font-semibold tracking-[-0.025em] text-[var(--accent-blue)]">
                <AnimatedNumber value={slurmSegments} format={(n) => `${Math.max(1, Math.round(n))} job${Math.round(n) > 1 ? 's' : ''}`} />
              </div>
              <div className="text-[11px] font-mono text-[var(--text-tertiary)] mt-0.5">
                -maxh {slurmMaxh} -cpi -append
              </div>
            </div>

            <div className="p-4 rounded-[18px] bg-[var(--bg-subtle)] border border-[var(--border-hairline)]">
              <div className="text-[11.5px] text-[var(--text-secondary)] font-medium flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" /> Est. .xtc Disk Size
              </div>
              <div className="mt-1 text-[24px] font-semibold tracking-[-0.025em] text-[var(--text-primary)]">
                <AnimatedNumber
                  value={estSizeGb}
                  format={(g) => (g < 1 ? `${Math.round(g * 1024)} MB` : `${g.toFixed(2)} GB`)}
                />
              </div>
              <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                {totalFrames.toLocaleString()} frames · System group
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
