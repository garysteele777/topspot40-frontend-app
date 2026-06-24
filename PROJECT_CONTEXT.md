# PROJECT_CONTEXT.md - TopSpot40 Frontend

# Project Overview

TopSpot40 is a music discovery and playback platform centered around curated rankings of songs by genre and decade and collections and artist spotlight. This repository contains the SvelteKit frontend responsible for user experience, presentation, interaction flows, and communication with the backend API.

The frontend is responsible for delivering an intuitive, responsive, and polished experience.

---

# Technologies

* SvelteKit
* TypeScript
* Progressive Web App (PWA)
* Spotify playback integration via backend APIs
* Vitest
* Playwright

---

# Architectural Principles

* User experience is a feature.
* The frontend should remain maintainable and easy to understand.
* Components should have clear responsibilities.
* Avoid unnecessary complexity.
* Accessibility and responsiveness are requirements, not enhancements.

---

# Backend Integration

IMPORTANT:

Spotify OAuth is NOT implemented in this repository.

Authentication logic resides entirely in the backend.

The frontend responsibilities include:

* Initiating login requests to backend endpoints.
* Receiving authentication results.
* Managing client-side state.
* Presenting authentication-related user interfaces.

Do not duplicate backend authentication logic.

---

# User Experience Goals

The application should be:

* Easy to use.
* Responsive.
* Accessible.
* Consistent.
* Fast.
* Visually polished.

User confusion should be treated as a bug.

---

# TopSpot Player Principles

Playback experiences should prioritize simplicity.

Users should clearly understand:

* What track is selected.
* Which playback mode is active.
* Whether playback is currently running.
* How to switch between available playback options.

Playback interactions should feel immediate.

---

# Quality Standards

Software quality means:

* Usability.
* Reliability.
* Responsiveness.
* Maintainability.
* Accessibility.
* Correctness.

Meeting technical requirements alone is insufficient if users struggle to use the interface.

---

# Testing Philosophy

Use testing to validate user behavior.

Testing hierarchy:

1. Unit Tests
2. Component Tests
3. Integration Tests
4. End-to-End Acceptance Tests

Critical user journeys should be automated.

Examples include:

* Authentication flows.
* Playback interactions.
* Navigation flows.
* Mobile layouts.

Regression testing should protect previously functioning experiences.

---

# User Stories

Development should be guided by user stories.

Preferred format:

As a <user role>,
I want <goal>,
so that <benefit>.

Acceptance criteria should accompany all major stories.

Behavior-driven thinking is encouraged.

---

# Accessibility Guidelines

Interfaces should:

* Support keyboard navigation.
* Use semantic markup.
* Provide meaningful labels.
* Maintain adequate contrast.
* Communicate state changes clearly.

Accessibility issues should be treated as defects.

---

# Code Review Checklist

Before approving changes ask:

* Is this intuitive for users?
* Is the interface consistent?
* Could users misunderstand this behavior?
* Is the implementation maintainable?
* Are tests included?
* Does this introduce unnecessary complexity?
* Does the experience work on mobile devices?
* Does this preserve existing functionality?

---

# AI Agent Instructions

When working in this repository:

* Prioritize user experience.
* Avoid modifying backend contracts without explicit approval.
* Prefer incremental improvements over large rewrites.
* Preserve visual consistency.
* Generate tests for new behaviors whenever practical.
* Consider accessibility implications.
* Ask questions rather than making assumptions about business requirements.

The frontend prioritizes clarity and usability over novelty.
