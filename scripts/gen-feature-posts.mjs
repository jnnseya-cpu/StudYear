import { readFileSync, writeFileSync } from 'node:fs';
const POSTS = '/home/user/StudYear/apps/web/public/blog/posts.json';
const existing = JSON.parse(readFileSync(POSTS, 'utf8'));
const keepIds = new Set(['seed1','seed2','seed3','seed4']); // preserve curated posts
const base = existing.filter(p => keepIds.has(p.id));

// date spread (deterministic) so the blog feels alive
const D = (i) => new Date(Date.UTC(2026, 6, 10 + i, 9, 0, 0)).toISOString();

// helper link shortcuts (dense internal linking = the SEO + funnel engine)
const L = {
  free: '[free predicted-grade & revision-plan tool](/free/)',
  freeS: '[free tool](/free/)',
  study: '[Study Hub](/study/)',
  tutor: '[AI tutor](/study/)',
  skill: '[SkillRush](/skillrush/)',
  career: '[Career Passport](/career/)',
  parent: '[parent dashboard](/parent/)',
  teacher: '[teacher tools](/teacher/)',
  tutors: '[tutor marketplace](/tutors/)',
  start: '[create a free account](/app/)',
  how: '[how StudYear works](/how-it-works/)',
};
const P = (slug, text) => `[${text}](/blog/${slug}/)`; // link to another feature article

