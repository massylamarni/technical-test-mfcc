# Marine Fleet Control Center

A modern, interactive fleet monitoring dashboard built for the marine telemetry technical assessment. The app lets a fleet control manager replay historical vessel operations, compare multiple IMO vessels, and inspect spatio-temporal performance metrics over a selected time window.

## Overview

This project addresses the challenge of visualizing a fleet of vessels using historical telemetry data from three vessels: IMO1, IMO2, and IMO3. The interface supports:

- Multi-vessel selection
- Date range filtering
- Variable selection for trajectory coloring
- Interactive world map with vessel trajectories
- Time-windowed dataset querying through a small server-side API

The result is a lightweight operational dashboard inspired by maritime navigation and weather tooling, with a clear focus on fleet situational awareness and performance analysis.

## Technical assessment context

The project is structured around the candidate assessment requirements:

- Replay and analyze historical vessel operations
- Work with multiple spatio-temporal variables
- Render trajectories on an interactive map
- Color-code paths by selected variable values
- Keep the front-end clean, fast, and usable for fleet control workflows

The repository also includes design notes for the broader deliverables expected by the assessment:

- [docs/database-architecture-proposal.md](docs/database-architecture-proposal.md)
- [docs/advanced-feature-proposal.md](docs/advanced-feature-proposal.md)

## Current implementation

### Features

- Vessel selector for IMO1, IMO2, and IMO3
- Start and end date controls for time-window filtering
- Variable dropdown covering telemetry metrics such as speed, roll, pitch, GM, and parametric roll risk
- World map display using MapLibre GL
- Dynamic trajectory coloring based on the selected metric
- Per-vessel route labeling and automatic map fit to the active data window
- Loading/error states for data fetches
- Client-side data grouping and filtering before rendering

### Data model and processing

The application ingests three CSV sources per vessel:

- GPS data
- MACS3 stability and hydrodynamic data
- MOTIONS / IMU data

These are merged and normalized by timestamp so that a single operational record contains both position and relevant performance/stability variables. The merge logic is implemented in the CSV parsing layer and filtered on the server before reaching the UI.

### Data handling rules and cleanup decisions

The implementation treats raw input carefully so that nulls and noise are interpreted correctly:

- Empty cells are stored as `null`, not zero values.
- An empty GM field is treated as "no reading" rather than "GM is zero".
- Rows with a valid timestamp but all-null measurements are dropped, since they do not contain useful signal.
- Data sorting is performed in code, rather than assuming the source files are already ordered.
- Filtering is separated into a dedicated function that the Next.js API route will call with the user's vessel selection and date range; this makes it testable in isolation.
- CSV file naming and label normalization were corrected to match the expected vessel and telemetry schema, including the MACS3 filename fix and the NAVIGATION_GPS / NAVIGATION_GYRO label consistency fix.
- Because of a MapLibre runtime issue, the worker library was copied into the public folder so the map could load reliably in the browser.
- The vessel track is split into separate line segments whenever the longitude jumps across the International Date Line by more than 180°, preventing a drawn line from taking the long route across the antimeridian.

## Stack and tooling

- React.js + Next.js
- PostgreSQL with TimescaleDB for time-series management
- Shadcn + Tailwind
- MapLibre GL JS
- Recharts
- Zod + Drizzle or Prisma
- PapaParse for frontend CSV parsing
- SQL parsing tooling where needed for dataset preparation

## API behavior

The app exposes a server-side endpoint at `/api/vessels` that accepts:

- `vessels`: comma-separated vessel IDs such as `IMO1,IMO2`
- `start`: start datetime
- `end`: end datetime

The route validates the request, loads the relevant merged dataset, filters it by vessel and date range, and returns JSON for the client to render.

## Local development

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Run the app locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```
