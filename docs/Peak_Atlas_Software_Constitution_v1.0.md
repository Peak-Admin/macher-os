# Peak Atlas Software Constitution
## Central Business Reality, Shared Objects, Pain-Weighted UX & AI-Native Architecture

**Status:** Canonical Architecture & Product Standard  
**Version:** 1.0  
**Applies to:** Peak One, all Peak apps, portals, internal systems, customer-facing software and future products  
**Primary principle:** **One Business Reality — Many Apps, Views and Workflows**

---

# 1. Core Thesis

Peak Atlas software must not be built as a collection of isolated applications.

It must be built as **one connected operating system for a company**.

A company has one reality:

- one person,
- one organization,
- one product,
- one customer,
- one goal,
- one project,
- one task,
- one document,
- one decision,
- one metric,
- one approval,
- one event,
- one timeline.

Different Peak products may show, enrich or act on the same object differently, but they must **not create competing copies of the same business reality**.

> **A Task is a Task everywhere.**

A task created in Peak Growth is the same task that appears in Work.  
A task related to a Product is still the same Task object.  
A task assigned by an AI Agent is still the same Task object.  
A task created from a meeting is still the same Task object.

The same principle applies to all shared business objects.

---

# 2. The Fundamental Architecture Rule

## One Object. One ID. One Source of Truth.

Every canonical business object receives:

- one global object identity,
- one canonical data model,
- one permission model,
- one audit history,
- one timeline,
- one relationship model,
- one event stream,
- one AI-readable semantic meaning.

Applications do not own the underlying business reality.

Applications are **interfaces, workflows and lenses** on top of that reality.

---

# 3. Apps Are Lenses, Not Silos

Peak Finance, Peak Product, Peak Growth, Peak Customer, Peak People and all other products must not behave like disconnected SaaS tools.

They are different operational lenses on the same company.

```text
                         ┌─────────────────────┐
                         │   Business Reality  │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
         Peak Product          Peak Growth            Peak Work
              │                     │                     │
              └─────────────── Same Task ─────────────────┘
```

A Product Launch can simultaneously be:

- a Product in Peak Product,
- an Initiative in Peak Command,
- a Project in Work,
- connected to Tasks,
- connected to Campaigns in Peak Growth,
- connected to Budget in Peak Finance,
- connected to Suppliers in Peak Supply,
- connected to Decisions,
- connected to Metrics,
- visible to AI as one connected context.

No synchronization between duplicate copies should be required because there should be **no duplicate copies in the first place**.

---

# 4. Canonical Shared Objects

The following objects should exist globally wherever reasonably possible.

## 4.1 Identity & Organization

- Organization
- Workspace
- User
- Person
- Team
- Role
- Membership
- Guest
- Agent
- Permission
- Policy

## 4.2 Strategy & Execution

- Goal
- Objective
- Key Result
- Initiative
- Milestone
- Project
- Task
- Subtask
- Routine
- Blocker
- Dependency
- Decision
- Approval

## 4.3 Knowledge & Collaboration

- Document
- Note
- Comment
- Mention
- Attachment
- Link
- Conversation
- Meeting
- Message
- Knowledge Item

## 4.4 Commercial & Operational Objects

- Company
- Customer
- Contact
- Product
- Variant
- Supplier
- Partner
- Opportunity
- Order
- Campaign
- Asset
- Contract
- Invoice

Domain-specific objects may exist, but shared concepts must not be recreated independently inside each application.

---

# 5. The Global Task Principle

## A Task must never belong to only one app.

The global Task object should contain a stable core contract such as:

```text
Task
├── id
├── organization_id
├── workspace_id
├── title
├── description
├── status
├── priority
├── owner
├── assignees[]
├── created_by
├── start_at
├── due_at
├── completed_at
├── parent_task_id
├── project_id
├── goal_id
├── milestone_id
├── source
├── source_object
├── relationships[]
├── tags[]
├── permissions
├── custom_fields
├── created_at
└── updated_at
```

Domain applications may add contextual metadata.

Example:

