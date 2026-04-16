import type { TicketType } from "./types";

export interface TroubleshootingTip {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  whenToEscalate: string;
  matchLabel: string;
}

interface TipRule {
  id: string;
  title: string;
  summary: string;
  category?: string;
  types?: TicketType[];
  keywords: string[];
  steps: string[];
  whenToEscalate: string;
}

const tipRules: TipRule[] = [
  {
    id: "hvac-airflow",
    title: "Check the local thermostat and airflow",
    summary: "Many HVAC issues come from thermostat settings, tripped local controls, or blocked vents.",
    category: "Air Conditioning",
    keywords: ["air conditioning", "ac", "cooling", "temperature", "hvac", "air flow", "vent"],
    steps: [
      "Confirm the thermostat is set to the correct mode and target temperature.",
      "Check whether vents or return grilles are blocked by furniture, papers, or boxes.",
      "Listen for airflow or fan noise near the affected unit to spot a complete shutdown.",
    ],
    whenToEscalate: "Create the ticket immediately if the area is still hot, noisy, leaking, or serving a critical room.",
  },
  {
    id: "electrical-power",
    title: "Try the nearby power source first",
    summary: "A loose cable, switched outlet, or local breaker trip often looks like an equipment failure.",
    category: "Electricity / Lighting",
    keywords: ["power", "electrical", "socket", "outlet", "breaker", "voltage", "lights", "lamp"],
    steps: [
      "Test the device with another known working outlet if it is safe to do so.",
      "Check that plugs, adapters, and extension leads are firmly connected.",
      "See whether nearby lights or outlets are also affected to narrow the fault area.",
    ],
    whenToEscalate: "Escalate at once if you notice sparks, heat, burning smell, or a full area outage.",
  },
  {
    id: "plumbing-leak",
    title: "Contain the leak and note the source",
    summary: "Fast containment and a precise source description help plumbing tickets move much faster.",
    category: "Water / Plumbing",
    keywords: ["leak", "water", "pipe", "plumbing", "drip", "flood", "drain", "ceiling"],
    types: ["INCIDENT", "MAINTENANCE"],
    steps: [
      "Move equipment or papers away from the wet area if it is safe.",
      "Check whether the leak appears constant, only during rain, or only when fixtures are used.",
      "Note the exact spot where water appears first, such as ceiling panel, sink trap, or wall joint.",
    ],
    whenToEscalate: "Raise the ticket immediately if water is near power, chemicals, or public walkways.",
  },
  {
    id: "network-basic",
    title: "Run a quick network sanity check",
    summary: "A disconnected cable or local Wi-Fi issue can mimic a wider network outage.",
    category: "Internet / Wi-Fi",
    keywords: ["network", "internet", "wifi", "wi-fi", "router", "switch", "offline", "connection"],
    types: ["INCIDENT"],
    steps: [
      "Confirm whether only one user, one room, or multiple users are affected.",
      "Check visible network cables or wall jacks for loose connections.",
      "Try opening another service or website to confirm whether the issue is general or app-specific.",
    ],
    whenToEscalate: "Escalate if multiple users are down, business systems are unreachable, or security devices are impacted.",
  },
  {
    id: "projector-av",
    title: "Check the AV basics before dispatch",
    summary: "Input source, lamp state, and simple cabling checks solve many AV tickets quickly.",
    category: "Classroom Equipment",
    keywords: ["projector", "display", "screen", "speaker", "audio", "av", "microphone", "hdmi"],
    steps: [
      "Verify the correct input source is selected on the projector or display.",
      "Check HDMI, USB-C, and power connections at both device ends.",
      "Look for warning lights, overheating messages, or muted audio controls.",
    ],
    whenToEscalate: "Escalate if the room is needed soon, the lamp warning persists, or the hardware will not power on.",
  },
  {
    id: "access-reader",
    title: "Try a simple access control reset flow",
    summary: "Reader misreads and access delays are often tied to card placement, dirt, or stale device state.",
    category: "Access / Security",
    keywords: ["card", "reader", "access", "gate", "door", "badge", "turnstile", "lock"],
    steps: [
      "Retry with a known valid card and check whether the problem affects one user or everyone.",
      "Inspect the reader face for dirt, damage, or obvious obstruction.",
      "Note any blinking pattern, beeps, or lock behavior during the failed attempt.",
    ],
    whenToEscalate: "Escalate immediately if a secure area is inaccessible or a door fails in an unsafe way.",
  },
  {
    id: "general-observation",
    title: "Capture a clean issue snapshot",
    summary: "A short observation pass often turns a vague request into a fast, actionable ticket.",
    keywords: ["broken", "issue", "fault", "problem", "maintenance", "incident"],
    steps: [
      "Record when the issue started and whether it is constant or intermittent.",
      "Check if nearby rooms or similar equipment show the same symptom.",
      "Attach a photo or short note showing the exact fault location when possible.",
    ],
    whenToEscalate: "Proceed with the ticket if the problem blocks work, repeats, or affects safety.",
  },
  {
    id: "furniture-damage",
    title: "Check whether the damage is stable or spreading",
    summary: "Furniture and fixture issues are easier to prioritize when the current risk is clear.",
    category: "Furniture / Facility Damage",
    keywords: ["chair", "desk", "table", "door", "window", "broken", "damage", "furniture"],
    steps: [
      "Note whether the item is simply unusable or creates a safety risk.",
      "Move people away from unstable furniture, broken glass, or sharp edges.",
      "Add a short note explaining whether the damage is cosmetic, structural, or blocking access.",
    ],
    whenToEscalate: "Escalate immediately if the damage could injure someone or block a room from being used.",
  },
];

