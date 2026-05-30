// REI Runner Academy — module content. Keep this file editable; it drives the UI.
// Modules: lessons (text/video/pdf) + a 5-question knowledge quiz. Pass = 80%.

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correct: number; // index into options
};

export type AcademySection = {
  id: string;
  title: string;
  body: string;
  videoUrl?: string;
  pdfUrl?: string;
};

export type AcademyModule = {
  id: string;
  order: number;
  title: string;
  summary: string;
  duration: string;
  sections: AcademySection[];
  quiz: QuizQuestion[];
};

export const PASS_THRESHOLD = 80; // percent

export const ACADEMY_MODULES: AcademyModule[] = [
  {
    id: "welcome",
    order: 1,
    title: "Welcome to REI Runner",
    summary: "What REI Runner is, who uses it, and how runners earn.",
    duration: "10 min",
    sections: [
      {
        id: "what-is",
        title: "What is REI Runner?",
        body: "REI Runner connects real estate investors with local independent contractors (runners) for on-site field work: photos, walkthrough videos, occupancy checks, drive-bys, sign and lockbox placement, and other simple tasks. You're paid per task you complete — no shifts, no quotas, no middleman.",
      },
      {
        id: "ic-status",
        title: "Your status: independent contractor",
        body: "Runners are independent contractors, not employees. You decide which tasks to accept, when to work, and how you organize your day. You're responsible for your own taxes, transportation, and equipment (phone, vehicle).",
      },
      {
        id: "expectations",
        title: "What investors expect",
        body: "Investors are buying eyes on a property they can't visit. They expect timely communication, accurate observations, clear photos/videos, and honest condition reporting. Showing up on time and uploading deliverables promptly is the single most important driver of repeat work.",
      },
    ],
    quiz: [
      { id: "q1", prompt: "Runners on REI Runner are…", options: ["W-2 employees", "Independent contractors", "Licensed real estate agents", "Brokerage staff"], correct: 1 },
      { id: "q2", prompt: "Pay is structured as…", options: ["Hourly", "Salary", "Per completed task", "Commission on property sales"], correct: 2 },
      { id: "q3", prompt: "Why do investors hire runners?", options: ["To sell properties", "To physically see a property they can't visit", "To provide legal advice", "To perform inspections"], correct: 1 },
      { id: "q4", prompt: "Which single factor most drives repeat work?", options: ["Charging the lowest price", "Owning expensive equipment", "Showing up on time and uploading promptly", "Living in a big city"], correct: 2 },
      { id: "q5", prompt: "Who pays your self-employment taxes?", options: ["REI Runner", "The investor", "You do", "Stripe"], correct: 2 },
    ],
  },
  {
    id: "photo-standards",
    order: 2,
    title: "Property Photography Standards",
    summary: "How to deliver investor-grade property photos every time.",
    duration: "15 min",
    sections: [
      {
        id: "minimum-shots",
        title: "Minimum required shots",
        body: "Every photo set includes: street view from both directions, full front of house, both side yards, full back of house, roofline, driveway/garage, front door close-up, and a clear shot of the address numbers. Interior tasks add every room, every bathroom, kitchen from two angles, utility room, and any visible defects.",
      },
      {
        id: "technical",
        title: "Technical standards",
        body: "Hold phone horizontally (landscape). Tap to focus. Keep horizon level. Avoid finger over the lens. Shoot during daylight when possible. Geotagging and timestamps must be enabled in your camera settings — investors rely on these.",
      },
      {
        id: "what-to-avoid",
        title: "What to avoid",
        body: "No filters, no edits, no zoom. Don't include yourself, other people, or vehicles other than the subject property in the frame when possible. Never photograph through windows of an occupied home.",
      },
    ],
    quiz: [
      { id: "q1", prompt: "Photos should be taken in…", options: ["Portrait orientation", "Landscape orientation", "Square crop", "Whatever feels right"], correct: 1 },
      { id: "q2", prompt: "Which is required on every exterior shoot?", options: ["A drone shot", "Address numbers", "An aerial view", "A neighborhood map"], correct: 1 },
      { id: "q3", prompt: "Geotagging and timestamps should be…", options: ["Disabled for privacy", "Enabled", "Optional", "Added manually later"], correct: 1 },
      { id: "q4", prompt: "Editing/filtering photos is…", options: ["Encouraged", "Not allowed", "Required", "Allowed for color only"], correct: 1 },
      { id: "q5", prompt: "If a property is occupied you should…", options: ["Photograph through windows", "Knock and ask to enter", "Stay on public right-of-way and not photograph occupants", "Skip the task entirely"], correct: 2 },
    ],
  },
  {
    id: "video-standards",
    order: 3,
    title: "Walkthrough Video Standards",
    summary: "Filming clear, narrated walkthroughs that underwrite a deal.",
    duration: "15 min",
    sections: [
      {
        id: "setup",
        title: "Setup",
        body: "Use horizontal orientation. Wipe the lens. Walk at a slow, steady pace — about half normal walking speed. Don't pan quickly. Keep both hands on the phone.",
      },
      {
        id: "narration",
        title: "Narration",
        body: "Speak clearly. Announce each room as you enter (\"entering the primary bedroom\"). Call out visible condition issues (water stains, missing flooring, broken fixtures). Do not speculate about repair cost or value.",
      },
      {
        id: "coverage",
        title: "Required coverage",
        body: "Exterior front, walk the property line if accessible, enter through the agreed entry, then every room, every bathroom, kitchen, utility/mechanical room, attic access if visible, and exit. Total length should be 5–15 minutes depending on property size.",
      },
    ],
    quiz: [
      { id: "q1", prompt: "Walkthrough videos are shot in…", options: ["Portrait", "Landscape", "Square", "Either"], correct: 1 },
      { id: "q2", prompt: "Your walking pace should be…", options: ["Normal speed", "Faster than normal", "About half normal speed", "A run"], correct: 2 },
      { id: "q3", prompt: "Narration should…", options: ["Estimate repair cost", "Announce rooms and call out visible issues", "Recommend an offer price", "Stay silent"], correct: 1 },
      { id: "q4", prompt: "Typical walkthrough length is…", options: ["30 seconds", "1–2 minutes", "5–15 minutes", "Over an hour"], correct: 2 },
      { id: "q5", prompt: "If you spot water damage you should…", options: ["Skip filming it", "Describe what you see, not what caused it", "Recommend a contractor", "Estimate the repair cost"], correct: 1 },
    ],
  },
  {
    id: "occupancy",
    order: 4,
    title: "Occupancy Check Procedures",
    summary: "Safely and accurately determine vacant / occupied / abandoned status.",
    duration: "12 min",
    sections: [
      {
        id: "stay-safe",
        title: "Stay safe first",
        body: "Do not enter any property unless the task explicitly authorizes interior access. Stay on public right-of-way or driveway. Do not approach occupants aggressively. If you feel unsafe, leave and report it.",
      },
      {
        id: "signs",
        title: "What to look for",
        body: "Signs of occupancy: vehicles in driveway, lights on, blinds in normal positions, lawn maintained, mail not overflowing, sounds from inside. Signs of vacancy: utility meters not spinning, mail piling up, overgrown grass, lockbox already in place, no curtains. Signs of abandonment: boarded windows, code violation notices, severe disrepair, squatter evidence.",
      },
      {
        id: "reporting",
        title: "Reporting",
        body: "Pick ONE status: vacant, occupied, or abandoned. Include exterior photos and a brief written observation describing the signs that led to your call. Never claim certainty about who lives there.",
      },
    ],
    quiz: [
      { id: "q1", prompt: "Should you enter an occupied property to check inside?", options: ["Yes, always", "Only if no one is home", "Only if the task explicitly authorizes interior access", "Yes if the door is unlocked"], correct: 2 },
      { id: "q2", prompt: "A sign of vacancy is…", options: ["Cars in driveway", "Mail piling up", "Lights on at night", "Trash bins out"], correct: 1 },
      { id: "q3", prompt: "You must choose…", options: ["Multiple statuses", "Only vacant or occupied", "One: vacant, occupied, or abandoned", "Whichever sounds best"], correct: 2 },
      { id: "q4", prompt: "If you feel unsafe you should…", options: ["Push through", "Leave and report it", "Call the police first", "Knock louder"], correct: 1 },
      { id: "q5", prompt: "Your written report should include…", options: ["A guess about who lives there", "An offer price", "Observed signs that led to your status call", "Nothing — photos are enough"], correct: 2 },
    ],
  },
  {
    id: "lockbox",
    order: 5,
    title: "Lockbox Installation Procedures",
    summary: "How to install, photograph, and securely communicate lockbox codes.",
    duration: "10 min",
    sections: [
      {
        id: "placement",
        title: "Placement",
        body: "Install at the agreed location (typically a hose bib, gas meter pipe, or the front door knob if specified). Make sure the box is firmly seated and the shackle is fully engaged. The box should not be visible from the street unless the investor requests it.",
      },
      {
        id: "confirmation-photo",
        title: "Confirmation photo",
        body: "Take two photos: one wide shot showing where the box is located on the property, and one close-up showing the box itself. Geotag and timestamp must be enabled.",
      },
      {
        id: "code-handoff",
        title: "Code handoff",
        body: "Deliver the code ONLY through the REI Runner app messaging. Never text or email the code to a personal phone or address. Never share the code with anyone other than the investor who posted the task.",
      },
    ],
    quiz: [
      { id: "q1", prompt: "How should the lockbox code be delivered?", options: ["SMS to the investor's personal phone", "Inside the REI Runner app messaging", "Email", "Posted on the front door"], correct: 1 },
      { id: "q2", prompt: "How many confirmation photos are required?", options: ["None", "One", "Two (wide + close-up)", "Five"], correct: 2 },
      { id: "q3", prompt: "The box should be installed…", options: ["Wherever convenient", "At the agreed location specified in the task", "Always on the front door", "Always on the gas meter"], correct: 1 },
      { id: "q4", prompt: "May you share the code with anyone else on the property?", options: ["Yes, neighbors", "Yes, agents on site", "Only the investor who posted the task", "Anyone who asks"], correct: 2 },
      { id: "q5", prompt: "Before leaving you should verify…", options: ["The shackle is fully engaged", "Nothing", "The code works on a different lockbox", "The neighbor's mail"], correct: 0 },
    ],
  },
  {
    id: "conduct",
    order: 6,
    title: "Professional Conduct and Safety",
    summary: "How runners represent themselves, stay safe, and avoid legal exposure.",
    duration: "12 min",
    sections: [
      {
        id: "what-you-may-not-do",
        title: "What runners may NOT do",
        body: "Runners may not: enter occupied properties without authorization, negotiate contracts, provide legal or real estate advice, perform licensed inspections, or misrepresent themselves as agents, brokers, or inspectors. Always identify yourself as an REI Runner field contractor if asked.",
      },
      {
        id: "safety",
        title: "Personal safety",
        body: "Park in well-lit areas. Tell someone your route. Stay aware of surroundings. Do not engage with hostile occupants — leave and report. If a property looks dangerous (structural damage, animals, hazardous materials), stop and report rather than proceeding.",
      },
      {
        id: "communication",
        title: "Communication",
        body: "All client communication stays inside REI Runner messaging. Do not give out your personal phone, email, or social handles. Do not solicit work outside the platform — it's a violation of the IC agreement and grounds for removal.",
      },
    ],
    quiz: [
      { id: "q1", prompt: "Which of these is a runner allowed to do?", options: ["Negotiate a purchase contract", "Provide legal advice", "Take photos and report observations", "Perform a licensed inspection"], correct: 2 },
      { id: "q2", prompt: "If a property has clear structural damage you should…", options: ["Enter anyway", "Stop and report it", "Try to fix it", "Ignore it"], correct: 1 },
      { id: "q3", prompt: "Where should client communication happen?", options: ["Inside REI Runner messaging", "Personal text", "Personal email", "WhatsApp"], correct: 0 },
      { id: "q4", prompt: "Soliciting work off-platform is…", options: ["Encouraged", "Allowed if the investor agrees", "A violation of the IC agreement", "Required after 3 tasks"], correct: 2 },
      { id: "q5", prompt: "If asked who you are, you say…", options: ["A real estate agent", "An inspector", "An REI Runner field contractor", "Whatever sounds best"], correct: 2 },
    ],
  },
];

export function getModule(id: string): AcademyModule | undefined {
  return ACADEMY_MODULES.find((m) => m.id === id);
}