```text
Task: "Approve Q4 Google Ads budget"

Global Task Core
- owner
- due date
- status
- priority

Peak Growth Context
- campaign_id
- ad_account_id

Peak Finance Context
- budget_id
- requested_amount

Peak Governance Context
- approval_policy_id
```

This remains **one Task**.

---

# 6. Shared Object Contract

Every canonical object should support, where relevant:

1. Global ID
2. Organization / tenant
3. Ownership
4. Status
5. Relationships
6. Tags
7. Permissions
8. Custom fields
9. Comments
10. Attachments
11. Activity timeline
12. Audit history
13. Events
14. AI context
15. Search indexing
16. Automations
17. External integration references

This creates predictable behavior across the entire platform.

---

# 7. Relationship Graph

Objects should be able to connect to other objects.

```text
Goal
 └── Initiative
      └── Project
           ├── Task
           ├── Document
           ├── Decision
           └── Metric
```

Another example:

```text
Product
├── Supplier
├── Inventory
├── Purchase Order
├── Campaign
├── Customer Feedback
├── Task
├── Decision
└── Metric
```

Peak should implement a generic relationship layer.

```text
Relationship
├── source_object_type
├── source_object_id
├── relation_type
├── target_object_type
├── target_object_id
├── metadata
└── timestamps
```

This forms the foundation of the **Peak Business Graph**.

---

# 8. Everything Has a Timeline

Every important business object should expose a chronological history.

Example:

```text
Product: Everglobe Travel Bag

09:04  Price changed
09:18  Campaign launched
10:21  Inventory warning triggered
10:35  AI suggested reorder
11:02  Purchase decision approved
11:08  Task created
13:45  Supplier contacted
```

The timeline combines:

- user actions,
- AI actions,
- automation events,
- external integration events,
- status changes,
- comments,
- decisions,
- approvals.

This creates an auditable company memory.

---

# 9. Event-Driven Architecture

Peak should not only store current state.

It should emit meaningful business events.

Examples:

```text
task.created
task.completed
goal.at_risk
inventory.low
product.margin_changed
order.created
campaign.performance_dropped
customer.churn_risk_detected
approval.requested
approval.granted
decision.created
invoice.overdue
```

Events can trigger:

- notifications,
- automations,
- AI analysis,
- workflows,
- approvals,
- downstream integrations,
- analytics.

---

# 10. Pain-Weighted Product Design

## 10.1 Core Principle

The interface must not give every function, problem or workflow equal visual importance.

Peak should identify the **most frequent and most painful problems** of the target user and reflect that priority directly in the product.

> **The interface is a visual representation of business pain and business importance.**

A function that solves an intense, frequent pain should be:

- easier to find,
- visually stronger,
- faster to execute,
- closer to the primary workflow,
- more proactively surfaced,
- more heavily automated.

A low-frequency, low-impact function should be:

- visually quieter,
- deeper in the interface,
- available on demand,
- excluded from the primary workflow unless contextually relevant.

---

# 11. Pain Score

Every significant user problem should receive a quantitative Pain Score.

The simplest canonical model is:

```text
Pain Score = Frequency × Intensity
```

Normalize both dimensions to `1–10`.

Therefore:

```text
Pain Score = 1–100
```

Example:

| Pain Point | Frequency | Intensity | Pain Score |
|---|---:|---:|---:|
| Not knowing what to work on today | 10 | 10 | 100 |
| Cash-flow risk is noticed too late | 7 | 10 | 70 |
| Reordering stock manually | 8 | 8 | 64 |
| Changing a profile image | 2 | 2 | 4 |

The score is not decorative research metadata.

It directly influences **product architecture and UX priority**.

---

# 12. Extended Pain Priority Model

Where more precision is useful, Peak may extend the model:

```text
Priority Score =
Frequency
× Intensity
× Business Impact
× Urgency
```

Each factor can be normalized before calculation.

Possible factors:

- Frequency
- Intensity
- Financial impact
- Time loss
- Error risk
- Stress / cognitive burden
- Urgency
- Strategic relevance
- Number of affected users
- Automation potential

