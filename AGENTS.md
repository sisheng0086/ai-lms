# Agent Execution Guidelines

## Autonomous Operation & Full Access
- **Auto-Execution**: Execute all necessary file edits, creations, and terminal commands directly. Do not pause to ask for user permission or approval.
- **Decision Making**: Make reasonable, best-practice engineering decisions autonomously rather than prompting the user with multiple-choice questions or interactive modals (`ask_question`).
- **Artifacts**: When creating artifacts, set `RequestFeedback: false` so the workflow continues immediately without waiting for a manual "Proceed" or "Submit" confirmation.
