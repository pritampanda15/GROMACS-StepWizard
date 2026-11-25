import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Box,
  Bug,
  Check,
  CheckCircle2,
  Copy,
  FileSearch,
  FileText,
  Info,
  Search,
  Sparkles,
  Upload,
  Wand2,
  XCircle,
} from 'lucide-react';
import { CodeShowcase, SegmentedControl } from './UiPrimitives';

type InspectorMode = 'mdp' | 'xvg' | 'troubleshooter' | 'ions';

interface CrashEntry {
  id: string;
  errorPattern: string;
  stage: string;
  rootCause: string;
  fixes: string[];
  command: string;
}

const GROMACS_CRASH_DB: CrashEntry[] = [
  {
    id: 'lincs-settle',
    errorPattern: 'LINCS WARNING / step X: Water molecule starting at atom Y can not be settled',
    stage: 'Equilibration / Production',
    rootCause: 'Atomic overlap, unrelaxed steric clash, or overly aggressive timestep (dt) causing runaway forces.',
    fixes: [
      'Check Fmax from Energy Minimization — ensure Fmax < 1000 kJ/mol/nm (ideally < 500 for membranes).',
      'Start NVT with dt = 0.001 ps (1 fs) and position restraints (-DPOSRES) before stepping up to 2 fs.',
      'For 4 fs HMR runs, verify HMassRepartition was applied to topol.top and set lincs_iter = 2.',
      'Inspect the offending atom number Y in VMD/PyMOL to spot bad ligand geometry or overlapping atoms.',
    ],
    command: 'gmx energy -f em.edr -o potential.xvg && gmx grompp -f nvt.mdp -c em.gro -r em.gro -p topol.top -o nvt.tpr',
  },
  {
    id: '1-4-table',
    errorPattern: '1-4 interaction between atoms X and Y at distance Z is larger than the 1-4 table size',
    stage: 'MD Run / Blow-up',
    rootCause: 'System is blowing up — a bonded/torsion group stretched dramatically due to a bad ligand topology, missing exclusions, or high pressure shock.',
    fixes: [
      'Verify ligand .itp/.prm charges and dihedrals (CGenFF penalty scores > 50 often need refinement).',
      'Use C-rescale instead of Parrinello-Rahman during early NPT equilibration to avoid box oscillations.',
      'Confirm refcoord_scaling = com is set when combining position restraints with pressure coupling.',
    ],
    command: 'gmx trjconv -s nvt.tpr -f step*.pdb -o crash_check.pdb -pbc mol',
  },
  {
    id: 'dd-cell-size',
    errorPattern: 'There is no domain decomposition for N ranks that is compatible with the given box and a minimum cell size',
    stage: 'MPI / Multi-GPU Scaling',
    rootCause: 'Too many MPI ranks (-ntmpi / mpirun -np) for a small periodic box, or long-range constraints/restraints forcing a large minimum DD cell.',
    fixes: [
      'Reduce the number of MPI ranks (e.g., use 1–2 ranks with more OpenMP threads -ntomp 8 instead of 8 ranks).',
      'Pass -rdd <nm> explicitly only if needed, or switch small systems to single-GPU + CUDA MPS (-multidir).',
    ],
    command: 'gmx mdrun -v -deffnm md_0_1 -ntmpi 1 -ntomp 8 -nb gpu -pme gpu -bonded gpu -update gpu -pin on',
  },
  {
    id: 'atom-mismatch',
    errorPattern: 'Fatal error: number of coordinates in coordinate file (.gro) does not match topology (topol.top)',
    stage: 'grompp Preprocessing',
    rootCause: 'Atom counts drifted after manual ligand merging, gmx insert-molecules -replace, or forgetting to update [ molecules ] in topol.top.',
    fixes: [
      'Compute (topology_atoms - gro_atoms) / 3 for 3-point water (TIP3P/SPC/E) and subtract from SOL in topol.top.',
      'Check line 2 of complex.gro — it must equal the exact number of atom lines below it.',
      'Verify ligand residue order in [ molecules ] matches the exact order of coordinates in the .gro file.',
    ],
    command: 'tail -n 20 topol.top && head -n 3 complex.gro',
  },
  {
    id: 'update-gpu-disabled',
    errorPattern: 'Update groups can not be used / -update gpu is not supported for this system',
    stage: 'NVIDIA GPU Offload',
    rootCause: 'Constraints set to all-bonds, Nose-Hoover/Parrinello-Rahman incompatible combo in older GROMACS, or pull/FEP features forcing CPU updates.',
    fixes: [
      'Set constraints = h-bonds (not all-bonds) and cutoff-scheme = Verlet in your .mdp file.',
      'Use V-rescale + C-rescale (or Parrinello-Rahman in GROMACS 2022+) for full GPU-resident updates.',
      'For alchemical FEP decoupling, omit -update gpu and keep -nb gpu -pme gpu -bonded gpu.',
    ],
    command: 'gmx mdrun -v -deffnm md_0_1 -nb gpu -pme gpu -bonded gpu -update gpu -nstlist 100 -pin on',
  },
  {
    id: 'checkpoint-append',
    errorPattern: 'Output file appending has been requested, but some output files listed in the checkpoint (.cpt) are not present or modified',
    stage: 'Restart / Extend on HPC',
    rootCause: 'An existing .xtc/.edr/.log file was moved, truncated, or renamed between SLURM segments.',
    fixes: [
      'Keep all deffnm outputs (.xtc, .edr, .log, .cpt) intact in the working directory when using -append.',
      'If files were archived or truncated, restart cleanly with -noappend (creates part0002 files) and stitch later with gmx trjcat.',
    ],
    command: 'gmx mdrun -s next.tpr -deffnm md_0_1 -cpi md_0_1.cpt -noappend && gmx trjcat -f md_0_1.part*.xtc -o merged.xtc',
  },
  {
    id: 'cuda-oom',
    errorPattern: 'CUDA error #2 (cudaErrorMemoryAllocation): out of memory / cuFFT plan failed',
    stage: 'NVIDIA GPU Run',
    rootCause: 'Too many concurrent MPS simulations on one GPU, or a huge (>1M atom) system exceeding single-GPU VRAM.',
    fixes: [
      'Lower concurrent simulations per GPU under CUDA MPS or switch to a larger MIG slice (e.g., 2g.20gb).',
      'Distribute PME across multiple GPUs with export GMX_GPU_PME_DECOMPOSITION=1 and -npme 2 (cuFFTMp).',
      'Reduce -nstlist slightly (e.g. 40 instead of 200) to shrink the GPU Verlet pair-list buffer footprint.',
    ],
    command: 'nvidia-smi && export GMX_ENABLE_DIRECT_GPU_COMM=1 && gmx mdrun -deffnm md_0_1 -nb gpu -pme gpu -nstlist 40',
  },
  {
    id: 'nonzero-charge',
    errorPattern: 'NOTE: System has non-zero total charge',
    stage: 'grompp / PME Setup',
    rootCause: 'Net charge on the simulation box introduces a uniform neutralizing background plasma artifact under PME electrostatics.',
    fixes: [
      'Run gmx genion with -neutral (and optionally -conc 0.15 for physiological NaCl/KCl) before Energy Minimization.',
      'If non-integer charge (e.g. -0.002), verify ligand partial charges sum cleanly to an integer in ligand.itp.',
    ],
    command: 'printf "SOL\\n" | gmx genion -s ions.tpr -o solv_ions.gro -p topol.top -pname NA -nname CL -neutral -conc 0.15',
  },
];

