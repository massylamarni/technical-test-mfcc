# CANDIDATE SELECTION TECHNICAL ASSESSMENT

## 1. Marine Fleet Control Center

Imagine you are the head of a fleet centre responsible for monitoring 1000 of ship operational performance in real-time. In your fleet, each vessel is equipped with a multi-sensor data acquisition (DAQ) system that continuously measures key physical and operational parameters. This includes GPS, speed, heading, fuel consumption meter and motions sensors.

These measurements are timestamped and transmitted via satellite communication to a shore-based database infrastructure, where they are stored, processed, and made accessible for analysis through an API. Using such API gives you an overview of fleet states including historical time-series navigation and operational data, using unique identification number called IMO.

## 2. Fleet Data APIs

### 2.1. FleetView API

FleetView of AIU retrieves all data records onboard ships and stored on the fleet data acquisition database. These data are timeseries and cover the following ship navigation information:

| Parameter             | Description                                                                                                        | Unit    | Notes                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Latitude / Longitude  | GPS geographic position of the vessel                                                                              | °       | WGS-84 datum; Frequency: HF, MF                                                                                                                                     |
| SOG                   | Speed Over Ground — actual speed relative to the seabed                                                            | knots   | SOG is not STW (Speed Through Water); SOG = STW + Current (vectorial representation); Frequency available: HF, MF                                                   |
| GPS                   | Course True direction of travel over the ground                                                                    | °       | Influenced by currents and wind drift; Frequency available: HF, MF                                                                                                  |
| Gyrocompass (Heading) | Direction the vessel's bow is pointing                                                                             | °       | Differs from course in the presence of currents; Frequency available: HF, MF                                                                                        |
| Thruster Torque       | The mechanical torque transmitted from the main engine through the main shaft and gearboxes to drive the thrusters | N·meter | Frequency available: HF                                                                                                                                             |
| Thruster RPM          | Rotations per minute of the main propulsion system                                                                 | RPM     | Simple model: RPM = 4 × SOG; Frequency available: HF, MF                                                                                                            |
| IMU (6-DOF)           | Roll, pitch, yaw, heave, surge, sway from inertial sensors                                                         | Various | Frequency available: UH For HF                                                                                                                                      |
| Fuel Flow Rate        | Instantaneous fuel consumption. Not available but can be computed                                                  | t/day   | When not available, consider model: consumption ∝ SOG³, At 15 knot speed ship consumes ≈ 150 t per day, 1 tonne of fuel = 1000 USD; Frequency available: HF, MF, LF |

Onboard systems collect data at three frequency levels:

- **High Frequency (HF)** — sub-second sampling (e.g., inertial motion data)
- **Medium Frequency (MF)** — one sample per 15 minutes (primary dataset for this exercise)
- **Low Frequency (LF)** — one sample per 24 hours (daily summaries, fuel accounting)

### 2.2. AIS API (Alternative to FleetView)

The Automatic Identification System (AIS) is a mandatory maritime tracking system that serves as an alternative data source when direct access to onboard sensor data via the FleetView API is unavailable.

The AIS API provides vessel identification (IMO number, MMSI, name, call sign), position (latitude/longitude), navigation data (course over ground, heading), speed (speed over ground), voyage information (destination, navigational status, ETA, when available), vessel characteristics (type, length, beam, and other static data), and a timestamp for each message. The exact fields vary by provider and by what each vessel transmits.

AIS-equipped vessels broadcast this data via VHF radio, which is picked up by coastal stations near shore and satellite receivers over open ocean, then aggregated by AIS providers into global vessel-tracking databases accessible via HTTPS/JSON APIs.

The result is a continuous time series of vessel positions and navigation data used to reconstruct trajectories and monitor fleet movements.

**GoodWeather® API**

Deployed in production, this API takes the vessel's spatio-temporal position as input and returns detailed oceanic and atmospheric conditions for that location and time. The data is provided at high spatial resolution (1/36°, 1/12°, 1/10°, ¼° grid depending on the location and forecast ranges) with a forecast horizon of up to 10 days, enabling accurate environmental inputs for vessel performance and routing models.

## 3. AIU Proprietary APIs

### 3.1. GoodWeather® API

This API provides global meteocean high-resolution data (1/36°, 1/12°, 1/10°, and ¼° grid resolutions, depending on location and forecast horizon), covering forecast horizons of 5, 10, 15, and up to 35 days. It delivers accurate environmental inputs for vessel performance analysis and weather routing optimisation.

**ShipTwin API – Predictive Performance Model**

### 3.2. ShipTwin® API

This API is a library of models that captures the relationship between various vessel parameters under specific weather and loading conditions.

The API takes the following inputs:

- **Environmental conditions**: wind, wave state, currents, and other relevant meteorological and oceanographic data.
- **Vessel configuration**: draft, trim, loading condition, and other relevant vessel characteristics.
- **Navigation parameters**: vessel heading on a route segment.
- **Propulsion control parameter**: Main Engine RPM, the primary operational parameter used to control vessel speed.

Based on these inputs, the model predicts the vessel's expected performance, including:

- Speed Over Ground (SOG)
- Fuel consumption
- Other relevant performance parameters

Conversely, for a target SOG, the API library model can determine the required Main Engine RPM needed to achieve that speed under the given vessel and environmental conditions.

