import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Cpu,
  Flame,
  Gauge,
  Layers,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  MDP_PRESETS,
  MdpConfig,
  generateMdpText,
} from '../data/mdpPresets';
import {
  APPLE_SPRING,
  AnimatedNumber,
  CodeShowcase,
  SegmentedControl,
} from './ApplePrimitives';

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

export const StepWizardSection: React.FC<{
  onTelemetryChange?: (dtFs: number, tempK: number) => void;
}> = ({ onTelemetryChange }) => {
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
    onTelemetryChange?.(p.config.dt * 1000, p.config.temperature);
  };

  const isEM = preset.config.integrator === 'steep';

  // Unit display conversions
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
  // Rough estimate: ~220 KB per frame for a typical 50k-atom solvated protein .xtc
  const estSizeGb = (totalFrames * 0.00022).toFixed(2);
  const gpuResidentReady = constraints === 'h-bonds' && preset.config.cutoffScheme === 'Verlet';

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
    }),
    [preset, dt, nsteps, timePs, temperature, nstlist, tcoupl, pcoupl, constraints, nstxoutCompressed]
  );

  const mdpText = useMemo(() => generateMdpText(mdpConfig), [mdpConfig]);

  const mdpFilename =
    preset.id === 'charmm36-lipid-bilayer'
      ? 'step7_production.mdp'
      : preset.id === 'energy-minimization'
      ? 'minim.mdp'
      : preset.id === 'nvt-equilibration'
      ? 'nvt.mdp'
      : preset.id === 'npt-equilibration'
      ? 'npt.mdp'
      : 'production.mdp';

  const companionCmd = isEM
    ? `gmx grompp -f ${mdpFilename} -c solv_ions.gro -p topol.top -o em.tpr\ngmx mdrun -v -deffnm em`
    : `gmx grompp -f ${mdpFilename} -c npt.gro -t npt.cpt -p topol.top -o md_0_1.tpr\ngmx mdrun -v -deffnm md_0_1 -nb gpu -pme gpu -bonded gpu -update gpu -nstlist ${Math.max(nstlist, 40)} -pin on`;

  return (
    <section className="space-y-6">
      {/* Preset Strip */}
      <div className="apple-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-blue)]">
              Force-Field & Stage Templates
            </span>
            <h2 className="text-[20px] sm:text-[22px] font-semibold tracking-[-0.025em] text-[var(--text-primary)]">
              Choose an MDP Protocol Preset
            </h2>
          </div>
          <span className="text-[12px] text-[var(--text-secondary)] font-mono">
            {preset.source}
          </span>
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
                      transition={APPLE_SPRING}
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
        <div className="apple-card p-5">
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

        <div className="apple-card p-5">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[12px] font-medium">
            <span>Simulation Duration</span>
            <Clock className="w-4 h-4 text-[#5856d6]" />
          </div>
          <div className="mt-2 text-[26px] sm:text-[30px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            <AnimatedNumber
              value={timeNs}
              format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(2)} µs` : v < 1 ? `${Math.round(v * 1000)} ps` : `${v.toFixed(v % 1 === 0 ? 0 : 1)} ns`)}
            />
          </div>
          <div className="mt-1 text-[11.5px] text-[var(--text-tertiary)] tabular-nums">
            {timePs.toLocaleString()} picoseconds
          </div>
        </div>

        <div className="apple-card p-5">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[12px] font-medium">
            <span>Compressed .xtc Frames</span>
            <Layers className="w-4 h-4 text-[#ff9f0a]" />
          </div>
          <div className="mt-2 text-[26px] sm:text-[30px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            <AnimatedNumber value={totalFrames} />
          </div>
          <div className="mt-1 text-[11.5px] text-[var(--text-tertiary)] tabular-nums">
            {isEM ? 'Minimization coordinates only' : `Every ${saveIntervalPs} ps (~${estSizeGb} GB / 50k atoms)`}
          </div>
        </div>

        <div className="apple-card p-5">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-[12px] font-medium">
            <span>GPU-Resident Ready</span>
            <CheckCircle2
              className={`w-4 h-4 ${
                gpuResidentReady ? 'text-[#30d158]' : 'text-[#ff9f0a]'
              }`}
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
        {/* Left Controls */}
        <div className="lg:col-span-5 apple-card p-5 sm:p-6 space-y-6">
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

          {/* Duration Input + Slider */}
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
                className="apple-input w-full px-4 py-3 text-[18px] font-semibold tabular-nums"
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
              className="apple-slider w-full"
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

          {/* Timestep & Temperature */}
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
                  { value: '0.004', label: '4 fs HMR' },
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
                className="apple-slider w-full mt-2"
              />
            </div>
          </div>

          {/* Thermostat, Barostat, Constraints, nstlist */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[var(--text-secondary)]">
                Thermostat (tcoupl)
              </label>
              <select
                value={tcoupl}
                onChange={(e) => setTcoupl(e.target.value)}
                className="apple-input w-full px-3 py-2 text-[13px]"
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
                className="apple-input w-full px-3 py-2 text-[13px]"
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
                className="apple-input w-full px-3 py-2 text-[13px]"
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
                className="apple-input w-full px-3 py-2 text-[13px]"
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
                className="apple-slider w-full"
              />
            </div>
          )}
        </div>

        {/* Right Live Code Preview */}
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
    </section>
  );
};
