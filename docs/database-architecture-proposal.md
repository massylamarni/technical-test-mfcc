# Database Architecture Proposal

## 1. Technology Choice & Justification

**Primary Database:** PostgreSQL 16 with **TimescaleDB** and **PostGIS** extensions.

- **Why TimescaleDB over InfluxDB/NoSQL:** Maritime telemetry requires joining time-series records (speed, fuel, position) with strict relational metadata (vessel specs, IMO registry, voyage status). TimescaleDB keeps full SQL support and relational integrity while auto-partitioning data into time/space chunks (Hypertables).
- **Why PostGIS:** Essential for spatial indexing (R-Tree / GiST). It enables fast spatial queries such as spatial bounding-box lookups, track simplification (`ST_Simplify`), and intersection checks against marine zones.
- **Compression & Performance:** TimescaleDB’s columnar compression reduces storage footprint by 90%+ for historical telemetry and allows continuous aggregates (pre-computed 15-minute and 24-hour downsamples).

---

## 2. Key Tables & Schema Design

## `vessels` (Metadata Table)

```sql
CREATE TABLE vessels (
    imo_number INT PRIMARY KEY,
    mmsi INT UNIQUE NOT NULL,
    vessel_name VARCHAR(100) NOT NULL,
    vessel_type VARCHAR(50),
    length_m NUMERIC(6,2),
    beam_m NUMERIC(6,2),
    design_draft_m NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

```

## `vessel_telemetry` (Time-Series Hypertable)

```sql
CREATE TABLE vessel_telemetry (
    timestamp TIMESTAMPTZ NOT NULL,
    imo_number INT NOT NULL REFERENCES vessels(imo_number),
    location GEOMETRY(Point, 4326) NOT NULL, -- WGS-84 Point (Lon, Lat)
    sog_knots REAL,                           -- Speed Over Ground
    cog_deg REAL,                             -- Course Over Ground
    heading_deg REAL,                         -- Gyrocompass Heading
    thruster_rpm REAL,                        -- Main engine RPM
    thruster_torque_nm REAL,                  -- Shaft torque
    fuel_flow_t_per_day REAL,                 -- Calculated or direct fuel rate
    imu_6dof JSONB,                           -- Roll, pitch, yaw, heave, surge, sway
    data_source VARCHAR(20) DEFAULT 'FleetView'-- 'FleetView' or 'AIS'
);

-- Convert to TimescaleDB Hypertable partitioned by timestamp and IMO
SELECT create_hypertable('vessel_telemetry', 'timestamp', partitioning_column => 'imo_number', number_partitions => 4);

-- Indexes for performance
CREATE INDEX idx_telemetry_imo_time ON vessel_telemetry (imo_number, timestamp DESC);
CREATE INDEX idx_telemetry_location ON vessel_telemetry USING GIST (location);

```

---

## 3. Continuous Aggregates (Downsampling Strategy)

For long time windows (e.g., 10-month historical replays), returning high-frequency (HF) raw points crashes the frontend. Pre-calculated materialized views serve low-zoom map levels:

```sql
CREATE MATERIALIZED VIEW telemetry_15min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('15 minutes', timestamp) AS bucket,
    imo_number,
    FIRST(location, timestamp) as location,
    AVG(sog_knots) AS avg_sog,
    AVG(thruster_rpm) AS avg_rpm,
    SUM(fuel_flow_t_per_day * (15.0 / 1440.0)) AS fuel_consumed_tonnes
FROM vessel_telemetry
GROUP BY bucket, imo_number;

```

---

## 4. Global Weather Data Storage & Retrieval Architecture

Weather data from Copernicus comes in multi-dimensional GRIB2 or NetCDF formats across spatial grids ($1/36^\circ$ to $1/4^\circ$). Storing raw weather frames in a traditional relational DB creates scale bottlenecks.

1. **Storage Format:** Convert raw NetCDF/GRIB2 files into **Zarr** chunks stored on Cloud Object Storage (S3). Zarr allows chunk-level reading over HTTP byte-range requests without parsing entire multi-gigabyte files.
2. **Spatio-Temporal Indexing:** Index file references by `(time_bucket, lat_tile, lon_tile)` in a metadata catalog.
3. **Query Engine:** Deploy a lightweight Python/FastAPI microservice using **Xarray + DuckDB** to slice 3D arrays `(time, lat, lon)` on demand for a vessel's bounding box.
4. **Caching Layer:** Cache active route weather grids in **Redis** indexed by spatial geohash and timestamp buckets (`weather:geohash:timestamp`).

---