interface LintIssue {
  id: string;
  severity: 'error' | 'warning' | 'tip';
  param: string;
  title: string;
  detail: string;
  fixLabel?: string;
  applyFix?: (text: string) => string;
}

const SAMPLE_FLAWED_MDP = `; Legacy production.mdp with several GPU & ensemble pitfalls
title                   = Legacy Protein MD
integrator              = md
dt                      = 0.002
nsteps                  = 50000000
nstxout                 = 1000
nstvout                 = 1000
nstenergy               = 5000
nstlog                  = 5000
continuation            = no
gen_vel                 = no
constraint_algorithm    = lincs
constraints             = all-bonds
cutoff-scheme           = group
nstlist                 = 10
coulombtype             = Cut-off
rcoulomb                = 1.0
rvdw                    = 1.0
tcoupl                  = berendsen
tc-grps                 = Protein Non-Protein
tau_t                   = 0.1 0.1
ref_t                   = 300 300
pcoupl                  = berendsen
pcoupltype              = isotropic
tau_p                   = 2.0
ref_p                   = 1.0
compressibility         = 4.5e-5
pbc                     = xyz`;

const SAMPLE_RMSD_XVG = `# This file was created by gmx rms
@    title "Backbone RMSD"
@    xaxis  label "Time (ns)"
@    yaxis  label "RMSD (nm)"
@ s0 legend "Backbone after lsq fit to Backbone"
0.0   0.000
2.5   0.112
5.0   0.148
7.5   0.165
10.0  0.172
12.5  0.184
15.0  0.179
17.5  0.193
20.0  0.205
22.5  0.198
25.0  0.214
27.5  0.221
30.0  0.216
35.0  0.229
40.0  0.224
45.0  0.231
50.0  0.227
55.0  0.238
60.0  0.233
65.0  0.229
70.0  0.235
75.0  0.241
80.0  0.236
85.0  0.232
90.0  0.239
95.0  0.234
100.0 0.237`;

const SAMPLE_MD_LOG = `GROMACS:      gmx mdrun, version 2024.2-CUDA
Executable:   /usr/local/gromacs/bin/gmx
Running on 1 node with total 32 cores, 64 processing units, 1 compatible GPU
Hardware detected on host node042:
  GPU info:
    Number of GPUs detected: 1
    #0: NVIDIA A100-SXM4-80GB, compute cap: 8.0, ECC: yes, stat: compatible
Using 1 MPI thread
Using 8 OpenMP threads
1 GPU selected for this run.
Mapping of GPU IDs to the 2 GPU tasks in the 1 rank on this node:
  PP:0,PME:0
Non-bonded interactions: GPU
PME: GPU
Bonded interactions: GPU
Update & constraints: GPU
nsteps = 50000000
dt = 0.002

               Core t (s)   Wall t (s)        (%)
       Time:    189245.12     23655.64      800.0
                 (ns/day)    (hour/ns)
Performance:      365.240        0.066`;

function replaceOrAppendParam(text: string, keyRegex: RegExp, newLine: string): string {
  const lines = text.split('\n');
  let replaced = false;
  const next = lines.map((line) => {
    const code = line.split(';')[0];
    if (!replaced && keyRegex.test(code)) {
      replaced = true;
      return newLine;
    }
    return line;
  });
  if (!replaced) next.push(newLine);
  return next.join('\n');
}

function parseMdp(text: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const raw of text.split('\n')) {
    const clean = raw.split(';')[0].trim();
    if (!clean) continue;
    const eq = clean.indexOf('=');
    if (eq < 1) continue;
    const key = clean.slice(0, eq).trim().toLowerCase().replace(/_/g, '-');
    const val = clean.slice(eq + 1).trim();
    map[key] = val;
  }
  return map;
}

