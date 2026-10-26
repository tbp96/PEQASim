# PEQA Peer-Grading Simulator

This project studies how different peer-grading methods can produce accurate scores when students may grade with different levels of precision, have individual or common bias, or deliberately submit misleading reports. We built a simulation notebook and an interactive web simulator to compare these methods under different conditions.

The project is based on **“Removing Bias and Incentivizing Precision in Peer-grading”** by Chakraborty, Jindal, and Nath (JAIR 2024).

- **Try the interactive simulator:** <https://tbp96.github.io/PEQASim/>
- **Repository:** <https://github.com/tbp96/PEQASim>
- **Full experiment notebook:** [`peer_grading_simulations.ipynb`](peer_grading_simulations.ipynb)
- **Research paper:** <https://arxiv.org/abs/1807.11657>

## What is this project about?

In peer grading, students grade one another's work. Their reports may be noisy or biased, and some students may try to lower other students' scores. A grading system therefore needs to estimate scores from multiple reports while accounting for differences between graders.

We compare several score-aggregation methods and study two questions:

1. **Accuracy:** How close are the assigned scores to the true scores?
2. **Incentives:** Does a grader have a reason to report honestly and put effort into grading accurately?

The simulator uses generated data rather than real student submissions. It models each report as a true score plus grader-specific bias and random noise. Some papers are designated as **probes**: their true scores are known because they are graded by the instructor. These probe papers can be used to estimate grader bias and reliability. The remaining papers are called **non-probes**.

## Grading methods compared

- **Mean:** averages the reports for a paper. It is simple, but a very extreme report can strongly affect the result.
- **Median:** uses the median report. It is more resistant to a minority of extreme reports, but it does not itself reward graders for spending more effort.
- **Joint Least Squares (Joint LS):** estimates paper scores and relative grader biases together from overlapping reports.
- **Joint Maximum Likelihood / MAP (Joint ML, PG1):** estimates scores, biases, and grader precision using a statistical model and priors.
- **PEQA (ISWDM):** uses probe papers to estimate each grader's bias and reliability, then de-biases and reliability-weights the reports. It also includes a performance score intended to reward a grader's contribution to accuracy.
- **PEQA-ERM weights:** a PEQA variant that uses the more direct precision weighting, included as a comparison with the paper's incentive-oriented weighting.

We evaluate accuracy mainly using **root mean squared error (RMSE) on non-probe papers**. Lower RMSE means the assigned scores are closer to the simulated true scores.

## Interactive simulator

