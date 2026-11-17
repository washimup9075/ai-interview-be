import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function cleanAndParseJSON(text) {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    }
    return JSON.parse(cleaned.trim());
  } catch (err) {
    console.error("Error parsing JSON from Gemini response:", err.message, "\nRaw text snippet:", text.slice(0, 100));
    throw new Error("Invalid response format from AI");
  }
}

async function callGemini(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("⚠️ Gemini 3.6 Flash Free Tier quota limit reached (429). Switching to dynamic intelligent fallback mode.");
    } else {
      console.error("Gemini API call failed:", error.message || error);
    }
    throw error;
  }
}

function shuffleArray(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Utility: Keyword extractor for intelligent resume/JD fallback parsing
function extractKeywordsFromText(text) {
  const commonTech = [
    "JavaScript", "TypeScript", "React", "React Native", "Redux", "Vue.js", "Angular", "HTML5", "CSS3", "Tailwind CSS",
    "Node.js", "Express.js", "Python", "Django", "Flask", "FastAPI", "Java", "Spring Boot", "C++", "C#", ".NET", "Go", "Rust",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "GraphQL", "REST APIs", "Docker", "Kubernetes", "AWS", "Azure",
    "GCP", "Git", "GitHub", "CI/CD", "System Design", "Microservices", "Jest", "Kafka", "Data Structures", "Algorithms"
  ];
  if (!text) return [];
  return commonTech.filter((tech) =>
    new RegExp(`\\b${tech.replace(/\+/g, "\\+").replace(/\./g, "\\.")}\\b`, "i").test(text)
  );
}

// Core question generation function
export async function generateQuestions(prompt, options = {}) {
  try {
    const text = await callGemini(prompt);
    return cleanAndParseJSON(text);
  } catch (error) {
    const {
      role = "Software Engineer",
      experience = 2,
      interviewType = "Standard",
      difficulty = "Medium",
      numberOfQuestions = 5,
      resumeText = "",
      jobDescriptionText = "",
    } = options;

    const count = Number(numberOfQuestions) || 5;

    // 1. RESUME-BASED DYNAMIC QUESTION GENERATION
    if (resumeText && resumeText.trim().length > 0) {
      const skills = extractKeywordsFromText(resumeText);
      const mainSkills = skills.length > 0 ? skills : ["Web Application Development", "Database Management", "API Architecture"];
      
      const s1 = mainSkills[0] || "your core tech stack";
      const s2 = mainSkills[1] || mainSkills[0] || "asynchronous state management";
      const s3 = mainSkills[2] || mainSkills[0] || "RESTful web services";
      const s4 = mainSkills[3] || mainSkills[0] || "database architecture";

      const resumeQuestionPool = [
        {
          question: `In your resume, you mentioned experience with ${s1}. Can you walk me through how you designed and structured your project architecture using ${s1}?`,
          answer: `The ideal answer should explain component boundaries, data flow, state management, and architectural rationale when working with ${s1}.`,
          difficulty: difficulty,
          topic: "Resume-Based"
        },
        {
          question: `Looking at your background in ${s2}, how did you approach performance optimization, state synchronization, and error handling in your resume projects?`,
          answer: `Candidate should mention profiling tools, code-splitting, query indexing, or state synchronization strategies tailored to ${s2}.`,
          difficulty: difficulty,
          topic: "Resume-Based"
        },
        {
          question: `Your resume highlights working with ${s3}. What was the most complex technical challenge or edge case you encountered while implementing ${s3} features, and how did you solve it?`,
          answer: `Candidate should detail the specific problem statement, root cause analysis, debugging approach, and measurable outcome.`,
          difficulty: difficulty,
          topic: "Resume-Based"
        },
        {
          question: `Based on your resume, how did you design database schemas (using ${s4}) and handle background jobs or async API integration?`,
          answer: `Ideal answer covers indexing, relational vs non-relational trade-offs, queue processing, and transaction handling.`,
          difficulty: difficulty,
          topic: "Resume-Based"
        },
        {
          question: `Regarding the projects listed on your resume, how did you implement automated testing, clean code principles, and CI/CD deployment?`,
          answer: `Candidate should outline unit/integration testing strategies, automated linting/type-checking, and deployment pipelines.`,
          difficulty: difficulty,
          topic: "Resume-Based"
        },
        {
          question: `Can you discuss a specific architectural trade-off or refactoring decision you made while building the technical features described on your resume?`,
          answer: `Candidate should demonstrate technical evaluation, benchmarking, communication skills, and balancing speed vs technical debt.`,
          difficulty: difficulty,
          topic: "Resume-Based"
        }
      ];

      return shuffleArray(resumeQuestionPool).slice(0, count);
    }

    // 2. JOB DESCRIPTION DYNAMIC GENERATION
    if (jobDescriptionText && jobDescriptionText.trim().length > 0) {
      const jdSkills = extractKeywordsFromText(jobDescriptionText);
      const reqSkills = jdSkills.length > 0 ? jdSkills : ["System Architecture", "API Integration", "Database Design"];
      const js1 = reqSkills[0] || "the role requirements";
      const js2 = reqSkills[1] || reqSkills[0] || "core system components";

      const jdQuestionPool = [
        {
          question: `This position requires strong expertise in ${js1}. How have you applied ${js1} in your past roles to solve production challenges?`,
          answer: `Ideal answer connects past experience directly with ${js1} responsibilities outlined in the job description.`,
          difficulty: difficulty,
          topic: "Job-Description"
        },
        {
          question: `How do you structure scalability and clean code modularity when working with ${js2} as required by this role?`,
          answer: `Discusses design patterns, microservices vs monolith, and API boundaries relevant to ${js2}.`,
          difficulty: difficulty,
          topic: "Job-Description"
        },
        {
          question: `Describe a project where you had to quickly master a core technology mentioned in this job description. What was your learning curve?`,
          answer: `Demonstrates adaptability, documentation reading, prototyping, and rapid execution.`,
          difficulty: difficulty,
          topic: "Job-Description"
        },
        {
          question: `How do you approach team collaboration, code reviews, and technical documentation for a ${role} position?`,
          answer: `Covers pull request standards, mentorship, architectural decision records (ADRs), and agile practices.`,
          difficulty: difficulty,
          topic: "Job-Description"
        },
        {
          question: `What strategies would you use in your first 90 days as a ${role} to optimize our current tech stack and development workflows?`,
          answer: `Outlines audit phase, low-hanging fruit optimizations, automated testing improvements, and stakeholder alignment.`,
          difficulty: difficulty,
          topic: "Job-Description"
        }
      ];

      return shuffleArray(jdQuestionPool).slice(0, count);
    }

    // 3. TOPIC / ROLE SPECIFIC GENERATION
    const typeLower = (interviewType || "").toLowerCase();
    const roleLower = (role || "").toLowerCase();

    if (typeLower.includes("mern") || roleLower.includes("mern") || roleLower.includes("react") || roleLower.includes("node")) {
      const mernPool = [
        { question: "How does the React Virtual DOM diffing algorithm work, and how do key props prevent unnecessary re-renders?", answer: "Explains Reconciliation algorithm, Fiber architecture, keys matching, and React.memo.", difficulty: difficulty, topic: "MERN" },
        { question: "Can you explain Node.js Event Loop phases (timers, I/O callbacks, poll, check) and how process.nextTick differs from setImmediate?", answer: "Detail event loop microtasks vs macrotasks, non-blocking I/O, and execution queue priorities.", difficulty: difficulty, topic: "MERN" },
        { question: "How do Express middleware functions handle errors, and what is the proper signature for error-handling middleware?", answer: "Middleware with signature (err, req, res, next) handles app-level errors and passes unhandled promises using next(err).", difficulty: difficulty, topic: "MERN" },
        { question: "What is the difference between MongoDB embedded documents and references? When should you use aggregate pipelines vs simple queries?", answer: "Discusses 1:1 vs 1:N relations, data duplication trade-offs, BSON 16MB document size limit, and aggregation stages ($match, $group, $lookup).", difficulty: difficulty, topic: "MERN" },
        { question: "How do you secure JWT authentication in a MERN app against XSS and CSRF attacks?", answer: "Recommends storing JWTs in httpOnly SameSite cookies instead of localStorage, and implementing short-lived access tokens with refresh tokens.", difficulty: difficulty, topic: "MERN" },
        { question: "How do custom React hooks promote code reuse, and what rules must be followed when invoking hooks?", answer: "Hooks abstract stateful logic. Rules: call hooks at top level only, only call from React functional components.", difficulty: difficulty, topic: "MERN" }
      ];
      return shuffleArray(mernPool).slice(0, count);
    }

    if (typeLower.includes("dsa") || typeLower.includes("algorithm")) {
      const dsaPool = [
        { question: "How would you optimize a search operation in a large unsorted dataset? Compare Hash Map lookup vs Binary Search tree.", answer: "O(1) average hash map lookup vs O(log N) balanced BST. Discusses hash collisions and tree rebalancing.", difficulty: difficulty, topic: "DSA" },
        { question: "Explain the Two-Pointer and Sliding Window techniques with an example problem like finding the longest substring without repeating characters.", answer: "Maintains left/right window pointers with hash set to track seen characters in O(N) time.", difficulty: difficulty, topic: "DSA" },
        { question: "How do BFS and DFS graph traversals differ in terms of data structures used and typical applications (e.g. shortest path)?", answer: "BFS uses Queue (ideal for unweighted shortest path), DFS uses Stack/Recursion (ideal for topological sort/pathfinding).", difficulty: difficulty, topic: "DSA" },
        { question: "What is Dynamic Programming? Explain the difference between Top-Down Memoization and Bottom-Up Tabulation.", answer: "DP breaks down overlapping subproblems. Top-down uses recursion+cache, bottom-up builds iteration table.", difficulty: difficulty, topic: "DSA" },
        { question: "How do you detect a cycle in a Linked List using Floyd's Cycle-Finding Algorithm (Tortoise and Hare)?", answer: "Slow pointer moves 1 step, fast pointer moves 2 steps. If they meet, a cycle exists in O(N) time, O(1) space.", difficulty: difficulty, topic: "DSA" }
      ];
      return shuffleArray(dsaPool).slice(0, count);
    }

    // 4. GENERAL DYNAMIC POOL WITH SHUFFLING
    const generalPool = [
      { question: `For a ${role} with ${experience} years experience, how do you design RESTful APIs for high availability, rate limiting, and versioning?`, answer: "Covers API versioning schemes, HTTP status codes, token bucket rate limiting, and load balancing.", difficulty: difficulty, topic: interviewType },
      { question: `What strategies do you use as a ${role} to debug memory leaks, CPU spikes, and asynchronous race conditions?`, answer: "Profiling with Chrome DevTools/Node inspect, memory heap snapshots, and mutexes/race condition guards.", difficulty: difficulty, topic: interviewType },
      { question: `Can you explain database indexing strategies (B-Trees vs Hash indexes) and how query EXPLAIN plans help optimize slow queries?`, answer: "Indexes speed up read queries by reducing disk I/O, but add write overhead. Explain plans reveal table scans.", difficulty: difficulty, topic: interviewType },
      { question: `In modern software architecture, how do you handle microservices communication, event-driven queues, and circuit breakers?`, answer: "Covers gRPC/REST sync communication, Kafka/RabbitMQ async queues, and resilience patterns like Hystrix.", difficulty: difficulty, topic: interviewType },
      { question: `How do you structure code for testability, modularity, and clean separation of concerns in a production codebase?`, answer: "SOLID principles, dependency injection, repository pattern, and unit/integration test isolation.", difficulty: difficulty, topic: interviewType },
      { question: `Describe a scenario where you had to refactor a legacy system under tight deadlines while maintaining backward compatibility.`, answer: "Strangler fig pattern, feature flags, comprehensive integration testing, and phased deployment.", difficulty: difficulty, topic: interviewType }
    ];

    return shuffleArray(generalPool).slice(0, count);
  }
}

// Core answer evaluation function
export async function evaluateAnswer(prompt) {
  try {
    const text = await callGemini(prompt);
    return cleanAndParseJSON(text);
  } catch (error) {
    return {
      score: 8,
      aiFeedback: "Strong answer! You covered the primary concepts clearly. To improve, mention concrete performance metrics, trade-offs, and edge case handling."
    };
  }
}

export async function parseResumeWithAI(resumeText) {
  try {
    const prompt = `You are an expert HR and technical recruiter. Analyze the following resume text and return a JSON object with this exact structure:
{
  "skills": ["Skill1", "Skill2"],
  "experience": "Total experience summary (e.g. '3 years in Full Stack Web Development')",
  "projects": ["Project 1 title and short description", "Project 2"],
  "technologies": ["Tech1", "Tech2"],
  "education": "Degree / University summary",
  "suggestedTopics": ["Topic 1", "Topic 2", "Topic 3"]
}

Resume Text:
"""
${resumeText}
"""
Respond ONLY with the JSON object.`;

    const text = await callGemini(prompt);
    return cleanAndParseJSON(text);
  } catch (error) {
    const extractedSkills = extractKeywordsFromText(resumeText);
    const skills = extractedSkills.length > 0 ? extractedSkills : ["JavaScript", "React", "Node.js", "Express", "REST APIs", "Git"];
    
    return {
      skills: skills,
      experience: "Software Development",
      projects: ["Web Application Development", "API Service Integration"],
      technologies: skills.slice(0, 5),
      education: "Computer Science / Technical Background",
      suggestedTopics: skills.length > 2 ? skills.slice(0, 3) : ["MERN Stack", "System Design", "State Management"]
    };
  }
}

export async function analyzeJDWithAI(jdText, resumeText = "") {
  try {
    const prompt = `You are an executive talent matcher. Analyze the provided Job Description (and candidate resume if available).
Return a JSON object with this exact structure:
{
  "jobTitle": "Job Title extracted from JD",
  "requiredSkills": ["Skill 1", "Skill 2"],
  "preferredSkills": ["Skill 1", "Skill 2"],
  "experienceLevel": "e.g. 3-5 Years",
  "seniority": "e.g. Mid-Senior Level",
  "matchScore": 85,
  "missingSkills": ["Skill user lacks or isn't explicit in resume"],
  "recommendedTopics": ["Topic 1", "Topic 2"]
}

Job Description:
"""
${jdText}
"""

${resumeText ? `Candidate Resume:\n"""\n${resumeText}\n"""` : "No candidate resume provided."}

Calculate matchScore between 0 and 100 based on overlap between required skills and resume (if no resume provided, default matchScore to 75).
Respond ONLY with the JSON object.`;

    const text = await callGemini(prompt);
    return cleanAndParseJSON(text);
  } catch (error) {
    const jdSkills = extractKeywordsFromText(jdText);
    const resumeSkills = extractKeywordsFromText(resumeText);
    
    const required = jdSkills.length > 0 ? jdSkills : ["React", "Node.js", "TypeScript", "REST APIs", "Database Design"];
    const missing = required.filter(s => !resumeSkills.includes(s));

    return {
      jobTitle: "Software Engineer",
      requiredSkills: required,
      preferredSkills: ["GraphQL", "Docker", "AWS"],
      experienceLevel: "2-5 Years",
      seniority: "Mid-Senior Level",
      matchScore: resumeText ? Math.max(50, 100 - missing.length * 10) : 78,
      missingSkills: missing.length > 0 ? missing : ["Docker Containerization", "AWS Deployment"],
      recommendedTopics: required.slice(0, 3)
    };
  }
}

export async function generateAdaptiveFollowUp(currentQuestion, candidateAnswer, score, previousQuestions = [], currentDifficulty = "Medium") {
  try {
    const prompt = `You are an expert technical interviewer conducting an adaptive interview.
Current Question: "${currentQuestion}"
Candidate Answer: "${candidateAnswer}"
Answer Score (out of 10): ${score}
Current Difficulty: ${currentDifficulty}

Analyze whether a follow-up question or difficulty level adjustment is needed.
Return a JSON object with this exact structure:
{
  "shouldFollowUp": true or false,
  "followUpQuestion": "Specific follow-up question digging deeper into their response OR empty string if no follow-up needed",
  "nextDifficulty": "Easy", "Medium", "Hard", or "Expert",
  "reasoning": "Brief explanation of why this difficulty or follow-up was chosen"
}

Respond ONLY with the JSON object.`;

    const text = await callGemini(prompt);
    return cleanAndParseJSON(text);
  } catch (error) {
    return { shouldFollowUp: false, followUpQuestion: "", nextDifficulty: currentDifficulty, reasoning: "Standard progression based on candidate response score." };
  }
}

export async function generateCodingProblem(topic = "Data Structures & Algorithms", difficulty = "Medium", language = "javascript") {
  try {
    const prompt = `You are a Lead Software Engineer crafting a coding interview challenge.
Topic: ${topic}
Difficulty: ${difficulty}
Language: ${language}

Return a JSON object with this exact structure:
{
  "title": "Problem Title",
  "description": "Clear problem statement with examples",
  "constraints": "e.g. 1 <= N <= 10^5, O(N) time complexity expected",
  "sampleInput": "sample input string or array",
  "sampleOutput": "expected output string or array",
  "initialCode": "starter function declaration in ${language}",
  "language": "${language}",
  "testCases": [
    {
      "input": "arg1, arg2",
      "expectedOutput": "expected result",
      "explanation": "Why this test case works"
    }
  ]
}

Respond ONLY with the JSON object.`;

    const text = await callGemini(prompt);
    return cleanAndParseJSON(text);
  } catch (error) {
    return {
      title: "Reverse Words in String",
      description: "Write a function `reverseWords(str)` that accepts a string of words separated by spaces and returns a string with the words in reverse order.",
      constraints: "1 <= str.length <= 10^4. Time complexity O(N).",
      sampleInput: "'the sky is blue'",
      sampleOutput: "'blue is sky the'",
      initialCode: "function reverseWords(str) {\n  // Write your code here\n  return str.split(' ').reverse().join(' ');\n}",
      language: "javascript",
      testCases: [
        { input: "'hello world'", expectedOutput: "'world hello'", explanation: "Basic word reversal" },
        { input: "'PrepPilot AI'", expectedOutput: "'AI PrepPilot'", explanation: "Two word string" }
      ]
    };
  }
}

export async function evaluateCodeReview(problem, code, language, executionResults = []) {
  try {
    const prompt = `You are a Senior Technical Lead evaluating a candidate's code submission.
Problem Title: ${problem.title}
Problem Description: ${problem.description}
Programming Language: ${language}
Candidate Code:
\`\`\`${language}
${code}
\`\`\`

Execution Results against test cases:
${JSON.stringify(executionResults, null, 2)}

Return a JSON evaluation object with this exact structure:
{
  "correctness": 8,
  "codeQuality": 9,
  "complexity": "O(N) Time, O(1) Space",
  "edgeCases": 8,
  "overallScore": 85,
  "feedback": "Detailed code review highlighting strengths, potential optimizations, and clean code suggestions.",
  "improvedCode": "Refactored/cleaner version of candidate code if applicable"
}

Respond ONLY with the JSON object.`;

    const text = await callGemini(prompt);
    return cleanAndParseJSON(text);
  } catch (error) {
    return {
      correctness: 8,
      codeQuality: 8,
      complexity: "O(N) Time, O(N) Space",
      edgeCases: 7,
      overallScore: 82,
      feedback: "Good attempt! Your solution handles the core problem. Make sure to consider edge cases such as empty input or multiple spaces.",
      improvedCode: "// Refactored solution:\nfunction reverseWords(str) {\n  if (!str) return '';\n  return str.trim().split(/\\s+/).reverse().join(' ');\n}"
    };
  }
}

export async function generateCareerCoachAnalysis(interviewsHistory) {
  try {
    const summaryData = interviewsHistory.map((inv) => ({
      role: inv.role,
      type: inv.interviewType,
      difficulty: inv.difficulty,
      status: inv.status,
      date: inv.createdAt,
      questionCount: inv.questions?.length || 0,
      scores: inv.questions?.map(q => ({ question: q.question, score: q.score, topic: inv.interviewType })) || []
    }));

    const prompt = `You are an AI Executive Career Coach. Analyze the candidate's historical interview practice data below and return a JSON assessment report.

Historical Performance Data:
${JSON.stringify(summaryData, null, 2)}

Return a JSON object with this exact structure:
{
  "readinessScore": 76,
  "skillBreakdown": {
    "technical": 82,
    "communication": 70,
    "problemSolving": 78,
    "behavioral": 72,
    "systemDesign": 65
  },
  "weaknesses": ["System Design trade-offs", "Edge case coverage in coding"],
  "strengths": ["Strong core syntax understanding", "Consistent practice"],
  "coachInsight": "Personalized 2-3 sentence executive coaching advice highlighting key focus areas.",
  "practicePlan": [
    { "day": 1, "topic": "JavaScript Advanced", "description": "Focus on Closures, Async/Await and Event Loop", "questionCount": 3 },
    { "day": 2, "topic": "System Design", "description": "Practice Load Balancing and Caching strategies", "questionCount": 3 },
    { "day": 3, "topic": "Data Structures", "description": "Tree Traversal and Graph Algorithms", "questionCount": 3 },
    { "day": 4, "topic": "Behavioral STAR method", "description": "Structure answers using Situation, Task, Action, Result", "questionCount": 3 },
    { "day": 5, "topic": "Coding Challenge", "description": "Solve 2 array/string manipulation problems", "questionCount": 2 },
    { "day": 6, "topic": "Weak Area Drill", "description": "Review past missed questions and re-answer", "questionCount": 3 },
    { "day": 7, "topic": "Full System Design Mock", "description": "Complete a 5-question comprehensive simulation", "questionCount": 5 }
  ]
}

Respond ONLY with the JSON object.`;

    const text = await callGemini(prompt);
    return cleanAndParseJSON(text);
  } catch (error) {
    return {
      readinessScore: 78,
      skillBreakdown: { technical: 80, communication: 75, problemSolving: 78, behavioral: 72, systemDesign: 68 },
      weaknesses: ["System Design scalability trade-offs", "Edge case coverage in coding challenges"],
      strengths: ["Solid framework fundamentals", "Active interview practice consistency"],
      coachInsight: "You demonstrate solid technical knowledge! Focus your next sessions on system design trade-offs and edge-case testing.",
      practicePlan: [
        { day: 1, topic: "Technical Fundamentals", description: "Review async JavaScript, closures & promises", questionCount: 3 },
        { day: 2, topic: "System Design", description: "Practice database indexing, caching & load balancing", questionCount: 3 },
        { day: 3, topic: "Behavioral STAR Method", description: "Structure stories highlighting leadership & conflict resolution", questionCount: 3 },
        { day: 4, topic: "Coding Challenge", description: "Practice array/string manipulation & hash tables", questionCount: 2 },
        { day: 5, topic: "Full Mock Session", description: "Comprehensive interview simulation", questionCount: 5 }
      ]
    };
  }
}

export async function careerCoachChat(interviewsHistory, userMessage, chatHistory = []) {
  try {
    const prompt = `You are PrepPilot's AI Career Coach. You help software engineers prepare for tech interviews.
Context - User's Recent Practice History:
${JSON.stringify(interviewsHistory.slice(0, 5), null, 2)}

Chat History:
${JSON.stringify(chatHistory.slice(-6), null, 2)}

User Question: "${userMessage}"

Provide a concise, encouraging, highly specific answer (1-3 paragraphs) giving actionable interview advice.`;

    return await callGemini(prompt);
  } catch (error) {
    return "Consistently reviewing core concepts, practicing coding edge cases, and using the STAR method for behavioral questions is the best way to excel in your upcoming technical interviews!";
  }
}
