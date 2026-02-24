# Consistency Tracker

## Current State
New project - no existing code.

## Requested Changes (Diff)

### Add
- **Backend**: CRUD system for user habits/goals with consistency tracking data
- **Backend**: Daily check-in records with timestamps
- **Backend**: Reminder configuration per habit (time, sound enabled)
- **Frontend**: Mobile-responsive habit list view
- **Frontend**: Add/edit/delete habits interface
- **Frontend**: Daily check-in button for each habit
- **Frontend**: Visual streak counter and consistency calendar/history
- **Frontend**: Audio reminder system with notification sounds
- **Frontend**: Settings for reminder times and sound preferences

### Modify
N/A (new project)

### Remove
N/A (new project)

## Implementation Plan

1. **Backend** (via `generate_motoko_code`):
   - Create habit/goal data model (name, description, reminder time, sound enabled)
   - Check-in record system (habit ID, timestamp, completed)
   - Calculate streaks and consistency percentages
   - CRUD endpoints for habits
   - Endpoint to log daily check-ins
   - Query endpoints for history and statistics

2. **Frontend** (via frontend subagent):
   - Mobile-first responsive design with touch-friendly UI
   - Habit list with add/edit/delete functionality
   - Daily check-in interface with one-tap completion
   - Visual streak display and consistency stats
   - Calendar/history view showing completion patterns
   - Audio notification system using Web Audio API
   - Reminder scheduling with browser notifications (optional)
   - Sound selection and volume controls

## UX Notes
- Simple, clean mobile interface optimized for daily use
- Large touch targets for easy phone interaction
- Satisfying audio feedback on check-ins
- Clear visual progress indicators (streaks, percentages)
- Quick access to mark habits complete
- Persistent reminders until dismissed
