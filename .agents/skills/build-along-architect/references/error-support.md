# Error Support: Anticipate, Surface, Resolve

## Foundational principle

A masterpiece build-along does not prevent errors. It expects them. Users WILL make mistakes. The guide's job is not to eliminate that possibility but to make recovery instant.

John Carroll's minimalist instruction research showed that error support produces better learning outcomes than error prevention. Manu Kapur's productive failure research (2016) confirmed that learners who encounter and resolve errors transfer skills better than those who never fail.

The masterpiece approach: let them fail, catch them immediately, teach through the recovery.

## The three types of errors in build-alongs

### Type 1: Environment errors

The user's setup doesn't match the guide's assumptions.

- Wrong version of a tool
- Missing dependency
- Different operating system behavior
- Permission issues
- Port already in use

These are the most common cause of abandonment. They happen before the user does anything wrong.

**Strategy**: Surface environment errors in prerequisites (gate them out) and in Step 1's error support (catch what slipped through).

### Type 2: Execution errors

The user does the step wrong.

- Typo in a command
- Wrong directory
- Pasted into wrong file
- Missed a step
- Copy-pasted a line break incorrectly

**Strategy**: Confirmation ("You should see") catches these immediately. If the output doesn't match, the user knows to check their work before proceeding.

### Type 3: Comprehension errors

The user does the step correctly but misunderstands what happened, causing errors in later faded steps.

- Thinks a variable name is arbitrary when it's required
- Doesn't understand which part of the pattern to change
- Applies a pattern incorrectly because they didn't grasp the principle

**Strategy**: These surface in faded steps. The error support for faded steps should point back to the fully-worked example: "If this doesn't work, compare your file to the structure in Step 3."

## Error support formats

### Inline error block (most common)

Placed directly after the step's confirmation:
