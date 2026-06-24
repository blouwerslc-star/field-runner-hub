export type ServiceExample = {
  investor: {
    summary: string;
    fields: string[];
    typicalPayout: string;
  };
  runner: {
    summary: string;
    checklist: string[];
    estTime: string;
  };
};

export const LANDING_SERVICE_EXAMPLES: Record<string, ServiceExample> = {
  "Property Photos": {
    investor: {
      summary: "A full exterior + interior photo set delivered same-day so you can underwrite without flying out.",
      fields: [
        "Address + gate / lockbox code",
        "Focus areas (roof, HVAC, kitchen, baths)",
        "Due date (default 48 hrs)",
      ],
      typicalPayout: "$55–95",
    },
    runner: {
      summary: "Drive to the property, capture a full photo set, upload, submit.",
      checklist: [
        "Arrive on-site (geofence confirms)",
        "Capture exterior + every room (wide + detail)",
        "Upload 20+ geotagged photos and submit",
      ],
      estTime: "30–45 min on-site",
    },
  },
  "Walkthrough Videos": {
    investor: {
      summary: "A narrated interior walkthrough so you can tour the property remotely.",
      fields: [
        "Address + access details",
        "Areas to emphasize (basement, problem areas)",
        "Vertical or horizontal orientation",
      ],
      typicalPayout: "$85–135",
    },
    runner: {
      summary: "Record one continuous narrated walkthrough video and upload it.",
      checklist: [
        "Plan a route with a quick dry pass",
        "Record 3–6 min: exterior loop → room-by-room, narrate condition",
        "Upload video + a few backup stills, submit",
      ],
      estTime: "25–40 min on-site",
    },
  },
  "Drive-By Reports": {
    investor: {
      summary: "Quick exterior check with photos and condition notes — no interior access needed.",
      fields: [
        "Property address",
        "What to look for (damage, squatters, upkeep)",
        "Due date (default 24 hrs)",
      ],
      typicalPayout: "$20–35",
    },
    runner: {
      summary: "Drive past, capture exterior, note conditions, submit.",
      checklist: [
        "Arrive on-site (geofence confirms)",
        "Capture 4+ exterior photos with address visible",
        "Write 2–3 sentence condition note and submit",
      ],
      estTime: "10–15 min on-site",
    },
  },
  "Occupancy Checks": {
    investor: {
      summary: "Verify whether a property is occupied, vacant, or abandoned — with photo proof.",
      fields: [
        "Property address",
        "What you suspect (vacant / occupied / unknown)",
        "Drive-by only or knock-and-confirm",
      ],
      typicalPayout: "$25–45",
    },
    runner: {
      summary: "Observe occupancy signals, capture proof, deliver a verdict.",
      checklist: [
        "Observe mail, lights, vehicles, yard, window coverings",
        "Capture required exterior photos (front, mailbox, driveway)",
        "Select verdict + write observations, submit",
      ],
      estTime: "10–15 min on-site",
    },
  },
  "Sign & Lockbox Placement": {
    investor: {
      summary: "Install or retrieve a sign, lockbox, or other item at the property.",
      fields: [
        "Property address + placement instructions",
        "Item provided on-site or runner picks up",
        "Photo proof of placement required",
      ],
      typicalPayout: "$35–65",
    },
    runner: {
      summary: "Arrive, install/retrieve the item, photograph it in place, submit.",
      checklist: [
        "Arrive on-site (geofence confirms)",
        "Install / retrieve per instructions",
        "Capture before + after photos and submit",
      ],
      estTime: "15–25 min on-site",
    },
  },
  "Custom Field Tasks": {
    investor: {
      summary: "Meet a contractor, take a measurement, check a tenant turn — set your own scope.",
      fields: [
        "Address + clear scope of work",
        "Required deliverables (photos, notes, video)",
        "Time window the runner must be on-site",
      ],
      typicalPayout: "$40–120",
    },
    runner: {
      summary: "Execute the investor's custom scope and deliver the requested proof.",
      checklist: [
        "Arrive in the requested window (geofence confirms)",
        "Complete the scope as written",
        "Upload required deliverables + notes, submit",
      ],
      estTime: "varies by scope",
    },
  },
};