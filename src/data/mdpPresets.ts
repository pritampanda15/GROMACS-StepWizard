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
  lincsIter?: number;
  lincsOrder?: number;
  epsilonR?: number;
  pull?: {
    group1: string;
    group2: string;
    geometry: 'distance' | 'direction' | 'cylinder';
    dim: string;
    rate: number; // nm/ps (0.0 for umbrella window)
    k: number; // kJ / (mol nm^2)
    start: 'yes' | 'no';
  };
  fep?: {
    coupleMoltype: string;
    initLambdaState: number;
    scAlpha: number;
    scPower: number;
    scSigma: number;
    coupleIntramol: 'yes' | 'no';
  };
  awh?: {
    start: number;
    end: number;
    forceConstant: number;
    diffusion: number;
    shareMultisim: 'yes' | 'no';
  };
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
  {
    id: 'steered-md-pull',
    name: 'Steered MD Pulling (SMD)',
    subtitle: 'Center-of-mass pulling to generate reaction coordinate windows (pull-coord1-rate > 0)',
    badge: 'Umbrella / SMD',
    source: 'GROMACS Pull Code & CHAPERONg Umbrella Protocol',
    defaultTimeNs: 0.5,
    config: {
      title: 'Steered MD (SMD) Center-of-Mass Pulling',
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
      nstlist: 40,
      rcoulomb: 1.0,
      rvdw: 1.0,
      coulombtype: 'PME',
      nstxoutCompressed: 500,
      nstenergy: 500,
      nstlog: 500,
      continuation: 'yes',
      genVel: 'no',
      define: '-DPOSRES_B',
      dispCorr: 'EnerPres',
      pull: {
        group1: 'Chain_B',
        group2: 'Chain_A',
        geometry: 'distance',
        dim: 'N N Y',
        rate: 0.01,
        k: 1000,
        start: 'yes',
      },
    },
  },
  {
    id: 'umbrella-sampling-window',
    name: 'Umbrella Sampling Window',
    subtitle: 'Harmonic COM restraint at fixed spacing (pull-coord1-rate = 0.0) for WHAM PMF',
    badge: 'Umbrella / WHAM',
    source: 'GROMACS Pull Code & CHAPERONg Umbrella Protocol',
    defaultTimeNs: 10,
    config: {
      title: 'Umbrella Sampling Production Window (WHAM PMF)',
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
      nstlist: 40,
      rcoulomb: 1.0,
      rvdw: 1.0,
      coulombtype: 'PME',
      nstxoutCompressed: 5000,
      nstenergy: 5000,
      nstlog: 5000,
      continuation: 'yes',
      genVel: 'no',
      define: '-DPOSRES_B',
      dispCorr: 'EnerPres',
      pull: {
        group1: 'Chain_B',
        group2: 'Chain_A',
        geometry: 'distance',
        dim: 'N N Y',
        rate: 0.0,
        k: 1000,
        start: 'yes',
      },
    },
  },
  {
    id: 'fep-alchemical-decoupling',
    name: 'Alchemical FEP / ABFE (BAR/MBAR)',
    subtitle: 'Soft-core λ-state ligand decoupling with full dH/dλ neighbor evaluation',
    badge: 'FEP / MBAR',
    source: 'GROMACS Free Energy & Alchemical Best Practice',
    defaultTimeNs: 5,
    config: {
      title: 'Alchemical Free Energy Perturbation (ABFE Ligand Decoupling)',
      integrator: 'sd',
      dt: 0.002,
      temperature: 298.15,
      pressure: 1.0,
      tcoupl: 'no',
      pcoupl: 'C-rescale',
      pcoupltype: 'isotropic',
      tcGrps: 'System',
      tauT: '2.0',
      tauP: 5.0,
      compressibility: '4.5e-5',
      constraints: 'h-bonds',
      cutoffScheme: 'Verlet',
      nstlist: 40,
      rcoulomb: 1.2,
      rvdw: 1.2,
      vdwModifier: 'Potential-shift-Verlet',
      coulombtype: 'PME',
      nstxoutCompressed: 5000,
      nstenergy: 1000,
      nstlog: 1000,
      continuation: 'yes',
      genVel: 'no',
      dispCorr: 'EnerPres',
      fep: {
        coupleMoltype: 'LIG',
        initLambdaState: 0,
        scAlpha: 0.5,
        scPower: 1,
        scSigma: 0.3,
        coupleIntramol: 'no',
      },
    },
  },
  {
    id: 'awh-adaptive-bias',
    name: 'AWH Adaptive Free Energy',
    subtitle: 'Accelerated Weight Histogram native adaptive PMF (supports multi-walker -multidir)',
    badge: 'AWH Bias',
    source: 'GROMACS 2024 AWH Documentation',
    defaultTimeNs: 50,
    config: {
      title: 'Accelerated Weight Histogram (AWH) Adaptive PMF Simulation',
      integrator: 'md',
      dt: 0.002,
      temperature: 300,
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
      nstlist: 80,
      rcoulomb: 1.0,
      rvdw: 1.0,
      coulombtype: 'PME',
      nstxoutCompressed: 10000,
      nstenergy: 5000,
      nstlog: 5000,
      continuation: 'yes',
      genVel: 'no',
      dispCorr: 'EnerPres',
      pull: {
        group1: 'Protein',
        group2: 'LIG',
        geometry: 'distance',
        dim: 'Y Y Y',
        rate: 0.0,
        k: 1000,
        start: 'no',
      },
      awh: {
        start: 0.4,
        end: 3.0,
        forceConstant: 12800,
        diffusion: 5e-5,
        shareMultisim: 'yes',
      },
    },
  },
  {
    id: 'martini3-coarse-grained',
    name: 'Coarse-Grained Martini 3 (20 fs)',
    subtitle: 'Reaction-field electrostatics (εr=15), 1.1 nm cutoffs & 20 fs integration timestep',
    badge: 'Martini 3 CG',
    source: 'Martini 3 Official GROMACS Parameters',
    defaultTimeNs: 1000,
    config: {
      title: 'Martini 3 Coarse-Grained NPT Production MD',
      integrator: 'md',
      dt: 0.02,
      temperature: 310,
      pressure: 1.0,
      tcoupl: 'V-rescale',
      pcoupl: 'C-rescale',
      pcoupltype: 'isotropic',
      tcGrps: 'Protein Non-Protein',
      tauT: '1.0 1.0',
      tauP: 4.0,
      compressibility: '3e-4',
      constraints: 'none',
      cutoffScheme: 'Verlet',
      nstlist: 20,
      rcoulomb: 1.1,
      rvdw: 1.1,
      vdwModifier: 'Potential-shift-Verlet',
      coulombtype: 'reaction-field',
      epsilonR: 15,
      nstxoutCompressed: 5000,
      nstenergy: 5000,
      nstlog: 5000,
      continuation: 'yes',
      genVel: 'no',
    },
  },
  {
    id: 'hmr-4fs-production',
    name: '4 fs HMR High-Throughput NPT',
    subtitle: 'Hydrogen Mass Repartitioning (dt=0.004 ps) with lincs-iter=2 for 2× walltime reach',
    badge: '4 fs HMR',
    source: 'GROMACS HMR & NVIDIA GPU Best Practice',
    defaultTimeNs: 500,
    config: {
      title: '4 fs Hydrogen Mass Repartitioning (HMR) GPU-Resident Production',
      integrator: 'md',
      dt: 0.004,
      temperature: 300,
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
      nstxoutCompressed: 12500,
      nstenergy: 5000,
      nstlog: 5000,
      continuation: 'yes',
      genVel: 'no',
      dispCorr: 'EnerPres',
      lincsIter: 2,
      lincsOrder: 4,
    },
  },
];