This API enables the AIU Copilot® platform to deliver accurate voyage optimisation and operational recommendations based on multiple objectives and constraints.

### 3.3. BestRoute API – Weather Routing Algorithms

In production, this API takes as an input the departure and arrival location and timing, and returns optimal route accounting for dynamic weather obstacles and static obstacles such as landmarks and shallow water.

### 3.4. OnTime API – Just on Time Arrival Using Min Fuel / Emissions

In production this API takes as an input a fixed route and weather data and returns RPM instruction for an on-time arrival using minimum fuel consumption and emissions.

## 4. Technical Test Description – Full-Stack Engineer Intern

### 4.1. Part #1

For remote assessments, no API access will be provided. In addition, the scope has been intentionally simplified in order to focus on core analytical and technical skills.

**Data Source**

The dataset contains records from three vessels:

- IMO1
- IMO2
- IMO3

The dataset contains positional and operational time-series data collected over a ten-month period.

**Objective**

Develop a mini web application that allows a fleet control manager to replay and analyze the historical operations of any vessel in the fleet.

**Core Features**

The application must allow the user to:

1. Select one or more vessels from the three available (IMO1, IMO2, IMO3).
2. Define a time window by choosing a start date and an end date.
3. Select one or more spatio-temporal variables to visualise (e.g., Speed over time, RPM over time).
4. Display each selected vessel's trajectory on an interactive world map.
5. Dynamically colour-code the trajectory based on the selected variable (e.g., colour gradient from low to high speed).
6. Any other feature would be welcome.

### 4.2. Part #2

The test will be carried out in premis[es].

## 5. Expected Deliverables

| #   | Deliverable               | Description                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Frontend Application      | Design a small web application with a modern, visually compelling interface. Draw inspiration from best-in-class navigation and weather applications (Apple Weather, Google Waze, Windy.com) without needing to replicate them exactly. Focus on clear data presentation and intuitive UX.                                   |
| 2   | Database Architecture     | Propose a database schema suitable for storing and efficiently querying the vessel time-series data. Justify your technology choices (e.g., PostgreSQL with TimescaleDB, InfluxDB, etc.) and describe the key tables, indexes, and query patterns. How would you deal with the storage and retrieval of Global Weather Data? |
| 3   | Advanced Feature Proposal | Describe how a user could interactively modify a segment of a vessel's trajectory by dragging a waypoint on the map. Detail the technical approach: data model changes, backend logic, and front-end interaction patterns.                                                                                                   |

## 6. Evaluation Criteria

Candidates will be assessed across the following dimensions:

| Criterion                    | What we look for                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Code quality & architecture  | Clean, readable, well-structured code. Logical separation of concerns. Appropriate use of frameworks and libraries. |
| UI/UX design                 | Aesthetics, layout clarity, responsiveness, and ease of use. Map integration quality.                               |
| Data modelling               | Relevance and scalability of the proposed database schema. Understanding of time-series data constraints.           |
| Problem-solving & initiative | How you handle ambiguity, the assumptions you make, and the depth of your advanced feature proposal.                |

## 7. Reference Applications & Data Sources

The following applications demonstrate best-in-class maritime, weather, and navigation data visualisation. Study them for UX inspiration:

- **Apple Weather (iOS)** — Clean temporal data presentation, progressive disclosure of detail
- **Google Waze** — Real-time route visualisation, dynamic colour-coded paths, interactive map controls
- **Windy.com** — Global meteorological data overlaid on an interactive map; excellent reference for data-dense visualisations
- **Zoom Earth**
- **hifleet.com/kdistance/** — Maritime distance calculation tool
- **https://www.sofarocean.com/**

### 7.1. Open Meteorological Data (for inspiration only)

Global oceanographic and meteorological datasets are freely available for download and integration into the application:

- **Copernicus Marine Service** — https://data.marine.copernicus.eu
- **Copernicus Climate Data Store** — https://cds.climate.copernicus.eu

> **Note to Candidate**
> There is no single correct solution to this exercise. We are interested in how you think, design, and justify your choices. Feel free to go beyond the minimum requirements — creativity and initiative are highly valued. Document any assumptions you make and be prepared to discuss your decisions during the interview.

## 8. Deadline

Test started 25 Aug @ 15:00. Deadline is 26 Aug 2026 @ 18:00. If the result is acceptable, the candidate will be invited for an in-person test on 27 or 28 Aug 2026.

# Current implementation

## Features

- Vessel selector for IMO1, IMO2, and IMO3
- Start and end date controls for time-window filtering
- Variable dropdown covering telemetry metrics such as speed, roll, pitch, GM, and parametric roll risk
- World map display using MapLibre GL
- Dynamic trajectory coloring based on the selected metric
- Per-vessel route labeling and automatic map fit to the active data window
- Loading/error states for data fetches
- Client-side data grouping and filtering before rendering

## Data model and processing

The application ingests three CSV sources per vessel:

- GPS data
- MACS3 stability and hydrodynamic data
- MOTIONS / IMU data

These are merged and normalized by timestamp so that a single operational record contains both position and relevant performance/stability variables. The merge logic is implemented in the CSV parsing layer and filtered on the server before reaching the UI.

## Data handling rules and cleanup decisions

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

## Prerequisites

- Node.js 18+
- npm

## Install dependencies

```bash
npm install
```

## Run the app locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```