However, the default rule remains intentionally simple:

> **Frequency × Intensity determines the basic pain priority.**

Do not overcomplicate scoring unless additional dimensions materially improve a product decision.

---

# 13. Pain Score → Interface Weight

Pain Scores must affect the interface.

## 13.1 High-Pain Problems

A very high Pain Score may justify:

- placement on Home,
- a large Bento card,
- persistent visibility,
- proactive notification,
- automatic AI analysis,
- one-click action,
- default inclusion in onboarding,
- dedicated workflow,
- alerting,
- automation,
- daily or weekly resurfacing.

## 13.2 Medium-Pain Problems

Medium scores may justify:

- normal navigation visibility,
- contextual modules,
- standard cards,
- optional automations,
- contextual AI suggestions.

## 13.3 Low-Pain Problems

Low scores should generally live in:

- secondary views,
- settings,
- overflow menus,
- contextual drawers,
- advanced configuration.

**Low business importance must not consume high interface attention.**

---

# 14. Pain Score → Workflow Position

The Pain Score should influence not only visual size but also **where a capability appears in the workflow**.

For example:

```text
High frequency + high intensity
→ Primary workflow
→ Home / Today / Focus
→ proactive AI
→ minimal clicks

High frequency + low intensity
→ streamlined routine
→ automation candidate

Low frequency + high intensity
→ contextual emergency / exception flow
→ highly visible when triggered

Low frequency + low intensity
→ secondary / advanced UI
```

This ensures that Peak's workflow architecture reflects actual user problems rather than an internal feature taxonomy.

---

# 15. Exception-First UX

Peak should not force users to inspect every normal process.

The system should surface:

- deviations,
- blockers,
- risks,
- overdue work,
- missing information,
- thresholds,
- decisions,
- anomalies,
- required approvals.

Normal operations should increasingly disappear into the background.

> **Show the user what requires attention, not everything that exists.**

This is especially important for:

- executives,
- team leads,
- operators,
- finance,
- inventory,
- ads,
- customer operations.

---

# 16. Attention Is a Scarce Resource

Screen space, notifications and cognitive attention are limited resources.

Every visible element should justify its existence.

Before adding a component, ask:

1. Which pain does this solve?
2. How frequently does that pain occur?
3. How intense is it?
4. What happens if the user ignores it?
5. Does it require human attention?
6. Could Peak resolve it automatically?
7. Is this the right moment to show it?

This creates a **Focus over Feature Density** culture.

---

# 17. Visual Hierarchy Must Reflect Operational Hierarchy

Bento layouts, cards, typography and positioning should encode importance.

Example:

```text
100 Pain Score → dominant / immediate
80  Pain Score → prominent
60  Pain Score → standard
30  Pain Score → contextual
10  Pain Score → hidden until requested
```

This is not intended as a rigid pixel formula.

It is a design decision framework.

The interface should feel as though it understands:

> **What matters most right now?**

---

# 18. Dynamic Importance

Pain and importance are contextual.

A normally secondary object may become primary when conditions change.

Example:

`Inventory Reorder`

Normally:
- quiet,
- background monitoring.

When stockout risk becomes critical:
- moves into Inbox,
- appears on Home,
- receives warning state,
- AI explains the problem,
- suggested action appears,
- responsible person is identified.

Therefore:

```text
Static Product Priority
+
Live Business Context
=
Current Interface Priority
```

This is a core Peak principle.

---

# 19. Role-Weighted UX

Pain Scores may differ by role.

For example:

**CEO**
- cash
- goals
- blockers
- strategic decisions

**Head of Growth**
- CAC
- ROAS
- campaign anomalies
- creative pipeline

**Inventory Manager**
- stockouts
- reorder timing
- inbound delays

The same underlying objects remain shared.

Only the **lens and priority** change.

This means Peak can generate role-specific dashboards without creating role-specific data silos.

---

# 20. Shared Services

The following capabilities should increasingly become platform services rather than being reimplemented by each app.

## Core Platform Services

