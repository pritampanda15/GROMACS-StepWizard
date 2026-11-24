# GROMACS StepWizard

[![Live App](https://img.shields.io/badge/Live_App-pritampanda15.github.io-0071E3?style=flat-square&logo=githubpages&logoColor=white)](https://pritampanda15.github.io/GROMACS-StepWizard/)
[![CI](https://img.shields.io/github/actions/workflow/status/pritampanda15/GROMACS-StepWizard/ci.yml?branch=main&label=CI&style=flat-square)](https://github.com/pritampanda15/GROMACS-StepWizard/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/github/actions/workflow/status/pritampanda15/GROMACS-StepWizard/deploy.yml?branch=main&label=Pages&style=flat-square)](https://github.com/pritampanda15/GROMACS-StepWizard/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square)](LICENSE)

**Live Application:** [https://pritampanda15.github.io/GROMACS-StepWizard/](https://pritampanda15.github.io/GROMACS-StepWizard/)

**GROMACS StepWizard** is a client-side web studio for **GROMACS** molecular dynamics workflows. Calculate exact `nsteps`, export complete `.mdp` and shell script simulation kits (`.zip`), build GROMACS & NVIDIA GPU-accelerated CLI commands, estimate HPC walltime and `.xtc` storage, lint `.mdp` files, and inspect `.xvg` and `md.log` outputs — all directly in the browser with no backend required.

![GROMACS StepWizard Interface](docs/screenshot.png)

---

## Features

| Workspace | Capabilities |
| :--- | :--- |
| **Step & MDP Wizard** | Convert simulation length (`ps`, `ns`, `µs`) to exact `nsteps` across `1 fs`, `2 fs`, and `4 fs HMR` timesteps; 7 curated `.mdp` presets (OPLS-AA, NVIDIA GPU-Resident, CHARMM36 Lipid Bilayer, CHARMM36 Protein–Ligand, NVT, NPT, Energy Minimization); one-click **Full MD Kit (`.zip`)** export (`ions.mdp`, `minim.mdp`, `nvt.mdp`, `npt.mdp`, `production.mdp`, `run_local_gpu.sh`, `slurm_gpu_md.sh`, `README_KIT.txt`); and an **HPC Walltime, SLURM `-maxh` & Storage Estimator**. |
| **CLI Builder** | Visual `gmx` / `gmx_mpi` command assembler covering `mdrun`, `grompp`, system setup (`pdb2gmx`, `editconf`, `solvate`, `genion`), trajectory post-processing (`trjconv`, `rms`), run extension (`convert-tpr`), PCA/FEL (`covar`, `anaeig`, `sham`, `xpm2ps`), and `gmx_MMPBSA`, with live per-flag explanations. |
| **NVIDIA GPU Studio** | Interactive **Host CPU ↔ NVIDIA GPU** task offload visualizer (`-nb`, `-pme`, `-bonded`, `-update`) and launch generators for Single-GPU Resident (`GMX_CUDA_GRAPH=1`), Multi-GPU Direct Comm (`GMX_ENABLE_DIRECT_GPU_COMM=1`), Multi-Node `cuFFTMp` PME Decomposition (`GMX_GPU_PME_DECOMPOSITION=1`), NVIDIA NGC Containers (Docker & Singularity/Apptainer), CUDA MPS (`-multidir` & `-pinoffset`), and A100/H100 MIG partitioning. |
| **Script Vault** | Live-parameterized bash, C-shell, and `gmx_MMPBSA` scripts curated from [`Molecular-Dynamics`](https://github.com/pritampanda15/Molecular-Dynamics) (`run_ngc_gromacs.sh`, `run_mps_multidir.sh`, `run_protein_md.sh`, `slurm_protein_md.sh`, `run_lipid_bilayer_slurm.sh`, `slurm_charmm_gui.csh`, `batch_postprocess.sh`, `run_pca_fel_windows.sh`, `mmpbsa.in`, and CHARMM36/CGenFF protein–ligand setup). |
| **Inspector** | Client-side **`.mdp` Sanity Linter** (10 ensemble & GPU rules with one-click auto-fix and clean `.mdp` export) plus an interactive **`.xvg` Plotter & `md.log` Benchmark Parser** (`ns/day`, detected GPU, offload mapping, and summary statistics). |
| **Docs & Flags + `⌘K` Search** | Instant `⌘K` / `Ctrl+K` command palette and searchable reference across GROMACS official CLI arguments, NVIDIA GPU environment variables, and `.mdp` options. |

---

## Quick Start

### Prerequisites
- **Node.js** 18+ (22 recommended) and `npm`

### Local Development
```bash
git clone https://github.com/pritampanda15/GROMACS-StepWizard.git
cd GROMACS-StepWizard
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

### Typecheck & Production Build
```bash
npm run typecheck
npm run build
npm run preview
```

Pushes to `main` are checked by [`.github/workflows/ci.yml`](.github/workflows/ci.yml) and automatically deployed to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

---

## Repository Structure

```text
GROMACS-StepWizard/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── workflows/
│       ├── ci.yml                      # TypeScript & Vite build verification
│       └── deploy.yml                  # GitHub Pages deployment
├── docs/
│   └── screenshot.png                  # Application preview
├── src/
│   ├── App.tsx                         # Shell, navigation, hero & 8-stage MD pipeline
│   ├── main.tsx                        # React entry point
│   ├── index.css                       # Light/Dark theme tokens & styling
│   ├── components/
│   │   ├── UiPrimitives.tsx            # SegmentedControl, ToggleSwitch, AnimatedNumber, CodeShowcase
│   │   ├── StepWizardSection.tsx       # Step calculator, MDP generator, ZIP export & walltime planner
│   │   ├── CommandBuilderSection.tsx   # Visual GROMACS CLI builder
│   │   ├── GpuOffloadDiagram.tsx       # Interactive CPU <-> NVIDIA GPU offload diagram
│   │   ├── NvidiaGpuStudio.tsx         # Single/Multi-GPU, cuFFTMp, NGC, MPS & MIG studio
│   │   ├── ScriptVaultSection.tsx      # Parameterized Molecular-Dynamics script library
│   │   ├── AnalyzerSection.tsx         # Client-side .mdp linter & .xvg / md.log analyzer
│   │   ├── ReferenceSection.tsx        # Searchable CLI, NVIDIA GPU & MDP documentation
│   │   └── SpotlightPalette.tsx        # Cmd+K / Ctrl+K quick search palette
│   ├── data/
│   │   ├── mdpPresets.ts               # Curated MDP templates & parameter docs
│   │   ├── cliReference.ts             # GROMACS & NVIDIA GPU CLI flag catalog
│   │   └── scriptsVault.ts             # Parameterized HPC & analysis scripts
│   └── utils/
│       └── simulationKit.ts            # Client-side .zip simulation bundle generator
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── CONTRIBUTING.md
└── LICENSE
```

---

## Tech Stack

- **UI & Build**: React 19, TypeScript 5.7, Vite 6, Tailwind CSS v4
- **Animation & Icons**: Framer Motion, Lucide React
- **Bundle Export**: JSZip

---

## Contributing

Contributions are welcome! See [`CONTRIBUTING.md`](CONTRIBUTING.md) for local setup and pull request guidelines.

---

## Author & License

**Pritam Kumar Panda** · Stanford University  
[GitHub](https://github.com/pritampanda15) · [LinkedIn](https://www.linkedin.com/in/pritam-kumar-panda/) · [Molecular-Dynamics Repository](https://github.com/pritampanda15/Molecular-Dynamics)

Licensed under the **Apache License 2.0** — see [`LICENSE`](LICENSE) for details.
