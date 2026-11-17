export function buildInterviewPrompt(data) {
  let contextSnippet = "";
  if (data.resumeText && data.resumeText.trim().length > 0) {
    contextSnippet += `\nCandidate Resume Context:\n"""\n${data.resumeText}\n"""\nCRITICAL RESUME INSTRUCTIONS:\n- You MUST generate questions directly asking about the candidate's actual projects, specific work experience, and technical skills explicitly written in their resume above.\n- For example: "In your resume, you mentioned [Project Name/Technology]. How did you implement [Feature] and handle scalability?"\n- Do NOT ask generic questions. Every single question MUST reference specific details from the candidate's resume.`;
  }
  if (data.jobDescriptionText && data.jobDescriptionText.trim().length > 0) {
    contextSnippet += `\nTarget Job Description Context:\n"""\n${data.jobDescriptionText}\n"""\nCRITICAL JOB DESCRIPTION INSTRUCTIONS:\n- Align questions directly with the key responsibilities, required skills, and technology requirements listed in the Job Description.`;
  }

  return `
    You are an expert principal technical interviewer.
    Generate exactly ${data.numberOfQuestions} UNIQUE, non-repetitive interview questions tailored to the candidate profile below.

    Role: ${data.role}
    Experience Level: ${data.experience} years
    Difficulty: ${data.difficulty}
    Interview Type: ${data.interviewType}
    Session Seed / Timestamp: ${Date.now()}-${Math.random()}
    ${contextSnippet}

    REQUIREMENTS:
    1. Ensure all questions are 100% distinct from each other.
    2. Adjust question complexity to ${data.difficulty} difficulty for a candidate with ${data.experience} years of experience.
    ${data.resumeText ? "3. EVERY question MUST explicitly cite and ask about specific projects, tools, frameworks, or experience from the candidate's resume." : "3. Ask deep, realistic technical scenarios relevant to " + data.role + "."}

    Return ONLY a valid JSON array of question objects with this exact structure:
    [
        {
            "question": "Detailed contextual question text...",
            "answer": "Expected ideal answer baseline...",
            "difficulty": "${data.difficulty}",
            "topic": "${data.interviewType}"
        }
    ]
  `;
}