- Identity
- Organizations
- Memberships
- Roles
- Permissions
- Policies
- Search
- AI / Ask
- Tasks
- Goals
- Projects
- Documents
- Comments
- Files
- Notifications
- Inbox
- Approvals
- Activity
- Audit
- Relationships
- Events
- Metrics
- Automations
- Integrations
- Agents

A new Peak product should consume these platform capabilities whenever possible.

---

# 21. Central Data Architecture

Supabase should act as the central transactional foundation for Peak One unless a specific technical requirement justifies another system.

The architecture should preserve **shared primitives** while separating domain responsibilities logically.

```text
auth
│
└── Supabase Auth

core
│
├── organizations
├── workspaces
├── users
├── memberships
├── teams
├── roles
├── permissions
├── policies
├── relationships
└── custom_fields

work
│
├── goals
├── initiatives
├── projects
├── milestones
├── tasks
├── routines
├── blockers
└── decisions

collaboration
│
├── documents
├── comments
├── mentions
├── attachments
├── meetings
└── conversations

platform
│
├── notifications
├── inbox_items
├── approvals
├── events
├── activity
├── audit_logs
├── automations
├── agents
├── integrations
└── metrics

domain
│
├── products
├── inventory
├── suppliers
├── orders
├── campaigns
├── customers
├── opportunities
└── invoices
```

Logical separation does **not** mean isolated realities.

Shared IDs, relationships, permissions and events connect the domains.

---

# 22. One Semantic Layer

Peak must have a common business vocabulary.

Terms such as:

- Revenue
- Customer
- Product
- Margin
- Task
- Goal
- Owner
- Status
- Campaign
- Profit
- Inventory

must have central definitions.

This is critical for:

- analytics,
- reporting,
- AI,
- integrations,
- automations,
- cross-product workflows.

Without a semantic layer, different apps will eventually disagree about what the same business term means.

---

# 23. AI-Native, Not AI-Added

AI must not be treated as a chatbot pasted onto existing software.

AI should understand:

- the current organization,
- the current user,
- the user's role,
- current object context,
- related objects,
- permissions,
- historical events,
- decisions,
- metrics,
- integrations,
- current business state.

AI should be able to move through the loop:

```text
Observe
→ Understand
→ Explain
→ Recommend
→ Simulate
→ Request Approval
→ Execute
→ Measure
→ Learn
```

---

# 24. Global Ask / Search

Search and AI should converge into a universal company interface.

Examples:

```text
"Why did profit decline last month?"
"Which products are at stockout risk?"
"Show all tasks blocking Q4 revenue goals."
"What did we decide about the new supplier?"
"Create tasks from yesterday's leadership meeting."
```

Peak should resolve these requests across the entire business graph rather than forcing the user to know which app owns the information.

---

# 25. Global Inbox

Everything that genuinely requires attention should converge in a common attention layer.

Possible Inbox items:

- task assigned,
- mention,
- approval required,
- AI finding,
- anomaly,
- blocker,
- integration error,
- customer escalation,
- inventory warning,
- decision request.

The Inbox should **not** become a dumping ground.

Pain priority, role relevance, urgency and context should control what reaches it.

---

# 26. Universal Create

Peak should provide a contextual global creation entry point.

Examples:

- Task
- Project
- Goal
- Product
- Customer
- Document
- Meeting
- Decision
- Automation

The creation interface should adapt to current context.

Creating a Task while viewing a Product should automatically be able to establish the Product relationship.

---

# 27. Capability-First Integrations

Internal Peak functionality should use stable capabilities rather than hard-code external providers throughout the product.

Example:

```text
commerce.orders.read
ads.performance.read
campaign.create
customer.create
document.create
message.send
```

Providers sit behind these capabilities.

This allows provider substitution and prevents the application layer from becoming tightly coupled to third-party APIs.

---

# 28. Read and Write Must Be Separated

External capabilities should clearly distinguish:

```text
READ
WRITE
MONEY
PUBLICATION
DESTRUCTIVE
ADMIN
```

Examples:

