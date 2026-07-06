# Microcopy rules

Microcopy is any text in a UI shorter than three sentences: buttons, labels, tooltips, error messages, empty states, confirmations, placeholders, and inline help.

Microcopy carries more cognitive weight per word than any other copy on the page. A single word change in a button label has been shown to increase conversion by 14.5% (UserIntuition, 2025).

## Universal rules for all microcopy

1. **Be specific, not clever.** The user is mid-task. They need clarity, not personality.
2. **Say what happens next.** Every piece of microcopy should answer: "what will happen when I do this?"
3. **Use the user's frame, not the system's.** "Your file is ready" not "Export process complete."
4. **Front-load the useful word.** "Email address" not "Please enter your email address in the field below."
5. **Match the emotional weight of the moment.** Deleting something permanent feels different than changing a color.

## Buttons and CTAs

### Formula: Verb + Noun (+ Benefit)

- "Save changes" not "Submit"
- "Send message" not "Done"
- "Get my report" not "Generate"
- "Book a call" not "Contact us"

### Rules:

- Max 4 words. Ideal is 2-3.
- Use first person for primary actions: "Start my trial", "Get my report"
- Use imperative for secondary actions: "Learn more", "See examples"
- Never use "Click here", "Submit", "Go", or "Continue" as standalone labels
- The button text should make sense if you read ONLY the button and nothing else on the page
- Pair a destructive action with what is being destroyed: "Delete project" not "Delete"

## Form labels and placeholders

- Labels should be nouns: "Email", "Password", "Company name"
- Never use the placeholder as the only label (accessibility + usability)
- Placeholder text should be an example, not an instruction: "jane@company.com" not "Enter your email"
- Required fields: mark the optional ones instead (most fields are required; mark the exception)
- Help text goes below the field, not above: "We'll only use this for shipping updates"

## Error messages

### Formula: What happened + What to do

Bad: "Invalid input"
Bad: "Oops! Something went wrong. Don't worry!"
Good: "That email address doesn't look right. Check for typos."
Good: "Payment didn't go through. Try a different card."

### Rules:

- Never blame the user ("You entered an invalid...")
- Never be vague ("Something went wrong")
- Never be fake-cheerful about a real problem ("Oops! Looks like...")
- State the problem in plain language
- Give a concrete next step
- Match the severity to the tone. Payment failure is serious. A missing optional field is not.

## Empty states

Empty states are the first thing a new user sees. They are onboarding copy disguised as interface copy.

### Formula: What will go here + How to fill it

Bad: "Nothing to see here yet!"
Bad: "Your journey begins here. Start exploring our features."
Good: "No projects yet. Create one to start tracking your work."
Good: "Your reports will show up here after your first campaign runs."

### Rules:

- Name what the empty space will eventually contain
- Give ONE clear action to resolve the emptiness
- Do not use the empty state to market features
- Do not be cute unless the brand explicitly calls for it

## Confirmation messages

### Formula: What was done (+ What happens next)

Bad: "Success!"
Bad: "Your request has been successfully submitted and is being processed."
Good: "Message sent. They'll get it in a few seconds."
Good: "Saved. Your team can see the changes now."

### Rules:

- Confirm the specific action, not a generic success
- If there's a next step or wait time, say so
- Keep it under 15 words

## Tooltips and inline help

- Only appear when there is a real chance of confusion
- Answer ONE question: "what does this do?" or "why do I need this?"
- Never repeat the label in different words
- Max 1 sentence. If you need more, it belongs in docs, not a tooltip.

## Navigation labels

- Use nouns, not verbs: "Settings" not "Manage settings"
- Use concrete terms, not abstract ones: "Invoices" not "Financial management"
- Never use motivational language as navigation: "Your Journey" is not a nav item. "Dashboard" is.
- Test: would the user recognize this word from their mental model of the task?

## Loading and progress states

- If under 3 seconds: show a spinner, no text needed
- If 3-10 seconds: brief text about what's happening ("Generating report...")
- If 10+ seconds: text + indication of progress or time remaining
- Never say "Please wait" with no other information

## Destructive actions

- Name what will be destroyed: "Delete 'Q3 Report'? This can't be undone."
- Confirm button should name the action: "Delete report" not "OK" or "Yes"
- Cancel button should say "Cancel" or "Keep [thing]"
- Never use "Are you sure?" as the entire confirmation message
