import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

const FIELD_RUNNER_SHEET = "Field Runners";
const PRO_SHEET = "Real Estate Pros";

const FIELD_RUNNER_HEADERS = [
  "Submitted At", "Full Name", "Email", "Phone", "City", "State",
  "Has Transportation", "Has Smartphone", "Services", "Availability",
  "Experience", "Sample URL", "Disclaimer Agreed",
];

const PRO_HEADERS = [
  "Submitted At", "Full Name", "Email", "Phone", "Company", "Role",
  "Market City", "Market State", "Services Needed", "Frequency",
  "Budget", "Urgency", "Details",
];

function authHeaders() {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!GOOGLE_SHEETS_API_KEY) throw new Error("GOOGLE_SHEETS_API_KEY is not configured");
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_SHEETS_API_KEY,
    "Content-Type": "application/json",
  };
}

async function getStoredSpreadsheetId(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "applications_spreadsheet_id")
    .maybeSingle();
  return data?.value ?? null;
}

async function saveSpreadsheetId(id: string) {
  await supabaseAdmin
    .from("app_settings")
    .upsert({ key: "applications_spreadsheet_id", value: id, updated_at: new Date().toISOString() });
}

async function createSpreadsheet(): Promise<string> {
  const res = await fetch(`${GATEWAY_URL}/spreadsheets`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      properties: { title: "REI Runner — Applications" },
      sheets: [
        { properties: { title: FIELD_RUNNER_SHEET } },
        { properties: { title: PRO_SHEET } },
      ],
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Sheets create failed [${res.status}]: ${body}`);
  const json = JSON.parse(body) as { spreadsheetId: string };

  // Seed headers in both tabs.
  await Promise.all([
    appendValues(json.spreadsheetId, FIELD_RUNNER_SHEET, [FIELD_RUNNER_HEADERS]),
    appendValues(json.spreadsheetId, PRO_SHEET, [PRO_HEADERS]),
  ]);

  return json.spreadsheetId;
}

async function appendValues(spreadsheetId: string, sheet: string, values: (string | number | boolean)[][]) {
  const range = `${sheet}!A1`;
  const url = `${GATEWAY_URL}/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets append failed [${res.status}]: ${body}`);
  }
}

async function getOrCreateSpreadsheetId(): Promise<string> {
  let id = await getStoredSpreadsheetId();
  if (id) return id;
  id = await createSpreadsheet();
  await saveSpreadsheetId(id);
  return id;
}

export async function appendFieldRunner(row: {
  full_name: string; email: string; phone: string; city: string; state: string;
  has_transportation: string; has_smartphone: string; services: string[];
  availability: string; experience: string; sample_url: string; disclaimer_agreed: boolean;
}) {
  try {
    const id = await getOrCreateSpreadsheetId();
    await appendValues(id, FIELD_RUNNER_SHEET, [[
      new Date().toISOString(), row.full_name, row.email, row.phone, row.city, row.state,
      row.has_transportation, row.has_smartphone, row.services.join(", "),
      row.availability, row.experience, row.sample_url, row.disclaimer_agreed ? "Yes" : "No",
    ]]);
  } catch (err) {
    console.error("appendFieldRunner to Sheets failed:", err);
  }
}

export async function appendPro(row: {
  full_name: string; email: string; phone: string; company_name: string; role: string;
  market_city: string; market_state: string; services_needed: string[]; frequency: string;
  budget: string; urgency: string; details: string;
}) {
  try {
    const id = await getOrCreateSpreadsheetId();
    await appendValues(id, PRO_SHEET, [[
      new Date().toISOString(), row.full_name, row.email, row.phone, row.company_name, row.role,
      row.market_city, row.market_state, row.services_needed.join(", "),
      row.frequency, row.budget, row.urgency, row.details,
    ]]);
  } catch (err) {
    console.error("appendPro to Sheets failed:", err);
  }
}