import { parseGpsCsv, filterMergedRows, mergeVesselData } from "./parse-csv";

describe("CSV parsing and vessel filtering", () => {
  it("treats empty cells as null and retains only rows with valid position data", () => {
    const csv = `Timestamp,Latitude [deg],Longitude [deg],Course [deg],Heading [deg],Speed [kn]
2026-03-01 00:00:00,, , , ,
2026-03-01 00:15:00,10.5,20.25,180,100,8.5
`;

    const rows = parseGpsCsv(csv, "IMO1");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      vesselId: "IMO1",
      latitude: 10.5,
      longitude: 20.25,
      course: 180,
      heading: 100,
      speed: 8.5,
    });
  });

  it("filters merged vessel rows by vessel selection and time window", () => {
    const rows = [
      {
        vesselId: "IMO1",
        date: new Date("2026-03-01T00:00:00.000Z"),
        latitude: 10,
        longitude: 20,
        speed: 8,
        course: null,
        heading: null,
        displacement: null,
        fsm: null,
        gg: null,
        gm: null,
        gmFluid: null,
        kg: null,
        lcg: null,
        rxx: null,
        ryy: null,
        rzz: null,
        tAft: null,
        tFwd: null,
        tPitch: null,
        tRoll: null,
        tcg: null,
        c1: null,
        c2: null,
        c3: null,
        cTotal: null,
        parametricRollAdvanced2To1: null,
        pitchAcceleration: null,
        pitchMotion: null,
        pitchMotionPeriod: null,
        pitchVelocity: null,
        rollAcceleration: null,
        rollMotion: null,
        rollMotionPeriod: null,
        rollVelocity: null,
        xAcceleration: null,
        xMotion: null,
        xVelocity: null,
        yAcceleration: null,
        yMotion: null,
        yVelocity: null,
        yawAcceleration: null,
        yawMotion: null,
        yawVelocity: null,
        zAcceleration: null,
        zMotion: null,
        zVelocity: null,
      },
      {
        vesselId: "IMO2",
        date: new Date("2026-03-02T00:00:00.000Z"),
        latitude: 11,
        longitude: 21,
        speed: 9,
        course: null,
        heading: null,
        displacement: null,
        fsm: null,
        gg: null,
        gm: null,
        gmFluid: null,
        kg: null,
        lcg: null,
        rxx: null,
        ryy: null,
        rzz: null,
        tAft: null,
        tFwd: null,
        tPitch: null,
        tRoll: null,
        tcg: null,
        c1: null,
        c2: null,
        c3: null,
        cTotal: null,
        parametricRollAdvanced2To1: null,
        pitchAcceleration: null,
        pitchMotion: null,
        pitchMotionPeriod: null,
        pitchVelocity: null,
        rollAcceleration: null,
        rollMotion: null,
        rollMotionPeriod: null,
        rollVelocity: null,
        xAcceleration: null,
        xMotion: null,
        xVelocity: null,
        yAcceleration: null,
        yMotion: null,
        yVelocity: null,
        yawAcceleration: null,
        yawMotion: null,
        yawVelocity: null,
        zAcceleration: null,
        zMotion: null,
        zVelocity: null,
      },
    ] as any;

    const result = filterMergedRows(
      rows,
      ["IMO1"],
      new Date("2026-03-01T00:00:00.000Z"),
      new Date("2026-03-01T12:00:00.000Z"),
    );

    expect(result).toHaveLength(1);
    expect(result[0].vesselId).toBe("IMO1");
  });

  it("keeps one continuous route when longitude jumps are within the 180° wrap threshold", () => {
    const gpsRows = [
      {
        vesselId: "IMO1",
        date: new Date("2026-03-01T00:00:00.000Z"),
        latitude: 10,
        longitude: 179,
        speed: 8,
        course: null,
        heading: null,
      },
      {
        vesselId: "IMO1",
        date: new Date("2026-03-01T00:15:00.000Z"),
        latitude: 11,
        longitude: -179,
        speed: 8,
        course: null,
        heading: null,
      },
    ] as any;

    const merged = mergeVesselData(gpsRows, [], []);

    expect(merged).toHaveLength(2);
    expect(merged[0].longitude).toBe(179);
    expect(merged[1].longitude).toBe(-179);
  });
});
