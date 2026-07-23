# Duolingo Deep-Dive Extraction for StudYear

| | |
|---|---|
| **Document** | Duolingo deep-dive extraction & product transformation blueprint |
| **Companion to** | `duolingo-ci-04.md` (executive dossier CI-04) — this is the full deep-dive that CI-04 summarises |
| **Sits alongside** | `get-revising-audit.md` · TTRS teardown |
| **Feeds** | agent registry `../product/studyear-ai-os-venture-brief.md` (SY-A01–A21) · `../REQUIREMENTS-MANDATE.md` (preserve-and-enhance) · v1.2 backlog |
| **Status** | Merged as a new module. Additive only — deletes/replaces nothing existing. |

> **Naming note.** This document was authored using the spelling "StudyYear"; it
> refers to **StudYear**, the product in this repository. Competitor figures are
> carried with their original attributions and are context for planning, not
> StudYear claims. The *Improve/Add*, module list, roadmap and metrics are
> StudYear strategy derived from the extraction.

---

## Executive verdict

StudyYear should not copy Duolingo’s screens, characters, wording, lesson content, animations or proprietary brand assets. It should copy and improve the underlying product logic:

Diagnostic intelligence + tiny daily learning actions + visible progression + emotional rewards + adaptive recovery + social accountability + premium AI intervention.

Duolingo’s strategic strength is not simply gamification. It has created a highly engineered behavioural system that repeatedly converts:

intention → immediate action → short achievement → reward → return trigger → habit → subscription.

