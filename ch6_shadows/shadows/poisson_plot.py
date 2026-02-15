import numpy as np
import matplotlib.pyplot as plt
import math
import random

# -----------------------------
# Parameters
# -----------------------------
N = 1000
k = 30
np.random.seed(0)
random.seed(0)

# -----------------------------
# Random sampling
# -----------------------------
random_pts = np.random.rand(N, 2)

# -----------------------------
# Bridson Poisson-disk sampling (2D)
# -----------------------------
r = math.sqrt(1.0 / (N * math.pi)) * 1.1

width, height = 1.0, 1.0
cell_size = r / math.sqrt(2)
grid_w = int(math.ceil(width / cell_size))
grid_h = int(math.ceil(height / cell_size))

grid = [[-1 for _ in range(grid_h)] for _ in range(grid_w)]
samples = []
active = []

def grid_coords(pt):
    return int(pt[0] / cell_size), int(pt[1] / cell_size)

def in_domain(pt):
    return 0 <= pt[0] < width and 0 <= pt[1] < height

def is_valid(pt):
    gx, gy = grid_coords(pt)
    for i in range(max(0, gx-2), min(grid_w, gx+3)):
        for j in range(max(0, gy-2), min(grid_h, gy+3)):
            idx = grid[i][j]
            if idx != -1:
                dx = samples[idx][0] - pt[0]
                dy = samples[idx][1] - pt[1]
                if dx*dx + dy*dy < r*r:
                    return False
    return True

# Initial sample
pt0 = [random.random(), random.random()]
samples.append(pt0)
gx, gy = grid_coords(pt0)
grid[gx][gy] = 0
active.append(0)

while active:
    idx = random.randrange(len(active))
    base_pt = samples[active[idx]]
    found = False
    
    for _ in range(k):
        rho = random.uniform(r, 2*r)
        theta = random.uniform(0, 2*math.pi)
        new_pt = [
            base_pt[0] + rho * math.cos(theta),
            base_pt[1] + rho * math.sin(theta)
        ]
        
        if in_domain(new_pt) and is_valid(new_pt):
            samples.append(new_pt)
            gx, gy = grid_coords(new_pt)
            grid[gx][gy] = len(samples) - 1
            active.append(len(samples) - 1)
            found = True
            break
    
    if not found:
        active[idx] = active[-1]
        active.pop()

poisson_pts = np.array(samples)

# -----------------------------
# Side-by-side plot
# -----------------------------
fig, axes = plt.subplots(1, 2, figsize=(12, 6))

axes[0].scatter(random_pts[:,0], random_pts[:,1], s=8)
axes[0].set_title("Random Sampling")
axes[0].set_xlim(0,1)
axes[0].set_ylim(0,1)
axes[0].set_aspect('equal')
axes[0].legend()

axes[1].scatter(poisson_pts[:,0], poisson_pts[:,1], s=8)
axes[1].set_title("Poisson-Disk Sampling")
axes[1].set_xlim(0,1)
axes[1].set_ylim(0,1)
axes[1].set_aspect('equal')
axes[1].legend()

plt.tight_layout()
plt.show()