function lintMdp(text: string): LintIssue[] {
  const p = parseMdp(text);
  const issues: LintIssue[] = [];
  const integrator = (p['integrator'] ?? 'md').toLowerCase();
  const isEM = integrator === 'steep' || integrator === 'cg';

  if (p['cutoff-scheme'] && p['cutoff-scheme'].toLowerCase() !== 'verlet') {
    issues.push({
      id: 'verlet',
      severity: 'error',
      param: 'cutoff-scheme',
      title: `Legacy cutoff-scheme = ${p['cutoff-scheme']} is unsupported in GROMACS 2020+`,
      detail: 'Modern GROMACS and all NVIDIA GPU kernels require cutoff-scheme = Verlet.',
      fixLabel: 'Set cutoff-scheme = Verlet',
      applyFix: (t) => replaceOrAppendParam(t, /^\s*cutoff[-_]scheme\s*=/i, 'cutoff-scheme           = Verlet'),
    });
  }

  if (!isEM && p['pcoupl']?.toLowerCase() === 'berendsen') {
    issues.push({
      id: 'pcoupl-berendsen',
      severity: 'error',
      param: 'pcoupl',
      title: 'Berendsen barostat does not sample a true NPT ensemble',
      detail: 'Use C-rescale (GROMACS 2021+) or Parrinello-Rahman for production simulations to avoid unphysical volume fluctuations.',
      fixLabel: 'Switch to C-rescale',
      applyFix: (t) => replaceOrAppendParam(t, /^\s*pcoupl\s*=/i, 'pcoupl                  = C-rescale'),
    });
  }

  if (!isEM && p['tcoupl']?.toLowerCase() === 'berendsen') {
    issues.push({
      id: 'tcoupl-berendsen',
      severity: 'warning',
      param: 'tcoupl',
      title: 'Berendsen thermostat suppresses canonical kinetic fluctuations',
      detail: 'Replace with V-rescale (Bussi stochastic velocity rescaling) for a rigorous canonical ensemble.',
      fixLabel: 'Switch to V-rescale',
      applyFix: (t) => replaceOrAppendParam(t, /^\s*tcoupl\s*=/i, 'tcoupl                  = V-rescale'),
    });
  }

  if (!isEM && p['constraints']?.toLowerCase() === 'all-bonds') {
    issues.push({
      id: 'constraints-gpu',
      severity: 'warning',
      param: 'constraints',
      title: 'constraints = all-bonds blocks NVIDIA -update gpu offload',
      detail: 'GROMACS can only build GPU update groups when constraints = h-bonds. Keeping all-bonds forces CPU coordinate updates every step.',
      fixLabel: 'Set constraints = h-bonds',
      applyFix: (t) => replaceOrAppendParam(t, /^\s*constraints\s*=/i, 'constraints             = h-bonds'),
    });
  }

  if (!isEM && p['coulombtype']?.toLowerCase() === 'cut-off') {
    issues.push({
      id: 'coulomb-pme',
      severity: 'error',
      param: 'coulombtype',
      title: 'Plain electrostatic Cut-off causes severe energy/force artifacts',
      detail: 'Use PME (Particle Mesh Ewald) for accurate long-range electrostatics and cuFFT GPU acceleration.',
      fixLabel: 'Set coulombtype = PME',
      applyFix: (t) => replaceOrAppendParam(t, /^\s*coulombtype\s*=/i, 'coulombtype             = PME'),
    });
  }

  const nstxout = Number(p['nstxout'] ?? 0);
  const nstvout = Number(p['nstvout'] ?? 0);
  if (!isEM && (nstxout > 0 || nstvout > 0)) {
    issues.push({
      id: 'trr-bloat',
      severity: 'warning',
      param: 'nstxout / nstvout',
      title: 'Uncompressed .trr output active (risk of huge disk usage)',
      detail: `nstxout=${nstxout}, nstvout=${nstvout} writes full-precision .trr frames. Set both to 0 and use nstxout-compressed = 5000 for compact .xtc files.`,
      fixLabel: 'Disable .trr & enable .xtc',
      applyFix: (t) => {
        let out = replaceOrAppendParam(t, /^\s*nstxout\s*=/i, 'nstxout                 = 0');
        out = replaceOrAppendParam(out, /^\s*nstvout\s*=/i, 'nstvout                 = 0');
        out = replaceOrAppendParam(out, /^\s*nstxout[-_]compressed\s*=/i, 'nstxout-compressed      = 5000');
        return out;
      },
    });
  }

  if (!isEM && p['continuation']?.toLowerCase() === 'no' && p['gen-vel']?.toLowerCase() === 'no') {
    issues.push({
      id: 'continuation-vel',
      severity: 'warning',
      param: 'continuation / gen_vel',
      title: 'Both continuation = no and gen_vel = no are set',
      detail: 'If continuing from NPT equilibration via -t npt.cpt, set continuation = yes so LINCS does not re-apply unconstrained startup steps.',
      fixLabel: 'Set continuation = yes',
      applyFix: (t) => replaceOrAppendParam(t, /^\s*continuation\s*=/i, 'continuation            = yes'),
    });
  }

  const nstlist = Number(p['nstlist'] ?? 20);
  if (!isEM && nstlist > 0 && nstlist < 40) {
    issues.push({
      id: 'nstlist-gpu',
      severity: 'tip',
      param: 'nstlist',
      title: `nstlist = ${nstlist} is conservative for modern NVIDIA GPUs`,
      detail: 'Increasing nstlist to 100 (or passing -nstlist 100 at runtime) reduces pair-search overhead and boosts GPU ns/day.',
      fixLabel: 'Optimize nstlist = 100',
      applyFix: (t) => replaceOrAppendParam(t, /^\s*nstlist\s*=/i, 'nstlist                 = 100'),
    });
  }

  const dtVal = Number(p['dt'] ?? 0.002);
  if (!isEM && dtVal >= 0.004) {
    issues.push({
      id: 'dt-hmr',
      severity: 'tip',
      param: 'dt',
      title: `Large timestep dt = ${dtVal} ps (${dtVal * 1000} fs)`,
      detail: 'Verify your topology uses Hydrogen Mass Repartitioning (HMR) or virtual sites, otherwise LINCS warnings or LINCS blow-ups will occur.',
    });
  }

  if (!isEM && !p['dispcorr'] && p['vdw-modifier']?.toLowerCase() !== 'force-switch') {
    issues.push({
      id: 'dispcorr',
      severity: 'tip',
      param: 'DispCorr',
      title: 'Missing Dispersion Correction (DispCorr = EnerPres)',
      detail: 'For OPLS-AA / AMBER force fields (without CHARMM Force-switch), DispCorr = EnerPres improves bulk density and pressure accuracy.',
      fixLabel: 'Add DispCorr = EnerPres',
      applyFix: (t) => replaceOrAppendParam(t, /^\s*dispcorr\s*=/i, 'DispCorr                = EnerPres'),
    });
  }

  return issues;
}

