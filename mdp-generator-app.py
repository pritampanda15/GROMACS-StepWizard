import streamlit as st
import os
import base64

# Set page config
st.set_page_config(
    page_title="GROMACS MDP Generator",
    page_icon="⚛️",
    layout="wide"
)

# Function to create downloadable link for text file
def get_download_link(file_content, file_name):
    b64 = base64.b64encode(file_content.encode()).decode()
    return f'<a href="data:file/txt;base64,{b64}" download="{file_name}">Download {file_name}</a>'

# Function to generate MDP content
def generate_mdp_content(nsteps, simulation_time_ps):
    mdp_template = """title = OPLS Lysozyme NPT equilibration
integrator = md
nsteps = {} ; {} ps
dt = 0.002
nstxout = 0
nstvout = 0
nstfout = 0
nstenergy = 5000
nstlog = 5000
nstxout-compressed = 5000
compressed-x-grps = System
continuation = yes
constraint_algorithm = lincs
constraints = h-bonds
lincs_iter = 1
lincs_order = 4
cutoff-scheme = Verlet
ns_type = grid
nstlist = 10
rcoulomb = 1.0
rvdw = 1.0
coulombtype = PME
pme_order = 4
fourierspacing = 0.16
tcoupl = V-rescale
tc-grps = Protein Non-Protein
tau_t = 0.1 0.1
ref_t = 300 300
pcoupl = Parrinello-Rahman
pcoupltype = isotropic
tau_p = 2.0
ref_p = 1.0
compressibility = 4.5e-5
pbc = xyz
DispCorr = EnerPres
gen_vel = no"""
    return mdp_template.format(nsteps, simulation_time_ps)

# Dictionary of parameters for information section
parameters = {
    "dt": "The time step for integration in picoseconds. Default is 0.002 ps (2 fs).",
    "nsteps": "The number of steps to simulate. Calculated as simulation_time / dt.",
    "nstxout": "Frequency of writing coordinates to the output file. Set to 0 to save disk space.",
    "nstvout": "Frequency of writing velocities to the output file. Typically not needed, set to 0.",
    "nstenergy": "Frequency of saving energy data. Default is 5000 steps.",
    "tcoupl": "Temperature coupling algorithm. Default is V-rescale.",
    "pcoupl": "Pressure coupling algorithm. Default is Parrinello-Rahman."
}

# Main Streamlit app
st.title("GROMACS MDP Generator")
st.markdown("""
This tool helps you generate production MDP files for GROMACS molecular dynamics simulations.
Enter your desired simulation time and the tool will calculate the appropriate number of steps.
""")

# Create tabs for different sections
tab1, tab2 = st.tabs(["Generate MDP", "Parameter Information"])

with tab1:
    st.header("Calculate Simulation Steps")
    
    # Create two columns for input options
    col1, col2 = st.columns(2)
    
    with col1:
        simulation_time_ps = st.number_input("Simulation time (ps)", 
                                           min_value=0, 
                                           max_value=5000000,
                                           step=1000,
                                           help="Enter simulation time in picoseconds")
    
    with col2:
        simulation_time_ns = st.number_input("Simulation time (ns)", 
                                           min_value=0, 
                                           max_value=5000,
                                           step=1,
                                           help="Enter simulation time in nanoseconds")
    
    # Calculate button
    calculate_button = st.button("Calculate Steps")
    
    if calculate_button:
        # Input validation
        if simulation_time_ps == 0 and simulation_time_ns == 0:
            st.error("Please provide simulation time in either ps or ns.")
        else:
            # Convert ns to ps if ns is provided
            if simulation_time_ns > 0:
                simulation_time_ps = simulation_time_ns * 1000
            
            # Validate range
            if simulation_time_ps < 1 or simulation_time_ps > 5000000:
                st.error("Invalid input! Please enter a value between 1 ps and 5,000,000 ps.")
            else:
                # Calculate nsteps and time in ns
                nsteps = simulation_time_ps * 500
                time_ns = simulation_time_ps / 1000
                
                # Display results in a nice format
                st.success("Calculation completed!")
                
                result_col1, result_col2, result_col3 = st.columns(3)
                with result_col1:
                    st.metric("Simulation Time (ps)", f"{simulation_time_ps:,}")
                with result_col2:
                    st.metric("Simulation Time (ns)", f"{time_ns:,.2f}")
                with result_col3:
                    st.metric("Number of Steps", f"{nsteps:,}")
                
                # Generate MDP content
                mdp_content = generate_mdp_content(nsteps, simulation_time_ps)
                
                # Display MDP content
                st.subheader("MDP File Content")
                st.code(mdp_content, language="bash")
                
                # Create download button
                st.download_button(
                    label="Download production.mdp",
                    data=mdp_content,
                    file_name="production.mdp",
                    mime="text/plain"
                )

with tab2:
    st.header("GROMACS Parameter Information")
    st.markdown("""
    This section provides information about common GROMACS parameters used in MDP files.
    Understanding these parameters is essential for setting up accurate molecular dynamics simulations.
    """)
    
    # Display parameters in a nice table format
    parameter_data = [[param, desc] for param, desc in parameters.items()]
    st.table({"Parameter": [p[0] for p in parameter_data], "Description": [p[1] for p in parameter_data]})
    
    # Add some additional helpful information
    st.subheader("Tips for Production Runs")
    st.markdown("""
    - **Time Step**: 2 fs is standard with constraints on hydrogen bonds
    - **Temperature Coupling**: V-rescale is recommended for production runs
    - **Pressure Coupling**: Parrinello-Rahman is recommended for production runs
    - **Energy Output**: Save energy data every 5000 steps to avoid large output files
    - **Coordinates Output**: Use compressed trajectory output (nstxout-compressed) to save disk space
    
    For more detailed information, refer to the [GROMACS Documentation](http://manual.gromacs.org/current/user-guide/mdp-options.html).
    """)

# Sidebar with information
st.sidebar.header("About this Tool")
st.sidebar.markdown("""
This tool helps generate GROMACS MDP files for molecular dynamics production runs.

**Features:**
- Calculate appropriate number of steps from simulation time
- Generate production MDP files with standard parameters
- Quick reference for common GROMACS parameters

The generated MDP file uses standard parameters suitable for most protein simulations:
- OPLS force field settings
- NPT ensemble (constant temperature and pressure)
- V-rescale temperature coupling
- Parrinello-Rahman pressure coupling
- PME for long-range electrostatics
""")

st.sidebar.markdown("---")
st.sidebar.markdown("Created by Pritam Kumar Panda @Stanford University")
st.sidebar.markdown("[GitHub Repository](https://github.com/pritampanda15)")
