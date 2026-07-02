# StudYear — Founding Project Description (studyear.com)

> **The genesis document.** The original project description for StudYear — website and
> contents (courses, practice quizzes and others). Explicitly **inspired by the successful
> model of Get Revising** — which is why the platform taxonomy, Create suite, and planner
> mechanics mirror the incumbent's information architecture (see
> [`../competitors/get-revising-audit.md`](../competitors/get-revising-audit.md) and the
> vocabularies in [`../architecture/12`](../architecture/12-reference-data.md)). Everything
> later in the corpus — the AI-OS, agent registry, ACU economy — is the evolution of this
> foundation. Per the [mandate](../REQUIREMENTS-MANDATE.md), every objective and feature
> here remains binding.

## Overview

StudYear is an innovative online platform designed to **empower students in their
educational journey.** It actively engages them in their learning process and provides a
**collaborative space for sharing educational resources.** Inspired by the successful model
of Get Revising, StudYear fosters **creativity, collaboration, and self-directed study.**
The platform offers a range of interactive tools, enabling users to effectively plan their
revisions and create personalized study materials while providing a **community resource
bank.**

## Objectives

| # | Objective | Detail |
|---|---|---|
| 1 | **Active Learning** | students take ownership of their learning through interactive tools for personalized study planning and note-taking |
| 2 | **Creativity and Collaboration** | craft unique revision materials; collaborate with peers through resource sharing |
| 3 | **Comprehensive Resource Bank** | a vast library of revision notes, study guides, and educational resources shared among students — enhancing collective knowledge and support |
| 4 | **Accessibility** | StudYear remains **completely free for schools and individual students**, with an **optional premium membership** offering additional features |

## Features

### 1. Core search and resource features
- **Resource Search Functionality** — searchable database: keywords, subjects, study levels.
- **Diverse Resource Types** — flashcards, revision notes, quizzes, mind maps,
  organizational tools.

### 2. Study planning and organisation
- **Study Planner Tool** — intuitive interface; personalized study plans **in under 5
  minutes.**
- **Past Papers Locator** — access past examination papers across levels and subjects.

### 3. Creative and interactive tools
- **Custom Resource Creation** — users develop their own materials (mind maps, flashcards).
- **AI Tutor Bot** — AI-powered tutor bot assisting with homework and exam queries.

### 4. Support and guidance
- **Homework and Exam Assistance** — help with assignments and exam preparation.
- **Progress Tracking System** — monitor study progress over time.

### 5. Extensive subject coverage
- Resources across **GCSE, A Level, IB, and University-level** courses.

### 6. User accounts and profiles
- Profiles with dashboards for **superusers (admin), teachers, and students**, linked to
  study levels and subjects.

### 7. Premium membership options
- Enhanced features for premium subscribers: **advanced analytics and personalized study
  recommendations.**

### 8. Blog and AI-powered features
- **AI-powered blog** with customizable content based on **user behavior tracking and
  engagement metrics.**

## Development prompts (build directives)

| # | Directive |
|---|---|
| 1 | **Project init:** set up StudYear — comprehensive course content across subjects, quizzes, assignments, practice papers |
| 2 | **Resource search:** searchable database by keywords, subjects (e.g., Biology, History), study levels (e.g., A2/A-level, GCSE, University) |
| 3 | **Diverse resource types:** flashcards, revision cards, revision notes, quizzes, mind maps, organizational thinking tools |
| 4 | **Study Planner:** personalized plans for current subjects **in under 5 minutes** |
| 5 | **Past Papers Locator:** across levels and subjects |
| 6 | **Custom resource creation:** mind maps for essay planning; flashcards from personal notes |
| 7 | **Homework & exam assistance:** dedicated help section |
| 8 | **AI Tutor Bot:** homework and exam queries |
| 9 | **Progress tracking:** monitor progress over time |
| 10 | **Subject coverage:** GCSE, A Level, IB, university |
| 11 | **User management:** dashboards for superuser (admin), teachers, students; linked levels/subjects |
| 12 | **Freemium model:** **80% of students free / 20% premium; 50% of teacher access free** with a premium tier for advanced functionality |
| 13 | **Superuser dashboard:** manage subscriptions, monitor usage, control access — **only vetted teachers can access the system** |
| 14 | **Email notifications:** automated, interaction-driven updates |
| 15 | **Service recommendations:** personalized suggestions from behavior-tracking data |
| 16 | **Google Analytics:** user interactions and engagement metrics |
| 17 | **Crashlytics:** real-time crash reporting for app stability |
| 18 | **ML implementation:** e.g., **image categorization** to enhance user experience |
| 19 | **AI-powered blog generation:** admin publishing tool following **SEO best practices** |

> Goal: a comprehensive educational resource **mirroring the functionality of
> getrevising.co.uk while maintaining a unique identity and structure.**

## Evolution notes (union with the later corpus)

| Founding item | Where it evolved |
|---|---|
| AI Tutor Bot | → Tutor Agent **SY-A02** (Socratic, syllabus-grounded) |
| Study Planner (<5 min) | → Planner Agent **SY-A01** (continuous replanning) — the 5-minute onboarding promise survives |
| Progress tracking | → Progress Intelligence + KTE mastery vectors |
| Premium membership | → ACU economy + five-engine pricing (venture brief §8/§11) |
| "Completely free for schools" + 80/20 & 50/50 freemium ratios | → evolved into per-seat school licences and tier allowances; **the founding free-access commitments remain recorded as the accessibility objective and the free-tier design constraint** (Student Free tier; free teacher tooling in GTM §12.1) |
| Vetted-teachers-only access | → tutor/teacher verification + safeguarding vetting (venture brief §10.2) |
| Behavior-tracking recommendations | → LPV / Personalisation Engine (§5.6) — questionnaire-free behavioural inference |
| Google Analytics / Crashlytics / image-categorization ML | → observability stack + multimodal ingestion (photo-of-work pipelines) |
| AI-powered SEO blog | **retained as a distinct build item** — admin content-marketing tool (not superseded by anything later) |
