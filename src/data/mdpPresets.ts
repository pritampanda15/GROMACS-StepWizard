export interface MdpConfig {
  title: string;
  integrator: string;
  dt: number; // ps
  nsteps: number;
  timePs: number;
  temperature: number; // K
  pressure: number; // bar
  tcoupl: string;
  pcoupl: string;
  pcoupltype: string;
  tcGrps: string;
  tauT: string;
  tauP: number;
  compressibility: string;
  constraints: string;
  cutoffScheme: string;
  nstlist: number;
  rcoulomb: number;
  rvdw: number;
  vdwModifier?: string;
  rvdwSwitch?: number;
  rlist?: number;
  coulombtype: string;
  nstxoutCompressed: number;
  nstenergy: number;
  nstlog: number;
  continuation: 'yes' | 'no';
  genVel: 'yes' | 'no';
  define?: string;
  dispCorr?: string;
  refcoordScaling?: string;
  commGrps?: string;
  emtol?: number;
}

export interface MdpPreset {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  source: string;
  defaultTimeNs: number;
  config: Omit<MdpConfig, 'nsteps' | 'timePs'>;
}

export const MDP_PRESETS: MdpPreset[] = [
  {
    id: 'opls-production',
    name: 'OPLS-AA Production (NPT)',
    subtitle: 'Classic GROMACS StepWizard protein-in-water NPT production run',
    badge: 'StepWizard Default',
    source: 'GROMACS-StepWizard/production_files/production.mdp',
    defaultTimeNs: 100,
    config: {
      title: 'OPLS-AA Protein NPT Production MD',
      integrator: 'md',
      dt: 0.002,
      temperature: 300,
      pressure: 1.0,
      tcoupl: 'V-rescale',
      pcoupl: 'Parrinello-Rahman',
      pcoupltype: 'isotropic',
      tcGrps: 'Protein Non-Protein',
      tauT: '0.1 0.1',
      tauP: 2.0,
      compressibility: '4.5e-5',
      constraints: 'h-bonds',
      cutoffScheme: 'Verlet',
      nstlist: 20,
      rcoulomb: 1.0,
      rvdw: 1.0,
      coulombtype: 'PME',
      nstxoutCompressed: 5000,
      nstenergy: 5000,
      nstlog: 5000,
      continuation: 'yes',
      genVel: 'no',
      dispCorr: 'EnerPres',
    },
  },
  {
    id: 'nvidia-gpu-resident',
    name: 'NVIDIA GPU-Resident High-Throughput',
    subtitle: 'Tuned for -nb gpu -pme gpu -bonded gpu -update gpu with larger nstlist & C-rescale',
    badge: 'NVIDIA GPU',
    source: 'Molecular-Dynamics/hpc/nvidia-gpu & GROMACS 2024 Docs',
    defaultTimeNs: 200,
    config: {
      title: 'GPU-Resident NPT Production MD (NVIDIA Optimized)',
      integrator: 'md',
      dt: 0.002,
      temperature: 310,
      pressure: 1.0,
      tcoupl: 'V-rescale',
      pcoupl: 'C-rescale',
      pcoupltype: 'isotropic',
      tcGrps: 'Protein Non-Protein',
      tauT: '0.5 0.5',
      tauP: 5.0,
      compressibility: '4.5e-5',
      constraints: 'h-bonds',
      cutoffScheme: 'Verlet',
      nstlist: 100,
      rcoulomb: 1.0,
      rvdw: 1.0,
      coulombtype: 'PME',
      nstxoutCompressed: 25000,
      nstenergy: 10000,
      nstlog: 10000,
      continuation: 'yes',
      genVel: 'no',
      dispCorr: 'EnerPres',
    },
  },
  {
    id: 'charmm36-lipid-bilayer',
    name: 'CHARMM36 Lipid Bilayer Production',
    subtitle: 'Asymmetric plasma membrane semi-isotropic NPT (310.15 K, Force-switch)',
    badge: 'CHARMM-GUI',
    source: 'Molecular-Dynamics/workflows/lipid-bilayer/step7_production.mdp',
    defaultTimeNs: 100,
    config: {
      title: 'CHARMM36 Asymmetric Plasma Membrane Production (step7)',
      integrator: 'md',
      dt: 0.002,
      temperature: 310.15,
      pressure: 1.0,
      tcoupl: 'Nose-Hoover',
      pcoupl: 'Parrinello-Rahman',
      pcoupltype: 'semiisotropic',
      tcGrps: 'MEMB SOLV',
      tauT: '1.0 1.0',
      tauP: 5.0,
      compressibility: '4.5e-5 4.5e-5',
      constraints: 'h-bonds',
      cutoffScheme: 'Verlet',
      nstlist: 20,
      rlist: 1.2,
      rcoulomb: 1.2,
      rvdw: 1.2,
      vdwModifier: 'Force-switch',
      rvdwSwitch: 1.0,
      coulombtype: 'PME',
      nstxoutCompressed: 5000,
      nstenergy: 1000,
      nstlog: 1000,
      continuation: 'yes',
      genVel: 'no',
      commGrps: 'MEMB SOLV',
    },
  },
  {
    id: 'charmm36-protein-ligand',
    name: 'CHARMM36 Protein–Ligand Production',
    subtitle: 'Force-switched 1.2 nm cutoffs with merged Protein_LIG coupling group',
    badge: 'Protein–Ligand',
    source: 'Molecular-Dynamics/workflows/protein-ligand/',
    defaultTimeNs: 100,
    config: {
      title: 'CHARMM36 Protein-Ligand Complex Production MD',
      integrator: 'md',
      dt: 0.002,
      temperature: 300,
      pressure: 1.0,
      tcoupl: 'V-rescale',
      pcoupl: 'Parrinello-Rahman',
      pcoupltype: 'isotropic',
      tcGrps: 'Protein_LIG Water_and_ions',
      tauT: '0.1 0.1',
      tauP: 2.0,
      compressibility: '4.5e-5',
      constraints: 'h-bonds',
      cutoffScheme: 'Verlet',
      nstlist: 20,
      rlist: 1.2,
      rcoulomb: 1.2,
      rvdw: 1.2,
      vdwModifier: 'Force-switch',
      rvdwSwitch: 1.0,
      coulombtype: 'PME',
      nstxoutCompressed: 5000,
      nstenergy: 5000,
      nstlog: 5000,
      continuation: 'yes',
      genVel: 'no',
    },
  },
  {
    id: 'nvt-equilibration',
    name: 'NVT Equilibration (Restrained)',
    subtitle: 'Constant volume thermalization with position restraints (-DPOSRES)',
    badge: 'Equilibration',
    source: 'GROMACS Standard Equilibration Protocol',
    defaultTimeNs: 0.1,
    config: {
      title: 'NVT Equilibration with Position Restraints',
      integrator: 'md',
      dt: 0.002,
      temperature: 300,
      pressure: 1.0,
      tcoupl: 'V-rescale',
      pcoupl: 'no',
      pcoupltype: 'isotropic',
      tcGrps: 'Protein Non-Protein',
      tauT: '0.1 0.1',
      tauP: 2.0,
      compressibility: '4.5e-5',
      constraints: 'h-bonds',
      cutoffScheme: 'Verlet',
      nstlist: 20,
      rcoulomb: 1.0,
      rvdw: 1.0,
      coulombtype: 'PME',
      nstxoutCompressed: 500,
      nstenergy: 500,
      nstlog: 500,
      continuation: 'no',
      genVel: 'yes',
      define: '-DPOSRES',
      dispCorr: 'EnerPres',
    },
  },
  {
    id: 'npt-equilibration',
    name: 'NPT Equilibration (C-rescale)',
    subtitle: 'Density & box volume equilibration using stochastic cell rescaling',
    badge: 'Equilibration',
    source: 'GROMACS 2022+ Best Practice Protocol',
    defaultTimeNs: 0.5,
    config: {
      title: 'NPT Equilibration with Position Restraints',
      integrator: 'md',
      dt: 0.002,
      temperature: 300,
      pressure: 1.0,
      tcoupl: 'V-rescale',
      pcoupl: 'C-rescale',
      pcoupltype: 'isotropic',
      tcGrps: 'Protein Non-Protein',
      tauT: '0.1 0.1',
      tauP: 2.0,
      compressibility: '4.5e-5',
      constraints: 'h-bonds',
      cutoffScheme: 'Verlet',
      nstlist: 20,
      rcoulomb: 1.0,
      rvdw: 1.0,
      coulombtype: 'PME',
      nstxoutCompressed: 500,
      nstenergy: 500,
      nstlog: 500,
      continuation: 'yes',
      genVel: 'no',
      define: '-DPOSRES',
      refcoordScaling: 'com',
      dispCorr: 'EnerPres',
    },
  },
  {
    id: 'energy-minimization',
    name: 'Energy Minimization (Steepest Descent)',
    subtitle: 'Steric clash removal down to Fmax < 1000 kJ/mol/nm',
    badge: 'Minimization',
    source: 'Molecular-Dynamics/workflows/lipid-bilayer/step6.0_minimization.mdp',
    defaultTimeNs: 0.01,
    config: {
      title: 'Energy Minimization (Steepest Descent)',
      integrator: 'steep',
      dt: 0.002,
      temperature: 300,
      pressure: 1.0,
      tcoupl: 'no',
      pcoupl: 'no',
      pcoupltype: 'isotropic',
      tcGrps: 'System',
      tauT: '0.1',
      tauP: 2.0,
      compressibility: '4.5e-5',
      constraints: 'h-bonds',
      cutoffScheme: 'Verlet',
      nstlist: 10,
      rlist: 1.2,
      rcoulomb: 1.2,
      rvdw: 1.2,
      vdwModifier: 'Force-switch',
      rvdwSwitch: 1.0,
      coulombtype: 'PME',
      nstxoutCompressed: 0,
      nstenergy: 100,
      nstlog: 100,
      continuation: 'no',
      genVel: 'no',
      emtol: 1000.0,
    },
  },
];