- Reading Google Ads performance is not equivalent to changing budget.
- Drafting a campaign is not equivalent to publishing it.
- Reading invoices is not equivalent to sending payments.

Risk must influence permission and approval behavior.

---

# 29. Risk-Based Approval

A general model:

```text
Low risk
→ automatic execution may be allowed

Moderate risk
→ user-configurable automation

High risk
→ explicit approval

Critical / destructive
→ explicit approval + audit + additional safeguards
```

Examples of higher-risk actions:

- spending money,
- publishing externally,
- changing pricing,
- deleting data,
- transferring funds,
- modifying sensitive permissions.

---

# 30. AI Must Respect the Same Permissions as Humans

An AI agent must never become a permission bypass.

If a user cannot access a value manually, their AI should not reveal it.

If a user cannot execute an action, their AI should not execute it on their behalf.

Permission checks belong in the capability layer, not only in the frontend.

---

# 31. Multi-Tenant by Design

Every relevant object must respect tenant boundaries.

Canonical hierarchy:

```text
Platform
└── Organization
    ├── Workspace
    ├── Teams
    ├── Users
    ├── Guests
    ├── Agents
    └── Objects
```

Tenant isolation, RLS and access rules are architectural requirements, not later security improvements.

---

# 32. Configuration Before Customer-Specific Code

Customer-specific requirements should be solved through:

- custom fields,
- views,
- filters,
- workflows,
- permissions,
- roles,
- templates,
- automations,
- policies,
- dashboards.

Avoid customer-specific code forks.

> **One platform. Configurable realities. No customer-specific product branches unless absolutely unavoidable.**

---

# 33. Opinionated Defaults

Peak should not open as an empty low-code builder.

It should provide:

- recommended workflows,
- recommended views,
- recommended metrics,
- recommended automations,
- recommended roles,
- recommended defaults.

Users can customize later.

Default experience should solve the core pain immediately.

---

# 34. 3–4 Primary Navigation Items

Individual Peak products should normally expose only **3–4 primary navigation items**.

Navigation should represent the natural workflow, not the underlying database or feature catalogue.

Bad:

```text
Dashboard
Reports
Tasks
Comments
Files
Settings
Charts
Exports
Rules
Alerts
...
```

Better:

```text
Plan
Execute
Review
Improve
```

or another workflow appropriate to the domain.

Features live inside the workflow.

---

# 35. Progressive Disclosure

Users should not encounter the full complexity of Peak immediately.

Default:

```text
Simple first
→ Contextual depth
→ Advanced controls
```

Complexity should appear only when relevant.

---

# 36. 80/20 Interface

The most frequently used and highest-value actions should be exceptionally fast.

Rare functionality can sit deeper.

Do not optimize every feature for equal discoverability.

That destroys hierarchy.

---

# 37. Focus Over Feature Density

A product can contain many capabilities without displaying them simultaneously.

The interface should continually answer:

```text
What matters now?
What should I do next?
What is blocked?
What is at risk?
What changed?
```

The user should not have to construct this answer manually from dashboards.

---

# 38. Goals Cascade Into Execution

Peak should connect:

```text
Company Goal
→ Objective
→ Initiative
→ Milestone
→ Project
→ Task
→ Routine
→ Today's Work
```

This allows any person to understand:

> **Why am I doing this?**

A task without strategic context may still exist, but the architecture should make goal linkage easy.

---

# 39. Decisions Are First-Class Objects

Important decisions should not disappear inside chat threads.

A Decision object can contain:

- question,
- options,
- context,
- evidence,
- decision,
- decision maker,
- date,
- expected outcome,
- related objects,
- follow-up date,
- actual outcome.

This creates institutional memory and allows future AI to learn from prior decisions.

---

# 40. Evidence Before Recommendation

AI recommendations should show evidence when relevant.

Peak should distinguish:

```text
FACT
CALCULATION
INFERENCE
ESTIMATE
RECOMMENDATION
```

The user should be able to ask:

> Why does Peak believe this?

Important recommendations should be traceable to underlying data.

