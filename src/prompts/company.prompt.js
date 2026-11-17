/**
 * IMPORTANT DISCLAIMER — used in every company interview prompt:
 * These are AI-generated practice questions INSPIRED by publicly known
 * general hiring patterns for this company. They are NOT official questions
 * from the company and are meant purely for interview preparation.
 */

export const COMPANY_PROFILES = {
  google: {
    label: "Google",
    roundTypes: ["Online Assessment (OA)", "Technical Phone Screen", "Onsite - Coding Rounds (x4)", "Behavioral / Googleyness Round"],
    focusAreas: ["Data Structures & Algorithms", "System Design", "Problem Solving", "Leadership & Culture Fit"],
    difficultyNote: "Google interviews are heavily algorithm and problem-solving focused. Expect LeetCode Hard-level DSA, large-scale system design, and behavioral questions using the STAR method.",
    suggestedTypes: ["DSA", "System design", "Behavioral"],
  },
  amazon: {
    label: "Amazon",
    roundTypes: ["Online Assessment (OA)", "Technical Phone Screen", "Onsite (Bar Raiser + Technical + Behavioral)"],
    focusAreas: ["Leadership Principles", "DSA & Coding", "System Design at Scale", "Behavioral STAR Stories"],
    difficultyNote: "Amazon heavily evaluates Leadership Principles (LPs) in every round. Expect 1-2 LP behavioral stories per technical round. System design questions focus on high-traffic, distributed systems.",
    suggestedTypes: ["DSA", "Behavioral", "System design"],
  },
  microsoft: {
    label: "Microsoft",
    roundTypes: ["Recruiter Screen", "Technical Phone Screen", "Onsite (Design + Coding + Behavioral)", "As-Appropriate Interview"],
    focusAreas: ["Coding & Problem Solving", "OOP Design", "System Design", "Culture & Growth Mindset"],
    difficultyNote: "Microsoft emphasizes Object-Oriented Design and clean code patterns. System design focuses on Azure-scale. Growth mindset and collaboration stories are key in behavioral rounds.",
    suggestedTypes: ["MERN", "DSA", "System design", "Behavioral"],
  },
  meta: {
    label: "Meta (Facebook)",
    roundTypes: ["Recruiter Screen", "Technical Phone Screen (x2)", "Onsite - Coding (x2) + System Design + Behavioral"],
    focusAreas: ["Advanced DSA (Graphs, Trees)", "Product System Design", "Behavioral (Handling conflicts, scale)"],
    difficultyNote: "Meta focuses on advanced DSA (trees, graphs, dynamic programming) and product-centric system design. Strong emphasis on measurable impact in behavioral stories.",
    suggestedTypes: ["DSA", "System design", "Behavioral"],
  },
  infosys: {
    label: "Infosys",
    roundTypes: ["Online Test (Aptitude + Coding)", "Technical Interview", "HR Interview"],
    focusAreas: ["Core CS Fundamentals", "OOP Concepts", "Basic DSA", "Project Discussion", "HR & Communication"],
    difficultyNote: "Infosys interviews focus on core CS fundamentals, OOP concepts, and basic data structures. Freshers interviews heavily include aptitude, project discussion, and HR rounds.",
    suggestedTypes: ["DSA", "HR", "MERN", "Behavioral"],
  },
  tcs: {
    label: "TCS",
    roundTypes: ["TCS NQT (Online Test)", "Technical Interview", "Managerial Interview", "HR Interview"],
    focusAreas: ["Aptitude & Reasoning", "Core CS & Programming", "Project Discussion", "HR Communication"],
    difficultyNote: "TCS interviews include NQT aptitude + coding, followed by technical and HR rounds. Expect questions on core CS, your final year project, and communication skills.",
    suggestedTypes: ["DSA", "HR", "Behavioral"],
  },
  accenture: {
    label: "Accenture",
    roundTypes: ["Online Assessment (Cognitive + Technical)", "Communication Test", "Technical Interview", "HR Interview"],
    focusAreas: ["Aptitude & Logic", "Basic Coding", "Communication Skills", "Situational Judgment", "HR Personality"],
    difficultyNote: "Accenture focuses on communication skills and situational judgment alongside technical basics. HR round assesses cultural fit and adaptability.",
    suggestedTypes: ["Behavioral", "HR", "DSA"],
  },
  deloitte: {
    label: "Deloitte",
    roundTypes: ["Aptitude + Verbal Test", "Group Discussion", "Technical Interview", "HR Interview"],
    focusAreas: ["Problem Solving", "Analytics & Consulting mindset", "Technical Fundamentals", "Leadership Scenarios"],
    difficultyNote: "Deloitte Tech interviews combine consulting-style problem solving with technical knowledge. Expect questions on analytics, logical reasoning, and leadership scenarios.",
    suggestedTypes: ["Behavioral", "DSA", "System design", "HR"],
  },
  wipro: {
    label: "Wipro",
    roundTypes: ["Online Test (Aptitude + Coding)", "Technical Interview", "HR Interview"],
    focusAreas: ["Core Programming", "OOP Concepts", "DSA Basics", "Project Discussion", "Soft Skills"],
    difficultyNote: "Wipro interviews include an online test followed by technical and HR rounds. Focus on OOP, core CS concepts, and your project experience.",
    suggestedTypes: ["DSA", "MERN", "HR", "Behavioral"],
  },
  cognizant: {
    label: "Cognizant (CTS)",
    roundTypes: ["Online Assessment", "Technical Interview", "HR Interview"],
    focusAreas: ["Core CS & Programming", "SQL & Databases", "OOP", "Project Experience", "Communication"],
    difficultyNote: "Cognizant emphasizes core programming fundamentals, OOP, databases, and project discussion. Communication is assessed throughout.",
    suggestedTypes: ["DSA", "MERN", "HR"],
  },
  capgemini: {
    label: "Capgemini",
    roundTypes: ["Pseudo Code Test", "Behavioral Assessment", "Technical Interview", "HR Interview"],
    focusAreas: ["Pseudo Code & Logic", "Core Programming", "Behavioral Scenarios", "Communication"],
    difficultyNote: "Capgemini's Pseudo Code assessment is unique—it tests logical thinking without requiring a specific language. Behavioral and communication rounds are key.",
    suggestedTypes: ["DSA", "Behavioral", "HR"],
  },
  apple: {
    label: "Apple",
    roundTypes: ["Phone Screen", "Technical Interviews (x4-x6)", "Final Review"],
    focusAreas: ["Advanced DSA", "System Design", "iOS/macOS Specific Design", "Culture & Passion for Apple Products"],
    difficultyNote: "Apple interviews are rigorous, focusing on advanced algorithms, domain-specific design (iOS/macOS), and deep passion for products. Behavioral alignment with Apple's culture is critical.",
    suggestedTypes: ["DSA", "System design", "Behavioral"],
  },
  netflix: {
    label: "Netflix",
    roundTypes: ["Phone Screen", "Technical Screen", "Onsite (System Design + Coding + Culture Fit)"],
    focusAreas: ["System Design at Scale", "Advanced Coding", "Culture Fit (Freedom & Responsibility)", "Distributed Systems"],
    difficultyNote: "Netflix focuses heavily on system design at massive scale and culture alignment with their 'Freedom and Responsibility' values. Coding problems are advanced.",
    suggestedTypes: ["System design", "DSA", "Behavioral"],
  },
};

