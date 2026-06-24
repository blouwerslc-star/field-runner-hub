export type SampleTemplate = {
  investor: {
    summary: string;
    fields: string[];
    deliverables: string[];
    typicalPayout: string;
  };
  runner: {
    summary: string;
    checklist: string[];
    photoRequirements: string[];
    estTime: string;
  };
};

export const SAMPLE_TEMPLATES: Record<string, SampleTemplate> = {
  property_photos: {
    investor: {
      summary: "A full exterior + interior photo set delivered same-day so you can evaluate condition without flying out.",
      fields: [
        "Property address + gate / lockbox code",
        "Access window (e.g. weekday 9a–5p)",
        "Photo focus areas (roof, HVAC, kitchen, baths, damage)",
        "Due date (default: 48 hrs)",
      ],
      deliverables: [
        "20+ geotagged photos, 12MP minimum",
        "Wide + detail shots of every room",
        "Short written condition note per area",
        "Auto-uploaded to your task page",
      ],
      typicalPayout: "$55–95",
    },
    runner: {
      summary: "Drive to the property, capture a full photo set, upload, and submit.",
      checklist: [
        "Accept task and start tracking",
        "Arrive at property (geofence confirms on-site)",
        "Walk exterior — front, sides, rear, roofline, driveway",
        "Walk interior room-by-room, wide then detail",
        "Note visible damage, leaks, or hazards in the comment field",
        "Upload all photos and submit for investor review",
      ],
      photoRequirements: [
        "Front + street view",
        "All 4 exterior elevations",
        "Each room: 1 wide + 2 detail",
        "Kitchen, bath fixtures, HVAC, water heater",
      ],
      estTime: "30–45 min on-site",
    },
  },
  occupancy_check: {
    investor: {
      summary: "Verify whether a property is occupied, vacant, or abandoned — with proof.",
      fields: [
        "Property address",
        "What you suspect (vacant / occupied / unknown)",
        "Drive-by only or knock-and-confirm",
        "Due date (default: 24 hrs)",
      ],
      deliverables: [
        "Occupancy verdict: vacant / occupied / abandoned",
        "4+ exterior photos showing key indicators",
        "Written observations (mail, lights, vehicles, yard)",
        "Timestamp + GPS pin",
      ],
      typicalPayout: "$25–45",
    },
    runner: {
      summary: "Drive past the property, observe occupancy signals, capture proof, submit.",
      checklist: [
        "Accept task and start tracking",
        "Arrive at property (geofence confirms on-site)",
        "Observe — mail buildup, lights, vehicles, yard condition, window coverings",
        "Capture required exterior photos",
        "Select verdict and write a 2–3 sentence observation note",
        "Submit for investor review",
      ],
      photoRequirements: [
        "Front of house with address visible",
        "Mailbox / front door close-up",
        "Driveway + any vehicles",
        "Yard / general upkeep wide shot",
      ],
      estTime: "10–15 min on-site",
    },
  },
  walkthrough_video: {
    investor: {
      summary: "A narrated interior walkthrough video so you can tour the property remotely.",
      fields: [
        "Property address + access details",
        "Areas to emphasize (basement, roof access, problem areas)",
        "Vertical or horizontal orientation",
        "Due date (default: 48 hrs)",
      ],
      deliverables: [
        "Single continuous HD video (3–6 min)",
        "Narrated by the runner — calling out condition + concerns",
        "Covers every room + exterior loop",
        "Uploaded to your task page, streamable + downloadable",
      ],
      typicalPayout: "$85–135",
    },
    runner: {
      summary: "Record one continuous narrated walkthrough video and upload it.",
      checklist: [
        "Accept task and start tracking",
        "Arrive at property (geofence confirms on-site)",
        "Do a dry pass to plan the route — exterior loop, then enter",
        "Record in one take: enter, room-by-room, narrate condition",
        "End on exterior loop with address mention",
        "Upload video + a few backup stills, then submit",
      ],
      photoRequirements: [
        "Final video (3–6 min, vertical HD by default)",
        "3–5 backup stills of any major concern",
      ],
      estTime: "25–40 min on-site",
    },
  },
};