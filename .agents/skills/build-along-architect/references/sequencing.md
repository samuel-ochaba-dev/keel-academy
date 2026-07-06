# Sequencing: Dependency Order and Worked-Example Fading

## Foundational principle

A masterpiece build-along is not a list of steps. It is a dependency chain. Each step REQUIRES the output of the previous step. The user cannot reorder. They cannot skip. This strict dependency is what creates momentum: each completed step makes the next step possible.

Sequencing is also the teaching mechanism. Through worked-example fading (Sweller & Cooper, 1985), the sequence transitions from "follow exactly" to "now you do it." The user doesn't notice they're learning. They just notice they need less help.

## Dependency chain construction

### Step 1: Identify the terminal artifact

What does the user have at the end? Be specific. Not "a web app" but "a deployed Next.js app with authentication, a dashboard page, and a PostgreSQL database."

### Step 2: Decompose backward

Work backward from the terminal artifact:

- What must exist for the final thing to work? (deployment config, built app)
- What must exist for THAT to work? (working app locally)
- What must exist for THAT? (routes, components, database)
- What must exist for THAT? (project scaffold, dependencies)
- What's the absolute starting point? (empty directory + prerequisites)

This backward decomposition gives you the dependency chain.

### Step 3: Linearize the dependencies

Turn the dependency tree into a linear sequence. Where branches exist (A depends on B and C independently), order by:

1. Foundation first: which branch establishes something the other branch will use?
2. Confidence first: which branch produces a more satisfying visible result?
3. Simpler first: which branch has fewer steps?

### Step 4: Verify no forward dependencies

Check every step: does it reference anything introduced in a later step? If yes, reorder.

## Worked-example fading protocol

### What is fading?

Fading is the systematic reduction of instructional specificity as the user demonstrates competence. It mirrors how apprenticeship works: the master shows you exactly how, then guides you, then watches you do it alone.

### The fading curve