interface ParsedXvg {
  title: string;
  xLabel: string;
  yLabel: string;
  legend: string;
  points: { x: number; y: number }[];
}

function parseXvg(text: string): ParsedXvg {
  let title = 'GROMACS XVG Series';
  let xLabel = 'Time';
  let yLabel = 'Value';
  let legend = 'Series 0';
  const points: { x: number; y: number }[] = [];

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('@')) {
      const mTitle = line.match(/title\s+"([^"]+)"/i);
      if (mTitle) title = mTitle[1];
      const mX = line.match(/xaxis\s+label\s+"([^"]+)"/i);
      if (mX) xLabel = mX[1];
      const mY = line.match(/yaxis\s+label\s+"([^"]+)"/i);
      if (mY) yLabel = mY[1];
      const mLeg = line.match(/s0\s+legend\s+"([^"]+)"/i);
      if (mLeg) legend = mLeg[1];
      continue;
    }
    const cols = line.split(/\s+/).map(Number);
    if (cols.length >= 2 && Number.isFinite(cols[0]) && Number.isFinite(cols[1])) {
      points.push({ x: cols[0], y: cols[1] });
    }
  }
  return { title, xLabel, yLabel, legend, points };
}

interface ParsedMdLog {
  version: string;
  gpuName: string;
  nsPerDay: number | null;
  hourPerNs: number | null;
  wallSec: number | null;
  coreSec: number | null;
  mpiThreads: string;
  ompThreads: string;
  gpuTasks: string[];
}