export function generateMdpText(cfg: MdpConfig): string {
  const isEM = cfg.integrator === 'steep' || cfg.integrator === 'cg';
  const lines: string[] = [
    `; Generated by GROMACS StepWizard 2.0`,
    `title                   = ${cfg.title}`,
  ];

  if (cfg.define) {
    lines.push(`define                  = ${cfg.define}`);
  }

  lines.push(`; Run parameters`);
  lines.push(`integrator              = ${cfg.integrator}`);

  if (isEM) {
    lines.push(`emtol                   = ${(cfg.emtol ?? 1000).toFixed(1)}    ; Stop minimization when max force < ${cfg.emtol ?? 1000} kJ/mol/nm`);
    lines.push(`emstep                  = 0.01      ; Minimization step size`);
    lines.push(`nsteps                  = ${cfg.nsteps}    ; Max minimization steps`);
  } else {
    const ns = cfg.timePs / 1000;
    lines.push(`nsteps                  = ${cfg.nsteps}    ; ${cfg.dt} ps * ${cfg.nsteps.toLocaleString()} = ${cfg.timePs.toLocaleString()} ps (${ns >= 1 ? `${ns.toFixed(ns % 1 === 0 ? 0 : 2)} ns` : `${cfg.timePs} ps`})`);
    lines.push(`dt                      = ${cfg.dt}     ; ${cfg.dt * 1000} fs integration timestep`);
  }

  lines.push(``);
  lines.push(`; Output control`);
  lines.push(`nstxout                 = 0         ; Suppress uncompressed .trr coordinates to save disk`);
  lines.push(`nstvout                 = 0         ; Suppress velocities`);
  lines.push(`nstfout                 = 0         ; Suppress forces`);
  lines.push(`nstenergy               = ${cfg.nstenergy}      ; Write energies every ${cfg.nstenergy} steps`);
  lines.push(`nstlog                  = ${cfg.nstlog}      ; Update log file every ${cfg.nstlog} steps`);
  if (!isEM) {
    lines.push(`nstxout-compressed      = ${cfg.nstxoutCompressed}      ; Write compressed .xtc every ${((cfg.nstxoutCompressed * cfg.dt)).toFixed(1)} ps`);
    lines.push(`compressed-x-grps       = System`);
  }

  lines.push(``);
  lines.push(`; Bond parameters`);
  lines.push(`continuation            = ${cfg.continuation}`);
  lines.push(`constraint_algorithm    = lincs`);
  lines.push(`constraints             = ${cfg.constraints}   ; Required as h-bonds for -update gpu`);
  lines.push(`lincs_iter              = 1`);
  lines.push(`lincs_order             = 4`);

  lines.push(``);
  lines.push(`; Neighbor searching & cutoffs`);
  lines.push(`cutoff-scheme           = ${cfg.cutoffScheme}`);
  lines.push(`nstlist                 = ${cfg.nstlist}        ; Neighbor list update frequency (40-200 optimal on GPUs)`);
  if (cfg.rlist) lines.push(`rlist                   = ${cfg.rlist.toFixed(1)}`);
  lines.push(`rcoulomb                = ${cfg.rcoulomb.toFixed(1)}       ; Short-range electrostatic cutoff (nm)`);
  lines.push(`rvdw                    = ${cfg.rvdw.toFixed(1)}       ; Short-range van der Waals cutoff (nm)`);
  if (cfg.vdwModifier) {
    lines.push(`vdwtype                 = Cut-off`);
    lines.push(`vdw-modifier            = ${cfg.vdwModifier}`);
    if (cfg.rvdwSwitch) lines.push(`rvdw-switch             = ${cfg.rvdwSwitch.toFixed(1)}`);
  }

  lines.push(``);
  lines.push(`; Electrostatics`);
  lines.push(`coulombtype             = ${cfg.coulombtype}`);
  lines.push(`pme_order               = 4`);
  lines.push(`fourierspacing          = 0.16`);

  if (!isEM) {
    lines.push(``);
    lines.push(`; Temperature coupling`);
    lines.push(`tcoupl                  = ${cfg.tcoupl}`);
    if (cfg.tcoupl !== 'no') {
      const grpCount = cfg.tcGrps.trim().split(/\s+/).length;
      const refT = Array(grpCount).fill(cfg.temperature).join(' ');
      lines.push(`tc-grps                 = ${cfg.tcGrps}`);
      lines.push(`tau_t                   = ${cfg.tauT}`);
      lines.push(`ref_t                   = ${refT}`);
    }

    lines.push(``);
    lines.push(`; Pressure coupling`);
    lines.push(`pcoupl                  = ${cfg.pcoupl}`);
    if (cfg.pcoupl !== 'no') {
      lines.push(`pcoupltype              = ${cfg.pcoupltype}`);
      lines.push(`tau_p                   = ${cfg.tauP.toFixed(1)}`);
      lines.push(
        `ref_p                   = ${cfg.pcoupltype === 'semiisotropic' ? `${cfg.pressure.toFixed(1)} ${cfg.pressure.toFixed(1)}` : cfg.pressure.toFixed(1)}`
      );
      lines.push(`compressibility         = ${cfg.compressibility}`);
      if (cfg.refcoordScaling) {
        lines.push(`refcoord_scaling        = ${cfg.refcoordScaling}`);
      }
    }

    lines.push(``);
    lines.push(`; Periodic boundary conditions & dispersion`);
    lines.push(`pbc                     = xyz`);
    if (cfg.dispCorr) {
      lines.push(`DispCorr                = ${cfg.dispCorr}`);
    }
    if (cfg.commGrps) {
      lines.push(`nstcomm                 = 100`);
      lines.push(`comm-mode               = linear`);
      lines.push(`comm-grps               = ${cfg.commGrps}`);
    }

    lines.push(``);
    lines.push(`; Velocity generation`);
    lines.push(`gen_vel                 = ${cfg.genVel}`);
    if (cfg.genVel === 'yes') {
      lines.push(`gen_temp                = ${cfg.temperature}`);
      lines.push(`gen_seed                = -1`);
    }
  } else {
    lines.push(``);
    lines.push(`pbc                     = xyz`);
  }

  return lines.join('\n');
}