// each feature: unique, specific copy (no filler) + dense internal links
const F = [
  { slug:'ai-tutor-that-teaches-not-cheats', title:'The AI tutor that teaches the method — and never just hands over the answer', cat:'Study tools', kw:'ai tutor for gcse',
    tags:['ai tutor','gcse','revision','StudYear'], rel:['exam-practice-predicted-grades','ai-flashcard-maker','interactive-ai-lessons'],
    body:
`Most "homework AI" gives a student the answer and teaches them nothing. StudYear's ${L.tutor} does the opposite: it works like a real tutor, asking guiding questions, showing a worked step, and checking understanding — so the student can do the next one alone. It even reads a photo of handwritten work and draws labelled diagrams for science and maths.

## Why "teaching the method" matters
A tutor that hands over answers creates dependence and inflates confidence without raising grades. One that teaches the *method* builds the thing exams actually test: the ability to solve a problem you haven't seen before.

## How students use it
- Stuck on a question? Ask the tutor to walk you through it, step by step.
- Revising a topic? Have it explain, then quiz you and mark your reasoning.
- Got a marked essay or a photo of your work? It reads it and coaches the fix.

Pair it with the ${P('spaced-repetition-highest-roi-revision','Smart Review')} engine and the ${L.skill} fluency games, and weak topics become automatic. New here? Try the ${L.free} first — no sign-up — then ${L.start} to unlock the tutor.

## FAQ
### Is the AI tutor free?
Yes — every account starts with free AI credits, no card. ${L.start} to begin.
### Does it just give the answers?
No. It's built to teach the method and check understanding, so students become independent.` },

  { slug:'exam-practice-predicted-grades', title:'Real exam practice and an honest predicted grade — online, from your actual marks', cat:'Study tools', kw:'gcse exam practice online',
    tags:['exam practice','predicted grade','gcse','StudYear'], rel:['ai-tutor-that-teaches-not-cheats','revision-timetable-maker','mark-my-essay-ai'],
    body:
`Guesswork helps no one. StudYear's exam simulator gives students timed, exam-style practice and an **evidence-based predicted grade** — one that only appears once there's real work behind it, with a confidence band and a trajectory showing whether they're climbing or slipping.

Want a number in 60 seconds with no account? Use the ${L.free}. For full practice and tracking, ${L.start}.

## What you get
- Timed questions that mirror the real papers, marked against the scheme.
- A predicted grade from your **actual** marks — never invented.
- A clear "reachable with this plan" target, not a vague hope.

## Turn the prediction into action
A prediction is only useful if it changes what you do next. The ${L.tutor} coaches your weak questions, ${P('revision-timetable-maker','the study planner')} schedules the fix, and the ${L.parent} shows parents the trajectory. ${L.how}.

## FAQ
### How is the predicted grade calculated?
From your recent marks mapped to the grade bands, adjusted for time and revision left — honest, not a guarantee.
### Can I try it without signing up?
Yes — the ${L.freeS} gives you a grade and a plan instantly.` },

  { slug:'ai-flashcard-maker', title:'AI flashcard maker: turn any topic into a revision deck in seconds', cat:'Study tools', kw:'ai flashcard maker',
    tags:['flashcards','revision','study tools','StudYear'], rel:['ai-quiz-generator','spaced-repetition-highest-roi-revision','ai-note-summariser'],
    body:
`Making flashcards by hand eats the time you should spend revising. StudYear's AI flashcard maker turns any subject or topic into an accurate, ready-to-test deck in seconds — then feeds them into spaced-repetition so you actually remember them.

## Why flashcards + testing beat re-reading
Retrieving a fact from memory builds far stronger recall than reading it again. Flashcards are the simplest way to force retrieval — and the ${P('spaced-repetition-highest-roi-revision','Smart Review engine')} brings each card back just before you'd forget it.

## Do more with your deck
- Generate ${P('ai-quiz-generator','a quiz')} from the same topic to test application, not just recall.
- Ask the ${L.tutor} to explain any card you keep getting wrong.
- Summarise a chapter first with the ${P('ai-note-summariser','AI note summariser')}, then make cards from it.

Start free — ${L.start} — or get a plan first with the ${L.free}.

## FAQ
### Are the flashcards accurate?
They're generated to the subject and level you choose and you can edit any card.
### Is it free?
Yes, on the free tier — ${L.start}.` },

  { slug:'ai-quiz-generator', title:'AI quiz generator: test yourself on any topic, instantly', cat:'Study tools', kw:'quiz generator from notes',
    tags:['quiz','revision','study tools','StudYear'], rel:['ai-flashcard-maker','interactive-ai-lessons','exam-practice-predicted-grades'],
    body:
`Reading your notes feels productive but proves nothing. StudYear's AI quiz generator turns any topic — or your own notes — into multiple-choice and short-answer questions that test whether you actually understood it, with instant marking and explanations.

## Test application, not just memory
Good quizzes ask you to *use* a fact, not just recognise it. Pair a quiz with ${P('ai-flashcard-maker','flashcards')} for recall and ${P('exam-practice-predicted-grades','exam practice')} for the real thing, and you cover the whole ladder from "know it" to "can do it in the exam".

## How students use it
- After a lesson: a quick 6-question check you actually learned it.
- Before a test: rapid rounds on your weakest topics.
- Wrong answer? The ${L.tutor} explains why, so the gap closes.

${L.start} free, or size up your revision with the ${L.free}.

## FAQ
### Can it quiz me on my own notes?
Yes — paste your notes or pick a topic.
### Does it explain wrong answers?
Yes, so every quiz is a learning moment.` },

  { slug:'interactive-ai-lessons', title:'Interactive AI lessons on any topic, matched to your exam board', cat:'Study tools', kw:'interactive gcse lessons',
    tags:['lessons','gcse','a-level','StudYear'], rel:['ai-tutor-that-teaches-not-cheats','ai-quiz-generator','revision-timetable-maker'],
    body:
`Sometimes you don't need a quiz — you need to actually *learn* the topic properly. StudYear builds a full **interactive lesson** on any topic, pitched to your level and exam board: clear teaching, worked examples, the common misconception to avoid, and a real end-of-lesson quiz that checks you understood it.

## A proper lesson, not a wall of text
Each lesson teaches step by step, then makes you apply it — the same "I do, we do, you do" a good teacher uses. Follow it with ${P('ai-flashcard-maker','flashcards')} to lock it in and ${P('exam-practice-predicted-grades','exam practice')} to prove it.

## Build a whole course
Turn a subject into a sequence of lessons, each opening into the ${L.tutor} for questions. Schedule them with ${P('revision-timetable-maker','the study planner')}. New here? The ${L.free} shows where to start; ${L.start} to open the lessons.

## FAQ
### Is it aligned to my exam board?
Yes — choose your level and board and the lesson matches it.
### Is there a free version?
Yes — ${L.start} on the free tier.` },

  { slug:'ai-note-summariser', title:'AI note summariser: turn long notes into clear revision points', cat:'Study tools', kw:'ai note summariser for students',
    tags:['summariser','notes','revision','StudYear'], rel:['ai-flashcard-maker','ai-quiz-generator','essay-plan-generator'],
    body:
`Dense notes are hard to revise from. StudYear's AI summariser turns any text — a chapter, a handout, your own messy notes — into a tight summary, key bullet points and the terms you must know, ready to revise.

## From summary to mastery
A summary is step one. Turn it straight into ${P('ai-flashcard-maker','flashcards')} to test recall, generate ${P('ai-quiz-generator','a quiz')} to test understanding, and ask the ${L.tutor} to explain anything that's still fuzzy.

Try the ${L.free} for a plan, or ${L.start} to summarise your first topic.

## FAQ
### Can it summarise my own notes?
Yes — paste them in and choose your level.
### Is it accurate?
It works to the level you set and you can edit the output.` },

  { slug:'essay-plan-generator', title:'GCSE & A-Level essay plan generator: structure, thesis and evidence', cat:'Study tools', kw:'gcse essay plan help',
    tags:['essays','english','history','StudYear'], rel:['ai-note-summariser','mark-my-essay-ai','ai-tutor-that-teaches-not-cheats'],
    body:
`A blank page is where essays go to die. StudYear builds a specific essay plan for your exact question — a clear thesis, an introduction, point-evidence-explain body paragraphs with concrete examples, a counter-argument and a conclusion — so you write with a map, not a blank stare.

## Plan, write, then get it marked
Plan here, write it, then use ${P('mark-my-essay-ai','the AI marker')} to grade it against the criteria and show you exactly where the marks are. Stuck on the argument? The ${L.tutor} coaches it.

${L.start} free, or check your predicted grade with the ${L.free}.

## FAQ
### Does it write the essay for me?
No — it gives you a strong plan so you write a better essay yourself.
### Which subjects?
English, History, RE, Sociology and any essay-based subject.` },

  { slug:'times-tables-and-fluency-games', title:'SkillRush: times tables, number bonds and fluency games that actually stick', cat:'Study tools', kw:'times tables practice game',
    tags:['skillrush','maths','fluency','primary','StudYear'], rel:['mental-maths-practice','career-passport-gcse-options','ai-tutor-that-teaches-not-cheats'],
    body:
`Weak basics slow everything down. StudYear's ${L.skill} is a fast, game-style arena — coins, streaks, leaderboards, class battles — that turns shaky skills automatic: times tables, number bonds, mental arithmetic, spelling, grammar and science facts, from Year 1 all the way up, with an AI coach that explains *why* an answer was wrong.

## Fluency is the foundation
You can't do multi-step maths if times tables aren't automatic. SkillRush drills them until they are — then the ${L.tutor} and ${P('interactive-ai-lessons','interactive lessons')} build on solid ground. See also ${P('mental-maths-practice','Maths Heroes')} for the four operations.

${L.start} free and start a streak today.

## FAQ
### What ages is it for?
Year 1 through GCSE — it adapts to the learner.
### Is it free?
Yes — ${L.start}.` },

  { slug:'mental-maths-practice', title:'Maths Heroes: master the four operations with adaptive practice', cat:'Study tools', kw:'mental maths practice',
    tags:['maths','fluency','primary','StudYear'], rel:['times-tables-and-fluency-games','career-passport-gcse-options','ai-tutor-that-teaches-not-cheats'],
    body:
`Maths Heroes builds real fluency in addition, subtraction, multiplication and division with adaptive engines, trophies and a readiness status that shows exactly which facts are shaky — so practice targets the gaps, not the things you already know.

## Built on the fluency arena
Maths Heroes sits inside ${L.skill}, alongside times-tables and number-bonds practice. Once the basics are automatic, the ${L.tutor} takes students into problem-solving with a solid foundation. Parents can watch progress on the ${L.parent}.

${L.start} free to begin.

## FAQ
### Does it adapt to my child?
Yes — it targets the specific facts they find hard.
### Is there a cost?
It's on the free tier — ${L.start}.` },

  { slug:'career-passport-gcse-options', title:'Career Passport: choose GCSE options and see your best post-16 routes', cat:'Careers', kw:'gcse options help',
    tags:['careers','gcse options','post-16','StudYear'], rel:['choosing-gcse-options-year-9-parents-guide','future-readiness-neet-early-support','times-tables-and-fluency-games'],
    body:
`Most families pick GCSE options with too little information. StudYear's ${L.career} maps a student's real strengths to their best-fit GCSE choices and post-16 routes — university, degree apprenticeship, T-Level, trade, employment or self-employment — and, for Year 10s, matches their grades to every route's entry requirements.

## Decide with evidence, not guesswork
It uses real assessment data, then hands the shortlist to the ${L.tutor} to talk through. Read the parents' guide to ${P('choosing-gcse-options-year-9-parents-guide','choosing GCSE options')}, and see how schools evidence careers with ${P('future-readiness-neet-early-support','early support')}.

${L.start} free to build a passport.

## FAQ
### When should we start thinking about options?
Year 9 is ideal, but the Career Passport helps at any stage.
### Is it free?
Yes — ${L.start}.` },

  { slug:'mark-my-essay-ai', title:'Mark my essay: AI feedback against the exam criteria, with targets', cat:'Study tools', kw:'mark my essay ai',
    tags:['marking','essays','feedback','StudYear'], rel:['essay-plan-generator','exam-practice-predicted-grades','ai-tutor-that-teaches-not-cheats'],
    body:
`Waiting a week for feedback kills momentum. StudYear marks a student's work like a real examiner — a predicted grade, a criterion breakdown, strengths quoting their actual words, specific targets with *how* to fix them, and one sentence rewritten to show the standard. It even reads a photo of handwritten work.

## The full loop
Plan with ${P('essay-plan-generator','the essay planner')}, write it, mark it here, then act on the targets with the ${L.tutor}. Track the grade trend with ${P('exam-practice-predicted-grades','predicted grades')}.

${L.start} free, or get a predicted grade instantly with the ${L.free}.

## FAQ
### Does it mark handwriting?
Yes — upload a photo and it reads and marks it.
### Which subjects?
Any written work — essays, extended answers, coursework drafts.` },

  { slug:'revision-timetable-maker', title:'Free revision timetable maker: a plan that adapts to you', cat:'Study tools', kw:'gcse revision timetable maker',
    tags:['revision plan','timetable','gcse','StudYear'], rel:['exam-practice-predicted-grades','spaced-repetition-highest-roi-revision','interactive-ai-lessons'],
    body:
`"Where do I even start?" is why revision stalls. StudYear builds a personal revision plan in minutes, then each day picks the single best next action — and it adapts to a quick mood/energy check-in, going lighter on the days you're running low.

## Start free, right now
Get a week-by-week plan with no sign-up using the ${L.free}. Inside the app, the planner spaces your weak topics with ${P('spaced-repetition-highest-roi-revision','Smart Review')}, opens straight into ${P('interactive-ai-lessons','interactive lessons')}, and switches to timed past papers near the exam.

${L.start} to save and track your plan.

## FAQ
### Is the timetable really free?
Yes — the ${L.freeS} builds one with no account.
### Does it adapt if I fall behind?
Yes — it re-prioritises to protect your weakest topics.` },

  { slug:'track-my-childs-grades', title:'Track your child’s grades: one honest dashboard for parents', cat:'Parents', kw:'track my child grades app',
    tags:['parents','dashboard','grades','StudYear'], rel:['how-to-help-my-child-revise','free-family-support-uk','career-passport-gcse-options'],
    body:
`Report cards are autopsies — by the time a bad grade arrives, the damage is weeks old. StudYear's ${L.parent} gives parents a heartbeat instead: an Academic Stability score, subject mastery heatmaps, an evidence-based grade forecast, and early risk alerts that fire while there's still time to act.

## Link a child in seconds
Connect with a code or QR, then see how your child is *actually* doing across every subject — with the child in control of what's shared, so it builds trust, not surveillance. Turn the picture into action with ${P('how-to-help-my-child-revise','weekly Action Cards')}.

${L.start} free to link your child.

## FAQ
### Can my child control what I see?
Yes — sharing is consent-based and can be paused.
### Is it free for parents?
Yes — ${L.start}.` },

  { slug:'how-to-help-my-child-revise', title:'How to help your child revise: weekly Action Cards for parents', cat:'Parents', kw:'how to help my child revise',
    tags:['parents','revision','support','StudYear'], rel:['track-my-childs-grades','free-family-support-uk','revision-timetable-maker'],
    body:
`Most parents want to help but don't know what would actually move the needle. StudYear's Parent Action Cards turn dense charts into a short weekly list of the most useful things you can do — turning worry into a plan.

## Small, specific, high-impact
Instead of "help more", you get "this week, quiz them on quadratics for 15 minutes" — tied to the child's real ${P('track-my-childs-grades','live data')}. For the whole family, ${P('free-family-support-uk','AI Family Support')} points you to trusted UK services beyond grades.

${L.start} free to see your first Action Card.

## FAQ
### Do I need to understand the subjects?
No — the cards are simple, specific actions any parent can do.
### Is it free?
Yes — ${L.start}.` },

  { slug:'free-family-support-uk', title:'Free AI Family Support: trusted UK help beyond grades', cat:'Parents', kw:'free family support uk',
    tags:['family support','parents','wellbeing','StudYear'], rel:['how-to-help-my-child-revise','track-my-childs-grades','career-passport-gcse-options'],
    body:
`A child's results are shaped by everything around them. StudYear includes a free, confidential AI Family Support coach that points parents to trusted UK services — wellbeing, money, employment, apprenticeships and more — so support goes beyond just the grades.

## Part of the whole picture
It sits alongside the ${P('track-my-childs-grades','parent dashboard')} and ${P('how-to-help-my-child-revise','Action Cards')}, so the academic and the practical join up. It's free and private.

${L.start} to use it.

## FAQ
### Does it cost anything?
No — it's free and confidential.
### What can it help with?
Wellbeing, money, employment, apprenticeships and other UK services.` },

  { slug:'ai-lesson-plan-generator-teachers', title:'AI lesson plan generator for teachers: plans, differentiation and marking', cat:'Teachers', kw:'ai lesson plan generator',
    tags:['teachers','lesson plans','marking','StudYear'], rel:['exam-paper-maker','evidence-gatsby-benchmarks-automatically','future-readiness-neet-early-support'],
    body:
`Planning shouldn't eat your evenings. StudYear's ${L.teacher} generate lesson plans, differentiated tasks, quizzes, homework, marking frames and parent emails in seconds — automatically pitched to the exact year groups and subjects you're assigned — plus a morning Teaching Brief with ready/at-risk groupings computed from live data.

## Time back, every day
Auto-mark homework, spot at-risk students, and build a ${P('exam-paper-maker','branded exam paper')} in a click. It reads your class's real data, so the plan targets the actual misconception.

${L.start} to set up your class.

## FAQ
### Is it matched to what I teach?
Yes — to your assigned subjects and year groups.
### Does it mark work?
Yes — homework and written work, with feedback.` },

  { slug:'exam-paper-maker', title:'Exam paper maker: branded papers with mark schemes, in Word or PDF', cat:'Teachers', kw:'exam paper maker with answers',
    tags:['exam paper','teachers','tutors','StudYear'], rel:['ai-lesson-plan-generator-teachers','mark-my-essay-ai','exam-practice-predicted-grades'],
    body:
`Writing a practice paper by hand takes an evening. StudYear's Exam Paper Builder produces a branded paper of up to 50 questions **with a full mark scheme**, matched to the right stage and command words, exportable to Word or PDF — for teachers, tutors and students.

## From weak topic to targeted paper
One click turns a student's weak topic into a targeted paper; pair it with ${P('mark-my-essay-ai','AI marking')} and ${P('exam-practice-predicted-grades','predicted grades')} to close the loop. Tutors get it ${L.tutors} branded to their own practice.

${L.start} to build your first paper.

## FAQ
### Does it include answers?
Yes — a full mark scheme.
### Can I export it?
Yes — Word or PDF, school- or tutor-branded.` },

  { slug:'find-a-tutor-online-uk', title:'Find a tutor online in the UK — or get the same help free', cat:'Tutors', kw:'find a tutor online uk',
    tags:['tutors','marketplace','uk','StudYear'], rel:['ai-tutor-that-teaches-not-cheats','exam-practice-predicted-grades','track-my-childs-grades'],
    body:
`A private tutor is £30–£70 an hour — out of reach for many families. StudYear gives you both options: a ${L.tutors} of verified, DBS-badged tutors you can search by subject, price and specialism — and, if you'd rather start free, a 24/7 ${L.tutor} that teaches the method for nothing.

## Choose what fits
Book a human tutor when you want one; use the AI tutor and ${P('exam-practice-predicted-grades','exam practice')} in between sessions. Parents keep the whole picture on the ${P('track-my-childs-grades','dashboard')}.

Not sure where you stand? Get a ${L.free} first, then ${L.start}.

## FAQ
### Are tutors verified?
Yes — verified, DBS-badged profiles.
### Is there a free alternative?
Yes — the AI tutor is free to start. ${L.start}.` },

  { slug:'future-readiness-neet-early-support', title:'Future-Readiness: spotting who needs support early — without labelling a child', cat:'Schools', kw:'neet early identification',
    tags:['NEET','schools','early identification','careers','StudYear'], rel:['neet-risk-early-identification-primary-schools','career-passport-gcse-options','ai-lesson-plan-generator-teachers'],
    body:
`Schools are being asked to identify, from primary, the children who'll need extra support to stay in education, employment or training at 16. StudYear does it as a **strengths-and-needs** view that widens support — never a label — computed from data schools already generate, with a one-click evidence pack.

Read the deeper piece on ${P('neet-risk-early-identification-primary-schools','spotting NEET risk without labelling a child')}. It pairs with the student ${L.career} and the ${P('ai-lesson-plan-generator-teachers','teacher tools')}, so pupil and school data line up.

${L.start} or see ${L.how}.

## FAQ
### Does it label children?
No — it's strengths-and-needs; context only unlocks help and no child sees a prediction.
### Where does the data come from?
From attendance, fluency, engagement and behaviour the school already records.` },

  { slug:'free-study-app-no-subscription', title:'A genuinely free study app — no subscription, works offline', cat:'Study tools', kw:'free study app no subscription',
    tags:['free','offline','study app','StudYear'], rel:['ai-tutor-that-teaches-not-cheats','revision-timetable-maker','track-my-childs-grades'],
    body:
`Most "free" apps aren't. StudYear has a genuinely free tier — an ${L.tutor}, revision tools, exam practice and a ${P('track-my-childs-grades','parent dashboard')} — with free AI credits every quarter, no card, and it installs like an app and works offline with downloadable study packs.

## Free to start, honest about cost
Heavier users can top up in clear credits or subscribe, always paid by a verified adult — no bill shocks. Try the ${L.free} with no sign-up, then ${L.start}.

## FAQ
### Is it really free?
Yes — free credits every quarter, no card required.
### Does it work offline?
Yes — install it and download study packs for offline use.` },
];

const feats = F.map((f, i) => ({
  id: 'feat-' + f.slug,
  title: f.title,
  slug: f.slug,
  category: f.cat,
  excerpt: f.title.split(':').slice(-1)[0].trim().slice(0, 150),
  metaDesc: (f.title + ' — free to start with StudYear. ' + (f.body.split('\n')[0])).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').slice(0, 300),
  body: f.body,
  tags: f.tags,
  keyword: f.kw,
  readTime: Math.max(2, Math.round(f.body.split(/\s+/).length / 200)),
  seoScore: 95,
  published: true,
  date: D(i),
  reviewed: D(i),
}));

const out = base.concat(feats);
writeFileSync(POSTS, JSON.stringify(out, null, 2) + '\n');
console.log('posts.json now has', out.length, 'posts (', base.length, 'curated +', feats.length, 'feature articles )');
