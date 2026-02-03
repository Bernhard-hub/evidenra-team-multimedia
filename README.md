# EVIDENRA Team Multimedia

> Web-first Team Collaboration Platform for Qualitative Research, powered by AI

## Features

- **Team Collaboration**: Real-time collaboration with presence indicators, comments, and activity feeds
- **4 AI Coding Methods**:
  - **Dynamic Personas**: Contextually-aware AI personas that adapt to your content
  - **Three Expert System**: Simulates three independent coders with consensus validation
  - **Calibrated Pattern Coding**: TF-IDF similarity matching for consistent coding
  - **Ultra Turbo**: Fast single-pass analysis for exploration
- **Inter-Rater Reliability (IRR)**: Built-in calculation of Cohen's Kappa, Fleiss' Kappa, and Krippendorff's Alpha
- **Role-Based Access**: Admin, Coder, Reviewer, and Viewer roles
- **Modern Tech Stack**: React 18, TypeScript, Tailwind CSS, Supabase

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/evidenra-team-multimedia.git
cd evidenra-team-multimedia

# Install dependencies
pnpm install

# Copy environment variables
cp apps/web/.env.example apps/web/.env

# Set up Supabase
# 1. Create a new Supabase project
# 2. Run the migration: supabase/migrations/001_initial_schema.sql
# 3. Add your Supabase URL and anon key to .env

# Start development server
pnpm dev:web
```

## Project Structure

```
evidenra-team-multimedia/
├── apps/
│   └── web/                    # React web application
│       ├── src/
│       │   ├── components/     # Reusable UI components
│       │   ├── pages/          # Page components
│       │   └── stores/         # Zustand state stores
│       └── ...
├── packages/
│   ├── core/                   # Core coding & IRR logic
│   │   ├── src/
│   │   │   ├── coding/         # AI coding systems
│   │   │   ├── irr/            # Inter-rater reliability
│   │   │   └── types.ts        # Type definitions
│   │   └── ...
│   └── supabase/               # Supabase client & types
│       └── src/
│           ├── client.ts       # Supabase client
│           └── types.ts        # Database types
├── supabase/
│   └── migrations/             # Database migrations
└── ...
```

## Coding Methods

### 1. Dynamic Coding Personas

Creates AI personas that adapt to your document content:
- **Domain Expert**: Deep thematic analysis
- **Methodology Expert**: Pattern recognition and rigor
- **Critical Analyst**: Edge cases and alternative interpretations

### 2. Three Expert Coding System

Simulates having three independent human coders:
1. Each expert codes independently
2. Only codes with 2/3 or 3/3 consensus are kept
3. Achieves higher reliability through agreement

### 3. Calibrated Pattern Coding

Best for maintaining consistency:
1. Learns patterns from existing codes
2. Uses TF-IDF similarity matching
3. AI validates and refines matches

### 4. Ultra Turbo Coding

Fastest method for exploration:
- Single-pass analysis
- Parallel processing
- Great for initial data exploration

## Inter-Rater Reliability

Built-in IRR calculation supports:

| Metric | Use Case |
|--------|----------|
| Cohen's Kappa | 2 coders |
| Fleiss' Kappa | 3+ coders |
| Krippendorff's Alpha | Any coders, handles missing data |
| Percent Agreement | Simple baseline |

### Interpretation Scale (Landis & Koch)

| Value | Interpretation |
|-------|---------------|
| < 0 | Poor |
| 0.00 - 0.20 | Slight |
| 0.21 - 0.40 | Fair |
| 0.41 - 0.60 | Moderate |
| 0.61 - 0.80 | Substantial |
| 0.81 - 1.00 | Almost Perfect |

## Development

```bash
# Run web app
pnpm dev:web

# Run all packages in dev mode
pnpm dev

# Build all packages
pnpm build

# Type checking
pnpm type-check
```

## Database Schema

The application uses Supabase with the following main tables:

- `profiles`: User profiles
- `organizations`: Team organizations
- `organization_members`: Organization membership
- `projects`: Research projects
- `project_members`: Project membership with roles
- `documents`: Text documents and transcripts
- `codes`: Hierarchical code system
- `codings`: Applied codes to document segments
- `comments`: Team comments and discussions
- `activities`: Activity log for audit trail

## Security

- Row Level Security (RLS) enforces access control at the database level
- API keys are hashed before storage
- Real-time subscriptions respect RLS policies

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

Built with by the EVIDENRA Team
