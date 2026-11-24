# Contributing to GROMACS StepWizard

Contributions are welcome — including new force-field `.mdp` presets, updated GROMACS / NVIDIA GPU CLI flags, HPC scheduler templates, and bug fixes.

## Development Setup

```bash
git clone https://github.com/pritampanda15/GROMACS-StepWizard.git
cd GROMACS-StepWizard
npm install
npm run dev
```

## Before Opening a Pull Request

1. Ensure TypeScript type-checking and the production build pass cleanly:
   ```bash
   npm run typecheck
   npm run build
   ```
2. Keep scientific parameter defaults and CLI flags aligned with the [GROMACS Manual](https://manual.gromacs.org/current/index.html) and [NVIDIA GROMACS GPU guidelines](https://catalog.ngc.nvidia.com/orgs/hpc/containers/gromacs).
3. Add new `.mdp` templates in `src/data/mdpPresets.ts`, CLI/environment flags in `src/data/cliReference.ts`, and parameterized scripts in `src/data/scriptsVault.ts`.
4. Open a pull request describing what was added or fixed.