---

# 41. Simulation Before High-Impact Execution

Where feasible, important actions should support preview or simulation before execution.

Examples:

- ad budget change,
- price change,
- inventory order,
- hiring plan,
- cash allocation,
- promotion.

Pattern:

```text
Propose
→ Simulate
→ Review
→ Approve
→ Execute
→ Measure
```

---

# 42. Reversible by Default

Actions should be reversible wherever practical.

Support:

- undo,
- restore,
- version history,
- soft delete,
- audit log.

Irreversible actions require stronger confirmation.

---

# 43. Automation-Ready

Every recurring deterministic workflow should be evaluated for automation.

AI and automation should reduce repeated human work without obscuring control.

Potential triggers:

```text
event
schedule
threshold
state change
user action
external webhook
```

---

# 44. Agent-Ready

Applications should expose capabilities that approved AI agents can use safely.

Agents are not separate shadow applications.

They operate on the same:

- objects,
- permissions,
- events,
- workflows,
- policies,
- audit layer.

---

# 45. Graceful Degradation

Peak must remain useful if:

- an external integration fails,
- an AI provider is unavailable,
- an API rate limit is reached,
- a sync is delayed.

Core software must not become unusable because an AI feature or external provider is temporarily unavailable.

---

# 46. Data Lineage

Important data should expose origin where relevant.

Possible origins:

- user input,
- Shopify,
- Google Ads,
- Meta,
- accounting platform,
- calculated metric,
- imported file,
- AI estimate.

Peak should avoid presenting derived or estimated information as unquestionable raw fact.

---

# 47. Metric Definitions Are Centralized

A metric should have one canonical definition.

Example:

```text
Metric
├── id
├── name
├── definition
├── formula
├── unit
├── dimensions
├── source
├── owner
└── version
```

This prevents different Peak modules from reporting incompatible versions of the same KPI.

---

# 48. Telemetry-Native Product Development

Every major user journey should be measurable.

Measure:

- use,
- completion,
- time-to-value,
- errors,
- abandonment,
- repeated usage,
- outcome achieved.

Before building a major capability, define how success will be measured.

---

# 49. Complexity Budget

Every new feature consumes product complexity.

New functionality must earn that complexity.

Before adding it, ask:

```text
Does this solve a sufficiently painful problem?
Does it need to be visible?
Can an existing primitive solve it?
Can AI remove the need for an interface?
Can automation remove the task entirely?
```

---

# 50. Delete Aggressively

Unused:

- features,
- controls,
- settings,
- navigation,
- abstractions

should be removed or consolidated.

Peak should become **simpler as it becomes more capable**.

---

# 51. Shared Design System

All Peak products should share:

- design tokens,
- typography,
- spacing,
- form controls,
- command/search behavior,
- object patterns,
- data tables,
- views,
- permissions behavior,
- activity patterns,
- AI interaction patterns,
- loading/error states.

Domain products may have individual personality without breaking systemic consistency.

---

# 52. Peak Visual Language

The default Peak software aesthetic is:

- clean,
- premium,
- editorial,
- software-first,
- spacious,
- structured,
- Ivory / Off-White,
- Burgundy as primary accent,
- restrained materiality,
- subtle glass/frosted effects,
- serif headings where appropriate,
- functional Bento hierarchy,
- minimal visual noise.

Existing Peak Atlas brand and web assets should be reused whenever possible instead of generating unrelated generic SaaS visuals.

---

# 53. Bento Is Hierarchy, Not Decoration

Bento cards should communicate:

- importance,
- grouping,
- context,
- actionability.

Different card sizes must have a reason.

A large card means something is operationally or contextually important.

Do not use Bento purely because it looks modern.

---

# 54. Motion Must Explain

Animation should communicate:

- state change,
- causality,
- progress,
- hierarchy,
- relationship,
- transition.

Avoid decorative motion that increases cognitive load.

---

# 55. Views Are Lenses Over the Same Objects

Peak should support reusable view types such as:

