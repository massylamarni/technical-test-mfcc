# Advanced Feature Proposal: Interactive Trajectory Waypoint Modification

## 1. UX & Frontend Interaction Pattern

| Interaction Step           | User Action                                                     | UI Response                                                                                                                                                               |
| -------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Enable Edit Mode**    | Toggles "Modify Route" on a vessel track.                       | Trajectory transforms into an editable polyline with draggable waypoint handles (`nodes`) at critical turns.                                                              |
| **2. Drag Waypoint**       | Clicks and drags a handle to a new geographic point on the map. | The dragged segment turns into a dashed blue line (**Optimistic UI**). Direct sea distance updates instantly in a floating overlay.                                       |
| **3. Release & Calculate** | Drops waypoint (`dragend` event).                               | A subtle loading indicator appears over the segment. Backend recalculates performance via APIs and renders updated ETA, projected fuel consumption, and delta comparison. |
| **4. Scenario Comparison** | Toggles "Compare with Original".                                | Dual polyline view: Original route (Gray) vs. Custom route (Color-coded by predicted speed/fuel).                                                                         |

- **Map Engine Choice:** Mapbox GL JS / MapLibre GL JS using `turf.js` for client-side spatial snapping and rubber-banding line graphics.

---

## 2. Data Model Changes

Telemetry records historical data and must remain immutable. Modified trajectories require dedicated route planning entities:

```sql
CREATE TABLE planned_voyages (
    voyage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imo_number INT REFERENCES vessels(imo_number),
    voyage_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'DRAFT', -- 'ACTIVE', 'ARCHIVED', 'DRAFT'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE voyage_waypoints (
    waypoint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voyage_id UUID REFERENCES planned_voyages(voyage_id) ON DELETE CASCADE,
    sequence_order INT NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    eta TIMESTAMPTZ,
    target_sog_knots REAL,
    is_manual_override BOOLEAN DEFAULT FALSE,
    UNIQUE(voyage_id, sequence_order)
);

```

---

## 3. Backend Logic & Processing Pipeline

When a user releases a dragged waypoint, the backend executes the following orchestration pipeline:

1. **Path Validation (`BestRoute API`):** The updated waypoint coordinate set is sent to `BestRoute API` to snap the path around shallow waters, coastlines, and maritime hazards using A\* / Dijkstra on a nautical graph network.
2. **Weather Fetch (`GoodWeather API`):** Slices forecast data along the new spatial coordinates and estimated timestamp sequence.
3. **Performance Prediction (`ShipTwin®` & `OnTime API`):**

- Computes expected wave/wind resistance on the vessel's bow based on new headings.
- Calculates required Main Engine RPM to maintain ETA, or predicts new SOG if RPM is capped.
- Computes projected fuel consumption using:

$$\text{Fuel}_{\text{new}} \propto \text{SOG}^3 \times \Delta t + \text{Weather Margin}$$

4. **Response Payload:** Returns updated GeoJSON features containing point-by-point telemetry predictions, total distance delta ($\Delta d$), ETA delta ($\Delta t$), and fuel cost variance ($\Delta \$ \text{USD}$).