export function generateMdpText(cfg: MdpConfig): string {
  const isEM = cfg.integrator === 'steep' || cfg.integrator === 'cg';
  const lines: string[] = [
    `; Generated by GROMACS StepWizard`,
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
  if (cfg.constraints !== 'none') {
    lines.push(`constraint_algorithm    = lincs`);
    lines.push(`constraints             = ${cfg.constraints}   ; Required as h-bonds for -update gpu`);
    lines.push(`lincs_iter              = ${cfg.lincsIter ?? 1}${cfg.dt >= 0.004 ? '         ; lincs_iter = 2 recommended for 4 fs HMR' : ''}`);
    lines.push(`lincs_order             = ${cfg.lincsOrder ?? 4}`);
  } else {
    lines.push(`constraints             = none      ; Martini 3 uses harmonic bonds / constraints in .itp`);
  }

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
  if (cfg.coulombtype.toLowerCase() === 'reaction-field') {
    lines.push(`epsilon_r               = ${cfg.epsilonR ?? 15}        ; Relative dielectric constant (15 for Martini 3 water)`);
    lines.push(`epsilon_rf              = 0         ; Infinite reaction-field dielectric`);
  } else {
    lines.push(`pme_order               = 4`);
    lines.push(`fourierspacing          = 0.16`);
  }

  if (!isEM) {
    lines.push(``);
    lines.push(`; Temperature coupling`);
    lines.push(`tcoupl                  = ${cfg.tcoupl}${cfg.integrator === 'sd' ? '        ; Langevin sd integrator handles temperature control' : ''}`);
    if (cfg.tcoupl !== 'no' || cfg.integrator === 'sd') {
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

    if (cfg.pull) {
      lines.push(``);
      lines.push(`; Pull code (${cfg.awh ? 'AWH Collective Variable' : 'Steered MD / Umbrella Sampling'})`);
      lines.push(`pull                    = yes`);
      lines.push(`pull-ncoords            = 1         ; Number of reaction coordinates`);
      lines.push(`pull-ngroups            = 2         ; Reference + pulled group`);
      lines.push(`pull-group1-name        = ${cfg.pull.group1}`);
      lines.push(`pull-group2-name        = ${cfg.pull.group2}`);
      lines.push(`pull-coord1-type        = ${cfg.awh ? 'external-potential' : 'umbrella'}`);
      if (cfg.awh) {
        lines.push(`pull-coord1-potential-provider = awh`);
      }
      lines.push(`pull-coord1-geometry    = ${cfg.pull.geometry}  ; Distance / direction / cylinder`);
      lines.push(`pull-coord1-dim         = ${cfg.pull.dim}     ; Pull axis components (X Y Z)`);
      lines.push(`pull-coord1-groups      = 1 2`);
      lines.push(`pull-coord1-start       = ${cfg.pull.start}       ; Use initial COM distance as reference`);
      if (!cfg.awh) {
        lines.push(`pull-coord1-rate        = ${cfg.pull.rate}      ; ${cfg.pull.rate === 0 ? '0.0 nm/ps (stationary umbrella window)' : `${cfg.pull.rate} nm/ps (${(cfg.pull.rate * 1000).toFixed(1)} nm/ns pulling speed)`}`);
        lines.push(`pull-coord1-k           = ${cfg.pull.k}      ; Harmonic force constant (kJ mol^-1 nm^-2)`);
      }
    }

    if (cfg.awh) {
      lines.push(``);
      lines.push(`; Accelerated Weight Histogram (AWH) adaptive biasing`);
      lines.push(`awh                     = yes`);
      lines.push(`awh-nbias               = 1`);
      lines.push(`awh-nstout              = 50000     ; Write AWH PMF state to .edr`);
      lines.push(`awh-share-multisim      = ${cfg.awh.shareMultisim}       ; Share bias across -multidir walkers`);
      lines.push(`awh1-ndim               = 1`);
      lines.push(`awh1-error-init         = 10.0      ; Initial free-energy error estimate (kJ/mol)`);
      lines.push(`awh1-growth             = exp-linear`);
      lines.push(`awh1-dim1-coord-index   = 1`);
      lines.push(`awh1-dim1-start         = ${cfg.awh.start.toFixed(2)}      ; Lower bound along reaction coordinate (nm)`);
      lines.push(`awh1-dim1-end           = ${cfg.awh.end.toFixed(2)}      ; Upper bound along reaction coordinate (nm)`);
      lines.push(`awh1-dim1-force-constant = ${cfg.awh.forceConstant}   ; Umbrella stiffness (kJ mol^-1 nm^-2)`);
      lines.push(`awh1-dim1-diffusion     = ${cfg.awh.diffusion.toExponential(1)}   ; Estimated diffusion coefficient (nm^2/ps)`);
    }

    if (cfg.fep) {
      lines.push(``);
      lines.push(`; Alchemical Free Energy Perturbation (FEP / ABFE / BAR / MBAR)`);
      lines.push(`free-energy             = yes`);
      lines.push(`couple-moltype          = ${cfg.fep.coupleMoltype}       ; Molecule type to decouple`);
      lines.push(`couple-lambda0          = vdw-q     ; Fully interacting at state 0`);
      lines.push(`couple-lambda1          = none      ; Fully decoupled at final state`);
      lines.push(`couple-intramol         = ${cfg.fep.coupleIntramol}`);
      lines.push(`init-lambda-state       = ${cfg.fep.initLambdaState}         ; Override per window (0..20)`);
      lines.push(`coul-lambdas            = 0.00 0.20 0.40 0.60 0.80 1.00 1.00 1.00 1.00 1.00 1.00 1.00 1.00 1.00 1.00 1.00 1.00 1.00 1.00 1.00 1.00`);
      lines.push(`vdw-lambdas             = 0.00 0.00 0.00 0.00 0.00 0.00 0.05 0.10 0.20 0.30 0.40 0.50 0.60 0.65 0.70 0.75 0.80 0.85 0.90 0.95 1.00`);
      lines.push(`sc-alpha                = ${cfg.fep.scAlpha}       ; Soft-core LJ parameter to avoid end-point singularities`);
      lines.push(`sc-power                = ${cfg.fep.scPower}`);
      lines.push(`sc-sigma                = ${cfg.fep.scSigma}`);
      lines.push(`calc-lambda-neighbors   = -1        ; Evaluate all λ states for MBAR`);
      lines.push(`nstdhdl                 = 100       ; Write dH/dλ every 100 steps`);
      lines.push(`separate-dhdl-file      = yes`);
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
  {
    param: 'pull / pull-coord1-type',
    category: 'Integration',
    defaultValue: 'yes / umbrella',
    description: 'Activates GROMACS COM pull code for Steered MD (SMD) and Umbrella Sampling with a harmonic potential (pull-coord1-type = umbrella).',
    tip: 'Set pull-coord1-rate = 0.01 nm/ps for pulling, then 0.0 nm/ps for stationary umbrella windows.',
  },
  {
    param: 'pull-coord1-k',
    category: 'Integration',
    defaultValue: '1000 kJ mol⁻¹ nm⁻²',
    description: 'Harmonic spring force constant restraining the reaction coordinate. Ensure adjacent window histograms overlap cleanly in gmx wham.',
    tip: 'Increase k (e.g. 1500–2500) across steep barrier regions if histogram gaps appear.',
  },
  {
    param: 'free-energy / sc-alpha / calc-lambda-neighbors',
    category: 'Integration',
    defaultValue: 'yes / 0.5 / -1',
    description: 'Enables alchemical FEP/ABFE/RBFE decoupling with soft-core potentials (sc-alpha=0.5, sc-power=1) and full λ-matrix evaluation (-1) required for MBAR.',
    tip: 'Pair with integrator = sd (stochastic Langevin dynamics) for robust decoupling temperature control.',
  },
  {
    param: 'awh / awh-share-multisim',
    category: 'Integration',
    defaultValue: 'yes / yes',
    description: 'Activates GROMACS native Accelerated Weight Histogram (AWH) adaptive biasing to sample PMFs without manually spacing dozens of umbrella windows.',
    tip: 'Launch 4–8 walkers with gmx_mpi mdrun -multidir to share a single AWH bias and converge faster.',
  },
  {
    param: 'coulombtype = reaction-field / epsilon_r = 15',
    category: 'Cutoffs & PME',
    defaultValue: 'Martini 3 CG standard',
    description: 'Standard electrostatics setup for Martini 3 coarse-grained simulations with 1.1 nm cutoffs and 20 fs timesteps (dt = 0.02).',
  },
  {
    param: 'lincs_iter (HMR 4 fs)',
    category: 'Constraints',
    defaultValue: '2 (for dt = 0.004)',
    description: 'Increases LINCS constraint solver iterations to preserve bond-length accuracy and energy conservation when running 4 fs Hydrogen Mass Repartitioning (HMR).',
  },
];