1. Table
2. List
3. Gallery
4. Board
5. Calendar
6. Timeline
7. Map
8. Chart
9. Tree
10. Graph
11. Canvas

These views should ideally operate over canonical objects rather than maintaining duplicated datasets.

---

# 56. Platform Experience

The global Peak One shell is conceptually organized around:

```text
Home
Work
Discover
Connect
```

Global utilities can include:

```text
Search / Ask
Inbox
Create
Automations
Integrations
Settings
```

Domain applications should work within this shared platform logic rather than inventing new global navigation paradigms.

---

# 57. Home = Contextual Attention Layer

Home should answer:

```text
What matters?
What changed?
What is at risk?
What should I do next?
What requires my decision?
```

It should not simply be a dashboard containing every available KPI.

Home content should be dynamically informed by:

- role,
- Pain Score,
- urgency,
- goals,
- current work,
- exceptions,
- deadlines,
- business events.

---

# 58. Work = Unified Execution Layer

Work should unify:

- goals,
- milestones,
- projects,
- tasks,
- routines,
- blockers,
- current focus.

Domain apps can create or modify execution objects, but Work remains a universal lens over execution.

This is another reason why **a Task must be the same Task everywhere**.

---

# 59. Discover = Universal Discovery Layer

Discover should allow users to find:

- apps,
- solutions,
- workflows,
- templates,
- objects,
- knowledge,
- people,
- capabilities.

It should scale without forcing every capability into global navigation.

---

# 60. Connect = Human Network Layer

Connect is for:

- people,
- community,
- relationships,
- events,
- networking.

Technical integrations belong to the Integration layer and should not be mixed conceptually with human connection.

---

# 61. Software 2030+

Peak should not merely clone current SaaS conventions.

For every new product, ask:

> If this category were invented today with AI, agents, semantic data and automation already available, how would it work?

Use existing software for:

- domain knowledge,
- edge cases,
- proven workflows.

Do not inherit outdated interaction patterns merely because incumbents use them.

---

# 62. Outcome Before Feature

Every feature should exist because it helps achieve an outcome.

Start with:

```text
User
→ Pain
→ Desired Outcome
→ Workflow
→ Objects
→ Intelligence
→ Action
→ Verification
```

Do not start with:

```text
Competitor has Feature X
→ therefore Peak needs Feature X
```

---

# 63. Pain Research Is a Build Requirement

Before major product work:

1. Identify target users.
2. Identify their pains.
3. Rank pains by frequency.
4. Rank pains by intensity.
5. Calculate Pain Scores.
6. Map pains to workflows.
7. Map workflows to canonical objects.
8. Design interface hierarchy from priority.
9. Determine what can be automated.
10. Define measurable outcomes.

A Master Build Specification should document this explicitly.

---

# 64. Pain → Product Architecture Mapping

Every high-priority pain should map to one or more product responses.

```text
Pain
→ Workflow
→ Object
→ View
→ Action
→ Automation
→ AI behavior
→ Metric
```

Example:

```text
Pain:
"I constantly lose track of what matters today."

Frequency: 10
Intensity: 10
Pain Score: 100

Response:
→ Work / Today
→ Goals + Tasks + Routines + Blockers
→ Focus view
→ AI prioritization
→ maximum 3 active focus items
→ proactive blocker detection
→ completion / focus metrics
```

This makes product design traceable back to actual user pain.

---

# 65. The Peak Build Sequence

For any new product or major module:

```text
1. Define target user
2. Identify pains
3. Score Frequency × Intensity
4. Define desired outcomes
5. Map natural workflow
6. Reuse canonical objects
7. Identify missing domain objects
8. Define relationships
9. Define events
10. Define permissions
11. Define AI context
12. Define automation opportunities
13. Define integration capabilities
14. Design 3–4 item navigation
15. Design pain-weighted interface
16. Define telemetry
17. Define acceptance criteria
18. Build
19. Test
20. QA
21. Deploy
22. Measure actual usage and outcomes
23. Simplify based on evidence
```

---

# 66. Master Build Specification Requirement

