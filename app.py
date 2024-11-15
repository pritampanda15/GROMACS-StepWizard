from flask import Flask, request, render_template, send_file
import os

app = Flask(__name__)

# Home route to render the input form
@app.route('/')
def index():
    return render_template('index.html')

# Route to calculate steps and display results
@app.route('/calculate', methods=['POST'])
def calculate_steps():
    try:
        # Get inputs from the form
        simulation_time_ps = request.form.get('time_ps')
        simulation_time_ns = request.form.get('time_ns')
        
        # Validate inputs (ensure at least one is provided)
        if not simulation_time_ps and not simulation_time_ns:
            return "Please provide simulation time in either ps or ns.", 400

        # Convert inputs to integers
        simulation_time_ps = int(simulation_time_ps) if simulation_time_ps else 0
        simulation_time_ns = int(simulation_time_ns) if simulation_time_ns else 0
        
        # Convert ns to ps if ns is provided
        if simulation_time_ns > 0:
            simulation_time_ps = simulation_time_ns * 1000
        
        # Validate range
        if simulation_time_ps < 1 or simulation_time_ps > 5000000:
            return "Invalid input! Please enter a value between 1 ps and 5,000,000 ps.", 400

        # Calculate nsteps and time in ns
        nsteps = simulation_time_ps * 500
        time_ns = simulation_time_ps / 1000
        
        # Pass results to the front-end
        return render_template('result.html', ps=simulation_time_ps, nsteps=nsteps, time_ns=time_ns)
    except ValueError:
        return "Invalid input! Please enter numeric values.", 400

# Route to generate the .mdp file
@app.route('/generate', methods=['POST'])
def generate_mdp():
    # Get nsteps and simulation time from the form
    nsteps = int(request.form['nsteps'])
    simulation_time_ps = int(request.form['ps'])
    
    # Create the MDP content using string formatting
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

    mdp_content = mdp_template.format(nsteps, simulation_time_ps)

    # Save the .mdp file
    mdp_file_path = os.path.join('production_files', 'production.mdp')
    os.makedirs('production_files', exist_ok=True)  # Ensure the directory exists
    with open(mdp_file_path, 'w') as file:
        file.write(mdp_content)
    
    # Return the file for download
    return send_file(mdp_file_path, as_attachment=True)

# Route to display general parameter information
@app.route('/info')
def general_info():
    parameters = {
        "dt": "The time step for integration in picoseconds. Default is 0.002 ps (2 fs).",
        "nsteps": "The number of steps to simulate. Calculated as simulation_time / dt.",
        "nstxout": "Frequency of writing coordinates to the output file. Set to 0 to save disk space.",
        "nstvout": "Frequency of writing velocities to the output file. Typically not needed, set to 0.",
        "nstenergy": "Frequency of saving energy data. Default is 5000 steps.",
        "tcoupl": "Temperature coupling algorithm. Default is V-rescale.",
        "pcoupl": "Pressure coupling algorithm. Default is Parrinello-Rahman."
    }
    return render_template('info.html', parameters=parameters)


if __name__ == '__main__':
    app.run(debug=True)