Open the [live simulator](https://tbp96.github.io/PEQASim/) in a browser. No local installation is required for the hosted version.

The main simulator page provides:

- **One round:** inspect the grader-to-paper assignment, estimated grader bias and reliability, assigned scores under different methods, and round-level RMSE.
- **Accuracy sweeps:** see how accuracy changes when bias, noise, common score shifts, adversarial graders, or design parameters change.
- **Incentives:** explore bias/reliability incentive checks, best-response effort, equilibrium versus social optimum, and a competitive grader's incentives.

The separate **Tiny instance** page demonstrates a small peer-grading setup where the possible signal outcomes can all be enumerated. This makes it easier to inspect the mechanism's incentive properties on a simple example.

The web simulator is intended for exploring a selection of experiments interactively. For the full set of analyses, additional plots, tables, and implementation details, see the Jupyter notebook.

## Experiments in the notebook

The notebook [`peer_grading_simulations.ipynb`](peer_grading_simulations.ipynb) contains the complete simulation workflow. Run its cells from top to bottom to reproduce the experiments and view their plots and tables.

| Section | What we investigate |
|---|---|
| **Parts 1–2: Simulator and grading rules** | Set up the peer-grading model and compare Mean, Median, Joint LS, Joint ML/PG1, PEQA, and PEQA-ERM. We also inspect how probe and non-probe papers are assigned. |
| **Experiment A: Recovery error** | Change individual grader bias (A1), random grading noise (A2), and a common bias shift affecting all graders (A3). Compare the resulting RMSE across methods. |
| **Experiment B: Adversarial graders** | Test graders who always shift scores down, always report zero, or submit random scores. Study how the methods respond as the proportion of adversarial graders increases. |
| **Experiment C1: EPBI and EPRM** | Numerically check PEQA's intended incentive properties: Ex-Post Bias Insensitivity (EPBI) and Ex-Post Reliability Monotonicity (EPRM). |
| **Experiment C2: Effort game** | Plot best-response effort, examine the symmetric Nash equilibrium, and compare equilibrium effort with social optimum. Also study heterogeneous effort costs and the effect of regrading. |
| **Modified PEQA** | Check the modified payment/transfer calculation used to offset competitive incentives, including the ranking invariance result described in the notebook. |
| **Experiment D: Competitive grader** | Let one grader choose bias and effort while competing with other graders. Compare Mean, Median, and PEQA under uniform rivalry and rivalry concentrated on the papers she grades. |
| **Experiment E: Tiny-instance verification** | Use 3 graders and 3 submissions, with discretised noise, to enumerate all possible signal profiles. Check best responses under PEQA, Median, and Mean, and test EPBI/EPRM in this small setting. |
| **Experiment F: Design sensitivity** | Vary the number of probe papers, papers per grader, and class size. Compare a baseline scenario with a stress scenario, and examine design heatmaps and effort levels. |
| **Experiment G: Probe-discrimination stress test** | Test what happens if graders can recognise probe papers and behave differently on non-probe papers. Examine accuracy degradation and whether a probe/non-probe comparison can detect this behaviour. |
| **Experiment H: True-score distributions** | Compare grading-method RMSE when true scores are generated from Normal, Uniform, Binomial, Gamma, Beta, Lognormal, Bimodal, and Student-t distributions. |

### Main observations from the experiments

- **Probes provide an anchor to the true score scale.** This helps PEQA address a common bias shift that methods relying only on agreements between graders cannot identify from peer reports alone.
- **Robustness and incentives are different goals.** The Median can resist a minority of extreme reports, but it does not provide a performance reward for grading more carefully. The Mean is more sensitive to extreme reports.
- **PEQA uses both bias correction and reliability estimates.** Its probe-based estimates are useful, although they are themselves noisy when a grader has only a few probe observations.
- **The assignment design matters.** The notebook finds that papers per grader can have a stronger effect on accuracy than simply increasing the total number of probes, because more papers per grader provide more observations for estimating bias and reliability.
- **Probe papers need to be representative.** If graders can identify probes and behave more carefully on them than on ordinary papers, the probe-based estimates can become misleading and PEQA's accuracy can degrade.

These are simulation findings under the notebook's model and parameter choices, not guarantees for every real classroom. Exact values may vary with the random seed and replication settings.

## Files in this repository

| File | Purpose |
|---|---|
| `README.md` | Project overview, simulator link, and summary of the experiments. |
| `index.html` | Main browser-based simulator page. |
| `sim.js` | Simulation engine, assignment logic, and grading-method calculations used by the web simulator. |
| `lab.js` | Browser interface for one-round simulations, accuracy sweeps, and incentive experiments. |
| `tiny.html` | Page for the tiny-instance verification experiment. |
| `tiny.js` | Enumeration and incentive checks for the tiny instance. |
| `style.css` | Styling for the web interface. |
| `peer_grading_simulations.ipynb` | Full notebook containing the model, experiments A–H, plots, tables, and result summaries. Upload this file to the repository root. |

When the notebook runs, it creates a `peer_grading_outputs/` directory containing saved plots, CSV data tables, logs, a run summary, and a configuration snapshot. It also packages these outputs into `peer_grading_outputs.zip`.

## Running the notebook

1. Open `peer_grading_simulations.ipynb` in Jupyter Notebook, JupyterLab, or Google Colab.
2. Install the required Python packages if they are not already available:

   ```bash
   pip install numpy pandas matplotlib scipy
   ```

3. Run the notebook from the first cell onward. The notebook uses a fixed random seed for repeatability.
4. For a quicker smoke test, set `QUICK_MODE = True` in the setup cell. The default `QUICK_MODE = False` uses more repetitions and takes longer to run.
5. Review the charts and tables in the notebook and the generated files in `peer_grading_outputs/`.

## Scope and limitations

This is a simulation study. It helps us compare methods under controlled assumptions, but its results depend on the model, selected parameters, number of repetitions, and the behaviours assigned to strategic or adversarial graders. In particular, the probe-discrimination stress test models strategic behaviour as a specified rule rather than deriving that behaviour as an equilibrium. The notebook should therefore be read alongside its assumptions and experiment descriptions.

## Reference

Chakraborty, A., Jindal, A., & Nath, S. (2024). *Removing Bias and Incentivizing Precision in Peer-grading*. Journal of Artificial Intelligence Research (JAIR). <https://arxiv.org/abs/1807.11657>