Major Peak products should be specified with a **Master Build Specification**, not only a classical PRD.

A complete specification should include:

- Product purpose
- Target users
- Pain-point analysis
- Frequency × Intensity scoring
- Desired outcomes
- User journeys
- Information architecture
- Workflow design
- Canonical object usage
- New domain objects
- Data model
- Relationships
- Events
- Permissions
- Roles
- AI behavior
- Automations
- Integrations
- UX/UI specification
- Design-system usage
- Responsive behavior
- Analytics / telemetry
- Testing
- Acceptance criteria
- Definition of Done
- Deployment
- Implementation order
- Final QA

The specification should leave as few unresolved product decisions as reasonably possible for implementation.

---

# 67. Architectural Layers

Peak should increasingly be understood as four connected layers.

## Layer 1 — Business Reality

```text
Objects
Relationships
Events
Metrics
Timeline
Permissions
```

## Layer 2 — Intelligence

```text
Semantic Layer
AI
Business Graph
Decisions
Recommendations
Simulations
Memory
```

## Layer 3 — Execution

```text
Tasks
Workflows
Automations
Agents
Integrations
Approvals
```

## Layer 4 — Experience

```text
Home
Work
Discover
Connect
Search / Ask
Inbox
Create
Views
```

The Experience Layer must not become the source of business truth.

It renders and acts on the underlying layers.

---

# 68. Canonical AI Loop

The ideal Peak intelligence loop is:

```text
OBSERVE
   ↓
UNDERSTAND
   ↓
PRIORITIZE
   ↓
EXPLAIN
   ↓
RECOMMEND
   ↓
SIMULATE
   ↓
APPROVE
   ↓
EXECUTE
   ↓
MEASURE
   ↓
LEARN
   ↺
```

Pain severity, business goals, role and real-time context influence **PRIORITIZE**.

---

# 69. The Peak Attention Formula

A future dynamic attention model can conceptually combine:

```text
Attention Priority =
Baseline Pain Score
× Context Relevance
× Urgency
× Current Business Impact
× Role Relevance
```

This can determine:

- Home prominence,
- Inbox ordering,
- warning states,
- AI proactive behavior,
- card size,
- workflow placement.

The exact algorithm may evolve.

The architectural principle should remain:

> **The interface adapts to what matters, rather than giving everything equal weight.**

---

# 70. Non-Negotiable Rules

For future Peak software:

1. **Do not duplicate canonical business objects across apps.**
2. **A Task is the same Task everywhere.**
3. **Use one central business reality and multiple contextual lenses.**
4. **Prefer relationships over copied data.**
5. **Make important objects searchable, linkable and auditable.**
6. **Use events for meaningful state changes.**
7. **Use Pain Score = Frequency × Intensity as a core prioritization tool.**
8. **Let pain priority influence navigation, workflow and visual hierarchy.**
9. **Surface exceptions and required decisions before normal operations.**
10. **Keep primary navigation to approximately 3–4 workflow-oriented items.**
11. **Reuse shared platform services before rebuilding functionality.**
12. **AI must understand context and respect permissions.**
13. **Separate read, write, money, publication and destructive capabilities.**
14. **Use approvals based on action risk.**
15. **Design for multi-tenancy from the beginning.**
16. **Use configuration instead of customer-specific forks.**
17. **Use opinionated defaults and progressive disclosure.**
18. **Track evidence and lineage for important facts and recommendations.**
19. **Build for automation and agents without removing human control.**
20. **Every major feature must solve a sufficiently important pain or outcome.**
21. **The product should become simpler as the underlying system becomes more powerful.**

---

# 71. Final Principle

The long-term goal of Peak Atlas is not to build hundreds of disconnected software tools.

The goal is to build a **living digital model of a company**.

Apps are views into that model.

AI understands that model.

Automations act on that model.

Agents operate within that model.

Humans collaborate through that model.

Every task, person, product, goal, decision and metric contributes to one connected reality.

And the interface continuously asks one question:

> **What matters most right now — and what is the best next action?**

That is the Peak Atlas software architecture.