const starterTips: TroubleshootingTip[] = [
  {
    id: "starter-context",
    title: "Start with the symptom and impact",
    summary: "A clear title and short impact statement make both the tips panel and ticket routing more accurate.",
    steps: [
      "Mention the affected asset or room first.",
      "Add the visible symptom, such as leak, no power, no cooling, or offline network.",
      "Include who or what is blocked by the issue.",
    ],
    whenToEscalate: "Once the issue is clearly described, submit the ticket even if the exact cause is still unknown.",
    matchLabel: "Starter guidance",
  },
  {
    id: "starter-safety",
    title: "Check for any immediate safety risk",
    summary: "A fast safety scan helps decide whether the issue should become a high-priority incident.",
    steps: [
      "Look for water near power, exposed wiring, smoke, heat, or blocked exits.",
      "Keep people away from unsafe equipment or surfaces.",
      "Use the description field to note any urgent risk you observed.",
    ],
    whenToEscalate: "If there is any risk to people, equipment, or building operations, submit right away with high priority.",
    matchLabel: "Always useful",
  },
];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function getTroubleshootingTips(input: {
  title: string;
  description: string;
  category: string;
  type: TicketType;
}) {
  const title = normalizeText(input.title);
  const description = normalizeText(input.description);
  const category = normalizeText(input.category);
  const haystack = `${title} ${description}`;

  const rankedTips = tipRules
    .map((rule) => {
      let score = 0;
      const matchedKeywords = rule.keywords.filter((keyword) => haystack.includes(keyword));

      if (rule.category && normalizeText(rule.category) === category) {
        score += 4;
      }

      if (rule.types?.includes(input.type)) {
        score += 1;
      }

      score += matchedKeywords.length * 2;

      if (!title && !description && score === 0 && rule.category) {
        return null;
      }

      return {
        score,
        tip: {
          id: rule.id,
          title: rule.title,
          summary: rule.summary,
          steps: rule.steps,
          whenToEscalate: rule.whenToEscalate,
          matchLabel:
            matchedKeywords.length > 0
              ? `Matched: ${matchedKeywords.slice(0, 2).join(", ")}`
              : rule.category && normalizeText(rule.category) === category
                ? `Suggested for ${rule.category}`
                : "Helpful quick check",
        } satisfies TroubleshootingTip,
      };
    })
    .filter((item): item is { score: number; tip: TroubleshootingTip } => Boolean(item))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((item) => item.tip);

  if (rankedTips.length > 0) {
    return rankedTips;
  }

  return starterTips;
}
