# PEQA Lab – peer grading simulator

Interactive, in-browser simulator for peer grading, based on *Chakraborty, Jindal & Nath – "Removing Bias and Incentivizing Precision in Peer-grading"* (PEQA, JAIR 2024). No server and no build step: it is plain HTML/CSS/JS and runs on GitHub Pages.

## Deploy on GitHub Pages
1. Create a public repository and upload **the files of this folder to the repository root** (not inside a subfolder): `index.html`, `tiny.html`, `style.css`, `sim.js`, `lab.js`, `tiny.js`, `README.md`.
2. Settings → Pages → *Deploy from a branch* → `main` → `/ (root)` → Save.
3. Open `https://<username>.github.io/<repo>/` after a minute. To test locally, open `index.html` in a browser.

## Pages
**Simulator (`index.html`)** – parameters on the left (each has a short explanation), three tabs:
1. **One round** – the assignment matrix (P = probe, N = non-probe, grader never gets her own paper), each grader's true vs estimated bias b̂ and reliability τ̂, the final score of every paper under Mean, Median, Joint LS, Joint ML (PG1), PEQA (ISWDM) and PEQA-ERM weights, and the RMSE of the round.
2. **Accuracy sweeps** – RMSE plots for: growing individual bias, growing noise, a common bias shift, three adversary types (shift / zero / random), and the effect of the number of probes ℓ, papers per grader K and class size n.
3. **Incentives** – EPBI/EPRM plots (performance score flat in bias, increasing in reliability), best-response curve with the symmetric Nash equilibrium and the social optimum, and the competitive-grader plot (utility gain from grading aggressively under Mean, Median and PEQA).

**Tiny instance (`tiny.html`)** – brute-force check with 3 graders and 3 papers: all 5⁸ signal profiles are enumerated; shows whether truthful reporting with high effort is a best response under PEQA, Median and Mean, plus the EPBI and ex-post EPRM checks.

## Parameters
| Parameter | Meaning |
|---|---|
| n, K, ℓ | students; papers per grader (K/2 probes + K/2 non-probes); probe papers (K/2+1 ≤ ℓ ≤ n/(K/2+1)) |
| μ, sd | mean and spread of true scores |
| noise sd σ, heterogeneity | average grader noise (σ = 1/√τ) and how much it differs between graders |
| individual bias sd, common shift δ | each grader's own bias; a bias shared by all graders |
| adversary fraction / type / shift | attackers: shift (bias), zero (always 0), random (uniform 0–10) |
| replications, seed | rounds averaged per point; random seed |
| α, κ, regrading | weight of the performance score; effort cost κτ²/2 per paper; 1 = students request regrades when under-scored |

Grader model: report = true score + bias + noise with reliability τ (higher τ = more effort). RMSE is measured on non-probe papers.

## Files
`sim.js` engine (assignment, rules) · `lab.js` simulator page, sweeps and incentive experiments · `tiny.js` tiny-instance enumeration · `style.css` · `index.html`, `tiny.html`.

## Not included
The Hypothesis-4 stress test, the K×ℓ heat-maps, heterogeneous-cost equilibria, the effort-vs-design plot, the tiny-instance dominance check are only in the Python/Colab notebook.
