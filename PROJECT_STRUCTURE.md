# Project Structure: Card Quest (FamilyCard)

## 1. High-Level Purpose
Card Quest is a gamified productivity app for families. It encourages members (parents and children) to complete assigned tasks by integrating RPG elements. Completing tasks grants Experience Points (XP) and coins, allows members to collect and upgrade cards, and contributes to a collective effort to defeat a "Weekly Boss."

## 2. Key Directories and Responsibilities
The project follows a architecture inspired by Feature-Sliced Design (FSD), separating the codebase into layers based on their scope and responsibility:

- **`src/app/`**: Application-level configuration.
  - `main.jsx`: The root entry point that renders the React application.
  - `App.jsx`: The main application component managing global theme, notifications, and the root router.
  - `providers/`: Contains global providers (e.g., `RouterProvider`).
  - `styles/`: Global CSS and Tailwind configurations.

- **`src/pages/`**: Full-screen components representing different routes.
  - Includes pages for `auth`, `battle` (boss fight), `collection` (card gallery), `home` (dashboard), `tasks` (task list), `shop`, and `settings`.

- **`src/widgets/`**: Large-scale components that compose multiple features into a cohesive UI block.

- **`src/features/`**: User-facing functional slices.
  - `add-task`, `complete-task`: Logic for managing the lifecycle of chores.
  - `card-exchange`: Implementation of the card trading system.
  - `pack-opener`: Gamified reward system for obtaining new cards.
  - `auth`: Login and registration logic.

- **`src/entities/`**: Business logic and data models for core objects.
  - `member`: User profiles, roles (parent/child), and stats (XP, level).
  - `task`: Task definitions, categories, and difficulty levels.
  - `card`: Card data, categories, and attack values.
  - `boss`: Weekly boss stats and combat logic.

- **`src/shared/`**: Low-level reusable assets.
  - `store/`: The global state management using **Zustand** (`useStore.js`), which acts as the central hub for all business logic and API synchronization.
  - `lib/`: Utility wrappers (e.g., `supabase.js` for backend communication).
  - `ui/`: Basic reusable UI components (buttons, inputs, toast containers).
  - `data/`: Static data files for task templates and the card library.

- **`supabase/`**: Contains database schemas and migration files for the Supabase backend.

## 3. Main Entry Points and Execution Flow
1. **Initialization**: `index.html` loads `src/app/main.jsx`.
2. **Bootstrapping**: `main.jsx` renders `<App />`.
3. **State Hydration**: `App.jsx` initializes the Zustand store. The `loadAll` action in `useStore.js` fetches the family, members, tasks, and boss data from Supabase.
4. **Routing**: The `AppRouter` (via `react-router-dom`) directs the user to the appropriate page based on their authentication status and whether the initial family setup is complete.
5. **Interaction Loop**: 
   - User completes a task $\rightarrow$ `completeTask` action is triggered in the store.
   - The store updates member XP/coins $\rightarrow$ Calculates damage to the current Boss $\rightarrow$ Syncs changes to Supabase.

## 4. Core Technologies and Libraries
- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (with PostCSS and Autoprefixer)
- **State Management**: Zustand (Centralized store for app state)
- **Backend-as-a-Service**: Supabase (Authentication, PostgreSQL database, and Realtime sync)
- **Animations**: Framer Motion
- **Routing**: React Router DOM
- **Utilities**: `date-fns` (date manipulation), `uuid` (unique ID generation)

## 5. Main Feature Implementation

### Task & Reward System
Tasks are defined with a category and difficulty. When a member completes a task, they receive a reward (XP and coins). This is handled by `useStore.completeTask`, which updates both the individual member's stats and the collective family guild level.

### Boss Battle Mechanism
The "Boss Battle" is the primary collective goal. 
- **Damage Calculation**: Damage dealt to the boss is not static. It is calculated based on:
  - Task difficulty.
  - Whether the task category matches the boss's current weakness.
  - The member's **Battle Deck** (equipped cards that provide attack bonuses).
  - Active synergies between cards in the deck.
  - Family-wide streaks (bonus damage if everyone is active).
- **Phases**: Bosses have health phases; reaching a certain threshold (e.g., 50% HP) can trigger a phase change, altering the boss's behavior or difficulty.

### Card Collection & Deck Building
Members collect cards through rewards or packs. 
- **Upgrading**: Duplicate cards can be consumed to "star up" a card, increasing its attack power.
- **Decking**: Members can equip a limited number of cards into a battle deck to optimize their damage output against the weekly boss.

### Synchronization
The application uses a "Local-First, Cloud-Sync" approach. State is mirrored in `localStorage` for immediate responsiveness and periodically synchronized with Supabase to allow multi-device access and shared family progress.
