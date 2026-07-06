# Anti-Patterns: What Prevents Build-Alongs From Achieving Masterwork

## Why this file exists

AI-generated build-alongs have specific, predictable failure modes. These are not random errors. They are systematic tendencies that emerge from how language models optimize for helpfulness over usability. Knowing them precisely allows you to detect and avoid them.

## The fatal five

### 1. The wall of text step

**What it looks like**: A step begins with 3-4 sentences of explanation before the actual instruction. The user's eyes glaze over. They scroll looking for the code block.

**Why it happens**: The model defaults to "explain then instruct" because that's how documentation works. But build-alongs are not documentation. They are action sequences.

**How to detect it**: Is there more than one sentence before the first imperative verb or code block? If yes, it's a wall.

**How to fix it**: Lead with the action. If context is needed, make it one sentence max. Move all explanation to AFTER the confirmation ("Why this works: ...") or cut it entirely.

**Before**:

> Step 4: Set up the database connection
>
> Now we need to connect our application to the database. PostgreSQL uses connection strings to identify where the database lives and how to authenticate. The connection string format is `postgres://user:password@host:port/database`. We'll store this in an environment variable for security, since hardcoding credentials in source code is a security risk.
>
> Create a `.env` file...

**After**:

> Step 4: Create the database connection
>
> Create `.env` in your project root:
>
> ```
> DATABASE_URL=postgres://localhost:5432/myapp
> ```
>
> **You should see:** the file appear in your project root (it won't produce terminal output)

### 2. The invisible step

**What it looks like**: A step that produces no visible output. The user completes it and has no way to verify it worked.

**Why it happens**: Some actions genuinely produce no output (environment variables, config files, middleware registration). The model doesn't add verification because the step is "complete."

**How to detect it**: Does the "You should see" section describe something the user can actually observe? If it says "nothing will appear" or the step has no confirmation at all, it's invisible.

**How to fix it**: Add a verification command. Every invisible action has SOME way to confirm:

- Set an env var? → `echo $VAR_NAME` should print the value
- Created a config file? → `cat filename` should show the content
- Registered middleware? → "Restart the server. The console should now show 'Middleware loaded'"

### 3. The assumption gap

**What it looks like**: The guide says "open the config file and add the database section" without specifying WHICH config file, WHERE to add it, or what "the database section" looks like.

**Why it happens**: The model has context from writing the previous steps. It "knows" which file. But the user, who may have stepped away or lost focus, does not.

**How to detect it**: Ask: if the user landed on this step with no memory of previous steps, would they know exactly what to do? If no, there's an assumption gap.

**How to fix it**: Always specify: full file path, exact location within the file, exact content to add. Assume the user has forgotten everything except what they can see on their screen right now.

**Before**: "Add the auth routes to your app."

**After**: "Open `server.js`. Add this line after line 12 (after `app.use(express.json())`): `app.use('/auth', require('./routes/auth'))`"

### 4. The premature explanation

**What it looks like**: The guide explains WHY something works before showing WHAT to do. The user reads three paragraphs about JWT token architecture before ever creating a file.

**Why it happens**: The model has been trained to be educational. It believes understanding should precede action. In build-alongs, the opposite is true: action produces context for understanding.

**How to detect it**: Is there any concept explanation BEFORE the first action in this step? If yes, it's premature.

**How to fix it**: Action first. Explanation after (if needed). "Do this. You should see this. (Why: because JWT tokens encode claims as base64...)" The explanation becomes optional reading for the curious, not a gate for the doer.

### 5. The mega-step

**What it looks like**: A single step asks the user to create 4 files, run 2 commands, modify an existing file, and restart a server.

**Why it happens**: The model groups "related" actions together conceptually. They're all "setting up authentication," so they're one step. But the user's working memory doesn't care about conceptual grouping. It cares about quantity.

**How to detect it**: Count the discrete actions. More than 7? It's a mega-step.

**How to fix it**: Split by the natural confirmation points. Each mini-group that produces a verifiable result becomes its own step.

## Secondary anti-patterns

### 6. Version amnesia

Not specifying tool versions in prerequisites, causing cryptic failures when the user has a different version than the guide assumes.

### 7. The optional trap

Marking steps as "optional" when later steps actually depend on them. If a step CAN be skipped, NO later step may reference its output.

### 8. Placeholder overload

Using 5+ placeholders in a single code block (YOUR_API_KEY, YOUR_PROJECT_ID, YOUR_REGION, etc.) without a clear mapping of where to find each value.

### 9. The context switch

Asking the user to switch tools mid-step ("open your browser, then go back to the terminal, then check the browser again"). Each tool switch is cognitive overhead.

### 10. The "just" minimizer

"Just run the deploy command." "Just add the config." The word "just" signals the author considers it trivial, which makes the user feel stupid when it fails. Remove "just" from your vocabulary.

### 11. The dangling step

A step that works in isolation but breaks something established in a previous step. Usually caused by not testing the full sequence end-to-end.

### 12. Inconsistent naming

Using `myApp` in step 3, `my-app` in step 5, and `myapp` in step 8. Users copy names. Inconsistency causes errors.
