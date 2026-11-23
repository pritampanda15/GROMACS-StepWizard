export type ScriptCategory =
  | 'All'
  | 'NVIDIA GPU'
  | 'HPC & SLURM'
  | 'Workflows'
  | 'Post-Processing'
  | 'PCA & FEL'
  | 'MM-PBSA / GBSA';

export interface ScriptParam {
  key: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
}

export interface RepoScript {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<ScriptCategory, 'All'>;
  filename: string;
  sourcePath: string;
  language: 'bash' | 'csh' | 'ini';
  badges: string[];
  params: ScriptParam[];
  renderContent: (values: Record<string, string>) => string;
}

export const REPO_SCRIPTS: RepoScript[] = [
  {
    id: 'ngc-gromacs',
    title: 'NVIDIA NGC GROMACS Container Runner',
    subtitle: 'Docker & Singularity/Apptainer launcher with full GPU offload & direct GPU comms',
    category: 'NVIDIA GPU',
    filename: 'run_ngc_gromacs.sh',
    sourcePath: 'Molecular-Dynamics/hpc/nvidia-gpu/run_ngc_gromacs.sh',
    language: 'bash',
    badges: ['Docker', 'Singularity', 'NGC', 'Full GPU Offload'],
    params: [
      { key: 'DEFFNM', label: 'File Prefix (DEFFNM)', defaultValue: 'md_0_1' },
      { key: 'RUNTIME', label: 'Runtime (docker | singularity | apptainer)', defaultValue: 'docker' },
      { key: 'GROMACS_TAG', label: 'NGC Image Tag', defaultValue: '2023.2' },
      { key: 'GPUS', label: 'GPUs (0 | 0,1 | all)', defaultValue: '0' },
      { key: 'NTMPI', label: 'Thread-MPI Ranks', defaultValue: '1' },
      { key: 'NTOMP', label: 'OpenMP Threads/Rank', defaultValue: '8' },
      { key: 'NPME', label: 'Dedicated PME Ranks', defaultValue: '0' },
      { key: 'EXTRA_ARGS', label: 'Extra mdrun Flags', defaultValue: '-nstlist 100' },
    ],
    renderContent: (v) => `#!/usr/bin/env bash
# =============================================================================
# Run GPU-Accelerated GROMACS via the Official NVIDIA NGC Container
# Source: Molecular-Dynamics/hpc/nvidia-gpu/run_ngc_gromacs.sh
# =============================================================================
set -euo pipefail

DEFFNM="\${1:-${v.DEFFNM}}"
RUNTIME="\${RUNTIME:-${v.RUNTIME}}"
GROMACS_TAG="\${GROMACS_TAG:-${v.GROMACS_TAG}}"
IMAGE="\${IMAGE:-nvcr.io/hpc/gromacs:\${GROMACS_TAG}}"

GPUS="\${GPUS:-${v.GPUS}}"
NTMPI="\${NTMPI:-${v.NTMPI}}"
NTOMP="\${NTOMP:-${v.NTOMP}}"
NPME="\${NPME:-${v.NPME}}"
PIN="\${PIN:-on}"
EXTRA_ARGS="\${EXTRA_ARGS:-${v.EXTRA_ARGS}}"

MDRUN_ARGS=(
    gmx mdrun -v -deffnm "\${DEFFNM}"
    -ntmpi "\${NTMPI}"
    -ntomp "\${NTOMP}"
    -nb gpu -pme gpu -bonded gpu -update gpu
    -pin "\${PIN}"
)

if [ "\${NPME}" -gt 0 ]; then
    MDRUN_ARGS+=(-npme "\${NPME}")
fi

if [ -n "\${EXTRA_ARGS}" ]; then
    # shellcheck disable=SC2206
    MDRUN_ARGS+=(\${EXTRA_ARGS})
fi

# Direct GPU-to-GPU communication flags (GROMACS 2022+ & 2020-2021 compatibility)
export GMX_ENABLE_DIRECT_GPU_COMM=1
export GMX_GPU_DD_COMMS=true
export GMX_GPU_PME_PP_COMMS=true
export GMX_FORCE_UPDATE_DEFAULT_GPU=true

case "\${RUNTIME}" in
    docker)
        GPU_FLAG="--gpus device=\${GPUS}"
        [ "\${GPUS}" = "all" ] && GPU_FLAG="--gpus all"
        docker run \${GPU_FLAG} --ipc=host --rm \\
            -e GMX_ENABLE_DIRECT_GPU_COMM=1 \\
            -e GMX_GPU_DD_COMMS=true \\
            -e GMX_GPU_PME_PP_COMMS=true \\
            -e GMX_FORCE_UPDATE_DEFAULT_GPU=true \\
            -v "\${PWD}:/host_pwd" \\
            --workdir /host_pwd \\
            "\${IMAGE}" \\
            "\${MDRUN_ARGS[@]}"
        ;;
    singularity|apptainer)
        CONTAINER_REF="\${IMAGE}"
        if [ ! -f "\${CONTAINER_REF}" ] && [[ "\${CONTAINER_REF}" != docker://* ]]; then
            CONTAINER_REF="docker://\${CONTAINER_REF}"
        fi
        "\${RUNTIME}" run --nv \\
            -B "\${PWD}:/host_pwd" \\
            --pwd /host_pwd \\
            "\${CONTAINER_REF}" \\
            "\${MDRUN_ARGS[@]}"
        ;;
    *)
        echo "Unsupported RUNTIME='\${RUNTIME}'. Use docker, singularity, or apptainer." >&2
        exit 1
        ;;
esac`,
  },
  {
    id: 'mps-multidir',
    title: 'NVIDIA CUDA MPS Multi-Simulation Runner',
    subtitle: 'Saturate A100/H100/V100 GPUs with concurrent replicas via MPS, -multidir & -pinoffset',
    category: 'NVIDIA GPU',
    filename: 'run_mps_multidir.sh',
    sourcePath: 'Molecular-Dynamics/hpc/nvidia-gpu/run_mps_multidir.sh',
    language: 'bash',
    badges: ['CUDA MPS', '-multidir', '-pinoffset', 'Throughput'],
    params: [
      { key: 'GPU_ID', label: 'GPU Device ID', defaultValue: '0' },
      { key: 'NTOMP', label: 'OpenMP Threads / Sim', defaultValue: '4' },
      { key: 'DEFFNM', label: 'TPR Prefix', defaultValue: 'md_0_1' },
      { key: 'MODE', label: 'Mode (independent | multidir)', defaultValue: 'independent' },
      { key: 'GMX', label: 'Binary (gmx | gmx_mpi)', defaultValue: 'gmx' },
      { key: 'BASE_PINOFFSET', label: 'Starting CPU Core', defaultValue: '0' },
    ],
    renderContent: (v) => `#!/usr/bin/env bash
# =============================================================================
# Multi-Simulation GPU Throughput Runner with NVIDIA CUDA MPS
# Source: Molecular-Dynamics/hpc/nvidia-gpu/run_mps_multidir.sh
# Usage:  ./run_mps_multidir.sh sim_0 sim_1 sim_2 sim_3
# =============================================================================
set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <sim_dir_1> [sim_dir_2 ...]" >&2
    exit 1
fi

SIM_DIRS=("$@")
NUM_SIMS="\${#SIM_DIRS[@]}"

GPU_ID="\${GPU_ID:-${v.GPU_ID}}"
NTOMP="\${NTOMP:-${v.NTOMP}}"
DEFFNM="\${DEFFNM:-${v.DEFFNM}}"
GMX="\${GMX:-${v.GMX}}"
MODE="\${MODE:-${v.MODE}}"
BASE_PINOFFSET="\${BASE_PINOFFSET:-${v.BASE_PINOFFSET}}"

export CUDA_VISIBLE_DEVICES="\${GPU_ID}"
export CUDA_MPS_PIPE_DIRECTORY="\${CUDA_MPS_PIPE_DIRECTORY:-/tmp/nvidia-mps-\${USER}-gpu\${GPU_ID}}"
export CUDA_MPS_LOG_DIRECTORY="\${CUDA_MPS_LOG_DIRECTORY:-/tmp/nvidia-mps-log-\${USER}-gpu\${GPU_ID}}"
export GMX_ENABLE_DIRECT_GPU_COMM=1

mkdir -p "\${CUDA_MPS_PIPE_DIRECTORY}" "\${CUDA_MPS_LOG_DIRECTORY}"

cleanup() {
    echo "Stopping NVIDIA CUDA MPS daemon..."
    echo quit | nvidia-cuda-mps-control >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Starting NVIDIA CUDA MPS daemon on GPU \${GPU_ID}..."
nvidia-cuda-mps-control -d

case "\${MODE}" in
    independent)
        pids=()
        for idx in "\${!SIM_DIRS[@]}"; do
            dir="\${SIM_DIRS[$idx]}"
            offset=$((BASE_PINOFFSET + idx * NTOMP))
            (
                cd "\${dir}"
                "\${GMX}" mdrun -deffnm "\${DEFFNM}" \\
                    -ntmpi 1 -ntomp "\${NTOMP}" \\
                    -nb gpu -pme gpu -bonded gpu -update gpu \\
                    -pin on -pinoffset "\${offset}"
            ) &
            pids+=("$!")
        done
        for pid in "\${pids[@]}"; do wait "\${pid}"; done
        ;;
    multidir)
        mpirun -np "\${NUM_SIMS}" "\${GMX}" mdrun \\
            -multidir "\${SIM_DIRS[@]}" \\
            -deffnm "\${DEFFNM}" \\
            -ntomp "\${NTOMP}" \\
            -nb gpu -pme gpu -bonded gpu -update gpu \\
            -pin on -pinoffset "\${BASE_PINOFFSET}"
        ;;
esac`,
  },
  {
    id: 'protein-only-local',
    title: 'Complete Protein-in-Water MD Pipeline',
    subtitle: 'End-to-end pdb2gmx → editconf → solvate → genion → EM → NVT → NPT → Production',
    category: 'Workflows',
    filename: 'run_protein_md.sh',
    sourcePath: 'Molecular-Dynamics/workflows/protein-only/run_protein_md.sh',
    language: 'bash',
    badges: ['Local / Workstation', '8-Stage Pipeline', 'OPLS-AA / SPC/E'],
    params: [
      { key: 'GMX', label: 'GROMACS Binary', defaultValue: 'gmx' },
      { key: 'PDB', label: 'Input PDB File', defaultValue: 'protein.pdb' },
      { key: 'FF_CHOICE', label: 'Force Field Choice ID', defaultValue: '5' },
      { key: 'WATER', label: 'Water Model', defaultValue: 'spce' },
      { key: 'BOX_DIST', label: 'Box Wall Distance (nm)', defaultValue: '1.0' },
      { key: 'SOL_GRP', label: 'Solvent Index Group', defaultValue: '13' },
    ],
    renderContent: (v) => `#!/usr/bin/env bash
# =============================================================================
# Protein-Only Molecular Dynamics Workflow (GROMACS)
# Source: Molecular-Dynamics/workflows/protein-only/run_protein_md.sh
# =============================================================================
set -euo pipefail

GMX="\${GMX:-${v.GMX}}"
PDB="\${PDB:-${v.PDB}}"
FORCEFIELD_CHOICE="\${FORCEFIELD_CHOICE:-${v.FF_CHOICE}}"
WATER_MODEL="\${WATER_MODEL:-${v.WATER}}"
BOX_DISTANCE="\${BOX_DISTANCE:-${v.BOX_DIST}}"
SOLVENT_GROUP="\${SOLVENT_GROUP:-${v.SOL_GRP}}"

# 1. Convert PDB to GROMACS structure & topology
printf "%s\\n1\\n" "\${FORCEFIELD_CHOICE}" | "\${GMX}" pdb2gmx \\
    -f "\${PDB}" -o protein_processed.gro -water "\${WATER_MODEL}" -ignh

# 2. Define cubic periodic box
"\${GMX}" editconf -f protein_processed.gro -o protein_newbox.gro -c -d "\${BOX_DISTANCE}" -bt cubic

# 3. Solvate box
"\${GMX}" solvate -cp protein_newbox.gro -cs spc216.gro -o protein_solv.gro -p topol.top

# 4. Neutralize with counter-ions
"\${GMX}" grompp -f ions.mdp -c protein_solv.gro -p topol.top -o ions.tpr
printf "%s\\n" "\${SOLVENT_GROUP}" | "\${GMX}" genion \\
    -s ions.tpr -o protein_solv_ions.gro -p topol.top -pname NA -nname CL -neutral

# 5. Energy minimization
"\${GMX}" grompp -f minim.mdp -c protein_solv_ions.gro -p topol.top -o em.tpr
"\${GMX}" mdrun -v -deffnm em

# 6. NVT equilibration
"\${GMX}" grompp -f nvt.mdp -c em.gro -r em.gro -p topol.top -o nvt.tpr
"\${GMX}" mdrun -v -deffnm nvt

# 7. NPT equilibration
"\${GMX}" grompp -f npt.mdp -c nvt.gro -r nvt.gro -t nvt.cpt -p topol.top -o npt.tpr
"\${GMX}" mdrun -v -deffnm npt

# 8. Production MD
"\${GMX}" grompp -f md.mdp -c npt.gro -t npt.cpt -p topol.top -o md_0_1.tpr
"\${GMX}" mdrun -v -deffnm md_0_1`,
  },
  {
    id: 'slurm-protein-md',
    title: 'SLURM Cluster Protein MD Job',
    subtitle: 'Multi-node MPI + OpenMP SLURM batch template with automated PBC centering & extension notes',
    category: 'HPC & SLURM',
    filename: 'slurm_protein_md.sh',
    sourcePath: 'Molecular-Dynamics/hpc/slurm_protein_md.sh',
    language: 'bash',
    badges: ['SLURM', 'MPI + OpenMP', 'SNIC / Tetralith'],
    params: [
      { key: 'ACCOUNT', label: 'SLURM Account', defaultValue: 'snic2020-1-40' },
      { key: 'JOB_NAME', label: 'Job Name (-J)', defaultValue: 'amyloid' },
      { key: 'TIME', label: 'Walltime', defaultValue: '24:00:00' },
      { key: 'NODES', label: 'Nodes (-N)', defaultValue: '4' },
      { key: 'OMP', label: 'OMP_NUM_THREADS (-c)', defaultValue: '4' },
      { key: 'MODULE', label: 'GROMACS Module', defaultValue: 'GROMACS/2023.2-nsc1-gcc-11.3.0' },
    ],
    renderContent: (v) => `#!/usr/bin/env bash
# =============================================================================
# SLURM Job Script: Protein-Only GROMACS MD
# Source: Molecular-Dynamics/hpc/slurm_protein_md.sh
# =============================================================================
#SBATCH --time=${v.TIME}
#SBATCH -N ${v.NODES}
#SBATCH -c ${v.OMP}
#SBATCH --account=${v.ACCOUNT}
#SBATCH -J ${v.JOB_NAME}
#SBATCH --exclusive
#SBATCH --ntasks-per-node=32

set -euo pipefail

export OMP_NUM_THREADS=${v.OMP}
module load ${v.MODULE}

INPUT_PDB="\${INPUT_PDB:-\$(ls *.pdb | head -n 1)}"
MPPRUN_PASS="--map-by ppr:\$((16 / OMP_NUM_THREADS)):socket:PE=\${OMP_NUM_THREADS}"

# 1. Topology, box & solvation
printf "1\\n1\\n" | gmx_mpi pdb2gmx -f "\${INPUT_PDB}" -o peptide.gro
gmx_mpi editconf -f peptide.gro -o pep_box.gro -c -d 1.0 -bt cubic
gmx_mpi solvate -cp pep_box.gro -cs spc216.gro -o solv.gro -p topol.top

# 2. Ions & Energy minimization
gmx_mpi grompp -f ions.mdp -c solv.gro -p topol.top -o ions.tpr -maxwarn -1
# printf "13\\n" | gmx_mpi genion -s ions.tpr -o solv_ions.gro -p topol.top -pname NA -nname CL -neutral

gmx_mpi grompp -f minim.mdp -c solv.gro -p topol.top -o em.tpr -maxwarn -1
mpprun --pass="\${MPPRUN_PASS}" gmx_mpi mdrun -v -deffnm em

# 3. NVT & NPT equilibration
gmx_mpi grompp -f nvt.mdp -c em.gro -r em.gro -p topol.top -o nvt.tpr -maxwarn -1
mpprun --pass="\${MPPRUN_PASS}" gmx_mpi mdrun -deffnm nvt

gmx_mpi grompp -f npt.mdp -c nvt.gro -r nvt.gro -t nvt.cpt -p topol.top -o npt.tpr -maxwarn -1
mpprun --pass="\${MPPRUN_PASS}" gmx_mpi mdrun -deffnm npt

# 4. Production MD
gmx_mpi grompp -f md.mdp -c npt.gro -t npt.cpt -p topol.top -o md_0_1.tpr -maxwarn -1
mpprun --pass="\${MPPRUN_PASS}" gmx_mpi mdrun -deffnm md_0_1

# 5. Center trajectory & remove PBC jumps
printf "1\\n0\\n" | gmx_mpi trjconv \\
    -s md_0_1.tpr -f md_0_1.xtc -o md_0_1_center.xtc -center -pbc mol -ur compact`,
  },
  {
    id: 'slurm-lipid-bilayer',
    title: 'Asymmetric Plasma Membrane SLURM Pipeline',
    subtitle: 'CHARMM-GUI 6-stage lipid bilayer equilibration (step6.1–6.6) & production (310.15 K)',
    category: 'HPC & SLURM',
    filename: 'run_lipid_bilayer_slurm.sh',
    sourcePath: 'Molecular-Dynamics/workflows/lipid-bilayer/run_lipid_bilayer_slurm.sh',
    language: 'bash',
    badges: ['Membrane', 'CHARMM-GUI', '6-Stage Equil', 'SLURM'],
    params: [
      { key: 'ACCOUNT', label: 'SLURM Account', defaultValue: 'snic2021-1-42' },
      { key: 'JOB_NAME', label: 'Job Name', defaultValue: 'Lipid' },
      { key: 'TIME', label: 'Walltime', defaultValue: '24:00:00' },
      { key: 'NODES', label: 'Nodes', defaultValue: '4' },
      { key: 'OMP', label: 'OMP_NUM_THREADS', defaultValue: '4' },
    ],
    renderContent: (v) => `#!/usr/bin/env bash
# =============================================================================
# SLURM Job Script: Asymmetric Mammalian Plasma Membrane (PMm) MD Simulation
# Source: Molecular-Dynamics/workflows/lipid-bilayer/run_lipid_bilayer_slurm.sh
# =============================================================================
#SBATCH --time=${v.TIME}
#SBATCH -N ${v.NODES}
#SBATCH -c ${v.OMP}
#SBATCH --account=${v.ACCOUNT}
#SBATCH -J ${v.JOB_NAME}
#SBATCH --exclusive
#SBATCH --ntasks-per-node=32

set -euo pipefail

export OMP_NUM_THREADS=${v.OMP}
module load GROMACS/2019.6-nsc1-gcc-7.3.0-bare
MPPRUN_PASS="--map-by ppr:\$((16 / OMP_NUM_THREADS)):socket:PE=\${OMP_NUM_THREADS}"

# 1. Energy Minimization
gmx_mpi grompp -f step6.0_minimization.mdp -o minimization.tpr \\
    -c step5_input.gro -r step5_input.gro -p topol.top -n index.ndx
mpprun --pass="\${MPPRUN_PASS}" gmx_mpi mdrun -v -deffnm minimization

# 2. Six-Stage Equilibration (step6.1 .. step6.6)
prev_gro="minimization.gro"
for step in 1 2 3 4 5 6; do
    stage="step6.\${step}_equilibration"
    gmx_mpi grompp -f "\${stage}.mdp" -o "\${stage}.tpr" \\
        -c "\${prev_gro}" -r step5_input.gro -p topol.top -n index.ndx
    mpprun --pass="\${MPPRUN_PASS}" gmx_mpi mdrun -v -deffnm "\${stage}"
    prev_gro="\${stage}.gro"
done

# 3. Production MD (semiisotropic Parrinello-Rahman, 310.15 K)
gmx_mpi grompp -f step7_production.mdp -o md.tpr \\
    -c step6.6_equilibration.gro -p topol.top -n index.ndx
mpprun --pass="\${MPPRUN_PASS}" gmx_mpi mdrun -v -deffnm md`,
  },
  {
    id: 'slurm-charmm-gui',
    title: 'CHARMM-GUI Multi-Segment Runner (C-Shell)',
    subtitle: 'Minimization + step6.1–6.6 equilibration + 10 chained production segments (step7_1..10)',
    category: 'HPC & SLURM',
    filename: 'slurm_charmm_gui.csh',
    sourcePath: 'Molecular-Dynamics/hpc/slurm_charmm_gui.csh',
    language: 'csh',
    badges: ['CHARMM-GUI v3.7', '10-Segment Production', 'C-Shell'],
    params: [
      { key: 'ACCOUNT', label: 'SLURM Account', defaultValue: 'snic2022-1-34' },
      { key: 'JOB_NAME', label: 'Job Name', defaultValue: 'charmm_md' },
      { key: 'TIME', label: 'Walltime', defaultValue: '48:00:00' },
      { key: 'PROD_SEGS', label: 'Production Segments', defaultValue: '10' },
    ],
    renderContent: (v) => `#!/bin/csh
# =============================================================================
# SLURM Job Script: CHARMM-GUI GROMACS Workflow
# Source: Molecular-Dynamics/hpc/slurm_charmm_gui.csh
# =============================================================================
#SBATCH --time=${v.TIME}
#SBATCH -N 1
#SBATCH --account=${v.ACCOUNT}
#SBATCH -J ${v.JOB_NAME}

module load GROMACS/2022.2-nsc1-gcc-9.3.0-bare

set init        = step5_input
set rest_prefix = step5_input
set mini_prefix = step6.0_minimization
set equi_prefix = step6.%d_equilibration
set prod_prefix = step7_production
set prod_step   = step7

# 1. Minimization
gmx_mpi grompp -f \${mini_prefix}.mdp -o \${mini_prefix}.tpr -c \${init}.gro -r \${rest_prefix}.gro -p topol.top -n index.ndx -maxwarn -1
mpprun gmx_mpi mdrun -v -deffnm \${mini_prefix}

# 2. Six-stage Equilibration (step6.1 .. step6.6)
set cnt = 1
while ( \${cnt} <= 6 )
    @ pcnt = \${cnt} - 1
    set istep = \`printf \${equi_prefix} \${cnt}\`
    set pstep = \`printf \${equi_prefix} \${pcnt}\`
    if ( \${cnt} == 1 ) set pstep = \${mini_prefix}
    gmx_mpi grompp -f \${istep}.mdp -o \${istep}.tpr -c \${pstep}.gro -r \${rest_prefix}.gro -p topol.top -n index.ndx -maxwarn -1
    mpprun gmx_mpi mdrun -v -deffnm \${istep}
    @ cnt += 1
end

# 3. Multi-segment Production (step7_1 .. step7_${v.PROD_SEGS})
set cnt = 1
while ( \${cnt} <= ${v.PROD_SEGS} )
    @ pcnt = \${cnt} - 1
    set istep = \${prod_step}_\${cnt}
    set pstep = \${prod_step}_\${pcnt}
    if ( \${cnt} == 1 ) then
        set pstep = \`printf \${equi_prefix} 6\`
        gmx_mpi grompp -f \${prod_prefix}.mdp -o \${istep}.tpr -c \${pstep}.gro -p topol.top -n index.ndx -maxwarn -1
    else
        gmx_mpi grompp -f \${prod_prefix}.mdp -o \${istep}.tpr -c \${pstep}.gro -t \${pstep}.cpt -p topol.top -n index.ndx -maxwarn -1
    endif
    mpprun gmx_mpi mdrun -v -deffnm \${istep}
    @ cnt += 1
end`,
  },
  {
    id: 'batch-postprocess',
    title: 'Multi-Directory Batch Post-Processing',
    subtitle: 'Loops over all simulation folders for PBC centering, PDB snapshots, and backbone RMSD',
    category: 'Post-Processing',
    filename: 'batch_postprocess.sh',
    sourcePath: 'Molecular-Dynamics/hpc/batch_postprocess.sh',
    language: 'bash',
    badges: ['trjconv', 'rms', 'Batch Automation'],
    params: [
      { key: 'GMX', label: 'GROMACS Binary', defaultValue: 'gmx_mpi' },
      { key: 'PREFIX', label: 'Trajectory Prefix', defaultValue: 'md_0_1' },
      { key: 'SKIP', label: 'Snapshot Frame Skip', defaultValue: '1000' },
    ],
    renderContent: (v) => `#!/usr/bin/env bash
# =============================================================================
# Batch Post-Processing Script for Multiple GROMACS Simulation Directories
# Source: Molecular-Dynamics/hpc/batch_postprocess.sh
# =============================================================================
set -euo pipefail

GMX="\${GMX:-${v.GMX}}"
PREFIX="\${PREFIX:-${v.PREFIX}}"
SKIP="\${SKIP:-${v.SKIP}}"

for dir in ./*/; do
    [ -d "\${dir}" ] || continue
    if [ ! -f "\${dir}/\${PREFIX}.tpr" ] || [ ! -f "\${dir}/\${PREFIX}.xtc" ]; then
        echo "Skipping \${dir} (missing \${PREFIX}.tpr or \${PREFIX}.xtc)"
        continue
    fi

    echo "=== Post-processing \${dir} ==="
    (
        cd "\${dir}"

        # Center on Protein (1), output System (0) with compact periodic box
        printf "1\\n0\\n" | "\${GMX}" trjconv \\
            -s "\${PREFIX}.tpr" -f "\${PREFIX}.xtc" \\
            -o "\${PREFIX}_center.xtc" -center -pbc mol -ur compact

        # Remove PBC jumps centered on Protein (1), output System (0)
        printf "1\\n0\\n" | "\${GMX}" trjconv \\
            -s "\${PREFIX}.tpr" -f "\${PREFIX}.xtc" \\
            -o "\${PREFIX}_noPBC.xtc" -pbc mol -center

        # Extract separated Protein (1) snapshots every SKIP frames
        printf "1\\n1\\n" | "\${GMX}" trjconv \\
            -s "\${PREFIX}.tpr" -f "\${PREFIX}_center.xtc" \\
            -o _pro.pdb -sep -center -skip "\${SKIP}"

        # Compute Backbone (4) RMSD fitted to Backbone (4)
        printf "4\\n4\\n" | "\${GMX}" rms \\
            -s "\${PREFIX}.tpr" -f "\${PREFIX}_noPBC.xtc" \\
            -o rmsd.xvg -tu ns
    )
done
echo "Batch post-processing complete."`,
  },
  {
    id: 'pca-fel-windows',
    title: 'Sliding-Window PCA & Free Energy Landscape (FEL)',
    subtitle: 'Automated gmx covar → anaeig → sham → xpm2ps → PDF contour plots across time windows',
    category: 'PCA & FEL',
    filename: 'run_pca_fel_windows.sh',
    sourcePath: 'Molecular-Dynamics/analysis/pca-fel-entropy/run_pca_fel_windows.sh',
    language: 'bash',
    badges: ['covar', 'anaeig', 'sham', 'FEL'],
    params: [
      { key: 'GMX', label: 'GROMACS Binary', defaultValue: 'gmx' },
      { key: 'TRAJ', label: 'Fitted Trajectory', defaultValue: '../md_0_100_fit.xtc' },
      { key: 'TPR', label: 'TPR Structure', defaultValue: '../md_0_100.tpr' },
      { key: 'INDEX', label: 'Index File', defaultValue: '../index.ndx' },
      { key: 'GROUP', label: 'Index Group ID', defaultValue: '4' },
      { key: 'STEP', label: 'Window Size (ns)', defaultValue: '10' },
      { key: 'TOTAL_NS', label: 'Total Length (ns)', defaultValue: '100' },
    ],
    renderContent: (v) => `#!/usr/bin/env bash
# =============================================================================
# Sliding-Window PCA & Free Energy Landscape (FEL) Analysis (GROMACS)
# Source: Molecular-Dynamics/analysis/pca-fel-entropy/run_pca_fel_windows.sh
# =============================================================================
set -euo pipefail

GMX="\${GMX:-${v.GMX}}"
TRAJ="\${TRAJ:-${v.TRAJ}}"
TPR="\${TPR:-${v.TPR}}"
INDEX="\${INDEX:-${v.INDEX}}"
GROUP="\${GROUP:-${v.GROUP}}"
STEP="\${STEP:-${v.STEP}}"
TOTAL_NS="\${TOTAL_NS:-${v.TOTAL_NS}}"

for ((start = 0; start < TOTAL_NS; start += STEP)); do
    end=$((start + STEP))
    eigenval="md_\${start}_\${end}_eigenval.xvg"
    eigenvec="md_\${start}_\${end}_eigenvec.trr"
    pca_2dproj="PCA_2dproj_md_\${start}_\${end}.xvg"
    fel_sham="FEL_PCA_sham_md_\${start}_\${end}"

    echo "=== Analyzing window \${start}-\${end} ns ==="

    # 1. Covariance matrix, eigenvalues, eigenvectors
    printf "%s\\n%s\\n" "\${GROUP}" "\${GROUP}" | "\${GMX}" covar \\
        -f "\${TRAJ}" -s "\${TPR}" -n "\${INDEX}" \\
        -o "\${eigenval}" -v "\${eigenvec}" \\
        -b "\${start}" -e "\${end}" -tu ns

    # 2. 2D projection along PC1 & PC2
    printf "%s\\n%s\\n" "\${GROUP}" "\${GROUP}" | "\${GMX}" anaeig \\
        -v "\${eigenvec}" -f "\${TRAJ}" -eig "\${eigenval}" \\
        -s "\${TPR}" -n "\${INDEX}" \\
        -first 1 -last 2 -2d "\${pca_2dproj}"

    # 3. Gibbs Free Energy Landscape via Boltzmann inversion
    "\${GMX}" sham -f "\${pca_2dproj}" -ls "\${fel_sham}.xpm" -notime

    # 4. Render XPM -> EPS -> PDF
    "\${GMX}" xpm2ps -f "\${fel_sham}.xpm" -o "\${fel_sham}.eps" -rainbow red
    command -v convert >/dev/null 2>&1 && convert "\${fel_sham}.eps" "\${fel_sham}.pdf"
    rm -f ./*#
done`,
  },
  {
    id: 'mmpbsa-config',
    title: 'gmx_MMPBSA Binding Free Energy (MM-GBSA)',
    subtitle: 'AMBER Generalized-Born (igb=5) input file + gmx_MMPBSA execution command',
    category: 'MM-PBSA / GBSA',
    filename: 'mmpbsa.in',
    sourcePath: 'Molecular-Dynamics/analysis/mmpbsa-gbsa/mmpbsa.in',
    language: 'ini',
    badges: ['gmx_MMPBSA', 'MM-GBSA', 'igb=5', 'ΔG_bind'],
    params: [
      { key: 'SYS_NAME', label: 'System Name', defaultValue: 'protein-ligand' },
      { key: 'START_FRAME', label: 'Start Frame', defaultValue: '1' },
      { key: 'END_FRAME', label: 'End Frame', defaultValue: '5000' },
      { key: 'INTERVAL', label: 'Frame Interval', defaultValue: '1' },
      { key: 'TEMP', label: 'Temperature (K)', defaultValue: '298.15' },
      { key: 'IGB', label: 'GB Model (2 | 5 | 8)', defaultValue: '5' },
      { key: 'SALTCON', label: 'Salt Conc. (M)', defaultValue: '0.15' },
    ],
    renderContent: (v) => `# Input file for gmx_MMPBSA (Source: Molecular-Dynamics/analysis/mmpbsa-gbsa/mmpbsa.in)
# Run with:
#   gmx_MMPBSA -O -i mmpbsa.in -cs md_0_100.tpr -ct md_0_100_fit.xtc \\
#     -ci index.ndx -cg 1 13 -cp topol.top \\
#     -o FINAL_RESULTS_MMPBSA.dat -eo FINAL_RESULTS_MMPBSA.csv
# Visualize with:
#   gmx_MMPBSA_ana -f _GMXMMPBSA_info

&general
  sys_name             = "${v.SYS_NAME}"
  startframe           = ${v.START_FRAME}
  endframe             = ${v.END_FRAME}
  interval             = ${v.INTERVAL}
  forcefields          = "oldff/leaprc.ff99SB,leaprc.gaff"
  ions_parameters      = 1
  PBRadii              = 3
  temperature          = ${v.TEMP}
  qh_entropy           = 0
  interaction_entropy  = 0
  ie_segment           = 25
  c2_entropy           = 0
  keep_files           = 2
  solvated_trajectory  = 1
  verbose              = 1
/

&gb
  igb                  = ${v.IGB}
  intdiel              = 1.0
  extdiel              = 78.5
  saltcon              = ${v.SALTCON}
  surften              = 0.0072
  surfoff              = 0.0
  probe                = 1.4
/`,
  },
  {
    id: 'protein-ligand-cgenff',
    title: 'Protein–Ligand CHARMM36 / CGenFF & Random Insertion',
    subtitle: 'Full protocol for ligand parameterization, heavy-atom restraints, insert-molecules & MD',
    category: 'Workflows',
    filename: 'protein_ligand_cgenff.sh',
    sourcePath: 'Molecular-Dynamics/workflows/protein-ligand/charmm_tetralith_guide.md',
    language: 'bash',
    badges: ['CHARMM36', 'CGenFF', 'genrestr', 'insert-molecules'],
    params: [
      { key: 'GMX', label: 'GROMACS Binary', defaultValue: 'gmx_mpi' },
      { key: 'LIG_RES', label: 'Ligand Residue Name', defaultValue: 'LIG' },
      { key: 'NMOL', label: 'Random Insert Copies', defaultValue: '20' },
      { key: 'FC', label: 'Restraint Force Constant', defaultValue: '1000' },
    ],
    renderContent: (v) => `#!/usr/bin/env bash
# =============================================================================
# Protein-Ligand Setup (CHARMM36 / CGenFF) + Restraints + Optional Multi-Ligand
# Source: Molecular-Dynamics/workflows/protein-ligand/
# =============================================================================
set -euo pipefail

GMX="${v.GMX}"
LIG="${v.LIG_RES}"

# 1. Sort mol2 bonds & convert CGenFF .str -> GROMACS .itp/.prm
perl sort_mol2_bonds.pl "\${LIG}.mol2" "\${LIG}_fix.mol2"
python cgenff_charmm2gmx_py3_nx2.py "\${LIG}" "\${LIG}_fix.mol2" lig.str charmm36-feb2021.ff/

# 2. Process protein & convert ligand to .gro
"\${GMX}" pdb2gmx -f clean.pdb -o protein_processed.gro -ignh
"\${GMX}" editconf -f lig_ini.pdb -o lig.gro

# 3. After merging complex.gro & updating topol.top (#include lig.prm & lig.itp):
"\${GMX}" editconf -f complex.gro -o newbox.gro -bt cubic -d 1.0
"\${GMX}" solvate -cp newbox.gro -cs spc216.gro -p topol.top -o solv.gro
"\${GMX}" grompp -f ions.mdp -c solv.gro -p topol.top -o ions.tpr
"\${GMX}" genion -s ions.tpr -o solv_ions.gro -p topol.top -pname NA -nname CL -neutral

# Optional: Randomly insert ${v.NMOL} ligand copies replacing SOL (update SOL count afterward!)
# "\${GMX}" insert-molecules -f solv_ions.gro -ci lig.gro -replace -nmol ${v.NMOL}

# 4. Generate ligand heavy-atom position restraints
printf "0 & ! a H*\\nq\\n" | "\${GMX}" make_ndx -f lig.gro -o index_lig.ndx
"\${GMX}" genrestr -f lig.gro -n index_lig.ndx -o posre_lig.itp -fc ${v.FC} ${v.FC} ${v.FC}

# 5. Merge Protein + Ligand coupling group in index.ndx (e.g. 1 | 13)
"\${GMX}" make_ndx -f em.gro -o index.ndx`,
  },
];
