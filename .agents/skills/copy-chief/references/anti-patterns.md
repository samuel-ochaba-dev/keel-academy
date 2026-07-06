# Anti-patterns

These are the specific failure modes that AI copy falls into. Detect and avoid all of them.

## Anti-pattern 1: Brief regurgitation

**What it looks like:** The AI reads the brief's adjectives back to the prompter in a slightly fancier voice.

**How to detect it:** If you remove the brief, would you be able to reconstruct it word-for-word from the copy? If yes, you regurgitated.

**Example:**

Brief says: "We're a fast, simple project management tool for small teams."

Bad copy: "Experience the simplicity of fast project management. Our streamlined platform is purpose-built for small teams who want to stay organized without the complexity."

(Every adjective from the brief is present. The copy is proving it read the brief, not serving the reader.)

Good copy: "3 people, 12 projects, zero status meetings. That's what Tuesday looks like."

(Specific. Concrete. Evokes the outcome. None of the brief's adjectives appear.)

## Anti-pattern 2: Genre averaging

**What it looks like:** When lacking specifics, the AI produces the statistical average of all copy ever seen for that page type.

**How to detect it:** Could this copy appear on any competitor's site without changing a word? Does it contain any detail unique to THIS product?

**Example:**

Prompt: "Landing page for an AI writing tool"

Bad copy: "Unlock the Power of AI-Driven Writing. Transform your content creation workflow with cutting-edge AI."

(This is the average of all AI tool landing pages. It contains zero information unique to this specific product.)

Good copy: "First drafts in 30 seconds. Not robot-sounding ones. Drafts that sound like your last 50 blog posts."

(Specific mechanism, specific outcome, handles the main objection.)

## Anti-pattern 3: Performing tone instead of being tone

**What it looks like:** The AI was told "be friendly" so it performs friendliness with exclamation marks and filler rather than actually being warm through word choice.

**How to detect it:** Remove the exclamation marks and filler words. Is the underlying message still friendly? If removing "We're so excited!" makes the copy feel cold, the warmth was fake.

**Example:**

Brief: "Onboarding screen. Tone is friendly and encouraging."

Bad copy: "Welcome aboard! We're so excited to have you here! Let's get you set up in just a few easy steps so you can start your journey with us!"

(Performing friendly. Remove the exclamation marks and "so excited" and there is nothing warm left.)

Good copy: "You're in. Let's make this thing yours."

(Actually warm. Casual. Confident on the user's behalf. Friendly through word choice, not punctuation.)

## Anti-pattern 4: Adjective stuffing

**What it looks like:** Using adjectives where evidence should go. Every feature is "powerful", every experience is "seamless", every solution is "innovative".

**How to detect it:** Remove every adjective. Does the sentence still say something? If not, the adjective was hiding the absence of a claim.

**Example:**

Bad: "Our powerful, intuitive analytics platform provides seamless insights."
(Remove adjectives: "Our analytics platform provides insights." That says nothing.)

Good: "See which campaigns made money this week. One click."
(No adjectives needed. The specificity IS the persuasion.)

## Anti-pattern 5: The motivational poster

**What it looks like:** Copy that sounds like it belongs on a poster in a gym or a LinkedIn influencer's post. Inspirational without being informational.

**How to detect it:** Does the copy give you any concrete information about what the product does? Or could it caption a sunset photo?

**Example:**

Sidebar nav for a fitness app:

Bad: "Your Journey" / "Track Your Progress" / "Achieve Your Goals"

(These are motivational captions, not navigation. A user cannot predict what page each leads to.)

Good: "Workouts" / "Stats" / "Plan"

(Concrete nouns. The user knows exactly what they will find.)

## Anti-pattern 6: The safety hedge

**What it looks like:** Copy that refuses to commit to a strong claim, hedging everything with "helps you", "designed to", "enables you to".

**How to detect it:** Count instances of "helps", "enables", "allows", "designed to", "built to". These are all ways of avoiding a direct claim.

**Example:**

Bad: "Our platform helps you manage your tasks more effectively and enables seamless collaboration."

Good: "Your tasks, your team, one board. Nothing else."

(Direct claim. No hedging.)

## Anti-pattern 7: The faux-quirky error

**What it looks like:** Using "Oops!" and cutesy language for every error state regardless of brand or severity.

**How to detect it:** Would this tone be appropriate for a bank? A healthcare app? A government service? If not, it should not be the default.

**Example:**

Bad: "Oops! Looks like that page wandered off! Don't worry, let's get you back on track! 🚀"

Good: "Page not found. Here's the homepage, or search for what you need."

(Clear. Helpful. No performance.)

## Anti-pattern 8: The "welcome" trap

**What it looks like:** Starting every page, section, or flow with "Welcome" when the user doesn't need welcoming, they need orienting.

**How to detect it:** Is this the user's first time here AND do they need emotional reassurance? If either answer is no, skip the welcome.

**Example:**

Returning user dashboard:

Bad: "Welcome back, [Name]! We're glad you're here. Let's pick up where you left off!"

Good: "3 tasks due today. Here's your board."

(They know where they are. They don't need re-welcoming. Give them their stuff.)

## Anti-pattern 9: Telling the user what they already know

**What it looks like:** Copy that narrates the user's situation back to them before getting to the point.

**How to detect it:** Would the user think "yeah, I know that" while reading? Cut it.

**Example:**

User just clicked "Pricing":

Bad: "You're looking for the right plan for your team. We offer flexible options for businesses of all sizes."

(They know they're looking for a plan. They clicked the link. Skip to the plans.)

Good: [Just show the plans]

## Anti-pattern 10: Emotional inflation

**What it looks like:** Using extreme emotional language ("love", "amazing", "delighted", "incredible") for mundane interactions.

**How to detect it:** Match the emotional intensity of the word to the actual significance of the moment. Saving a file is not "amazing."

**Example:**

Bad: "We'd love to help you! Our amazing team is here to make your experience incredible."

Good: "Need help? Our team replies within 2 hours."

(Concrete promise instead of emotional inflation.)

## The master test

After writing any piece of copy, run these three checks:

1. **The Competitor Test**: Could a direct competitor use this exact copy? If yes → not specific enough.
2. **The Out-Loud Test**: Would a real person say this to another person? If no → too written, too stiff.
3. **The "So What" Test**: After each sentence, ask "so what?" If you cannot answer with a concrete benefit → the sentence is filler.

If the copy fails any of these three tests, rewrite before delivering.