export interface MdpParamDoc {
  param: string;
  category: 'Integration' | 'Output' | 'Constraints' | 'Cutoffs & PME' | 'Thermostat & Barostat' | 'GPU Tuning';
  defaultValue: string;
  description: string;
  tip?: string;
}

export const MDP_PARAM_DOCS: MdpParamDoc[] = [
  {
    param: 'dt',
    category: 'Integration',
    defaultValue: '0.002 ps (2 fs)',
    description: 'Integration time step in picoseconds. 2 fs is standard with h-bonds constrained; 4 fs is possible with Hydrogen Mass Repartitioning (HMR) or virtual sites.',
    tip: 'nsteps = total_time_ps / dt',
  },
  {
    param: 'nsteps',
    category: 'Integration',
    defaultValue: '50000000 (100 ns @ 2 fs)',
    description: 'Maximum number of integration steps. Set to -1 for unlimited steps (e.g. with -maxh on HPC clusters).',
  },
  {
    param: 'integrator',
    category: 'Integration',
    defaultValue: 'md',
    description: 'Leap-frog integrator (md) for standard MD, steep for steepest-descent energy minimization, sd for stochastic Langevin dynamics.',
  },
  {
    param: 'nstxout / nstvout / nstfout',
    category: 'Output',
    defaultValue: '0',
    description: 'Frequency for writing full-precision .trr coordinates, velocities, and forces. Keep at 0 in production to avoid multi-terabyte files.',
    tip: 'Use nstxout-compressed instead for compact .xtc trajectories.',
  },
  {
    param: 'nstxout-compressed',
    category: 'Output',
    defaultValue: '5000 (10 ps @ 2 fs)',
    description: 'Steps between writing lossy-compressed .xtc trajectory frames. 5000 steps = 10 ps/frame (10,000 frames per 100 ns).',
  },
  {
    param: 'nstenergy / nstlog',
    category: 'Output',
    defaultValue: '5000',
    description: 'Frequency of writing energy terms to .edr and diagnostic metrics to .log.',
  },
  {
    param: 'constraints',
    category: 'Constraints',
    defaultValue: 'h-bonds',
    description: 'Converts bonds involving hydrogen atoms into rigid LINCS constraints, enabling 2 fs timesteps.',
    tip: 'NVIDIA GPU Tip: Always use h-bonds (not all-bonds) so GROMACS can build GPU update groups for -update gpu.',
  },
  {
    param: 'cutoff-scheme',
    category: 'Cutoffs & PME',
    defaultValue: 'Verlet',
    description: 'Buffered pair-list scheme mandatory for GPU acceleration and modern SIMD kernels in GROMACS 2020+.',
  },
  {
    param: 'nstlist',
    category: 'GPU Tuning',
    defaultValue: '20 (CPU) / 100–200 (GPU)',
    description: 'Neighbor-list search frequency. Increasing nstlist on NVIDIA GPUs (or passing -nstlist 100 at runtime) cuts pair-search overhead dramatically.',
    tip: 'GROMACS automatically tunes Verlet buffer size to maintain energy conservation.',
  },
  {
    param: 'vdw-modifier / rvdw-switch',
    category: 'Cutoffs & PME',
    defaultValue: 'Force-switch / 1.0 nm (CHARMM36)',
    description: 'Smoothly switches van der Waals forces to zero between rvdw-switch (1.0 nm) and rvdw (1.2 nm) as required by CHARMM36 force fields.',
  },
  {
    param: 'tcoupl',
    category: 'Thermostat & Barostat',
    defaultValue: 'V-rescale',
    description: 'Velocity-rescaling (Bussi) thermostat guarantees a true canonical ensemble with rapid equilibration. Nose-Hoover is also common for CHARMM-GUI membranes.',
  },
  {
    param: 'pcoupl',
    category: 'Thermostat & Barostat',
    defaultValue: 'Parrinello-Rahman / C-rescale',
    description: 'Barostat algorithm. Use C-rescale (GROMACS 2021+) for robust NPT equilibration or production, and Parrinello-Rahman for rigorous NPT fluctuations.',
  },
  {
    param: 'pcoupltype',
    category: 'Thermostat & Barostat',
    defaultValue: 'isotropic / semiisotropic',
    description: 'Use isotropic for soluble proteins and semiisotropic (coupled XY plane, independent Z axis) for lipid bilayers and membrane proteins.',
  },
];
