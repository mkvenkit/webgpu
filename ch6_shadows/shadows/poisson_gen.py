"""
poisson_gen.py

Poisson-disk sample generator for shadow filtering kernels.

Implements Bridson's Poisson-disk sampling algorithm to generate
blue-noise point sets inside a unit disk. Intended for offline
generation of fixed Poisson kernels (e.g., 4/8/12/16 taps) for
shadow-map PCF and Poisson filtering in WebGPU shaders.

The output is formatted for direct inclusion in WGSL as
array<vec2f, N> coefficients.

Author: Mahesh Venkitachalam
"""


import argparse
import random
import math
import sys


def poisson_disk_samples(n, r_min=None, k=30, seed=None):
    """
    Generate n Poisson-disk samples inside a unit disk using
    Bridson's algorithm.

    Math / geometry summary:
    ------------------------
    Goal: place points {p_i} in R^2 such that

      1) ||p_i|| <= 1                          (inside unit disk)
      2) ||p_i - p_j|| >= r_min, i != j        (minimum separation)

    This produces a *blue-noise* distribution:
    - no clustering (unlike pure random)
    - no regular grid patterns (unlike lattice)

    Parameters:
    -----------
    n      : number of desired samples
    r_min  : minimum allowed distance between any two samples
             If None, estimated as sqrt(1 / n) from area arguments.
    k      : number of candidate attempts per active sample
    seed   : RNG seed for reproducibility
    """

    # -----------------------------
    # Sanity checks
    # -----------------------------
    if not isinstance(n, int) or n <= 0:
        raise ValueError("n (taps) must be a positive integer")

    if r_min is not None and (r_min <= 0.0 or r_min >= 1.0):
        raise ValueError("r_min must be in (0, 1)")

    if not isinstance(k, int) or k <= 0:
        raise ValueError("k must be a positive integer")

    if seed is not None:
        if not isinstance(seed, int):
            raise ValueError("seed must be an integer")
        random.seed(seed)

    # -----------------------------
    # Heuristic for r_min
    # -----------------------------
    # Area of unit disk = pi
    # Average area per sample ≈ pi / n
    # Characteristic spacing ≈ sqrt(area / pi) = sqrt(1 / n)
    if r_min is None:
        r_min = math.sqrt(1.0 / n)

    samples = []  # accepted points
    active = []   # points that can still spawn neighbors

    # -----------------------------
    # Random point uniformly distributed in a unit disk
    # -----------------------------
    def random_in_disk():
        # r = sqrt(u) ensures uniform area distribution
        r = math.sqrt(random.random())
        theta = 2 * math.pi * random.random()
        return (r * math.cos(theta), r * math.sin(theta))

    # Euclidean distance
    def dist(a, b):
        return math.hypot(a[0] - b[0], a[1] - b[1])

    # -----------------------------
    # Initialization
    # -----------------------------
    # Start with one random point
    p0 = random_in_disk()
    samples.append(p0)
    active.append(p0)

    # -----------------------------
    # Bridson's algorithm loop
    # -----------------------------
    # While there are active points that can generate new samples
    while active and len(samples) < n:
        # Pick a random active point
        idx = random.randrange(len(active))
        base = active[idx]
        found = False

        # Try up to k candidates around this base point
        for _ in range(k):
            # Candidate is generated in an annulus:
            # r in [r_min, 2 * r_min]
            # This avoids clustering near the base point
            rho = random.uniform(r_min, 2 * r_min)
            theta = random.uniform(0.0, 2 * math.pi)

            cand = (
                base[0] + rho * math.cos(theta),
                base[1] + rho * math.sin(theta),
            )

            # Reject if outside unit disk
            if cand[0] * cand[0] + cand[1] * cand[1] > 1.0:
                continue

            # Enforce Poisson condition:
            # candidate must be at least r_min away from all samples
            if all(dist(cand, s) >= r_min for s in samples):
                samples.append(cand)
                active.append(cand)
                found = True
                break

        # If no valid candidate was found, retire this active point
        if not found:
            active.pop(idx)

    # -----------------------------
    # Failure to converge check
    # -----------------------------
    if len(samples) < n:
        raise RuntimeError(
            f"Could only generate {len(samples)} samples (requested {n}). "
            "Try lowering r_min or increasing k."
        )

    # -----------------------------
    # Normalize to unit disk
    # -----------------------------
    # Numerical safety: scale all points so max radius = 1
    max_len = max(math.hypot(x, y) for x, y in samples)
    if max_len == 0.0:
        raise RuntimeError("Degenerate sample set (all points at origin)")

    samples = [(x / max_len, y / max_len) for x, y in samples]
    return samples


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Poisson-disk kernel")
    parser.add_argument("-n", "--taps", type=int, default=12,
                        help="number of Poisson samples (positive integer)")
    parser.add_argument("--rmin", type=float, default=None,
                        help="minimum separation (0 < rmin < 1)")
    parser.add_argument("--k", type=int, default=30,
                        help="candidates per active point")
    parser.add_argument("--seed", type=int, default=42,
                        help="random seed")
    args = parser.parse_args()

    try:
        pts = poisson_disk_samples(
            args.taps,
            r_min=args.rmin,
            k=args.k,
            seed=args.seed
        )
    except Exception as e:
        print(f"error: {e}", file=sys.stderr)
        sys.exit(1)

    # Output WGSL-ready array
    print(f"const poisson = array<vec2f, {len(pts)}>(")
    for p in pts:
        print(f"    vec2f({p[0]: .4f}, {p[1]: .4f}),")
    print(");")