export const DISCLAIMER =
  "⚠️ DISCLAIMER: These are AI-generated practice questions INSPIRED by publicly known general hiring patterns for this company. They are NOT official questions sourced from the company. Treat them as realistic AI-powered mock interview preparation.";

export function buildCompanyInterviewPrompt(data) {
  const companyKey = (data.company || "").toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, "");
  const profile = COMPANY_PROFILES[companyKey] || null;

  let companyContext = "";
  if (profile) {
    companyContext = `
Company: ${profile.label}
Typical Interview Rounds: ${profile.roundTypes.join(" → ")}
Core Focus Areas: ${profile.focusAreas.join(", ")}
Difficulty Note: ${profile.difficultyNote}
`;
  } else {
    companyContext = `
Company: ${data.company}
Note: Specific data for this company is not available. Generate realistic practice questions based on general software engineering hiring patterns for mid-to-large tech companies.
`;
  }

  return `
You are an expert technical interviewer conducting a mock interview INSPIRED BY the hiring style of ${data.company}.

IMPORTANT DISCLAIMER: You are generating AI-powered practice questions inspired by publicly known general hiring patterns. These are NOT official interview questions from ${data.company}.

${companyContext}

Candidate Profile:
- Role: ${data.role}
- Experience: ${data.experience} years
- Difficulty: ${data.difficulty}
- Interview Focus: ${data.interviewType}
- Session Seed: ${Date.now()}-${Math.random()}

REQUIREMENTS:
1. Generate exactly ${data.numberOfQuestions} UNIQUE, non-repetitive interview questions.
2. Questions should REFLECT the company's known interview style (e.g., Amazon LP-focused, Google DSA-heavy, Infosys core CS).
3. Calibrate difficulty to ${data.difficulty} for ${data.experience} years of experience.
4. Include a mix aligned with the company's focus areas: ${profile?.focusAreas?.join(", ") || "DSA, Technical, Behavioral"}.
5. For behavioral questions, frame them in the company's style (e.g., Amazon uses STAR + Leadership Principles).
6. Do NOT fabricate that these are real questions from ${data.company}'s question bank.

Return ONLY a valid JSON array:
[
    {
        "question": "Detailed question text...",
        "answer": "Expected ideal answer baseline...",
        "difficulty": "${data.difficulty}",
        "topic": "${data.company} - ${data.interviewType}"
    }
]
`;
}
