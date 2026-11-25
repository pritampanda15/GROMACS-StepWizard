import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Box,
  Cpu,
  FastForward,
  Flame,
  FlaskConical,
  GitCommitHorizontal,
  Layers,
  Play,
  Sparkles,
  Terminal,
  Waves,
  Wrench,
} from 'lucide-react';
import {
  ToggleSwitch,
  CodeShowcase,
  SegmentedControl,
} from './UiPrimitives';

type BuilderTab =
  | 'mdrun'
  | 'grompp'
  | 'setup'
  | 'postprocess'
  | 'analysis'
  | 'extend'
  | 'pca'
  | 'umbrella'
  | 'fep'
  | 'awh'
  | 'remd'
  | 'plumed'
  | 'mmpbsa';

export const CommandBuilderSection: React.FC = () => {
  const [tab, setTab] = useState<BuilderTab>('mdrun');

  // mdrun state
  const [binary, setBinary] = useState<'gmx' | 'gmx_mpi'>('gmx');
  const [deffnm, setDeffnm] = useState('md_0_1');
  const [ntmpi, setNtmpi] = useState(1);
  const [ntomp, setNtomp] = useState(8);
  const [npme, setNpme] = useState(0);
  const [nb, setNb] = useState<'gpu' | 'cpu' | 'auto'>('gpu');
  const [pme, setPme] = useState<'gpu' | 'cpu' | 'auto'>('gpu');
  const [bonded, setBonded] = useState<'gpu' | 'cpu' | 'auto'>('gpu');
  const [update, setUpdate] = useState<'gpu' | 'cpu' | 'auto'>('gpu');
  const [pinOn, setPinOn] = useState(true);
  const [pinoffset, setPinoffset] = useState(0);
  const [nstlistOverride, setNstlistOverride] = useState(100);
  const [useMaxh, setUseMaxh] = useState(false);
  const [maxh, setMaxh] = useState(23.8);
  const [useCheckpoint, setUseCheckpoint] = useState(false);
  const [dlb, setDlb] = useState<'auto' | 'yes' | 'no'>('auto');
  const [tunepme, setTunepme] = useState(true);
  const [verbose, setVerbose] = useState(true);

  // grompp state
  const [mdpFile, setMdpFile] = useState('production.mdp');
  const [coordFile, setCoordFile] = useState('npt.gro');
  const [restraintFile, setRestraintFile] = useState('');
  const [cptFile, setCptFile] = useState('npt.cpt');
  const [topFile, setTopFile] = useState('topol.top');
  const [ndxFile, setNdxFile] = useState('index.ndx');
  const [outTpr, setOutTpr] = useState('md_0_1.tpr');
  const [maxwarn, setMaxwarn] = useState('0');

  // setup state
  const [pdbIn, setPdbIn] = useState('protein.pdb');
  const [waterModel, setWaterModel] = useState('spce');
  const [boxType, setBoxType] = useState<'cubic' | 'dodecahedron' | 'octahedron'>('dodecahedron');
  const [boxDist, setBoxDist] = useState('1.0');
  const [saltConc, setSaltConc] = useState('0.15');
  const [ignh, setIgnh] = useState(true);

  // postprocess state
  const [ppPrefix, setPpPrefix] = useState('md_0_1');
  const [ppCenterPbc, setPpCenterPbc] = useState(true);
  const [ppFit, setPpFit] = useState(true);
  const [ppRmsd, setPpRmsd] = useState(true);
  const [ppSnapshots, setPpSnapshots] = useState(false);
  const [ppSkip, setPpSkip] = useState(1000);

  // extend state
  const [extendNs, setExtendNs] = useState(100);
  const [extendPrefix, setExtendPrefix] = useState('md_0_1');

  // pca state
  const [pcaGroup, setPcaGroup] = useState('4');
  const [pcaStart, setPcaStart] = useState(0);
  const [pcaEnd, setPcaEnd] = useState(100);
  const [pcaEntropy, setPcaEntropy] = useState(true);

  // mmpbsa state
  const [mmpbsaRec, setMmpbsaRec] = useState('1');
  const [mmpbsaLig, setMmpbsaLig] = useState('13');
  const [mmpbsaTpr, setMmpbsaTpr] = useState('md_0_100.tpr');
  const [mmpbsaXtc, setMmpbsaXtc] = useState('md_0_100_fit.xtc');

  // umbrella / WHAM state
  const [usRefGrp, setUsRefGrp] = useState('Chain_B');
  const [usPullGrp, setUsPullGrp] = useState('Chain_A');
  const [usUnit, setUsUnit] = useState<'kCal' | 'kJ'>('kCal');
  const [usSkipPs, setUsSkipPs] = useState(1000);
  const [usBootstrap, setUsBootstrap] = useState(200);

  // expanded analysis suite state
  const [anaPrefix, setAnaPrefix] = useState('md_0_1');
  const [anaRmsf, setAnaRmsf] = useState(true);
  const [anaGyrate, setAnaGyrate] = useState(true);
  const [anaHbond, setAnaHbond] = useState(true);
  const [anaSasa, setAnaSasa] = useState(false);
  const [anaMindist, setAnaMindist] = useState(true);
  const [anaDssp, setAnaDssp] = useState(true);
  const [anaEnergy, setAnaEnergy] = useState(false);

  // FEP / BAR state
  const [fepWindows, setFepWindows] = useState(21);
  const [fepTemp, setFepTemp] = useState(298.15);

  // AWH state
  const [awhWalkers, setAwhWalkers] = useState(4);
  const [awhOmp, setAwhOmp] = useState(4);

  // T-REMD state
  const [remdN, setRemdN] = useState(8);
  const [remdTmin, setRemdTmin] = useState(300);
  const [remdTmax, setRemdTmax] = useState(380);
  const [remdReplex, setRemdReplex] = useState(500);

  // PLUMED MetaD state
  const [plumedPace, setPlumedPace] = useState(500);
  const [plumedHeight, setPlumedHeight] = useState(1.2);
  const [plumedSigma, setPlumedSigma] = useState(0.05);
  const [plumedBias, setPlumedBias] = useState(10);

  const remdLadder = useMemo(() => {
    const n = Math.max(2, remdN);
    return Array.from({ length: n }, (_, i) =>
      Number((remdTmin * Math.exp((i * Math.log(Math.max(remdTmax, remdTmin + 1) / remdTmin)) / (n - 1))).toFixed(2))
    );
  }, [remdN, remdTmin, remdTmax]);

  const { command, activeFlags } = useMemo(() => {
    if (tab === 'mdrun') {
      const parts: string[] = [];
      const flags: { flag: string; meaning: string }[] = [];

      if (binary === 'gmx_mpi') {
        parts.push(`mpirun -np ${ntmpi} gmx_mpi mdrun`);
        flags.push({ flag: `mpirun -np ${ntmpi}`, meaning: `Launches ${ntmpi} MPI rank(s)` });
      } else {
        parts.push('gmx mdrun');
        if (ntmpi > 0) {
          parts.push(`-ntmpi ${ntmpi}`);
          flags.push({ flag: `-ntmpi ${ntmpi}`, meaning: `${ntmpi} thread-MPI rank(s)` });
        }
      }

      if (verbose) parts.push('-v');
      parts.push(`-deffnm ${deffnm}`);
      flags.push({ flag: `-deffnm ${deffnm}`, meaning: `Uses ${deffnm}.{tpr,xtc,edr,log,cpt}` });

      if (ntomp > 0) {
        parts.push(`-ntomp ${ntomp}`);
        flags.push({ flag: `-ntomp ${ntomp}`, meaning: `${ntomp} OpenMP threads per rank` });
      }
      if (npme > 0) {
        parts.push(`-npme ${npme}`);
        flags.push({ flag: `-npme ${npme}`, meaning: `${npme} dedicated PME rank(s)` });
      }

      parts.push(`-nb ${nb}`, `-pme ${pme}`, `-bonded ${bonded}`, `-update ${update}`);
      flags.push({
        flag: `-nb ${nb} -pme ${pme} -bonded ${bonded} -update ${update}`,
        meaning:
          nb === 'gpu' && pme === 'gpu' && bonded === 'gpu' && update === 'gpu'
            ? 'Full NVIDIA GPU-resident execution loop'
            : 'Explicit CPU/GPU task placement',
      });

      if (nstlistOverride > 0) {
        parts.push(`-nstlist ${nstlistOverride}`);
        flags.push({
          flag: `-nstlist ${nstlistOverride}`,
          meaning: 'Runtime neighbor-list search cadence',
        });
      }

      if (pinOn) {
        parts.push('-pin on');
        if (pinoffset > 0) parts.push(`-pinoffset ${pinoffset}`);
        flags.push({
          flag: pinoffset > 0 ? `-pin on -pinoffset ${pinoffset}` : '-pin on',
          meaning: 'Pins threads to physical CPU cores',
        });
      }

      if (dlb !== 'auto') {
        parts.push(`-dlb ${dlb}`);
        flags.push({ flag: `-dlb ${dlb}`, meaning: 'Dynamic domain load balancing' });
      }
      if (!tunepme) {
        parts.push('-notunepme');
        flags.push({ flag: '-notunepme', meaning: 'Disables runtime PME cutoff tuning' });
      }
      if (useMaxh) {
        parts.push(`-maxh ${maxh}`);
        flags.push({ flag: `-maxh ${maxh}`, meaning: `Graceful checkpoint exit at ${maxh}h` });
      }
      if (useCheckpoint) {
        parts.push(`-cpi ${deffnm}.cpt -append`);
        flags.push({ flag: `-cpi ${deffnm}.cpt -append`, meaning: 'Resumes from checkpoint & appends' });
      }

      return { command: parts.join(' \\\n    '), activeFlags: flags };
    }

    if (tab === 'grompp') {
      const parts = [`${binary} grompp`, `-f ${mdpFile}`, `-c ${coordFile}`];
      const flags = [
        { flag: `-f ${mdpFile}`, meaning: 'Molecular dynamics parameter file' },
        { flag: `-c ${coordFile}`, meaning: 'Starting coordinates (.gro/.pdb)' },
      ];
      if (restraintFile.trim()) {
        parts.push(`-r ${restraintFile.trim()}`);
        flags.push({ flag: `-r ${restraintFile.trim()}`, meaning: 'Position restraint reference coordinates' });
      }
      if (cptFile.trim()) {
        parts.push(`-t ${cptFile.trim()}`);
        flags.push({ flag: `-t ${cptFile.trim()}`, meaning: 'Preserves exact velocities & thermostat/barostat state' });
      }
      parts.push(`-p ${topFile}`);
      if (ndxFile.trim()) {
        parts.push(`-n ${ndxFile.trim()}`);
        flags.push({ flag: `-n ${ndxFile.trim()}`, meaning: 'Custom atom coupling index groups' });
      }
      parts.push(`-o ${outTpr}`);
      if (maxwarn !== '0') {
        parts.push(`-maxwarn ${maxwarn}`);
        flags.push({ flag: `-maxwarn ${maxwarn}`, meaning: 'Warning tolerance threshold' });
      }
      return { command: parts.join(' \\\n    '), activeFlags: flags };
    }

    if (tab === 'setup') {
      const cmd = [
        `# 1. Generate topology & processed structure`,
        `${binary} pdb2gmx -f ${pdbIn} -o protein_processed.gro -water ${waterModel}${ignh ? ' -ignh' : ''}`,
        ``,
        `# 2. Define periodic simulation box (${boxType}, ${boxDist} nm margin)`,
        `${binary} editconf -f protein_processed.gro -o newbox.gro -c -d ${boxDist} -bt ${boxType}`,
        ``,
        `# 3. Solvate with pre-equilibrated water`,
        `${binary} solvate -cp newbox.gro -cs spc216.gro -o solv.gro -p topol.top`,
        ``,
        `# 4. Neutralize & add ${saltConc} M NaCl counter-ions`,
        `${binary} grompp -f ions.mdp -c solv.gro -p topol.top -o ions.tpr`,
        `printf "13\\n" | ${binary} genion -s ions.tpr -o solv_ions.gro -p topol.top -pname NA -nname CL -neutral -conc ${saltConc}`,
      ].join('\n');

      return {
        command: cmd,
        activeFlags: [
          { flag: ignh ? '-ignh' : 'keep H', meaning: 'Rebuilds hydrogen atoms cleanly for force field' },
          { flag: `-bt ${boxType} -d ${boxDist}`, meaning: 'Periodic boundary shape & wall clearance' },
          { flag: `-neutral -conc ${saltConc}`, meaning: 'Zero net charge + physiological ionic strength' },
        ],
      };
    }

    if (tab === 'postprocess') {
      const lines: string[] = [];
      const flags: { flag: string; meaning: string }[] = [];
      if (ppCenterPbc) {
        lines.push(`# Center on Protein (1), make molecules whole, compact PBC unit cell`);
        lines.push(
          `printf "1\\n0\\n" | ${binary} trjconv -s ${ppPrefix}.tpr -f ${ppPrefix}.xtc -o ${ppPrefix}_center.xtc -center -pbc mol -ur compact`
        );
        flags.push({ flag: '-center -pbc mol -ur compact', meaning: 'Eliminates broken molecules & box-jump artifacts' });
      }
      if (ppFit) {
        lines.push(`\n# Remove overall rotational and translational drift`);
        lines.push(
          `printf "4\\n0\\n" | ${binary} trjconv -s ${ppPrefix}.tpr -f ${ppPrefix}_center.xtc -o ${ppPrefix}_fit.xtc -fit rot+trans`
        );
        flags.push({ flag: '-fit rot+trans', meaning: 'Superimposes Backbone (4) across all frames' });
      }
      if (ppRmsd) {
        lines.push(`\n# Compute Backbone (4) RMSD in nanoseconds`);
        lines.push(
          `printf "4\\n4\\n" | ${binary} rms -s ${ppPrefix}.tpr -f ${ppPrefix}_center.xtc -o rmsd.xvg -tu ns`
        );
        flags.push({ flag: 'gmx rms -tu ns', meaning: 'Outputs time-series RMSD in ns' });
      }
      if (ppSnapshots) {
        lines.push(`\n# Extract individual PDB snapshots every ${ppSkip} frames`);
        lines.push(
          `printf "1\\n1\\n" | ${binary} trjconv -s ${ppPrefix}.tpr -f ${ppPrefix}_center.xtc -o snap_pro.pdb -sep -center -skip ${ppSkip}`
        );
        flags.push({ flag: `-sep -skip ${ppSkip}`, meaning: `Writes separate PDBs every ${ppSkip} frames` });
      }
      return {
        command: lines.join('\n').trim() || '# Toggle at least one post-processing step.',
        activeFlags: flags,
      };
    }

    if (tab === 'extend') {
      const extendPs = extendNs * 1000;
      const cmd = [
        `# 1. Extend existing TPR by +${extendNs} ns (${extendPs.toLocaleString()} ps)`,
        `${binary} convert-tpr -s ${extendPrefix}.tpr -extend ${extendPs} -o next.tpr`,
        ``,
        `# 2. Resume seamlessly from checkpoint & append outputs`,
        `${binary} mdrun -v -s next.tpr -deffnm ${extendPrefix} -cpi ${extendPrefix}.cpt -append -nb gpu -pme gpu -bonded gpu -update gpu`,
      ].join('\n');
      return {
        command: cmd,
        activeFlags: [
          { flag: `-extend ${extendPs}`, meaning: `Adds ${extendNs} ns (${extendPs.toLocaleString()} ps) to TPR` },
          { flag: `-cpi ${extendPrefix}.cpt -append`, meaning: 'Continues exact ensemble without discontinuity' },
        ],
      };
    }

    if (tab === 'pca') {
      const lines = [
        `# 1. Diagonalize covariance matrix (${pcaStart}–${pcaEnd} ns, group ${pcaGroup})`,
        `printf "${pcaGroup}\\n${pcaGroup}\\n" | ${binary} covar -f md_fit.xtc -s md.tpr -n index.ndx -o eigenval.xvg -v eigenvec.trr -b ${pcaStart} -e ${pcaEnd} -tu ns`,
        ``,
        `# 2. Project trajectory onto PC1 & PC2`,
        `printf "${pcaGroup}\\n${pcaGroup}\\n" | ${binary} anaeig -v eigenvec.trr -f md_fit.xtc -eig eigenval.xvg -s md.tpr -n index.ndx -first 1 -last 2 -2d PCA_2dproj.xvg`,
        ``,
        `# 3. Compute 2D Gibbs Free Energy Landscape (FEL) & render color EPS/PDF`,
        `${binary} sham -f PCA_2dproj.xvg -ls FEL_sham.xpm -notime`,
        `${binary} xpm2ps -f FEL_sham.xpm -o FEL_sham.eps -rainbow red`,
        `convert FEL_sham.eps FEL_sham.pdf`,
      ];
      if (pcaEntropy) {
        lines.push(
          ``,
          `# 4. Quasi-harmonic conformational entropy & PC1 extreme motion PDB`,
          `printf "${pcaGroup}\\n${pcaGroup}\\n" | ${binary} anaeig -v eigenvec.trr -f md_fit.xtc -eig eigenval.xvg -s md.tpr -n index.ndx -first 1 -last 1 -nframes 100 -extr ev1.pdb -entropy`
        );
      }
      return {
        command: lines.join('\n'),
        activeFlags: [
          { flag: `-b ${pcaStart} -e ${pcaEnd} -tu ns`, meaning: 'Time slice for essential dynamics' },
          { flag: '-first 1 -last 2 -2d', meaning: '2D projection along principal eigenvectors' },
          { flag: 'gmx sham -notime', meaning: 'Boltzmann inversion free energy surface' },
        ],
      };
    }

    if (tab === 'umbrella') {
      const cmd = [
        `# 1. Steered MD (SMD) pulling run to generate starting configurations`,
        `${binary} grompp -f md_pull.mdp -c npt.gro -r npt.gro -t npt.cpt -p topol.top -n index.ndx -o pull.tpr`,
        `${binary} mdrun -v -deffnm pull -pf pullf.xvg -px pullx.xvg -nb gpu -pme gpu -bonded gpu -update gpu -pin on`,
        ``,
        `# 2. Extract SMD snapshots & measure COM distances between ${usRefGrp} and ${usPullGrp}`,
        `printf "0\\n" | ${binary} trjconv -s pull.tpr -f pull.xtc -o conf.gro -sep`,
        `${binary} distance -s pull.tpr -f conf0.gro -n index.ndx -select 'com of group "${usRefGrp}" plus com of group "${usPullGrp}"' -oall dist0.xvg`,
        ``,
        `# 3. Run Umbrella Sampling window (repeat across spaced windows 0..N)`,
        `${binary} grompp -f md_umbrella.mdp -c conf_win0.gro -r conf_win0.gro -p topol.top -n index.ndx -o umbrella0.tpr`,
        `${binary} mdrun -v -deffnm umbrella0 -pf pullf-umbrella0.xvg -px pullx-umbrella0.xvg -nb gpu -pme gpu -bonded gpu -update gpu -pin on`,
        ``,
        `# 4. Reconstruct PMF profile & histogram overlap via gmx wham`,
        `ls -v umbrella*.tpr > tpr-files.dat`,
        `ls -v pullf-umbrella*.xvg > pullf-files.dat`,
        `${binary} wham -it tpr-files.dat -if pullf-files.dat -o profile.xvg -hist histo.xvg -unit ${usUnit} -b ${usSkipPs} -nBootstrap ${usBootstrap} -bsres bsResult.xvg`,
      ].join('\n');
      return {
        command: cmd,
        activeFlags: [
          { flag: '-pf pullf.xvg -px pullx.xvg', meaning: 'Writes pull force & COM distance timeseries for WHAM' },
          { flag: `gmx distance (${usRefGrp} ↔ ${usPullGrp})`, meaning: 'Measures COM separation to pick evenly spaced windows' },
          { flag: `gmx wham -unit ${usUnit} -b ${usSkipPs}`, meaning: `Discards first ${usSkipPs} ps equilibration per window` },
          { flag: `-nBootstrap ${usBootstrap} -bsres`, meaning: 'Bayesian bootstrap error estimation along PMF curve' },
        ],
      };
    }

    if (tab === 'analysis') {
      const lines: string[] = [];
      const flags: { flag: string; meaning: string }[] = [];
      if (anaRmsf) {
        lines.push(`# Per-residue flexibility (RMSF) + B-factor mapped PDB`);
        lines.push(`printf "3\\n" | ${binary} rmsf -s ${anaPrefix}.tpr -f ${anaPrefix}_fit.xtc -o rmsf.xvg -res -oq bfac.pdb`);
        flags.push({ flag: 'gmx rmsf -res -oq', meaning: 'Cα per-residue RMSF & PDB with RMSF in B-factor column' });
      }
      if (anaGyrate) {
        lines.push(`\n# Radius of gyration (global compactness)`);
        lines.push(`printf "1\\n" | ${binary} gyrate -s ${anaPrefix}.tpr -f ${anaPrefix}_center.xtc -o gyrate.xvg`);
        flags.push({ flag: 'gmx gyrate', meaning: 'Tracks protein folding/compactness over time' });
      }
      if (anaHbond) {
        lines.push(`\n# Hydrogen bonds (e.g. Protein=1, Ligand=13)`);
        lines.push(`printf "1\\n13\\n" | ${binary} hbond -s ${anaPrefix}.tpr -f ${anaPrefix}_center.xtc -num hbnum.xvg`);
        flags.push({ flag: 'gmx hbond -num', meaning: 'Counts H-bonds per frame across trajectory' });
      }
      if (anaSasa) {
        lines.push(`\n# Solvent-Accessible Surface Area (SASA)`);
        lines.push(`printf "1\\n" | ${binary} sasa -s ${anaPrefix}.tpr -f ${anaPrefix}_center.xtc -o sasa.xvg -or resarea.xvg`);
        flags.push({ flag: 'gmx sasa -or', meaning: 'Total and per-residue solvent accessibility (nm²)' });
      }
      if (anaMindist) {
        lines.push(`\n# Periodic boundary minimum image check (verify no self-interaction)`);
        lines.push(`printf "1\\n" | ${binary} mindist -s ${anaPrefix}.tpr -f ${anaPrefix}_center.xtc -pi -od mindist_pbc.xvg`);
        flags.push({ flag: 'gmx mindist -pi', meaning: 'Detects periodic self-image artifacts (must stay > cutoff)' });
      }
      if (anaDssp) {
        lines.push(`\n# Secondary structure evolution (GROMACS 2023+ built-in DSSP)`);
        lines.push(`${binary} dssp -s ${anaPrefix}.tpr -f ${anaPrefix}_center.xtc -o dssp.dat -num scount.xvg`);
        flags.push({ flag: 'gmx dssp -num', meaning: 'Native GROMACS 2023+ secondary structure timeline' });
      }
      if (anaEnergy) {
        lines.push(`\n# Extract Potential, Temperature, Pressure, Density from .edr`);
        lines.push(`printf "Potential\\nTemperature\\nPressure\\nDensity\\n0\\n" | ${binary} energy -f ${anaPrefix}.edr -o energy.xvg`);
        flags.push({ flag: 'gmx energy', meaning: 'Checks thermodynamic convergence from .edr' });
      }
      return {
        command: lines.join('\n').trim() || '# Toggle at least one analysis metric.',
        activeFlags: flags,
      };
    }

    if (tab === 'fep') {
      const cmd = [
        `# 1. Run alchemical λ-windows (0..${fepWindows - 1}) writing dH/dλ files`,
        `for lam in $(seq 0 ${fepWindows - 1}); do`,
        `    mkdir -p lambda_\${lam}`,
        `    sed "s/^init-lambda-state.*/init-lambda-state = \${lam}/" fep_lambda.mdp > lambda_\${lam}/fep.mdp`,
        `    (cd lambda_\${lam} && ${binary} grompp -f fep.mdp -c ../npt.gro -t ../npt.cpt -p ../topol.top -o fep.tpr && \\`,
        `     ${binary} mdrun -v -deffnm fep -dhdl dhdl.xvg -nb gpu -pme gpu -bonded gpu -pin on)`,
        `done`,
        ``,
        `# 2. Estimate ΔG across all λ-states via Bennett Acceptance Ratio (BAR)`,
        `${binary} bar -f lambda_*/dhdl.xvg -o bar.xvg -oi barint.xvg -oh histogram.xvg`,
        ``,
        `# 3. Optional MBAR estimation via alchemlyb (Python)`,
        `python3 -c "import glob, pandas as pd; from alchemlyb.parsing.gmx import extract_u_nk; from alchemlyb.estimators import MBAR; u = pd.concat([extract_u_nk(f, T=${fepTemp}) for f in sorted(glob.glob('lambda_*/dhdl.xvg'))]); m = MBAR().fit(u); print(m.delta_f_)"`,
      ].join('\n');
      return {
        command: cmd,
        activeFlags: [
          { flag: '-dhdl dhdl.xvg', meaning: 'Outputs Hamiltonian derivatives & ΔH across λ neighbors' },
          { flag: 'gmx bar -f lambda_*/dhdl.xvg', meaning: 'Computes ΔG + overlap diagnostics via BAR' },
          { flag: `alchemlyb MBAR (T=${fepTemp} K)`, meaning: 'Multistate BAR across all λ states (calc-lambda-neighbors = -1)' },
        ],
      };
    }

    if (tab === 'awh') {
      const dirs = Array.from({ length: awhWalkers }, (_, i) => `walker_${i}`).join(' ');
      const cmd = [
        `# 1. Compile TPR for ${awhWalkers} AWH walkers (shared adaptive bias)`,
        `for d in ${dirs}; do mkdir -p "\${d}" && gmx_mpi grompp -f awh_md.mdp -c npt.gro -p topol.top -n index.ndx -o "\${d}/awh.tpr"; done`,
        ``,
        `# 2. Launch multi-walker AWH with NVIDIA GPU offload`,
        `export GMX_ENABLE_DIRECT_GPU_COMM=1`,
        `mpirun -np ${awhWalkers} gmx_mpi mdrun -multidir ${dirs} -deffnm awh -ntomp ${awhOmp} -nb gpu -pme gpu -bonded gpu -update gpu -pin on`,
        ``,
        `# 3. Extract converged PMF profile & friction metric from .edr`,
        `gmx_mpi awh -f walker_0/awh.edr -s walker_0/awh.tpr -o pmf.xvg -more`,
      ].join('\n');
      return {
        command: cmd,
        activeFlags: [
          { flag: `-multidir ${dirs}`, meaning: `${awhWalkers} coupled walkers sharing one adaptive AWH bias` },
          { flag: 'gmx_mpi awh -more', meaning: 'Writes PMF curve, target distribution & diffusion/friction' },
        ],
      };
    }

    if (tab === 'remd') {
      const dirs = remdLadder.map((_, i) => `rep_${i}`).join(' ');
      const cmd = [
        `# Geometric T-REMD Temperature Ladder (${remdLadder.length} replicas: ${remdTmin}–${remdTmax} K):`,
        `#   ${remdLadder.join('  ')} K`,
        ``,
        `# 1. Generate per-replica MDPs & TPRs`,
        `TEMPS=(${remdLadder.join(' ')})`,
        `for i in "\${!TEMPS[@]}"; do`,
        `    mkdir -p "rep_\${i}"`,
        `    sed "s/^ref_t.*/ref_t = \${TEMPS[$i]} \${TEMPS[$i]}/" production.mdp > "rep_\${i}/remd.mdp"`,
        `    gmx_mpi grompp -f "rep_\${i}/remd.mdp" -c npt.gro -p topol.top -o "rep_\${i}/remd.tpr"`,
        `done`,
        ``,
        `# 2. Launch Temperature Replica Exchange MD (-replex ${remdReplex})`,
        `export GMX_ENABLE_DIRECT_GPU_COMM=1`,
        `mpirun -np ${remdLadder.length} gmx_mpi mdrun -multidir ${dirs} -deffnm remd -replex ${remdReplex} -ntomp 4 -nb gpu -pme gpu -bonded gpu -update gpu -pin on`,
        ``,
        `# 3. Check exchange probability & demultiplex continuous trajectories`,
        `grep -A 10 "Repl  average probabilities" rep_0/remd.log`,
        `demux.pl rep_0/remd.log && gmx_mpi trjcat -f rep_*/remd.xtc -demux replica_index.xvg -o continuous.xtc`,
      ].join('\n');
      return {
        command: cmd,
        activeFlags: [
          { flag: `Ladder: ${remdTmin} → ${remdTmax} K`, meaning: `${remdLadder.length} exponentially spaced temperatures for uniform overlap` },
          { flag: `-replex ${remdReplex}`, meaning: `Attempts coordinate exchanges every ${remdReplex} steps` },
          { flag: 'trjcat -demux', meaning: 'Reconstructs continuous trajectories across temperature space' },
        ],
      };
    }

    if (tab === 'plumed') {
      const cmd = [
        `# 1. Create Well-Tempered Metadynamics input (plumed.dat)`,
        `cat <<'EOF' > plumed.dat`,
        `UNITS LENGTH=nm TIME=ps ENERGY=kj/mol`,
        `WHOLEMOLECULES ENTITY0=1-250 ENTITY1=3500-3542`,
        `c1: COM ATOMS=1-250`,
        `c2: COM ATOMS=3500-3542`,
        `d1: DISTANCE ATOMS=c1,c2`,
        `metad: METAD ARG=d1 PACE=${plumedPace} HEIGHT=${plumedHeight} SIGMA=${plumedSigma} BIASFACTOR=${plumedBias} TEMP=300 FILE=HILLS`,
        `PRINT ARG=d1,metad.bias STRIDE=${plumedPace} FILE=COLVAR`,
        `EOF`,
        ``,
        `# 2. Run PLUMED-patched GROMACS with GPU offload`,
        `${binary} mdrun -v -deffnm metad -plumed plumed.dat -nb gpu -pme gpu -bonded gpu -update gpu -pin on`,
        ``,
        `# 3. Integrate Gaussian hills into 1D Free Energy Surface (FES)`,
        `plumed sum_hills --hills HILLS --mintozero --outfile fes.dat`,
      ].join('\n');
      return {
        command: cmd,
        activeFlags: [
          { flag: '-plumed plumed.dat', meaning: 'Activates PLUMED collective-variable biasing inside mdrun' },
          { flag: `PACE=${plumedPace} HEIGHT=${plumedHeight} γ=${plumedBias}`, meaning: 'Well-Tempered Metadynamics hill deposition schedule' },
          { flag: 'plumed sum_hills --mintozero', meaning: 'Integrates deposited Gaussians into FES curve (kJ/mol)' },
        ],
      };
    }

    // mmpbsa
    const cmd = [
      `# 1. Activate gmx_MMPBSA conda environment`,
      `conda activate gmxMMPBSA`,
      ``,
      `# 2. Compute MM-GBSA / MM-PBSA binding free energy (Receptor=${mmpbsaRec}, Ligand=${mmpbsaLig})`,
      `gmx_MMPBSA -O \\`,
      `    -i mmpbsa.in \\`,
      `    -cs ${mmpbsaTpr} \\`,
      `    -ct ${mmpbsaXtc} \\`,
      `    -ci index.ndx \\`,
      `    -cg ${mmpbsaRec} ${mmpbsaLig} \\`,
      `    -cp topol.top \\`,
      `    -o FINAL_RESULTS_MMPBSA.dat \\`,
      `    -eo FINAL_RESULTS_MMPBSA.csv`,
      ``,
      `# 3. Launch interactive gmx_MMPBSA_ana GUI`,
      `gmx_MMPBSA_ana -f _GMXMMPBSA_info`,
    ].join('\n');
    return {
      command: cmd,
      activeFlags: [
        { flag: `-cg ${mmpbsaRec} ${mmpbsaLig}`, meaning: 'Receptor & Ligand group indices in index.ndx' },
        { flag: '-O -eo FINAL_RESULTS_MMPBSA.csv', meaning: 'Overwrites & exports energy decomposition CSV' },
        { flag: 'gmx_MMPBSA_ana', meaning: 'Interactive ΔG_bind plotting & per-residue GUI' },
      ],
    };
  }, [
    tab, binary, deffnm, ntmpi, ntomp, npme, nb, pme, bonded, update, pinOn, pinoffset,
    nstlistOverride, useMaxh, maxh, useCheckpoint, dlb, tunepme, verbose,
    mdpFile, coordFile, restraintFile, cptFile, topFile, ndxFile, outTpr, maxwarn,
    pdbIn, waterModel, boxType, boxDist, saltConc, ignh,
    ppPrefix, ppCenterPbc, ppFit, ppRmsd, ppSnapshots, ppSkip,
    extendNs, extendPrefix, pcaGroup, pcaStart, pcaEnd, pcaEntropy,
    mmpbsaRec, mmpbsaLig, mmpbsaTpr, mmpbsaXtc,
    usRefGrp, usPullGrp, usUnit, usSkipPs, usBootstrap,
    anaPrefix, anaRmsf, anaGyrate, anaHbond, anaSasa, anaMindist, anaDssp, anaEnergy,
    fepWindows, fepTemp, awhWalkers, awhOmp,
    remdLadder, remdTmin, remdTmax, remdReplex,
    plumedPace, plumedHeight, plumedSigma, plumedBias,
  ]);

  return (
    <section className="space-y-6">
      <div className="surface-card p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-blue)]">
              Visual CLI Assembler
            </span>
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.025em] text-[var(--text-primary)]">
              GROMACS Command Line Builder
            </h2>
            <p className="text-[13.5px] text-[var(--text-secondary)] mt-1">
              Compose validated flags from official GROMACS docs, NVIDIA GPU guides, and Molecular-Dynamics protocols.
            </p>
          </div>

          <SegmentedControl<'gmx' | 'gmx_mpi'>
            layoutId="gmx-binary-seg"
            size="sm"
            value={binary}
            onChange={setBinary}
            options={[
              { value: 'gmx', label: 'gmx (Thread-MPI)' },
              { value: 'gmx_mpi', label: 'gmx_mpi (HPC MPI)' },
            ]}
          />
        </div>

        <div className="mt-5">
          <SegmentedControl<BuilderTab>
            layoutId="cli-builder-tab"
            size="sm"
            wrap
            className="w-full"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'mdrun', label: 'mdrun', icon: <Play className="w-3.5 h-3.5" /> },
              { value: 'grompp', label: 'grompp', icon: <Wrench className="w-3.5 h-3.5" /> },
              { value: 'setup', label: 'Setup', icon: <Box className="w-3.5 h-3.5" /> },
              { value: 'postprocess', label: 'PBC & RMSD', icon: <Activity className="w-3.5 h-3.5" /> },
              { value: 'analysis', label: 'Analysis', icon: <BarChart3 className="w-3.5 h-3.5" /> },
              { value: 'extend', label: 'Extend', icon: <FastForward className="w-3.5 h-3.5" /> },
              { value: 'pca', label: 'PCA & FEL', icon: <Cpu className="w-3.5 h-3.5" /> },
              { value: 'umbrella', label: 'Umbrella', icon: <GitCommitHorizontal className="w-3.5 h-3.5" /> },
              { value: 'fep', label: 'FEP / BAR', icon: <Sparkles className="w-3.5 h-3.5" /> },
              { value: 'awh', label: 'AWH', icon: <Waves className="w-3.5 h-3.5" /> },
              { value: 'remd', label: 'T-REMD', icon: <Flame className="w-3.5 h-3.5" /> },
              { value: 'plumed', label: 'PLUMED', icon: <Layers className="w-3.5 h-3.5" /> },
              { value: 'mmpbsa', label: 'MMPBSA', icon: <FlaskConical className="w-3.5 h-3.5" /> },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Pane */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="lg:col-span-5 surface-card p-5 sm:p-6 space-y-4"
        >
          {tab === 'mdrun' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                    File Prefix (-deffnm)
                  </label>
                  <input
                    value={deffnm}
                    onChange={(e) => setDeffnm(e.target.value)}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                    -nstlist Override
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={400}
                    step={20}
                    value={nstlistOverride}
                    onChange={(e) => setNstlistOverride(Number(e.target.value))}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11.5px] text-[var(--text-secondary)] font-medium">
                    {binary === 'gmx_mpi' ? 'MPI Ranks' : '-ntmpi'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={64}
                    value={ntmpi}
                    onChange={(e) => setNtmpi(Math.max(1, Number(e.target.value)))}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] text-[var(--text-secondary)] font-medium">
                    -ntomp
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={64}
                    value={ntomp}
                    onChange={(e) => setNtomp(Math.max(1, Number(e.target.value)))}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] text-[var(--text-secondary)] font-medium">
                    -npme
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={16}
                    value={npme}
                    onChange={(e) => setNpme(Math.max(0, Number(e.target.value)))}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {([
                  ['Non-Bonded (-nb)', nb, setNb],
                  ['PME (-pme)', pme, setPme],
                  ['Bonded (-bonded)', bonded, setBonded],
                  ['Update (-update)', update, setUpdate],
                ] as const).map(([label, val, setter]) => (
                  <div key={label}>
                    <label className="text-[11.5px] text-[var(--text-secondary)] font-medium">
                      {label}
                    </label>
                    <select
                      value={val}
                      onChange={(e) => setter(e.target.value as 'gpu' | 'cpu' | 'auto')}
                      className="ui-input w-full px-3 py-2 text-[12.5px] mt-1 font-mono"
                    >
                      <option value="gpu">gpu</option>
                      <option value="cpu">cpu</option>
                      <option value="auto">auto</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11.5px] text-[var(--text-secondary)] font-medium">
                    Load Balancing (-dlb)
                  </label>
                  <select
                    value={dlb}
                    onChange={(e) => setDlb(e.target.value as 'auto' | 'yes' | 'no')}
                    className="ui-input w-full px-3 py-2 text-[12.5px] mt-1 font-mono"
                  >
                    <option value="auto">auto</option>
                    <option value="yes">yes</option>
                    <option value="no">no</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11.5px] text-[var(--text-secondary)] font-medium">
                    -pinoffset (MPS/MIG)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={128}
                    value={pinoffset}
                    onChange={(e) => setPinoffset(Math.max(0, Number(e.target.value)))}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="divide-y divide-[var(--border-hairline)] pt-1">
                <ToggleSwitch
                  checked={pinOn}
                  onChange={setPinOn}
                  label="Thread Pinning (-pin on)"
                  description="Locks threads to physical cores to prevent OS migration"
                  accent="green"
                />
                <ToggleSwitch
                  checked={tunepme}
                  onChange={setTunepme}
                  label="Dynamic PME Cutoff Tuning (-tunepme)"
                  description="Balances PP and PME workload automatically at startup"
                />
                <ToggleSwitch
                  checked={useCheckpoint}
                  onChange={setUseCheckpoint}
                  label="Resume from Checkpoint (-cpi -append)"
                  description="Continues an interrupted or extended trajectory seamlessly"
                />
                <ToggleSwitch
                  checked={useMaxh}
                  onChange={setUseMaxh}
                  label={`SLURM Walltime Guard (-maxh ${maxh})`}
                  description="Graceful shutdown + checkpoint before queue walltime expires"
                />
                {useMaxh && (
                  <div className="pt-3">
                    <input
                      type="number"
                      step="0.2"
                      value={maxh}
                      onChange={(e) => setMaxh(Number(e.target.value))}
                      className="ui-input w-full px-3 py-2 text-[13px] font-mono"
                    />
                  </div>
                )}
                <ToggleSwitch
                  checked={verbose}
                  onChange={setVerbose}
                  label="Verbose Step ETA (-v)"
                  description="Prints remaining walltime and step progress to stderr"
                />
              </div>
            </>
          )}

          {tab === 'grompp' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['MDP Input (-f)', mdpFile, setMdpFile],
                ['Coordinates (-c)', coordFile, setCoordFile],
                ['Restraint Ref (-r, optional)', restraintFile, setRestraintFile],
                ['Checkpoint (-t, optional)', cptFile, setCptFile],
                ['Topology (-p)', topFile, setTopFile],
                ['Index File (-n, optional)', ndxFile, setNdxFile],
                ['Output TPR (-o)', outTpr, setOutTpr],
                ['Max Warnings (-maxwarn)', maxwarn, setMaxwarn],
              ].map(([label, val, setter]) => (
                <div key={label as string}>
                  <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                    {label as string}
                  </label>
                  <input
                    value={val as string}
                    onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
              ))}
            </div>
          )}

          {tab === 'setup' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                    Input PDB
                  </label>
                  <input
                    value={pdbIn}
                    onChange={(e) => setPdbIn(e.target.value)}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                    Water Model (-water)
                  </label>
                  <select
                    value={waterModel}
                    onChange={(e) => setWaterModel(e.target.value)}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  >
                    <option value="spce">spce (SPC/E)</option>
                    <option value="tip3p">tip3p (CHARMM36 / AMBER)</option>
                    <option value="tip4p">tip4p</option>
                    <option value="opc">opc</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                    Box Geometry (-bt)
                  </label>
                  <select
                    value={boxType}
                    onChange={(e) => setBoxType(e.target.value as 'cubic' | 'dodecahedron' | 'octahedron')}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  >
                    <option value="dodecahedron">dodecahedron (~29% fewer waters)</option>
                    <option value="cubic">cubic</option>
                    <option value="octahedron">octahedron</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                    Box Wall Distance (-d nm)
                  </label>
                  <input
                    value={boxDist}
                    onChange={(e) => setBoxDist(e.target.value)}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                    Salt Conc. (-conc M)
                  </label>
                  <input
                    value={saltConc}
                    onChange={(e) => setSaltConc(e.target.value)}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
              </div>
              <ToggleSwitch
                checked={ignh}
                onChange={setIgnh}
                label="Ignore Input Hydrogens (-ignh)"
                description="Recommended for X-ray / AlphaFold PDBs so pdb2gmx assigns force-field hydrogens"
              />
            </div>
          )}

          {tab === 'postprocess' && (
            <div className="space-y-3">
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Trajectory Prefix
                </label>
                <input
                  value={ppPrefix}
                  onChange={(e) => setPpPrefix(e.target.value)}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div className="divide-y divide-[var(--border-hairline)]">
                <ToggleSwitch
                  checked={ppCenterPbc}
                  onChange={setPpCenterPbc}
                  label="PBC Cleanup & Center (-center -pbc mol -ur compact)"
                  description="Keeps protein whole and centered in a compact periodic box"
                />
                <ToggleSwitch
                  checked={ppFit}
                  onChange={setPpFit}
                  label="Rotational + Translational Fit (-fit rot+trans)"
                  description="Prepares trajectory for PCA, FEL, and gmx_MMPBSA"
                />
                <ToggleSwitch
                  checked={ppRmsd}
                  onChange={setPpRmsd}
                  label="Backbone RMSD (gmx rms -tu ns)"
                  description="Calculates structural drift over time in nanoseconds"
                />
                <ToggleSwitch
                  checked={ppSnapshots}
                  onChange={setPpSnapshots}
                  label="Extract Separated PDB Snapshots (-sep -skip)"
                  description="Exports frames for docking or structural ensembles"
                />
              </div>
              {ppSnapshots && (
                <div>
                  <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                    Frame Skip Interval (-skip)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={ppSkip}
                    onChange={(e) => setPpSkip(Math.max(1, Number(e.target.value)))}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {tab === 'extend' && (
            <div className="space-y-4">
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Existing Run Prefix
                </label>
                <input
                  value={extendPrefix}
                  onChange={(e) => setExtendPrefix(e.target.value)}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium flex justify-between">
                  <span>Extend Simulation By</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    +{extendNs} ns ({(extendNs * 1000).toLocaleString()} ps)
                  </span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={1000}
                  step={10}
                  value={extendNs}
                  onChange={(e) => setExtendNs(Number(e.target.value))}
                  className="ui-slider w-full mt-3"
                />
              </div>
            </div>
          )}

          {tab === 'pca' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11.5px] text-[var(--text-secondary)] font-medium">
                    Index Group
                  </label>
                  <input
                    value={pcaGroup}
                    onChange={(e) => setPcaGroup(e.target.value)}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] text-[var(--text-secondary)] font-medium">
                    Start (-b ns)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pcaStart}
                    onChange={(e) => setPcaStart(Number(e.target.value))}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] text-[var(--text-secondary)] font-medium">
                    End (-e ns)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={pcaEnd}
                    onChange={(e) => setPcaEnd(Number(e.target.value))}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
              </div>
              <ToggleSwitch
                checked={pcaEntropy}
                onChange={setPcaEntropy}
                label="Include Quasi-Harmonic Entropy & Extreme PDB"
                description="Appends gmx anaeig -extr ev1.pdb -entropy from Molecular-Dynamics/analysis/pca-fel-entropy"
              />
            </div>
          )}

          {tab === 'mmpbsa' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Receptor Group ID
                </label>
                <input
                  value={mmpbsaRec}
                  onChange={(e) => setMmpbsaRec(e.target.value)}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Ligand Group ID
                </label>
                <input
                  value={mmpbsaLig}
                  onChange={(e) => setMmpbsaLig(e.target.value)}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Structure TPR (-cs)
                </label>
                <input
                  value={mmpbsaTpr}
                  onChange={(e) => setMmpbsaTpr(e.target.value)}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Fitted Trajectory (-ct)
                </label>
                <input
                  value={mmpbsaXtc}
                  onChange={(e) => setMmpbsaXtc(e.target.value)}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
            </div>
          )}

          {tab === 'umbrella' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Reference Group
                </label>
                <input
                  value={usRefGrp}
                  onChange={(e) => setUsRefGrp(e.target.value)}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Pulled Group
                </label>
                <input
                  value={usPullGrp}
                  onChange={(e) => setUsPullGrp(e.target.value)}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  WHAM PMF Unit
                </label>
                <select
                  value={usUnit}
                  onChange={(e) => setUsUnit(e.target.value as 'kCal' | 'kJ')}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                >
                  <option value="kCal">kCal (kcal/mol)</option>
                  <option value="kJ">kJ (kJ/mol)</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Equil Discard (-b ps)
                </label>
                <input
                  type="number"
                  step={500}
                  min={0}
                  value={usSkipPs}
                  onChange={(e) => setUsSkipPs(Math.max(0, Number(e.target.value)))}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Bootstrap Resamples (-nBootstrap)
                </label>
                <input
                  type="number"
                  step={50}
                  min={0}
                  max={1000}
                  value={usBootstrap}
                  onChange={(e) => setUsBootstrap(Math.max(0, Number(e.target.value)))}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
            </div>
          )}

          {tab === 'analysis' && (
            <div className="space-y-3">
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Simulation Prefix
                </label>
                <input
                  value={anaPrefix}
                  onChange={(e) => setAnaPrefix(e.target.value)}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div className="divide-y divide-[var(--border-hairline)]">
                <ToggleSwitch checked={anaRmsf} onChange={setAnaRmsf} label="Per-Residue RMSF (gmx rmsf -res -oq)" description="Outputs rmsf.xvg + B-factor colored PDB" />
                <ToggleSwitch checked={anaGyrate} onChange={setAnaGyrate} label="Radius of Gyration (gmx gyrate)" description="Monitors global protein compactness" />
                <ToggleSwitch checked={anaHbond} onChange={setAnaHbond} label="Hydrogen Bonds (gmx hbond)" description="Protein–ligand or intra-protein H-bond count" />
                <ToggleSwitch checked={anaMindist} onChange={setAnaMindist} label="Periodic Image Check (gmx mindist -pi)" description="Verifies solute never sees its own periodic copy" accent="green" />
                <ToggleSwitch checked={anaDssp} onChange={setAnaDssp} label="Secondary Structure (gmx dssp)" description="GROMACS 2023+ native built-in DSSP analysis" />
                <ToggleSwitch checked={anaSasa} onChange={setAnaSasa} label="Solvent Accessible Area (gmx sasa)" description="Total & per-residue SASA in nm²" />
                <ToggleSwitch checked={anaEnergy} onChange={setAnaEnergy} label="Energy Convergence (gmx energy)" description="Extracts Potential, T, P, Density from .edr" />
              </div>
            </div>
          )}

          {tab === 'fep' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Number of λ Windows
                </label>
                <input
                  type="number"
                  min={5}
                  max={41}
                  value={fepWindows}
                  onChange={(e) => setFepWindows(Math.max(5, Number(e.target.value)))}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Temperature (K)
                </label>
                <input
                  type="number"
                  step={0.15}
                  value={fepTemp}
                  onChange={(e) => setFepTemp(Number(e.target.value))}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
            </div>
          )}

          {tab === 'awh' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Coupled Walkers (-multidir)
                </label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={awhWalkers}
                  onChange={(e) => setAwhWalkers(Math.max(1, Number(e.target.value)))}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  OpenMP Threads / Walker
                </label>
                <input
                  type="number"
                  min={1}
                  max={32}
                  value={awhOmp}
                  onChange={(e) => setAwhOmp(Math.max(1, Number(e.target.value)))}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
            </div>
          )}

          {tab === 'remd' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                    Replicas (N)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={64}
                    value={remdN}
                    onChange={(e) => setRemdN(Math.min(64, Math.max(2, Number(e.target.value))))}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                    Exchange Steps (-replex)
                  </label>
                  <input
                    type="number"
                    step={100}
                    min={50}
                    value={remdReplex}
                    onChange={(e) => setRemdReplex(Math.max(50, Number(e.target.value)))}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                    T_min (K)
                  </label>
                  <input
                    type="number"
                    value={remdTmin}
                    onChange={(e) => setRemdTmin(Math.max(100, Number(e.target.value)))}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                    T_max (K)
                  </label>
                  <input
                    type="number"
                    value={remdTmax}
                    onChange={(e) => setRemdTmax(Math.max(remdTmin + 5, Number(e.target.value)))}
                    className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                  />
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-blue)] mb-1.5">
                  Calculated Geometric Ladder (K)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {remdLadder.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[var(--bg-solid)] border border-[var(--border-hairline)] font-mono text-[11px] tabular-nums"
                    >
                      R{i}: {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'plumed' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Hill Pace (steps)
                </label>
                <input
                  type="number"
                  step={100}
                  value={plumedPace}
                  onChange={(e) => setPlumedPace(Math.max(50, Number(e.target.value)))}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Height (kJ/mol)
                </label>
                <input
                  type="number"
                  step={0.1}
                  value={plumedHeight}
                  onChange={(e) => setPlumedHeight(Number(e.target.value))}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Sigma (nm)
                </label>
                <input
                  type="number"
                  step={0.01}
                  value={plumedSigma}
                  onChange={(e) => setPlumedSigma(Number(e.target.value))}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] font-medium">
                  Bias Factor (γ)
                </label>
                <input
                  type="number"
                  step={1}
                  value={plumedBias}
                  onChange={(e) => setPlumedBias(Math.max(2, Number(e.target.value)))}
                  className="ui-input w-full px-3 py-2 text-[13px] mt-1 font-mono"
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Assembled Terminal Output + Active Flag Explainer */}
        <div className="lg:col-span-7 space-y-4">
          <CodeShowcase
            title={`Generated ${tab.toUpperCase()} Command`}
            subtitle="Ready to run in bash / SLURM"
            code={command}
            filename={`run_${tab}.sh`}
            language="bash"
            maxHeight="380px"
          />

          <div className="surface-card p-5">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-3">
              <Terminal className="w-3.5 h-3.5 text-[var(--accent-blue)]" /> Active Argument Breakdown
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeFlags.map((item) => (
                <div
                  key={item.flag}
                  className="p-3 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)]"
                >
                  <div className="font-mono text-[12px] font-semibold text-[var(--accent-blue)] break-all">
                    {item.flag}
                  </div>
                  <div className="text-[12px] text-[var(--text-secondary)] mt-1 leading-snug">
                    {item.meaning}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