function parseMdLog(text: string): ParsedMdLog {
  const version = text.match(/version\s+([^\n\r]+)/i)?.[1]?.trim() ?? 'Unknown';
  const gpuName = text.match(/#0:\s*([^,\n\r]+)/)?.[1]?.trim() ?? 'CPU / Not detected';
  const perfMatch = text.match(/Performance:\s+([\d.]+)\s+([\d.]+)/);
  const timeMatch = text.match(/Time:\s+([\d.]+)\s+([\d.]+)/);
  const mpiThreads = text.match(/Using\s+(\d+)\s+MPI/i)?.[1] ?? '—';
  const ompThreads = text.match(/Using\s+(\d+)\s+OpenMP/i)?.[1] ?? '—';
  const gpuTasks: string[] = [];
  if (/Non-bonded.*GPU/i.test(text)) gpuTasks.push('NB -> GPU');
  if (/PME.*GPU/i.test(text)) gpuTasks.push('PME -> GPU');
  if (/Bonded.*GPU/i.test(text)) gpuTasks.push('Bonded -> GPU');
  if (/Update.*GPU/i.test(text)) gpuTasks.push('Update -> GPU');
  return {
    version,
    gpuName,
    nsPerDay: perfMatch ? Number(perfMatch[1]) : null,
    hourPerNs: perfMatch ? Number(perfMatch[2]) : null,
    coreSec: timeMatch ? Number(timeMatch[1]) : null,
    wallSec: timeMatch ? Number(timeMatch[2]) : null,
    mpiThreads,
    ompThreads,
    gpuTasks,
  };
}

export const AnalyzerSection: React.FC = () => {
  const [mode, setMode] = useState<InspectorMode>('mdp');
  const [mdpText, setMdpText] = useState<string>(SAMPLE_FLAWED_MDP);
  const [xvgOrLogText, setXvgOrLogText] = useState<string>(SAMPLE_RMSD_XVG);
  const [fileKind, setFileKind] = useState<'xvg' | 'log'>('xvg');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [crashQuery, setCrashQuery] = useState<string>('');
  const [copiedCrashId, setCopiedCrashId] = useState<string | null>(null);

  // Box & Ion calculator state
  const [boxShape, setBoxShape] = useState<'cubic' | 'dodecahedron' | 'octahedron' | 'rect'>('dodecahedron');
  const [boxLx, setBoxLx] = useState<number>(9.5);
  const [boxLy, setBoxLy] = useState<number>(9.5);
  const [boxLz, setBoxLz] = useState<number>(9.5);
  const [soluteCharge, setSoluteCharge] = useState<number>(-4);
  const [saltMolarity, setSaltMolarity] = useState<number>(0.15);
  const [soluteFraction, setSoluteFraction] = useState<number>(12);
  const [cationName, setCationName] = useState<'NA' | 'K'>('NA');

  const mdpFileRef = useRef<HTMLInputElement>(null);
  const dataFileRef = useRef<HTMLInputElement>(null);

  const filteredCrashes = useMemo(() => {
    const q = crashQuery.trim().toLowerCase();
    if (!q) return GROMACS_CRASH_DB;
    return GROMACS_CRASH_DB.filter(
      (c) =>
        c.errorPattern.toLowerCase().includes(q) ||
        c.rootCause.toLowerCase().includes(q) ||
        c.stage.toLowerCase().includes(q) ||
        c.fixes.some((f) => f.toLowerCase().includes(q))
    );
  }, [crashQuery]);

  const ionCalc = useMemo(() => {
    const rawVolNm3 =
      boxShape === 'cubic'
        ? boxLx ** 3
        : boxShape === 'dodecahedron'
        ? (Math.SQRT1_2) * boxLx ** 3
        : boxShape === 'octahedron'
        ? ((4 / (3 * Math.sqrt(3))) * boxLx ** 3)
        : boxLx * boxLy * boxLz;
    const effSolventVol = rawVolNm3 * Math.max(0.1, 1 - soluteFraction / 100);
    // 1 M = 0.602214076 molecules / nm^3; bulk water ~ 33.3 molecules / nm^3
    const saltPairs = Math.round(saltMolarity * 0.602214076 * effSolventVol);
    const extraCations = soluteCharge < 0 ? Math.abs(Math.round(soluteCharge)) : 0;
    const extraAnions = soluteCharge > 0 ? Math.round(soluteCharge) : 0;
    const totalPos = saltPairs + extraCations;
    const totalNeg = saltPairs + extraAnions;
    const approxWaters = Math.max(0, Math.round(effSolventVol * 33.3) - totalPos - totalNeg);
    const genionExactCmd = `printf "SOL\\n" | gmx genion -s ions.tpr -o solv_ions.gro -p topol.top -pname ${cationName} -nname CL -np ${totalPos} -nn ${totalNeg}`;
    const genionAutoCmd = `printf "SOL\\n" | gmx genion -s ions.tpr -o solv_ions.gro -p topol.top -pname ${cationName} -nname CL -neutral -conc ${saltMolarity}`;
    return {
      rawVolNm3,
      effSolventVol,
      saltPairs,
      totalPos,
      totalNeg,
      approxWaters,
      genionExactCmd,
      genionAutoCmd,
    };
  }, [boxShape, boxLx, boxLy, boxLz, soluteCharge, saltMolarity, soluteFraction, cationName]);

  const copyCrashCmd = async (id: string, cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      // ignore
    }
    setCopiedCrashId(id);
    setTimeout(() => setCopiedCrashId(null), 1500);
  };

  const issues = useMemo(() => lintMdp(mdpText), [mdpText]);
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warnCount = issues.filter((i) => i.severity === 'warning').length;
  const fixableCount = issues.filter((i) => Boolean(i.applyFix)).length;

  const applyAllFixes = () => {
    let next = mdpText;
    for (const issue of issues) {
      if (issue.applyFix) next = issue.applyFix(next);
    }
    setMdpText(next);
  };

  const parsedXvg = useMemo(() => (fileKind === 'xvg' ? parseXvg(xvgOrLogText) : null), [xvgOrLogText, fileKind]);
  const parsedLog = useMemo(() => (fileKind === 'log' ? parseMdLog(xvgOrLogText) : null), [xvgOrLogText, fileKind]);

  const xvgStats = useMemo(() => {
    if (!parsedXvg || parsedXvg.points.length === 0) return null;
    const ys = parsedXvg.points.map((p) => p.y);
    const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
    const variance = ys.reduce((a, b) => a + (b - mean) ** 2, 0) / ys.length;
    return {
      min: Math.min(...ys),
      max: Math.max(...ys),
      mean,
      std: Math.sqrt(variance),
      last: ys[ys.length - 1],
      count: ys.length,
    };
  }, [parsedXvg]);

  const handleMdpUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setMdpText(String(r.result ?? ''));
    r.readAsText(file);
    e.target.value = '';
  };

  const handleDataUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      const content = String(r.result ?? '');
      const isLog = file.name.toLowerCase().endsWith('.log') || /Performance:\s+[\d.]+/.test(content);
      setFileKind(isLog ? 'log' : 'xvg');
      setXvgOrLogText(content);
      setHoverIdx(null);
    };
    r.readAsText(file);
    e.target.value = '';
  };

  // SVG chart coordinates for XVG
  const chart = useMemo(() => {
    if (!parsedXvg || parsedXvg.points.length < 2) return null;
    // Downsample gracefully if huge XVG (>400 points)
    const pts =
      parsedXvg.points.length > 400
        ? parsedXvg.points.filter((_, i) => i % Math.ceil(parsedXvg.points.length / 400) === 0)
        : parsedXvg.points;
    const W = 720;
    const H = 260;
    const padL = 54;
    const padR = 20;
    const padT = 18;
    const padB = 34;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) || minX + 1;
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys) || minY + 1;
    const yPad = (maxY - minY) * 0.1 || 0.1;
    const y0 = Math.max(0, minY - yPad);
    const y1 = maxY + yPad;

    const sx = (x: number) => padL + ((x - minX) / (maxX - minX || 1)) * (W - padL - padR);
    const sy = (y: number) => H - padB - ((y - y0) / (y1 - y0 || 1)) * (H - padT - padB);

    const coords = pts.map((p) => ({ x: sx(p.x), y: sy(p.y), rawX: p.x, rawY: p.y }));
    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${H - padB} L${coords[0].x.toFixed(1)},${H - padB} Z`;
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      val: y0 + t * (y1 - y0),
      y: sy(y0 + t * (y1 - y0)),
    }));
    return { W, H, padL, padB, coords, linePath, areaPath, yTicks, minX, maxX };
  }, [parsedXvg]);

  return (
    <section className="space-y-6">
      <div className="surface-card p-5 sm:p-6 space-y-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-blue)] inline-flex items-center gap-1.5">
            <FileSearch className="w-3.5 h-3.5" /> Client-Side File Diagnostics
          </span>
          <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.025em] text-[var(--text-primary)]">
            Inspector, Error Troubleshooter &amp; Ion Calculator
          </h2>
          <p className="text-[13.5px] text-[var(--text-secondary)] mt-1">
            100% local in-browser diagnostics — lint `.mdp` files, plot `.xvg` / `md.log`, debug common GROMACS crashes, and compute exact box ion counts.
          </p>
        </div>

        <SegmentedControl<InspectorMode>
          layoutId="inspector-mode-seg"
          wrap
          className="w-fit max-w-full"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'mdp', label: 'MDP Linter', icon: <Wand2 className="w-3.5 h-3.5" /> },
            { value: 'xvg', label: 'XVG / md.log', icon: <Activity className="w-3.5 h-3.5" /> },
            { value: 'troubleshooter', label: 'Crash Fixes', icon: <Bug className="w-3.5 h-3.5" /> },
            { value: 'ions', label: 'Box & Ions', icon: <Box className="w-3.5 h-3.5" /> },
          ]}
        />
      </div>

      {mode === 'mdp' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Drop/Paste MDP */}
          <div className="lg:col-span-6 space-y-4">
            <div className="surface-card p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                  Paste or Upload `.mdp` File
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMdpText(SAMPLE_FLAWED_MDP)}
                    className="px-3 py-1 rounded-full text-[11.5px] font-medium bg-[var(--bg-subtle)] hover:text-[var(--accent-blue)] text-[var(--text-secondary)] transition cursor-pointer"
                  >
                    Load Flawed Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => mdpFileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium bg-[#0071e3] text-white cursor-pointer"
                  >
                    <Upload className="w-3 h-3" /> Upload .mdp
                  </button>
                  <input
                    ref={mdpFileRef}
                    type="file"
                    accept=".mdp,.txt"
                    onChange={handleMdpUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <textarea
                value={mdpText}
                onChange={(e) => setMdpText(e.target.value)}
                rows={14}
                spellCheck={false}
                className="ui-input w-full p-3.5 font-mono text-[12px] leading-relaxed resize-y"
              />
            </div>

            <CodeShowcase
              title="fixed_production.mdp"
              subtitle="Download your cleaned MDP file"
              code={mdpText}
              filename="fixed_production.mdp"
              language="mdp"
              compact
              maxHeight="260px"
            />
          </div>

          {/* Right: Diagnostic Findings */}
          <div className="lg:col-span-6 space-y-4">
            <div className="surface-card p-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    errorCount > 0
                      ? 'bg-[#ff3b30]/15 text-[#ff3b30]'
                      : warnCount > 0
                      ? 'bg-[#ff9f0a]/15 text-[#ff9f0a]'
                      : 'bg-[#30d158]/15 text-[#248a3d] dark:text-[#30d158]'
                  }`}
                >
                  {errorCount > 0 ? (
                    <XCircle className="w-6 h-6" />
                  ) : warnCount > 0 ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="text-[16px] font-semibold text-[var(--text-primary)]">
                    {issues.length === 0
                      ? 'All GROMACS & NVIDIA GPU Checks Passed'
                      : `${errorCount} Error${errorCount === 1 ? '' : 's'} · ${warnCount} Warning${warnCount === 1 ? '' : 's'} · ${issues.length - errorCount - warnCount} Tip${issues.length - errorCount - warnCount === 1 ? '' : 's'}`}
                  </div>
                  <div className="text-[12px] text-[var(--text-secondary)]">
                    {issues.length === 0
                      ? 'Ready for grompp and full GPU-resident mdrun.'
                      : 'Apply individual fixes below or resolve everything in one click.'}
                  </div>
                </div>
              </div>

              {fixableCount > 0 && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={applyAllFixes}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#30d158] hover:brightness-105 text-black text-[12.5px] font-semibold cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Fix All ({fixableCount})
                </motion.button>
              )}
            </div>

            <div className="space-y-3">
              {issues.map((issue) => (
                <div key={issue.id} className="surface-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {issue.severity === 'error' ? (
                        <XCircle className="w-4 h-4 text-[#ff3b30] shrink-0 mt-0.5" />
                      ) : issue.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-[#ff9f0a] shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-[var(--accent-blue)] shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11.5px] px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[var(--accent-blue)] font-semibold">
                            {issue.param}
                          </span>
                          <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">
                            {issue.title}
                          </span>
                        </div>
                        <p className="text-[12.5px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                          {issue.detail}
                        </p>
                      </div>
                    </div>

                    {issue.applyFix && issue.fixLabel && (
                      <button
                        type="button"
                        onClick={() => setMdpText((prev) => issue.applyFix!(prev))}
                        className="shrink-0 px-3 py-1.5 rounded-full text-[11.5px] font-medium bg-[var(--bg-subtle)] hover:bg-[#0071e3] hover:text-white text-[var(--text-primary)] transition-colors cursor-pointer border border-[var(--border-hairline)]"
                      >
                        {issue.fixLabel}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : mode === 'xvg' ? (
        <div className="space-y-5">
          {/* Upload & Sample Bar */}
          <div className="surface-card p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setFileKind('xvg');
                  setXvgOrLogText(SAMPLE_RMSD_XVG);
                  setHoverIdx(null);
                }}
                className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition cursor-pointer ${
                  fileKind === 'xvg'
                    ? 'bg-[#0071e3] text-white'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                Demo: rmsd.xvg
              </button>
              <button
                type="button"
                onClick={() => {
                  setFileKind('log');
                  setXvgOrLogText(SAMPLE_MD_LOG);
                }}
                className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition cursor-pointer ${
                  fileKind === 'log'
                    ? 'bg-[#30d158] text-black'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                Demo: md.log (A100)
              </button>
            </div>

            <button
              type="button"
              onClick={() => dataFileRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Drop or Upload .xvg / md.log
            </button>
            <input
              ref={dataFileRef}
              type="file"
              accept=".xvg,.log,.txt"
              onChange={handleDataUpload}
              className="hidden"
            />
          </div>

          {fileKind === 'xvg' && parsedXvg && chart && xvgStats ? (
            <div className="space-y-5">
              {/* Summary KPI strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  ['Mean ± SD', `${xvgStats.mean.toFixed(3)} ± ${xvgStats.std.toFixed(3)}`],
                  ['Minimum', xvgStats.min.toFixed(3)],
                  ['Maximum', xvgStats.max.toFixed(3)],
                  ['Final Value', xvgStats.last.toFixed(3)],
                  ['Data Points', xvgStats.count.toLocaleString()],
                ].map(([lbl, val]) => (
                  <div key={lbl} className="surface-card p-4">
                    <div className="text-[11px] font-medium text-[var(--text-secondary)]">{lbl}</div>
                    <div className="text-[18px] font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Crisp Interactive SVG Chart */}
              <div className="surface-card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-[17px] font-semibold text-[var(--text-primary)]">
                      {parsedXvg.title}
                    </h3>
                    <div className="text-[12px] text-[var(--text-secondary)]">{parsedXvg.legend}</div>
                  </div>
                  {hoverIdx !== null && chart.coords[hoverIdx] && (
                    <div className="px-3 py-1 rounded-full bg-[#0071e3]/12 text-[var(--accent-blue)] font-mono text-[12px] tabular-nums">
                      {parsedXvg.xLabel}: {chart.coords[hoverIdx].rawX.toFixed(2)} · {parsedXvg.yLabel}:{' '}
                      {chart.coords[hoverIdx].rawY.toFixed(3)}
                    </div>
                  )}
                </div>

                <svg
                  viewBox={`0 0 ${chart.W} ${chart.H}`}
                  className="w-full h-auto overflow-visible select-none"
                  onMouseLeave={() => setHoverIdx(null)}
                >
                  <defs>
                    <linearGradient id="xvg-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0071e3" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#0071e3" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal gridlines */}
                  {chart.yTicks.map((tk, i) => (
                    <g key={i}>
                      <line
                        x1={chart.padL}
                        x2={chart.W - 20}
                        y1={tk.y}
                        y2={tk.y}
                        stroke="currentColor"
                        strokeOpacity="0.09"
                        strokeDasharray="3 4"
                      />
                      <text
                        x={chart.padL - 8}
                        y={tk.y + 4}
                        textAnchor="end"
                        className="fill-[var(--text-tertiary)] text-[10px] font-mono"
                      >
                        {tk.val.toFixed(2)}
                      </text>
                    </g>
                  ))}

                  <path d={chart.areaPath} fill="url(#xvg-grad)" />
                  <path
                    d={chart.linePath}
                    fill="none"
                    stroke="#0071e3"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive hover hit zones */}
                  {chart.coords.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoverIdx === i ? 5 : 3}
                      fill={hoverIdx === i ? '#0071e3' : 'transparent'}
                      stroke={hoverIdx === i ? '#ffffff' : 'transparent'}
                      strokeWidth={2}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoverIdx(i)}
                    />
                  ))}

                  {/* Axis labels */}
                  <text
                    x={(chart.padL + chart.W - 20) / 2}
                    y={chart.H - 4}
                    textAnchor="middle"
                    className="fill-[var(--text-secondary)] text-[11px] font-medium"
                  >
                    {parsedXvg.xLabel} ({chart.minX.toFixed(1)} → {chart.maxX.toFixed(1)})
                  </text>
                  <text
                    x={14}
                    y={chart.H / 2}
                    textAnchor="middle"
                    transform={`rotate(-90 14 ${chart.H / 2})`}
                    className="fill-[var(--text-secondary)] text-[11px] font-medium"
                  >
                    {parsedXvg.yLabel}
                  </text>
                </svg>
              </div>
            </div>
          ) : parsedLog ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="surface-card p-5">
                <div className="text-[12px] text-[var(--text-secondary)]">Measured Throughput</div>
                <div className="text-[32px] font-semibold tracking-[-0.03em] text-[#248a3d] dark:text-[#30d158] mt-1 tabular-nums">
                  {parsedLog.nsPerDay != null ? `${parsedLog.nsPerDay.toFixed(1)} ns/day` : 'Not found'}
                </div>
                <div className="text-[12px] font-mono text-[var(--text-tertiary)] mt-1">
                  {parsedLog.hourPerNs != null ? `${parsedLog.hourPerNs.toFixed(3)} hr/ns` : 'Upload complete md.log'}
                </div>
              </div>

              <div className="surface-card p-5">
                <div className="text-[12px] text-[var(--text-secondary)]">Detected Hardware</div>
                <div className="text-[16px] font-semibold text-[var(--text-primary)] mt-1.5 leading-snug">
                  {parsedLog.gpuName}
                </div>
                <div className="text-[12px] font-mono text-[var(--text-tertiary)] mt-1.5">
                  MPI: {parsedLog.mpiThreads} · OpenMP: {parsedLog.ompThreads} · {parsedLog.version}
                </div>
              </div>

              <div className="surface-card p-5">
                <div className="text-[12px] text-[var(--text-secondary)]">GPU Task Offload</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {parsedLog.gpuTasks.length > 0 ? (
                    parsedLog.gpuTasks.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-full text-[11.5px] font-mono font-semibold bg-[#30d158]/15 text-[#248a3d] dark:text-[#30d158]"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12.5px] text-[var(--text-tertiary)] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> No explicit GPU task lines parsed
                    </span>
                  )}
                </div>
                {parsedLog.wallSec != null && (
                  <div className="text-[11.5px] font-mono text-[var(--text-tertiary)] mt-2">
                    Wall time: {(parsedLog.wallSec / 3600).toFixed(2)} hrs
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === 'troubleshooter' && (
        <div className="space-y-4">
          <div className="surface-card p-5">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={crashQuery}
                onChange={(e) => setCrashQuery(e.target.value)}
                placeholder="Paste error message (e.g., LINCS, water cannot be settled, domain decomposition, atom mismatch, CUDA OOM)..."
                className="ui-input w-full pl-11 pr-4 py-3 text-[13.5px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCrashes.map((item) => (
              <div key={item.id} className="surface-card p-5 flex flex-col justify-between gap-3">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full bg-[#ff3b30]/12 text-[#ff3b30]">
                      {item.stage}
                    </span>
                  </div>
                  <h3 className="font-mono text-[13px] font-semibold text-[var(--text-primary)] leading-snug">
                    {item.errorPattern}
                  </h3>
                  <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
                    <strong className="text-[var(--text-primary)]">Root Cause:</strong> {item.rootCause}
                  </p>
                  <ul className="space-y-1 text-[12px] text-[var(--text-secondary)] list-disc pl-4">
                    {item.fixes.map((fix, idx) => (
                      <li key={idx}>{fix}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl bg-[var(--bg-code)] text-[#e6edf3] px-3.5 py-2.5 flex items-center justify-between gap-3 border border-white/10">
                  <code className="text-[11.5px] font-mono text-[#7ee787] overflow-x-auto whitespace-nowrap">
                    {item.command}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyCrashCmd(item.id, item.command)}
                    className="shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    aria-label="Copy diagnostic fix command"
                  >
                    {copiedCrashId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-[#30d158]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'ions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 surface-card p-5 sm:p-6 space-y-4">
            <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              Simulation Box &amp; Ionic Strength
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-[var(--text-secondary)]">
                  Box Geometry
                </label>
                <select
                  value={boxShape}
                  onChange={(e) =>
                    setBoxShape(e.target.value as 'cubic' | 'dodecahedron' | 'octahedron' | 'rect')
                  }
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1"
                >
                  <option value="dodecahedron">Rhombic Dodecahedron</option>
                  <option value="cubic">Cubic</option>
                  <option value="octahedron">Truncated Octahedron</option>
                  <option value="rect">Rectangular (Membrane)</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-medium text-[var(--text-secondary)]">
                  Cation Type
                </label>
                <select
                  value={cationName}
                  onChange={(e) => setCationName(e.target.value as 'NA' | 'K')}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                >
                  <option value="NA">Na⁺ / Cl⁻ (NA / CL)</option>
                  <option value="K">K⁺ / Cl⁻ (K / CL)</option>
                </select>
              </div>
            </div>

            {boxShape === 'rect' ? (
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">Lx (nm)</label>
                  <input type="number" step={0.5} min={2} value={boxLx} onChange={(e) => setBoxLx(Math.max(1, Number(e.target.value)))} className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono" />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">Ly (nm)</label>
                  <input type="number" step={0.5} min={2} value={boxLy} onChange={(e) => setBoxLy(Math.max(1, Number(e.target.value)))} className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono" />
                </div>
                <div>
                  <label className="text-[11.5px] font-medium text-[var(--text-secondary)]">Lz (nm)</label>
                  <input type="number" step={0.5} min={2} value={boxLz} onChange={(e) => setBoxLz(Math.max(1, Number(e.target.value)))} className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono" />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[12px] font-medium text-[var(--text-secondary)] flex justify-between">
                  <span>Box Vector Edge Length (d / L)</span>
                  <span className="font-mono text-[var(--text-primary)]">{boxLx.toFixed(1)} nm</span>
                </label>
                <input
                  type="range"
                  min={4}
                  max={25}
                  step={0.5}
                  value={boxLx}
                  onChange={(e) => setBoxLx(Number(e.target.value))}
                  className="ui-slider w-full mt-2"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-[var(--text-secondary)]">
                  Solute Net Charge (e)
                </label>
                <input
                  type="number"
                  step={1}
                  value={soluteCharge}
                  onChange={(e) => setSoluteCharge(Number(e.target.value))}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[var(--text-secondary)]">
                  Target Salt (M)
                </label>
                <input
                  type="number"
                  step={0.05}
                  min={0}
                  max={2}
                  value={saltMolarity}
                  onChange={(e) => setSaltMolarity(Math.max(0, Number(e.target.value)))}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium text-[var(--text-secondary)] flex justify-between">
                <span>Solute Excluded Volume</span>
                <span className="font-mono text-[var(--text-primary)]">{soluteFraction}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={45}
                step={1}
                value={soluteFraction}
                onChange={(e) => setSoluteFraction(Number(e.target.value))}
                className="ui-slider w-full mt-2"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="surface-card p-4">
                <div className="text-[11.5px] text-[var(--text-secondary)]">Box Volume</div>
                <div className="text-[22px] font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
                  {ionCalc.rawVolNm3.toFixed(0)} nm³
                </div>
                <div className="text-[10.5px] text-[var(--text-tertiary)]">
                  Solvent: {ionCalc.effSolventVol.toFixed(0)} nm³
                </div>
              </div>
              <div className="surface-card p-4">
                <div className="text-[11.5px] text-[var(--text-secondary)]">Est. Water Mols</div>
                <div className="text-[22px] font-semibold font-mono tabular-nums text-[var(--accent-blue)] mt-1">
                  {ionCalc.approxWaters.toLocaleString()}
                </div>
                <div className="text-[10.5px] text-[var(--text-tertiary)]">~33.3 H₂O/nm³</div>
              </div>
              <div className="surface-card p-4">
                <div className="text-[11.5px] text-[var(--text-secondary)]">Cations ({cationName}⁺)</div>
                <div className="text-[22px] font-semibold font-mono tabular-nums text-[#248a3d] dark:text-[#30d158] mt-1">
                  {ionCalc.totalPos}
                </div>
                <div className="text-[10.5px] text-[var(--text-tertiary)]">
                  {ionCalc.saltPairs} salt + {ionCalc.totalPos - ionCalc.saltPairs} neutral
                </div>
              </div>
              <div className="surface-card p-4">
                <div className="text-[11.5px] text-[var(--text-secondary)]">Anions (Cl⁻)</div>
                <div className="text-[22px] font-semibold font-mono tabular-nums text-[#5856d6] mt-1">
                  {ionCalc.totalNeg}
                </div>
                <div className="text-[10.5px] text-[var(--text-tertiary)]">
                  {ionCalc.saltPairs} salt + {ionCalc.totalNeg - ionCalc.saltPairs} neutral
                </div>
              </div>
            </div>

            <CodeShowcase
              title="gmx genion Commands"
              subtitle="Exact ion counts (-np/-nn) or automatic molarity (-conc)"
              code={`# Explicit ion counts (accounts for ${soluteFraction}% solute excluded volume)\n${ionCalc.genionExactCmd}\n\n# Or let GROMACS compute molarity from box volume automatically:\n${ionCalc.genionAutoCmd}`}
              language="bash"
              compact
              maxHeight="200px"
            />
          </div>
        </div>
      )}
    </section>
  );
};
