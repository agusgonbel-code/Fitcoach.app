# FitCoach — TestFlight-style QA + simulated 100-user review
Fecha: 22/08/2026

## Scope
This is a repository-level TestFlight-style audit plus a structured simulation of 100 user journeys. It is not a claim that 100 real people used a signed TestFlight build. Physical haptics, VoiceOver, background/suspension and final screenshots still require the signed binary on real Apple hardware.

## TestFlight-style journeys reviewed
- First launch and unified intake.
- Nutrition targets and meal distribution.
- 30-day menu generation and recipe navigation.
- Training generation, exercise history, RIR and progression.
- Weekly adaptation and Daily Coach.
- Coach/client workspace.
- Progress, photos, backup/restore and offline behaviour.
- Privacy/support packaging and iOS bundle preparation.

## Findings
### P0
No new reproducible P0 defect was found in the current repository-level review.

### P1 / release risks
1. Final accessibility and physical-device validation cannot be proven from browser CI.
2. Allergy handling should not be marketed as clinically robust while matching remains partly text-driven.
3. Photo analysis must remain progress-oriented and not be presented as medical diagnosis.
4. Weekly automatic changes must continue to use trend guardrails rather than single-day changes.

## Simulated 100-user feedback
The aggregate simulation included novices, intermediate lifters, advanced users, personal trainers, users with small screens, accessibility users and interrupted/offline sessions.

Most important themes:
- Users value the single intake feeding both nutrition and training.
- The largest perceived complexity is the amount of information available after generation; the Daily Coach should remain the main next-action surface.
- Users want every recommendation to explain why it changed.
- Trainers need client context preserved when moving between client views.
- Backup/restore confidence is important before users invest weeks of history.

## Changes applied in this QA cycle
- Added `.github/workflows/release-stress.yml`.
- Unit/invariant tests and audit now repeat 10 times in the stress gate.
- Browser end-to-end journey now repeats 10 times in the stress gate.

## Release verdict
Repository candidate: GO WITH PHYSICAL-DEVICE GATE.
Do not submit to App Review until the signed build passes iPhone/iPad accessibility, suspension/background, vibration/haptics where applicable, photos, backup/restore and App Store screenshot checks.
