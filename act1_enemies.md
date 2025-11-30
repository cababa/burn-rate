# Act 1 Enemy Mapping: The MVP Validation Phase

This document maps every Act 1 enemy from *Slay the Spire* to a specific "Early-Stage Startup" challenge for the CTO.

## I. Common Enemies (The Daily Grind)
These represent the routine technical and operational issues a CTO faces daily.

| StS Enemy | Startup Foe | Concept Pitch | Mechanics |
| :--- | :--- | :--- | :--- |
| **Cultist** | **The Fanboy** | A junior dev who is obsessed with a specific tech stack (e.g., "Rust is the future!") regardless of the problem. | **Ritual (Hype):** Gains +3 Strength every turn. If you don't shut them down fast, their bad decisions become costly. |
| **Jaw Worm** | **Spaghetti Code** | A messy piece of code that is hard to kill and bites back when you touch it. | **Chomp/Bellow:** Alternates between heavy hits (bugs) and gaining Block (hard to refactor). |
| **Louse (Red)** | **Critical Bug** | A high-priority bug that grows in severity if ignored. | **Curl Up:** Gains Block when hit (fixing it reveals more issues). **Grow:** Gains Strength (severity increases). |
| **Louse (Green)** | **Minor Bug** | A nagging issue that slows you down (Weak). | **Spit Web:** Applies Weak (slows development). **Curl Up:** Hard to fix quickly. |
| **Acid Slime (S)** | **Quick Hack** | A small, sloppy fix. Easy to kill but annoying. | **Tackle:** Low damage. Often appears in groups. |
| **Acid Slime (M)** | **Tech Debt** | A moderate chunk of bad code. | **Corrosive Spit:** Adds "Slimed" (Status) to discard pile. |
| **Acid Slime (L)** | **Legacy Module** | A large, outdated system. Splits into smaller "Tech Debt" chunks when "refactored" (killed). | **Split:** When HP < 50%, splits into 2 Medium Slimes (Tech Debt). |
| **Spike Slime (S)** | **Hotfix** | A tiny patch that might break something else. | **Tackle:** Low damage. |
| **Spike Slime (M)** | **Bad Merge** | A merge conflict that hurts. | **Frailty:** Applies Frail (Mitigation is less effective). |
| **Spike Slime (L)** | **Merge Conflict** | A massive integration issue. Splits into smaller conflicts. | **Split:** When HP < 50%, splits into 2 Medium Slimes (Bad Merges). |
| **Blue Slaver** | **Micromanager** | A stakeholder who stabs you with tasks and weakens your autonomy. | **Stab:** Damage. **Rake:** Weakens you. |
| **Red Slaver** | **Feature Pusher** | A stakeholder who demands features, making you Vulnerable to bugs. | **Scrape:** Applies Vulnerable. |
| **Looter** | **Headhunter** | A recruiter trying to steal your capital (budget/talent). | **Mug:** Steals Gold (Capital). Escapes if not killed quickly. |
| **Fungi Beast** | **Memory Leak** | A problem that grows over time and explodes if you kill the wrong part first. | **Spore Cloud:** On death, applies Vulnerable. **Grow:** Gains Strength. |

## II. Elites (The Gatekeepers)
These test specific aspects of your deck (team/process).

| StS Enemy | Startup Foe | Concept Pitch | Mechanics |
| :--- | :--- | :--- | :--- |
| **Gremlin Nob** | **Scope Creep** | The project requirements keep growing. Planning (Skills) only makes it worse; you must Execute (Attack). | **Enrage:** Gains +2 Strength whenever you play a Skill. **Heavy Blow:** Big damage check. |
| **Lagavulin** | **The Over-Engineer** | A dev building a "perfect" system. Asleep at first (siphoning agility), then wakes up with massive complexity costs. | **Asleep:** Stuns for 3 turns, siphoning stats (-1 Str/Dex). **Wake Up:** Massive damage every turn. |
| **3 Sentries** | **The Legacy Systems** | Three intertwined bad systems: Monolith, Hack, and Patch. They clutter your workflow with bugs. | **Artifact:** Immune to first debuff. **Dazed:** Shuffles "Bug" (Status) into draw pile. **Beam:** Damage. |

## III. Bosses (The Validation Events)
The final test of the MVP phase.

| StS Enemy | Startup Foe | Concept Pitch | Mechanics |
| :--- | :--- | :--- | :--- |
| **The Guardian** | **The Pivot** | The company shifts strategy. You must survive the chaos (Defensive Mode) and launch the new direction (Offensive Mode). | **Mode Shift:** Changes after X damage. **Defensive:** High Block + Thorns (Sharp Hide). **Offensive:** Multi-hit damage (Whirlwind). |
| **Hexaghost** | **The Burn Rate** | A spectral entity representing the company's dwindling cash. Its damage scales with your current HP (Runway). | **Divider:** Turn 1 damage scales with your HP. **Burn:** Adds "Burn" status cards (damage over time). **Inferno:** massive multi-hit attack. |
| **Slime Boss** | **The Monolith** | A massive, unmaintainable codebase. You must break it down into microservices (Split), but doing so creates many smaller problems. | **Split:** At 50% HP, splits into 2 smaller Monoliths (Microservices). **Goop:** Adds "Slimed" (Status) to deck. |

## Implementation Priority
1.  **Refactor Engine:** Support `enemies: EnemyData[]` (Multiple Enemies).
2.  **Implement Elites:** Scope Creep (Nob), Over-Engineer (Lagavulin), Legacy Systems (Sentries).
3.  **Implement Boss:** The Pivot (Guardian).
4.  **Implement Commons:** Fill in the rest as we scale.
