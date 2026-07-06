# Step Design: The Atomic Unit of a Build-Along

## Foundational principle

A step is the atomic unit of a build-along. It is indivisible: either the user completes it fully or not at all. Every step must produce a visible, verifiable result. A step without visible output is not a step. It is a gap where users get lost.

## The anatomy of a well-designed step

### Title: verb + noun

Always imperative. Always specific.

- Good: "Create the database schema"
- Good: "Install the CLI tool"
- Good: "Add authentication middleware"
- Bad: "Database setup" (no verb)
- Bad: "Next steps for configuration" (vague)
- Bad: "Understanding the routing system" (explanation, not action)

### Context: one sentence maximum

Why this step matters, only if non-obvious. If the user can infer why from the title, skip context entirely.

- Good: "This file tells the build system where to find your components."
- Bad: "Now we need to configure the build system. Build systems are tools that..." (too much)

### Instruction: imperative, concrete, unambiguous

The instruction is what the user DOES. It uses imperative mood ("Run this", "Paste this", "Open this file").

Rules:

- One action per sentence
- Exact file paths, exact commands, exact content
- If they need to create a file, show the COMPLETE file content, not a diff
- If they need to modify a file, show exactly what to change (line reference or before/after)
- If they need to run a command, show the exact command including flags
- No "you might want to" or "consider doing". Just "do this."

### Code blocks: complete and copy-pasteable

Code in a step must be directly copy-pasteable into a terminal or file.

- Include the full content, not snippets with ellipses
- If the file is longer than 30 lines, show the full file but bold/comment the new parts
- Never use `...` to truncate unless the unchanged parts are truly irrelevant
- Language-tag every code block for syntax highlighting

### Confirmation: "You should see"

After every step, tell the user what success looks like. This is mandatory. It serves two functions:

1. Confirms the step worked (positive feedback loop)
2. Creates a checkpoint the user can return to if later steps fail

Formats:

- Terminal output: show the expected output (or key lines from it)
- File creation: "You should now have a file at `path/to/file` containing..."
- Visual result: describe what appears on screen
- State change: "Your project structure should now look like: [tree]"

### Error support: "If instead you see"

Include error support for any step where:

- Users commonly make mistakes
- The error message is cryptic
- The fix is non-obvious
- A missing prerequisite would surface here

Format: **If instead you see:** [exact error text or description] → [exact fix]

Multiple errors? Stack them:

- `Error: ENOENT: no such file` → You're in the wrong directory. Run `cd project-name` first.
- `Permission denied` → Prefix the command with `sudo` (macOS/Linux) or run terminal as admin (Windows).

## The 7-item ceiling

George Miller's research: working memory holds 7±2 items. A step that asks for more than 7 discrete actions overloads the user.

Counting actions:

- "Run this command" = 1 action
- "Create this file with this content" = 1 action (copy-paste is atomic)
- "Open file X, find line Y, change Z to W" = 3 actions (open, find, change)
- "Create three files" = 3 actions (one per file)

If a step exceeds 7 actions, split it. Name the split logically:

- Step 4a: Create the route files
- Step 4b: Register the routes

## Step sizing by phase

### Foundation steps (1-3): small, fast, confidence-building

- Completable in under 2 minutes
- 1-3 actions maximum
- Full worked examples, zero ambiguity
- Purpose: prove the environment works, build confidence

### Building steps (4-N): progressively larger, fading

- Completable in 2-5 minutes
- 3-7 actions
- Early: still fully worked
- Middle: "repeat this pattern for X, Y, Z"
- Late: "now add [goal] using the same approach as step 7"

### Completion step (final): verification only

- 1-2 actions: run/test the finished thing
- Confirmation shows the FULL working result
- No new concepts introduced

## What makes a step masterful vs. merely correct

A correct step: tells you what to do.
A masterful step: makes it impossible to fail.

The difference:

- Masterful steps anticipate the user's cursor position ("you should still be in the project root")
- Masterful steps acknowledge platform differences inline ("on Windows, use `\\` instead of `/`")
- Masterful steps use the confirmation to teach ("You should see 'Server running on port 3000'. That means Express is listening for requests.")
- Masterful steps make the user feel progress ("That's the hard part done. The rest is just connecting the pieces.")