Its product-led model, recognisable brand, experimentation culture, organic distribution and premium subscription ladder have helped it become the leading mobile learning platform; Duolingo reported more than 50 million daily active users in 2025 and over $1 billion in bookings. ([Duolingo, Inc.](https://investors.duolingo.com/))

StudyYear can become more valuable than Duolingo academically because it already addresses areas where Duolingo remains limited:

* Full school curriculum coverage
* Academic diagnostics
* Predicted grades
* Parent intelligence
* Assignment support
* Exam readiness
* Teacher and school intervention
* Verified study time
* Multisubject learning
* Long-term academic planning

The opportunity is to combine Duolingo-level engagement with StudyYear-level academic depth and accountability.

## 1. Duolingo’s underlying product architecture

Duolingo appears simple to the learner, but underneath it operates as several connected systems.

### 1.1 The acquisition system

Duolingo attracts users through:

* Free entry
* Immediate onboarding
* Recognisable mascot
* Viral social content
* Word-of-mouth growth
* App-store visibility
* Low-friction account creation
* Public progress sharing
* Family and friend participation
* Free educational utility
* Strong brand personality

Duolingo says most of its historical growth has come through word of mouth supported by a product-focused and A/B-testing culture. ([Duolingo, Inc.](https://investors.duolingo.com/))

**StudyYear extraction**

StudyYear needs a zero-friction academic entry point:

1. Select school year.
2. Select target subjects.
3. Choose an academic objective.
4. Complete a short diagnostic.
5. Receive a personalised Academic Score.
6. Begin the first recovery mission immediately.

The user should receive visible value before being asked to subscribe.

**Recommended StudyYear entry products**

* Free five-minute academic diagnostic
* Free predicted-grade estimate
* Free GCSE readiness check
* Free SATs readiness check
* Free 11+ readiness check
* Free “What am I weak at?” analysis
* Free assignment structure check
* Free seven-day recovery plan
* Free parent academic snapshot

These become StudyYear’s viral acquisition mechanisms.

### 1.2 The learning path system

Duolingo converts a large subject into a clear sequential path composed of small lessons, checkpoints and progressively harder activities.

Its path communicates:

* Where the learner is
* What comes next
* What has been completed
* What remains locked
* Which content is being reviewed
* Where special challenges appear
* How far the learner has progressed

This eliminates decision fatigue.

**StudyYear extraction: Academic Journey Map**

StudyYear should create a subject-specific learning path for every learner.

Example:

GCSE Mathematics Journey

Foundation layer:

* Number
* Fractions
* Percentages
* Ratio
* Basic algebra

Development layer:

* Equations
* Graphs
* Geometry
* Probability
* Statistics

Exam layer:

* Mixed questions
* Timed sections
* Past-paper simulations
* Error correction
* Grade-target practice

Each node should display:

* Topic name
* Mastery level
* Curriculum code
* Estimated study time
* Difficulty
* Prerequisites
* Last attempt
* Confidence
* Predicted marks available
* Recommended next action

**Improvement over Duolingo**

The path should not be the same for every student.
StudyYear should dynamically rebuild the path according to:

* Diagnostic results
* Target grade
* Upcoming exam dates
* Teacher assignments
* Previous errors
* Knowledge decay
* Time available
* Learning speed
* Confidence
* Parent priorities
* School curriculum sequence

This becomes the **Adaptive Academic Route Engine**.

## 2. The Duolingo lesson engine

Duolingo uses short, interactive activities rather than long passive content. Its public app descriptions emphasise bite-sized lessons across reading, writing, listening and speaking. ([Google Play](https://play.google.com/store/apps/details?hl=en_US&id=com.duolingo))

The essential lesson pattern is:

1. Present a tiny task.
2. Require an action.
3. Give immediate feedback.
4. Adjust difficulty.
5. Repeat the concept differently.
6. Finish before fatigue appears.
7. Reward completion.

**StudyYear extraction: MicroLesson Engine**

StudyYear should decompose school lessons into 3–10 minute learning units.

Each MicroLesson should contain:

* One learning objective
* One short explanation
* One worked example
* One guided question
* One independent question
* One confidence check
* One mastery decision
* One next-step recommendation

**Supported activity types**

Mathematics

* Multiple choice
* Enter the answer
* Complete the calculation
* Drag steps into order
* Identify the incorrect step
* Match formula to problem
* Graph plotting
* Shape labelling
* Timed mental maths
* Explain the method
* Compare two solutions
* Estimate before calculating

English

* Identify language technique
* Improve a sentence
* Order paragraphs
* Choose stronger evidence
* Build a thesis
* Correct punctuation
* Analyse a quotation
* Compare interpretations
* Record a spoken response
* Mark an example answer
* Rewrite for a higher grade

Science

* Label a diagram
* Predict an outcome
* Match variables
* Build an equation
* Interpret a graph
* Sequence a process
* Analyse experimental results
* Identify controls
* Explain cause and effect
* Diagnose a misconception

Humanities

* Order events chronologically
* Link cause and consequence
* Analyse a source
* Identify bias
* Map locations
* Compare interpretations
* Construct an argument
* Evaluate significance
* Recall key dates
* Build an essay plan

Languages

* Listening
* Speaking
* Translation
* Vocabulary
* Grammar
* Pronunciation
* Dictation
* Conversation simulation
* Sentence construction

## 3. The adaptive difficulty engine

Duolingo’s activities adjust to learners’ levels and pace, including in its school assignments. ([schools.duolingo.com](https://schools.duolingo.com/))

StudyYear needs a stronger academic version.

**Adaptive Academic Difficulty Engine**

Every question should receive a difficulty score based on:

* Curriculum level
* Cognitive demand
* Number of reasoning steps
* Reading complexity
* Topic prerequisites
* Historical learner performance
* Time pressure
* Required recall depth
* Mark-scheme complexity

**Real-time adaptation rules**

When a learner struggles:

* Reduce question complexity
* Display a smaller first step
* Offer a visual explanation
* Retrieve a prerequisite lesson
* Show a worked example
* Allow verbal explanation
* Switch format
* Ask a confidence question
* Pause progression
* Generate a recovery exercise

When a learner performs strongly:

* Remove hints
* Increase complexity
* Introduce unfamiliar contexts
* Combine multiple topics
* Apply time limits
* Require explanation
* Introduce exam-style marking
* Advance to a higher grade band

**Mastery states**

Each curriculum skill should have one of these states:

* Not assessed
* Critical gap
* Emerging
* Developing
* Secure
* Strong
* Exam ready
* At risk of decay

The system must separate lesson completion from actual mastery.
This is an important improvement over engagement-led systems where progress can sometimes represent activity more than durable understanding.

## 4. Streak extraction and improvement

The streak is one of Duolingo’s most powerful habit mechanisms.
It transforms learning into a daily identity: “I am someone who does not break my streak.”

However, blindly copying a daily streak creates several risks:

* Students may complete low-value activities only to preserve the streak.
* Streak anxiety can discourage return after a break.
* A child may accumulate activity without learning.
* Time spent can become more important than academic improvement.

**StudyYear replacement: Academic Momentum**

StudyYear should use a more intelligent system than one universal streak.

Momentum dimensions

* Daily Learning Momentum
* Weekly Mastery Momentum
* Revision Consistency
* Assignment Momentum
* Exam Preparation Momentum
* Recovery Momentum
* Verified Study Momentum

**Momentum only counts when the learner completes a meaningful action**

Eligible actions:

* Masters a skill
* Corrects a previous misconception
* Completes a planned lesson
* Submits an assignment
* Performs active recall
* Finishes an exam question
* Reviews a decaying topic
* Completes verified focused study
* Improves an assessed response

Non-eligible actions:

* Opening the app
* Watching a video without interaction
* Repeating an already-mastered easy activity
* Rapidly clicking through lessons
* Leaving the lesson running
* Copying AI-generated answers

**Academic Momentum protections**

Introduce:

* Momentum Shield
* Rest Day
* School Holiday Mode
* Illness Pause
* Exam Recovery Mode
* Family Emergency Pause
* Restart Without Shame
* Weekend Flexible Goal

The system should motivate without creating unhealthy pressure.

## 5. Experience points and rewards

Duolingo uses XP to convert learning into an immediately visible reward.

XP supports:

* Progress
* Competition
* Challenges
* Leaderboards
* Goal completion
* Status
* Event participation

**StudyYear version: Knowledge Points**

StudyYear should not reward all activity equally.

Knowledge Point formula

```text
Knowledge Points =
Base activity value
× difficulty multiplier
× mastery improvement multiplier
× independence multiplier
× retention multiplier
× integrity multiplier
```

Example:

* Repeating an easy known question: 2 KP
* Learning a new concept: 10 KP
* Correcting a misconception: 15 KP
* Completing a timed exam problem independently: 25 KP
* Retaining mastery after 30 days: 30 KP
* Moving from Grade 4 to Grade 5 readiness: major milestone award

**Anti-gaming protections**

* Diminishing returns for repeated easy tasks
* No full rewards for skipped explanations
* Suspicious speed detection
* Question-pattern rotation
* Random verification questions
* AI-generated answer detection
* Copy-paste behaviour monitoring
* Independence scoring
* Mastery verification

This prevents students from chasing points without learning.

## 6. Hearts and energy mechanics

Duolingo historically used limited hearts to penalise mistakes and has also experimented with systems that reward correct answers through energy mechanics. Its product systems are continually tested and altered to improve engagement and monetisation. ([MarketWatch](https://www.marketwatch.com/))

A strict lives system should not be copied directly into StudyYear because mistakes are academically valuable.

**StudyYear alternative: Focus Energy**

Learners receive a daily Focus Energy allocation.

Focus Energy represents:

* Mental effort
* Session capacity
* Challenge readiness
* Recommended cognitive load

Energy should not prevent basic learning. Instead, it controls access to high-cost or intensive activities.

Energy may be used for

* AI tutor conversations
* AI assignment reviews
* Full mock exams
* Advanced simulations
* Voice tutoring
* Visual explanations
* Complex resource generation
* Detailed marking

Energy regeneration

* Completing non-AI revision
* Taking a healthy break
* Returning the next day
* Completing retrieval practice
* Parent-approved top-up
* Subscription allowance
* ACU wallet

This can connect naturally to StudyYear’s ACU commercial model without turning mistakes into punishment.

## 7. Leaderboards and leagues

Duolingo uses leagues and leaderboards to create competition and urgency.

The core mechanism includes:

* Weekly reset
* Peer comparison
* Promotion
* Relegation
* Rank protection
* Limited-time competition
* Status tiers
* Social visibility

**StudyYear improvement: Fair Academic Leagues**

A raw leaderboard can disadvantage:

* Learners with disabilities
* Students with limited device access
* Students with lower starting attainment
* Students with family responsibilities
* Learners studying harder subjects
* Learners who prioritise quality over volume

StudyYear should rank learners by improvement and consistency, not only total activity.

League options

* Personal Best League
* Most Improved League
* Consistency League
* Mastery League
* Revision League
* Subject League
* Class League
* School House League
* Friends League
* Family Learning League
* Exam Countdown League

Fairness controls

* Compare similar year groups
* Compare similar starting levels
* Normalise by assigned workload
* Cap daily qualifying points
* Hide rankings when harmful
* Allow private participation
* No public display of low performers
* Safeguard minors
* Teacher-controlled class competitions

League tiers

StudyYear could use academic identities such as:

* Explorer
* Builder
* Thinker
* Solver
* Scholar
* Master
* Academic Elite

Avoid copying Duolingo’s league names or visual assets.

## 8. Quests, missions and challenges

Duolingo uses daily and recurring challenges to convert vague ambitions into immediate actions.

**StudyYear Academic Missions**

Daily missions

* Complete one MicroLesson
* Correct yesterday’s error
* Review one weak topic
* Answer five retrieval questions
* Study for ten verified minutes
* Complete one exam question

Weekly missions

* Secure three weak skills
* Complete one mixed-topic challenge
* Finish one timed paper section
* Improve one written answer
* Maintain three study days
* Complete all teacher assignments

Long-term missions

* Reach GCSE Grade 6 readiness
* Master Year 6 arithmetic
* Complete the 11+ vocabulary pathway
* Finish the A-level calculus foundation
* Recover all red-flag topics
* Become exam ready in a subject

Dynamic missions

The AI should generate missions from actual risks:
“Your algebra accuracy dropped from 74% to 58%. Complete two equation recovery sessions this week.”

This is far more academically meaningful than generic activity challenges.

## 9. Duolingo characters and emotional design

Duolingo has built a memorable character universe. Characters make:

* Feedback feel human
* Notifications recognisable
* Mistakes less clinical
* Marketing more viral
* Premium AI conversations more engaging
* Lessons emotionally distinctive

Its AI conversation feature uses Lily as a consistent personality rather than presenting a generic chatbot. Lily adapts to the user’s level, conducts short conversations and can support repeated real-time speaking practice. ([Duolingo Blog](https://blog.duolingo.com/duolingo-max/))

**StudyYear Character Intelligence System**

StudyYear should not imitate the owl or Duolingo’s cast. It should develop original academic companions.

Possible StudyYear companion roles

* Nova — Study Coach: daily motivation and planning
* Atlas — Mathematics Guide: structured, precise explanations
* Lexi — English Mentor: writing and interpretation
* Aria — Science Explorer: experiments and visual reasoning
* Sage — Revision Strategist: memory and exam preparation
* Pulse — Wellbeing Coach: workload and burnout prevention
* Orbit — Career Navigator: subjects, careers and university readiness

Each companion requires:

* Distinct personality
* Role-specific system prompt
* Age-appropriate language
* Subject expertise boundaries
* Memory controls
* Safety rules
* Escalation logic
* Visual identity
* Voice style
* Feedback style

**Important improvement**

Students should be able to select:

* Encouraging coach
* Direct coach
* Calm coach
* High-challenge coach
* Visual coach
* Socratic coach

The personality should adapt without compromising academic quality.

## 10. AI conversation and tutoring

Duolingo Max offers AI-powered conversation functionality through Video Call, with adaptation to the learner’s proficiency, short real-time interactions and transcripts for review. ([Duolingo Blog](https://blog.duolingo.com/duolingo-max/))

**StudyYear extraction: Live AI Tutor Sessions**

StudyYear should extend this beyond language conversation.

Tutor session formats

* Voice Call
* Video Avatar Call
* Text Chat
* Whiteboard Session
* Screen Explanation
* Socratic Questioning
* Oral Exam
* Presentation Rehearsal
* Debate Practice
* Reading Practice
* Interview Preparation

Subject examples

Mathematics — the tutor watches the student solve a problem and asks:

* “What should you do first?”
* “Why did you choose that operation?”
* “Where might the sign have changed?”
* “Can you check your answer another way?”

English — the tutor conducts:

* Poetry discussion
* Oral analysis
* Thesis challenge
* Quotation recall
* Argument development
* Spoken language preparation

Science — the tutor can run:

* Practical-method questioning
* Variable identification
* Hypothesis testing
* Data interpretation
* Scientific vocabulary rehearsal

Languages

* Conversation simulation
* Pronunciation feedback
* Role-play
* Listening response
* Vocabulary recall
* Speaking exam rehearsal

**Post-session intelligence**

After every tutor session, generate:

* Transcript
* Skills practised
* Misconceptions detected
* Confidence score
* Fluency score
* Independence score
* Vocabulary gaps
* Recommended next mission
* Parent-safe summary
* Teacher-safe summary

**Cost control**

Because live AI is expensive, use:

* Maximum session duration
* Model routing by complexity
* Speech-to-text before premium reasoning
* Small model for routine responses
* Large model only for complex explanation
* Transcript compression
* Response caching
* ACU pre-authorisation
* Hard wallet stop
* Cost preview
* Per-session budget limit

## 11. Explain My Answer

One of the core Duolingo Max concepts is AI explanation of a learner’s answer.

**StudyYear version: Explain My Mistake**

This should become one of StudyYear’s strongest features.

For every incorrect answer, the learner can select:

* Explain simply
* Show the first step
* Show a worked example
* Explain visually
* Explain as a story
* Compare my answer with the correct answer
* Show where I went wrong
* Ask me questions instead
* Give me another similar question
* Explain for my age
* Explain at exam level
* Explain in another language

**Misconception record**

Every error should be classified as:

* Knowledge gap
* Misread question
* Calculation error
* Vocabulary gap
* Method error
* Missing prerequisite
* Weak recall
* Time-pressure error
* Careless mistake
* Overconfidence
* Incomplete reasoning

This error classification should update the student’s recovery plan.

## 12. Role-play extraction

Duolingo uses scenario-based role-play for applied language practice.

**StudyYear Academic Role-Play Engine**

Examples

* Act as a scientist defending an experiment
* Debate whether a historical decision was justified
* Present a business proposal
* Explain a maths method to a younger student
* Participate in a mock university interview
* Defend an English literature interpretation
* Conduct a French speaking exam
* Act as a doctor explaining body systems
* Simulate a courtroom discussion
* Deliver a class presentation
* Negotiate in a business studies scenario

Assessment — the engine should score:

* Subject accuracy
* Communication
* Evidence
* Reasoning
* Vocabulary
* Structure
* Confidence
* Responsiveness
* Misconceptions
* Curriculum alignment

## 13. Practice Hub extraction

Duolingo centralises additional practice, including personalised review and premium activities.

**StudyYear Practice Command Centre**

Sections should include:

* Weak Skills
* Recent Mistakes
* Knowledge at Risk
* Teacher Assignments
* Exam Questions
* Quick Revision
* Timed Practice
* Flashcards
* Formula Recall
* Vocabulary Recall
* Saved Questions
* Challenge Zone
* Tutor Calls
* Past Papers
* Confidence Recovery
* Recommended Today

The Practice Command Centre should answer:
“What is the single most valuable thing this student should study right now?”

## 14. Spaced repetition and knowledge decay

Duolingo repeatedly resurfaces material rather than treating a completed lesson as permanently learned.

**StudyYear Knowledge Decay Engine**

Each skill should contain:

* Initial mastery date
* Last successful retrieval
* Number of successful recalls
* Recall speed
* Confidence
* Error frequency
* Difficulty
* Decay risk
* Next review date

Scheduling inputs

* Exam proximity
* Topic importance
* Mark weighting
* Historical weakness
* Retrieval performance
* Time since last review
* Target grade
* Available study time

**StudyYear improvement**

Not all knowledge should decay at the same rate.
The engine should learn an individual retention profile:

* Fast-forgetting learner
* Slow-but-durable learner
* Strong visual retention
* Weak formula retention
* Strong recognition but weak recall
* Strong untimed but weak timed performance

## 15. Notifications and re-engagement

Duolingo is recognised for persistent, character-led reminders.

**StudyYear Smart Intervention Engine**

StudyYear must avoid generic reminders such as “Time to study.”
Instead, send evidence-based interventions:

* “Your fractions mastery may fall below Secure tomorrow.”
* “You are 12 minutes away from completing today’s plan.”
* “Your science test is in eight days. Two priority gaps remain.”
* “You improved algebra accuracy by 14% this week.”
* “Complete one five-minute task to protect your Academic Momentum.”
* “Your teacher assignment is due tomorrow.”
* “You have studied for four consecutive planned days.”
* “Your English predicted grade has moved from 5 to 6.”

Delivery channels

* In-app
* Push notification
* Email
* Parent notification
* Teacher alert
* WhatsApp, where compliant and appropriate
* Calendar reminder

Notification intelligence — control by:

* Age
* Time zone
* School hours
* Bedtime restrictions
* Parent preferences
* Exam urgency
* Notification fatigue
* Previous response rate
* Emotional risk signals

## 16. Onboarding and placement testing

Duolingo allows users to begin at an appropriate point rather than forcing every learner through the beginning.

**StudyYear Academic Placement System**

The diagnostic should identify:

* Curriculum level
* Missing prerequisites
* Topic mastery
* Reading age where appropriate
* Working grade
* Target grade
* Confidence
* Study habits
* Exam readiness
* Learning preferences
* Time availability

Diagnostic stages

1. Learner profile
2. Academic objective
3. Confidence self-assessment
4. Adaptive questions
5. Error analysis
6. Curriculum mapping
7. Grade prediction
8. Personal Recovery Plan
9. First recommended lesson

**Important rule**

The diagnostic must be short enough to complete but strong enough to create immediate trust.
Use progressive diagnostics:

* Initial five-minute diagnostic
* Background assessment during normal use
* Weekly calibration
* Monthly benchmark
* Formal term assessment

## 17. Scores and credentials

Duolingo aims to make its score a broadly recognised measure of language proficiency. ([Duolingo, Inc.](https://investors.duolingo.com/))

**StudyYear Academic Readiness Score**

StudyYear should create a universal but explainable academic scoring system.

Main scores

* Academic Readiness Score
* Subject Mastery Score
* Exam Readiness Score
* Learning Stability Score
* Independence Score
* Revision Consistency Score
* Verified Study Score
* Assignment Quality Score

Score requirements — every score must show:

* Current value
* Previous value
* Direction of travel
* Confidence interval
* Evidence used
* Skills affecting the score
* Actions required to improve
* Whether the score is diagnostic or verified

Credential layers

* Topic badges
* Subject milestones
* Verified mastery certificates
* Exam-readiness certificates
* Verified study-hour records
* Portfolio evidence
* School-validated achievements

StudyYear should not claim equivalence to official grades unless properly validated.

## 18. Social features

Duolingo uses community, friend activity, competition and shared achievements to strengthen retention.

**StudyYear Social Learning Network**

Recommended features

* Add study friends
* Follow classmates with privacy controls
* Celebrate achievements
* Cooperative missions
* Study circles
* Accountability partners
* Class challenges
* Family learning goals
* Peer explanation
* Revision rooms
* Subject clubs
* Exam countdown groups

Collaborative learning modes

* Solve together
* Explain to a peer
* Team quiz
* Group revision sprint
* Shared flashcard deck
* Debate room
* Mock-exam room
* Peer feedback
* Teacher-moderated challenge

Safeguarding requirements

* No unrestricted adult-child messaging
* Age-banded communities
* Restricted profile visibility
* Automated moderation
* Report and block controls
* School-controlled spaces
* Parent permissions
* No public exact location
* No public school timetable
* No direct image sharing by default
* Audit logs

## 19. School platform extraction

Duolingo for Schools offers standards-aligned curriculum, personalised assignments and progress insights such as accuracy and time spent learning. ([schools.duolingo.com](https://schools.duolingo.com/))

**StudyYear must go significantly further**

Teacher Command Centre — teachers need:

* Live class mastery map
* Curriculum coverage
* Individual learner risk
* Misconception clusters
* Assignment completion
* Time on task
* Verified active study
* Predicted grades
* Confidence patterns
* Intervention recommendations
* Knowledge decay
* Exam-readiness distribution
* Student support history

Teacher actions

* Assign a topic
* Assign a path node
* Create a lesson
* Generate a quiz
* Generate differentiated versions
* Set a target grade
* Add due dates
* Restrict AI assistance
* Review student working
* Approve AI-generated plans
* Launch a class challenge
* Send parent updates
* Create an intervention group
* Export reports

Class intelligence — the AI should detect:

* 42% of the class misunderstand simultaneous equations.
* High-attaining students are losing marks through incomplete reasoning.
* Homework completion is high but mastery remains low.
* Three students may need prerequisite intervention.
* Students perform well untimed but weakly under exam conditions.

School leadership layer

* Department performance
* Cohort gaps
* Teacher workload
* Curriculum progression
* Intervention impact
* Pupil premium analysis
* SEND accommodations
* Attendance-learning relationship
* Subject risk
* Predicted attainment
* Parent engagement
* Licence utilisation
* AI cost governance

This is one of the largest gaps StudyYear can exploit.

## 20. Parent experience

Duolingo’s main consumer product is learner-centred. StudyYear can create a much deeper parent product.

**Parent Academic Command Centre**

Parents should receive:

* Current academic condition
* What improved
* What declined
* Study completed
* Study quality
* Upcoming deadlines
* Predicted grade changes
* Priority interventions
* Recommended parent action
* Wellbeing risk
* Screen-time quality
* Subject confidence
* Verified Study Hours™

Parent recommendations must be actionable. Instead of “Your child needs help with maths,” provide:
“Joden is secure in ratio but is losing marks when rearranging equations. Ask him to complete the 12-minute Equation Recovery Mission before Thursday.”

Parent controls

* Set study windows
* Approve subscriptions
* Control ACU use
* Set weekly budgets
* View AI usage
* Disable selected features
* Receive weekly briefings
* Approve social participation
* Link multiple children
* Share reports with tutors

## 21. Monetisation extraction

Duolingo operates a free core product supported by premium subscription tiers and paid AI capabilities. Duolingo has stated that growing subscribers and increasing premium value are major strategic priorities, while Max adoption has been an important monetisation driver. ([Duolingo, Inc.](https://investors.duolingo.com/))

**StudyYear commercial model**

StudyYear should preserve meaningful free learning while monetising:

* Advanced AI
* Parent intelligence
* Premium resources
* Unlimited diagnostics
* Deep assignment review
* Voice tutoring
* Video tutoring
* Mock exams
* Predictive insights
* School management
* Multi-child reporting
* Exportable evidence
* Advanced career planning

Recommended product ladder

Free Student

* Basic diagnostic
* 100 introductory ACUs
* Daily MicroLessons
* Basic Academic Momentum
* Limited quiz practice
* Basic progress view
* Limited AI explanation

Student Premium — £10/month

* Premium learning tools
* Full Practice Command Centre
* Advanced progress analytics
* Unlimited non-AI practice
* Knowledge Decay Engine
* Premium revision pathways
* No ACUs included

Student Premium+ — £20/month

* Premium access
* 1,650 ACUs
* AI Tutor
* Assignment review
* Voice support
* Advanced diagnostics
* Mock-exam feedback

Parent Pro — £10/month

* Parent dashboard
* Weekly report
* Deadline visibility
* Intervention recommendations
* No ACUs

Parent Pro+ — £20/month

* Parent dashboard
* 1,650 ACUs
* AI Parent Advisor
* Advanced predictions
* Multi-channel alerts

Parent Elite — £39/month

* 5,000 ACUs
* Multiple children
* Deep intervention planning
* University readiness
* Priority AI features
* Family academic command centre

The ACU wallet remains essential because AI tutoring costs vary. Avoid claiming “unlimited AI” unless StudyYear has strict fair-use and routing controls.

## 22. Duolingo’s experimentation machine

A major hidden advantage is not one specific feature. It is the ability to continuously test:

* Onboarding
* Lesson length
* Notifications
* Pricing
* Subscription placement
* Rewards
* Paywalls
* Difficulty
* Characters
* Social mechanics
* Streak interventions

Duolingo openly emphasises a product-led A/B-testing culture. ([Duolingo, Inc.](https://investors.duolingo.com/))

**StudyYear Experimentation OS**

Every major feature should support experiments.

Experiment objects

* Hypothesis
* Audience
* Variant A
* Variant B
* Exposure rules
* Primary metric
* Guardrail metric
* Duration
* Statistical confidence
* Decision
* Rollback state

Metrics to test

* Diagnostic completion
* First lesson completion
* Day-one return
* Day-seven retention
* Weekly mastery gain
* Academic Momentum survival
* Subscription conversion
* ACU consumption
* Parent engagement
* Assignment completion
* Predicted-grade improvement
* Learning quality
* AI cost per successful outcome

**Essential rule**

StudyYear must not optimise only for engagement.
Every experiment should include an educational guardrail such as:

* Mastery improvement
* Retention
* Error reduction
* Independence
* Assessment performance
* Wellbeing

## 23. Duolingo’s important weaknesses and StudyYear opportunities

**Gap 1: Activity can be confused with learning.** A learner can be highly active without reaching deep subject mastery.
StudyYear improvement — separate: Engagement · Completion · Accuracy · Mastery · Retention · Transfer · Exam performance · Independence. Never show one generic progress percentage.

**Gap 2: Limited high-stakes curriculum depth.** Language-learning paths do not directly solve the complex requirements of multisubject school qualifications.
StudyYear improvement — support: National Curriculum · GCSE · A-level · SATs · 11+ · IB · International curricula · University modules. Every activity should connect to a curriculum objective and assessment requirement.

**Gap 3: Weak parent intervention layer.** StudyYear improvement — provide parent intelligence, weekly AI briefings, risk alerts and precise intervention actions.

**Gap 4: Limited teacher authoring.** A consumer learning path does not give teachers complete control over custom school content, marking policies and local sequencing.
StudyYear improvement — build: Custom content authoring · School resource library · Teacher-generated pathways · Department templates · Local curriculum mapping · Question-bank imports · Assignment rubrics · Custom AI policies.

**Gap 5: Competition may reward volume.** StudyYear improvement — rank improvement, mastery and consistency, not raw time or clicks.

**Gap 6: Limited proof of deep understanding.** Correct answers may result from recognition, guessing or repetition.
StudyYear improvement — use: Explain-your-answer prompts · Confidence ratings · Method marks · Oral verification · Transfer questions · Delayed retrieval · Novel contexts · Worked-solution review · Independence scoring.

**Gap 7: Limited assignment workflow.** StudyYear improvement — create end-to-end assignment management:

1. Import or photograph assignment.
2. Identify requirements.
3. Break into tasks.
4. Build a plan.
5. Provide guided support.
6. Detect overreliance on AI.
7. Review draft.
8. Compare against rubric.
9. Preserve student voice.
10. Generate submission checklist.

**Gap 8: Limited exam-board intelligence.** StudyYear improvement — map content to: Exam board · Specification · Assessment objective · Mark distribution · Command words · Grade boundaries · Common examiner feedback · Past-paper pattern.

**Gap 9: Limited connection between learning and wellbeing.** StudyYear improvement — use: Burnout indicators · Workload balancing · Focus limits · Healthy rest prompts · Confidence recovery · Emotional check-ins · Parent alerts where appropriate · Safeguarded escalation. The system must not diagnose mental-health conditions.

**Gap 10: Generic daily goals.** StudyYear improvement — generate goals from: Academic risk · Exam proximity · Assignment deadlines · Knowledge decay · Target grade · Available time · Previous behaviour.

**Gap 11: Limited offline and low-connectivity support.** StudyYear improvement — build: Downloadable lesson packs · Offline quizzes · Local answer capture · Delayed synchronisation · Compressed audio · Text-first modes · Low-data mode · Printable recovery plans · SMS or WhatsApp reminders where appropriate.

**Gap 12: AI cost exposure.** Duolingo has acknowledged that AI features affect cost structures, although falling AI costs have helped its margins. ([Reuters](https://www.reuters.com/business/duolingo-surges-ai-led-growth-forecast-raise-boost-investor-confidence-2025-08-07/))
StudyYear improvement — implement an AI Cost Governance Engine: Model routing · Provider abstraction · Prompt caching · Output caching · Token limits · Session limits · Cost prediction · ACU authorisation · Fraud detection · Monthly budgets · Feature-level margin tracking · Emergency provider failover.

## 24. New StudyYear modules inspired by the extraction

* **Module A — Academic Path**: adaptive visual path for every subject and qualification.
* **Module B — Daily Mission**: one academically valuable action selected each day.
* **Module C — Academic Momentum**: healthy habit system based on meaningful learning.
* **Module D — Knowledge Points**: rewards tied to genuine difficulty, retention and independence.
* **Module E — Mastery Engine**: skill-level assessment and progression.
* **Module F — Knowledge Decay**: predicts when learned content is likely to be forgotten.
* **Module G — Explain My Mistake**: AI diagnosis and explanation of errors.
* **Module H — AI Tutor Call**: voice, video-avatar or whiteboard tutoring.
* **Module I — Academic Role Play**: scenario-based application and oral assessment.
* **Module J — Practice Command Centre**: prioritised revision, mistakes and exam questions.
* **Module K — Academic Leagues**: fair competition based on improvement and consistency.
* **Module L — Cooperative Missions**: friends, classes and families complete shared learning goals.
* **Module M — Exam Simulator**: timed, adaptive, curriculum-aligned exam practice.
* **Module N — Teacher Command Centre**: assignments, interventions, class mastery and curriculum coverage.
* **Module O — Parent Command Centre**: predictions, verified study and intervention guidance.
* **Module P — Academic Readiness Score**: transparent evidence-based academic scoring.
* **Module Q — StudyYear Companions**: original subject and coaching personalities.
* **Module R — Smart Intervention Engine**: personalised, context-aware re-engagement.
* **Module S — Experimentation OS**: controlled product experimentation with educational guardrails.
* **Module T — Learning Integrity Engine**: detects passive use, copying and AI dependency.

## 25. Developer-ready core objects

LearnerProfile

```typescript
interface LearnerProfile {
  id: string;
  yearGroup: string;
  curriculum: string;
  targetQualifications: string[];
  targetGrades: Record<string, string>;
  preferredLearningModes: string[];
  availableStudyMinutesPerWeek: number;
  accessibilityNeeds: string[];
  parentAccountIds: string[];
  schoolAccountId?: string;
}
```

CurriculumSkill

```typescript
interface CurriculumSkill {
  id: string;
  subjectId: string;
  curriculumCode: string;
  title: string;
  description: string;
  prerequisites: string[];
  difficultyLevel: number;
  assessmentObjectives: string[];
  estimatedMinutes: number;
  markWeighting?: number;
}
```

SkillMastery

```typescript
interface SkillMastery {
  learnerId: string;
  skillId: string;
  masteryScore: number;
  confidenceScore: number;
  independenceScore: number;
  retentionScore: number;
  status:
    | "not_assessed"
    | "critical_gap"
    | "emerging"
    | "developing"
    | "secure"
    | "strong"
    | "exam_ready"
    | "decay_risk";
  lastPractisedAt?: string;
  nextReviewAt?: string;
  misconceptionIds: string[];
}
```

LearningMission

```typescript
interface LearningMission {
  id: string;
  learnerId: string;
  missionType:
    | "daily"
    | "weekly"
    | "recovery"
    | "exam"
    | "assignment"
    | "teacher";
  objective: string;
  skillIds: string[];
  requiredActions: string[];
  estimatedMinutes: number;
  rewardKnowledgePoints: number;
  dueAt?: string;
  status: "available" | "active" | "completed" | "expired";
}
```

LearningAttempt

```typescript
interface LearningAttempt {
  id: string;
  learnerId: string;
  activityId: string;
  skillIds: string[];
  answer: unknown;
  correct: boolean;
  responseTimeMs: number;
  confidenceBefore?: number;
  confidenceAfter?: number;
  hintCount: number;
  aiAssistanceLevel: number;
  independenceScore: number;
  misconceptionType?: string;
  createdAt: string;
}
```

AcademicMomentum

```typescript
interface AcademicMomentum {
  learnerId: string;
  currentDays: number;
  bestDays: number;
  qualifyingDaysThisWeek: number;
  dailyGoalMinutes: number;
  momentumShields: number;
  pauseMode?: "holiday" | "illness" | "school_break" | "family";
  lastQualifiedAt?: string;
}
```

TutorSession

```typescript
interface TutorSession {
  id: string;
  learnerId: string;
  subjectId: string;
  mode: "text" | "voice" | "avatar" | "whiteboard";
  skillIds: string[];
  objective: string;
  durationSeconds: number;
  acuAuthorised: number;
  acuConsumed: number;
  transcriptLocation?: string;
  misconceptionsDetected: string[];
  postSessionRecommendations: string[];
}
```

## 26. Priority delivery roadmap

**Phase 1 — Engagement foundation** (build first)

1. Adaptive Academic Path
2. MicroLesson Engine
3. Academic Momentum
4. Daily Missions
5. Knowledge Points
6. Basic rewards
7. Explain My Mistake
8. Practice Command Centre
9. Smart notifications
10. Basic parent progress report

This creates the core habit loop.

**Phase 2 — Academic superiority** (build next)

1. Mastery Engine
2. Knowledge Decay
3. Exam Board Mapping
4. Predicted Grade Engine
5. Exam Simulator
6. Assignment Workflow
7. Learning Integrity Engine
8. Teacher Command Centre
9. Parent Intervention Engine
10. Verified Study Hours™

**Phase 3 — Premium AI** (build after cost controls are operational)

1. Voice Tutor
2. Video-avatar Tutor
3. Academic Role Play
4. Oral Exam Simulator
5. Presentation Coach
6. Advanced assignment marking
7. Parent AI Advisor
8. Teacher AI Copilot
9. Career and university advisor

**Phase 4 — Network effects**

1. Friends
2. Cooperative missions
3. Fair leagues
4. Class challenges
5. School competitions
6. Study circles
7. Peer explanation
8. Referral rewards
9. Shareable achievements
10. Verified academic portfolio

## 27. Product success metrics

**North Star Metric** — Weekly Verified Mastery Gains per Active Learner. This is stronger than time spent or lessons completed.

Supporting metrics

Acquisition

* Diagnostic start rate
* Diagnostic completion
* Account creation
* First mission completion
* Parent account linkage

Engagement

* Daily active learners
* Weekly active learners
* Academic Momentum retention
* Missions completed
* Practice sessions
* Return after a broken streak

Learning

* Skills moved to Secure
* Skills retained after 7, 30 and 90 days
* Misconception reduction
* Exam-question improvement
* Independence improvement
* Predicted-grade movement

Commercial

* Free-to-paid conversion
* ACU consumption
* AI cost per learner
* Gross margin by feature
* Parent-plan conversion
* School licence utilisation
* Subscription retention

Safety and quality

* AI correction rate
* Inappropriate output rate
* Overreliance flags
* Student distress signals
* False academic predictions
* Safeguarding escalations
* Teacher overrides

## Final strategic recommendation

StudyYear should position itself as:
**The academic operating system that makes serious learning as engaging as a game, as personalised as a private tutor, and as accountable as a school assessment system.**

Duolingo’s strongest transferable ideas are: Tiny lessons · One obvious next action · Visible paths · Habit protection · Immediate feedback · Emotional characters · Personalised practice · Social accountability · Premium AI experiences · Continuous experimentation.

StudyYear’s defensible improvements should be: Curriculum depth · Real mastery verification · Predicted grades · Parent intervention · Teacher control · Exam-board alignment · Assignment intelligence · Learning integrity · Verified study · Wellbeing protection · AI cost governance · Full academic journeys from primary school to university.

The winning formula is not “Duolingo for school subjects.” It is:
**Duolingo-grade engagement + adaptive private tutoring + curriculum intelligence + exam readiness + parent and school command centres.**
