import { useState, useEffect, useCallback, useRef } from "react"

const TIMER_SECONDS = 60
const FEEDBACK_DELAY = 4000

const QUESTIONS = [
  // ── VOCABULARY ──────────────────────────────────────────────────────────────
  {
    id: 1,
    category: "Vocabulary · Context Window",
    scenario:
      "You're 60 messages deep in an AI coding session. The AI suddenly gives advice that contradicts what you both agreed on at the start of the conversation. No one changed the approach. What is the most likely cause?",
    options: [
      "The AI updated its knowledge mid-session",
      "Your earlier messages have fallen out of the context window",
      "The AI tool has a session bug — restart it",
      "You need to upgrade to a higher subscription tier",
    ],
    correct: 1,
    explanation:
      "The context window is AI's working memory. When it fills up, the oldest messages are silently dropped. The AI at message 60 no longer 'sees' what you said at message 1. Start a fresh session for each new task.",
  },
  {
    id: 2,
    category: "Vocabulary · Token",
    scenario:
      "You paste an entire 500-line service class into the AI chat along with 3 other files, and the AI starts giving confused, incomplete answers. Which of the following best explains why?",
    options: [
      "500 lines is too long for AI to understand structurally",
      "The AI is distracted by irrelevant files",
      "You've consumed a large portion of the context budget with tokens, leaving little room for a quality response",
      "AI tools have a line limit, not a token limit",
    ],
    correct: 2,
    explanation:
      "Tokens are the units AI processes text in — roughly ¾ of a word. A 500-line file can cost thousands of tokens. Paste only the relevant file and any interfaces it depends on. Keep context focused.",
  },
  {
    id: 3,
    category: "Vocabulary · Hallucination",
    scenario:
      "You ask AI how to use a Java library for ABN validation. It gives you a complete Maven dependency with groupId, artifactId, and version — everything looks legitimate. You search Maven Central and the library doesn't exist. What happened?",
    options: [
      "Maven Central is out of date — the library exists on a different registry",
      "The AI was testing whether you'd verify its output",
      "The AI hallucinated — it pattern-matched to something plausible but fabricated",
      "You searched Maven Central incorrectly",
    ],
    correct: 2,
    explanation:
      "Hallucination: AI confidently generates wrong or fabricated information without flagging it. The library name looked real because AI is trained on patterns of real Maven coordinates. Always search Maven Central / npm / PyPI before using any AI-suggested dependency.",
  },
  {
    id: 4,
    category: "Vocabulary · Agent",
    scenario:
      "You give an AI tool the instruction: 'Update all API endpoints to use the new auth middleware, write the tests, and confirm they pass.' The AI completes this across 12 files without you approving each step. What kind of AI behaviour is this?",
    options: [
      "Basic autocomplete — extended to multiple files",
      "Agentic AI — multi-step autonomous action using tools",
      "A scripted macro triggered by your prompt",
      "A hallucination — AI can't actually run tests",
    ],
    correct: 1,
    explanation:
      "An Agent takes multiple autonomous steps, makes decisions, and uses tools (read files, run commands, call APIs) without constant human input. This is powerful — and why Rule 1 (Stay in Control) and Rule 3 (Use Agents) both matter.",
  },
  {
    id: 5,
    category: "Vocabulary · MCP",
    scenario:
      "Your AI assistant says: 'I can see 3 open Jira tickets assigned to you — want me to draft updates?' You never pasted any Jira content into the chat. What is making this possible?",
    options: [
      "The AI is browsing the internet autonomously",
      "Your IDE plugin is injecting Jira data into every prompt",
      "MCP (Model Context Protocol) — a standard that lets AI connect to external apps directly",
      "The AI remembered Jira from a previous session",
    ],
    correct: 2,
    explanation:
      "MCP is the open standard that lets AI connect to external systems — Jira, GitHub, Slack, databases — and interact with them directly. Without MCP, AI only sees what you paste into the chat. MCP is what turns basic chat AI into a tool that can take real actions in your environment.",
  },
  {
    id: 6,
    category: "Vocabulary · Subagent & Orchestrator",
    scenario:
      "You request: 'Scaffold a new payments module, write the service layer, add tests, and verify they pass.' Behind the scenes, three separate AI processes run in parallel — one reads the codebase, one writes the code, one runs the tests. What are the three processes called?",
    options: [
      "Plugins — each one is an installed extension",
      "Tool Calls — each is a capability invocation",
      "Subagents — spawned by an Orchestrator to handle specific subtasks",
      "Prompt chains — one prompt triggering the next",
    ],
    correct: 2,
    explanation:
      "Subagents are AI instances spawned by an Orchestrator (the parent AI) to handle specific subtasks. The Orchestrator plans and delegates; subagents execute. You sit above the Orchestrator — you review the plan before it runs and the output before it ships.",
  },
  {
    id: 7,
    category: "Vocabulary · Tool Call",
    scenario:
      "While an AI agent is working on a task, you see log entries like: 'Reading file: src/auth/LoginService.java', 'Running: mvn test', 'Calling: POST /api/deploy'. What are each of these individual actions called?",
    options: [
      "Subagent invocations",
      "Prompt completions",
      "Tool Calls — discrete capability invocations mid-task",
      "MCP connections",
    ],
    correct: 2,
    explanation:
      "A Tool Call is when AI invokes a specific capability mid-task — reading a file, running a command, calling an API. Enabled by MCP or built-in tools. One agentic task can chain 20–50 tool calls in sequence. Each one is a real action in your environment.",
  },
  // ── RULE 1 — STAY IN CONTROL ────────────────────────────────────────────────
  {
    id: 8,
    category: "Rule 1 · Stay in Control",
    scenario:
      "A trainee on your team says: 'I didn't read the AI-generated login code in detail — I tested the happy path and it worked, so I merged it.' Two days later, a security issue is found: passwords are stored in plain text. What rule was broken?",
    options: [
      "Rule 3 — they should have used an agent to review the code",
      "Rule 1 — they didn't read every line; 'it works' is not the same as 'it's correct'",
      "Rule 5 — they ran the wrong type of tests",
      "Rule 6 — they should have written the login themselves",
    ],
    correct: 1,
    explanation:
      "Rule 1: You are responsible for every line that ships — regardless of who wrote it. AI code that compiles and passes a basic test is not guaranteed to be correct or secure. Read every line. 'It works' ≠ 'It's correct'.",
  },
  {
    id: 9,
    category: "Rule 1 · Stay in Control",
    scenario:
      "An agentic AI presents you with a detailed plan: update the database schema, migrate existing data, and update all API endpoints. The plan looks reasonable. What should you do before clicking Approve?",
    options: [
      "Approve immediately — the AI has read the codebase and knows it better than you",
      "Approve, but keep the terminal open to monitor execution",
      "Review the plan carefully, check assumptions, and only approve if it aligns with your full intent",
      "Reject it — agents should never modify database schemas",
    ],
    correct: 2,
    explanation:
      "You are always above the Orchestrator. Review the plan before execution. Ask: 'What assumptions is it making?' You can ask clarifying questions before approving. This is where mistakes are cheapest to catch — before any action is taken.",
  },
  // ── RULE 2 — PLAN MODE ───────────────────────────────────────────────────────
  {
    id: 10,
    category: "Rule 2 · Plan Mode",
    scenario:
      "You prompt: 'Refactor the auth module.' The AI generates code switching your session-based auth to JWT. The code compiles. It took 30 minutes to undo. What would have prevented this?",
    options: [
      "Running the code in a separate branch first",
      "Using Plan Mode — asking 'what approach will you take?' before asking it to implement anything",
      "Being more specific: 'Refactor the auth module cleanly'",
      "Using Agent Mode instead so it could test the output itself",
    ],
    correct: 1,
    explanation:
      "Plan Mode: get the plan before the code. 'What approach will you take for this refactor?' would have surfaced 'I'll switch to JWT' in 30 seconds. A 30-second correction vs a 30-minute reversal — that's the value of planning.",
  },
  {
    id: 11,
    category: "Rule 2 · Plan Mode",
    scenario:
      "Your team keeps a document of prompts that produced wrong or unexpected AI output, with notes on why. This practice is sometimes called 'saving bad prompts.' What is the primary benefit of this?",
    options: [
      "It lets you report bugs to the AI tool's developer",
      "It becomes shared team knowledge that improves prompt quality and prevents the same mistakes recurring",
      "It helps the AI learn from its mistakes over time",
      "It satisfies audit requirements for AI-generated code",
    ],
    correct: 1,
    explanation:
      "Saving bad prompts is the failure-log component of Plan Mode. When AI gives a wrong result, writing down the prompt and why it failed turns a personal mistake into team knowledge — preventing the same vague prompt from causing the same wrong output again.",
  },
  // ── RULE 3 — USE AGENTS ──────────────────────────────────────────────────────
  {
    id: 12,
    category: "Rule 3 · Use Agents",
    scenario:
      "You need to rename the component 'UserCard' to 'MemberCard' across 14 files. A colleague says 'just use find-and-replace.' What's the advantage of using an agent instead?",
    options: [
      "Agents are faster than find-and-replace",
      "Agents can handle case-sensitive and case-insensitive replacements simultaneously",
      "An agent can make the change, run the test suite, and confirm every instance was caught correctly",
      "Agents can rename files at the OS level, not just inside the code",
    ],
    correct: 2,
    explanation:
      "The agent's advantage isn't just speed — it's verification. After renaming, Subagent C runs the test suite and confirms every reference was updated correctly. Find-and-replace has no feedback loop. Tests are what make agents trustworthy.",
  },
  {
    id: 13,
    category: "Rule 3 · Use Agents",
    scenario:
      "Your team wants to use agents to generate and run tests on a large legacy codebase — but the codebase has almost no existing tests. Why is this risky?",
    options: [
      "Agents can't work on legacy codebases — they need modern frameworks",
      "Without tests, agents have no feedback loop to verify whether their changes are correct",
      "Legacy codebases use older languages that AI doesn't understand",
      "Agents will over-engineer the test suite and make the codebase harder to maintain",
    ],
    correct: 1,
    explanation:
      "Tests are the guardrails that let agents move fast and safely. Without them, Subagent C has nothing to run — so there's no signal about whether the changes worked. Invest in a test foundation before delegating large tasks to agents.",
  },
  // ── RULE 4 — USE SKILLS ──────────────────────────────────────────────────────
  {
    id: 14,
    category: "Rule 4 · Use Skills",
    scenario:
      "Without any Skill configured, your team asks AI to 'create a REST controller.' Different developers get different conventions — some get @RestController with direct returns, others get a response wrapper, others get no error handling. With a Skill, what changes?",
    options: [
      "AI will always produce the same code regardless of who runs the prompt",
      "The Skill acts as a shared context that ensures AI uses your team's conventions consistently across all developers",
      "Skills lock the AI output so developers can't customise it",
      "Skills improve the AI model's accuracy by retraining it on your codebase",
    ],
    correct: 1,
    explanation:
      "A Skill is a shared context — your tech stack, conventions, patterns — that every AI session loads automatically. It doesn't make the AI smarter. It gives AI the context it needs to produce output that matches your team's standards, consistently, across every developer.",
  },
  {
    id: 15,
    category: "Rule 4 · Use Skills",
    scenario:
      "A new trainee's first PR is reviewed and found to have: JUnit 4 tests (your team uses JUnit 5), @Autowired field injection (your team uses constructor injection), and System.out.println (your team uses @Slf4j). The trainee followed what AI told them. What one change would have most improved this outcome?",
    options: [
      "A longer onboarding document listing all the conventions",
      "A mandatory senior dev pair-programming session on the first PR",
      "A Skill encoding your team's conventions — so the AI session the trainee used would have produced the correct patterns from the first prompt",
      "A stricter CI/CD linter configured to catch all three issues",
    ],
    correct: 2,
    explanation:
      "The trainee didn't do anything wrong — they followed their AI tool. The tool didn't know your conventions. A Skill fixes this: it teaches the AI your patterns before it generates code. The trainee's first PR becomes correct output automatically.",
  },
  // ── RULE 5 — TRUST BUT VERIFY ───────────────────────────────────────────────
  {
    id: 16,
    category: "Rule 5 · Trust But Verify",
    scenario:
      "AI generates a login form with client-side validation. All unit tests pass. Your QA bypasses the form entirely by sending a raw HTTP POST request to the API — no validation fires server-side. What's the lesson?",
    options: [
      "QA used the wrong testing technique — form testing is the right approach",
      "AI intentionally skipped server-side validation to keep the code simpler",
      "'Tests pass' doesn't mean 'correct' — the prompt was ambiguous and only one layer was validated",
      "The linter should have detected the missing server-side validation",
    ],
    correct: 2,
    explanation:
      "The AI did exactly what was asked — 'the form' got validation. But validation must live at the server too. A better prompt: 'Add server-side validation to the login endpoint in addition to client-side validation.' Specificity determines safety. 'Tests pass' ≠ 'secure'.",
  },
  {
    id: 17,
    category: "Rule 5 · Trust But Verify",
    scenario:
      "AI tells you that 'Stream.toUnmodifiableList()' works in Java 11. You're targeting Java 11 in production. Your dev machine runs Java 17. What's the safest next step before using it?",
    options: [
      "Use it — if the AI is confident, it's probably correct",
      "Test it on your dev machine — if it compiles on Java 17, it's fine",
      "Check the official Java docs to verify which version the method was introduced in",
      "Add it to the codebase and let the CI pipeline catch any version issues",
    ],
    correct: 2,
    explanation:
      "Stream.toUnmodifiableList() was introduced in Java 16, not Java 11. It compiles on Java 17 but fails on Java 11 at runtime — exactly the kind of bug that passes all local checks and only fails in production. Always verify version claims in the official docs.",
  },
  {
    id: 18,
    category: "Rule 5 · Trust But Verify",
    scenario:
      "AI generates a test suite for your new feature. All 12 tests pass. A colleague reviews the tests and finds that several test methods assert `assertTrue(true)` — they'll always pass regardless of what the code does. What's the takeaway?",
    options: [
      "The tests are fine — they're confirming the feature doesn't crash",
      "AI-generated tests must be reviewed like code — a test that always passes gives false confidence",
      "The colleague is being overly critical — passing tests are the goal",
      "This is a known AI limitation — use a test generation tool instead",
    ],
    correct: 1,
    explanation:
      "A test that always passes is worse than no test — it creates false confidence. AI can generate tests that look real but test nothing. Rule 5 applies to tests too: review them like code, run them on a broken version of the feature to confirm they actually fail when they should.",
  },
  // ── RULE 6 — STILL WRITE CODE ────────────────────────────────────────────────
  {
    id: 19,
    category: "Rule 6 · Still Write Code",
    scenario:
      "A senior developer notices that whenever a NullPointerException occurs, junior devs immediately paste the stack trace into AI and apply the first fix it suggests — without reading the trace themselves. What risk does this create over time?",
    options: [
      "AI fixes are usually wrong and will introduce more bugs",
      "Debugging skills atrophy — developers lose the ability to diagnose problems independently, which matters most in high-pressure incidents",
      "The team becomes dependent on a specific AI tool vendor",
      "Stack traces contain sensitive information that shouldn't be shared with AI",
    ],
    correct: 1,
    explanation:
      "Rule 6: Keep your skills sharp. If you always hand errors to AI, your ability to debug manually weakens — and that's exactly when you need it most: production incidents at 2am with no AI access. Debug manually. Read the stack trace. Understand the problem before reaching for AI.",
  },
  {
    id: 20,
    category: "Rule 6 · Still Write Code",
    scenario:
      "Which of the following is the best example of a task you should do yourself rather than delegating to AI?",
    options: [
      "Rename a component across 14 files",
      "Generate boilerplate for a standard REST controller",
      "Fix a two-character typo in a variable name — you can see the fix immediately",
      "Write unit tests for a service class you've already designed",
    ],
    correct: 2,
    explanation:
      "Rule 6: if you can describe the change in one sentence and make it in under 2 minutes — just make it. Reaching for AI for a two-character fix costs more time than it saves, and every time you do it, you train yourself to need AI for things you can do independently.",
  },
]

// ── Utility ──────────────────────────────────────────────────────────────────

function getGrade(score, total) {
  const pct = score / total
  if (pct === 1) return { label: "Perfect Score!", color: "#06B6D4", emoji: "🏆" }
  if (pct >= 0.85) return { label: "Excellent", color: "#10B981", emoji: "⭐" }
  if (pct >= 0.7) return { label: "Good", color: "#7C3AED", emoji: "👍" }
  if (pct >= 0.5) return { label: "Needs Practice", color: "#F59E0B", emoji: "📚" }
  return { label: "Keep Learning", color: "#EF4444", emoji: "💪" }
}

function categoryColor(category) {
  if (category.includes("Vocabulary")) return "#06B6D4"
  if (category.includes("Rule 1")) return "#EF4444"
  if (category.includes("Rule 2")) return "#F59E0B"
  if (category.includes("Rule 3")) return "#10B981"
  if (category.includes("Rule 4")) return "#7C3AED"
  if (category.includes("Rule 5")) return "#3B82F6"
  if (category.includes("Rule 6")) return "#EC4899"
  return "#06B6D4"
}

// ── Screens ──────────────────────────────────────────────────────────────────

function WelcomeScreen({ name, setName, onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Calibri', sans-serif" }}>
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
        {/* Header badge */}
        <div style={{ display: "inline-block", background: "#06B6D4", color: "#0F172A", fontWeight: 700, fontSize: 12, letterSpacing: 2, padding: "6px 18px", borderRadius: 20, marginBottom: 32, textTransform: "uppercase" }}>
          AI-Assisted Development
        </div>

        <h1 style={{ color: "#F8FAFC", fontSize: 40, fontWeight: 800, margin: "0 0 12px", lineHeight: 1.2 }}>
          Knowledge Check
        </h1>
        <p style={{ color: "#94A3B8", fontSize: 17, margin: "0 0 40px", lineHeight: 1.6 }}>
          20 scenario questions · 60 seconds each<br />
          Covers vocabulary, the 6 rules, and real-world situations.
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 48, flexWrap: "wrap" }}>
          {[
            { label: "Questions", value: "20", color: "#06B6D4" },
            { label: "Time per Q", value: "60s", color: "#7C3AED" },
            { label: "Topics", value: "7", color: "#10B981" },
          ].map(s => (
            <div key={s.label} style={{ background: "#1E293B", borderRadius: 12, padding: "16px 28px", textAlign: "center" }}>
              <div style={{ color: s.color, fontSize: 28, fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: "#64748B", fontSize: 13, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Name input */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Enter your name to begin…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && name.trim() && onStart()}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#1E293B", border: "2px solid #334155",
              color: "#F8FAFC", fontSize: 17, padding: "14px 18px", borderRadius: 10,
              outline: "none", transition: "border-color 0.2s",
            }}
            onFocus={e => (e.target.style.borderColor = "#06B6D4")}
            onBlur={e => (e.target.style.borderColor = "#334155")}
          />
        </div>

        <button
          onClick={onStart}
          disabled={!name.trim()}
          style={{
            width: "100%", padding: "16px", borderRadius: 10, border: "none", cursor: name.trim() ? "pointer" : "not-allowed",
            background: name.trim() ? "#06B6D4" : "#334155", color: name.trim() ? "#0F172A" : "#64748B",
            fontSize: 17, fontWeight: 700, transition: "all 0.2s",
          }}
        >
          Start Quiz →
        </button>
      </div>
    </div>
  )
}

function QuestionScreen({ q, index, timeLeft, onAnswer, selectedAnswer }) {
  const accent = categoryColor(q.category)
  const pct = (timeLeft / TIMER_SECONDS) * 100
  const timerColor = timeLeft <= 10 ? "#EF4444" : timeLeft <= 20 ? "#F59E0B" : "#06B6D4"

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", flexDirection: "column", fontFamily: "'Calibri', sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: "#1E293B", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #334155" }}>
        <div style={{ color: "#64748B", fontSize: 14, fontWeight: 600 }}>
          Question <span style={{ color: "#F8FAFC" }}>{index + 1}</span> of {QUESTIONS.length}
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#0F172A", borderRadius: 8, padding: "8px 16px",
          border: `2px solid ${timerColor}`, transition: "border-color 0.5s"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={timerColor} strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span style={{ color: timerColor, fontSize: 20, fontWeight: 800, minWidth: 28, transition: "color 0.5s" }}>
            {timeLeft}
          </span>
        </div>
        <div style={{ color: "#64748B", fontSize: 14, fontWeight: 600 }}>
          <span style={{ color: accent }}>■</span> {q.category}
        </div>
      </div>

      {/* Timer progress bar */}
      <div style={{ height: 4, background: "#1E293B" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: timerColor, transition: "width 1s linear, background 0.5s" }} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: 720, width: "100%" }}>
          {/* Scenario card */}
          <div style={{ background: "#1E293B", borderRadius: 16, padding: "32px", marginBottom: 24, borderLeft: `5px solid ${accent}` }}>
            <p style={{ color: "#CBD5E1", fontSize: 18, lineHeight: 1.7, margin: 0, fontWeight: 400 }}>
              {q.scenario}
            </p>
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => !selectedAnswer && onAnswer(i)}
                disabled={selectedAnswer !== null}
                style={{
                  background: "#1E293B", border: "2px solid #334155",
                  borderRadius: 12, padding: "18px 22px",
                  color: "#E2E8F0", fontSize: 16, textAlign: "left",
                  cursor: selectedAnswer !== null ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "flex-start", gap: 14,
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={e => { if (!selectedAnswer) { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = "#243451" } }}
                onMouseLeave={e => { if (!selectedAnswer) { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.background = "#1E293B" } }}
              >
                <span style={{
                  minWidth: 30, height: 30, borderRadius: "50%",
                  background: "#0F172A", border: `2px solid #475569`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#94A3B8", flexShrink: 0, marginTop: 1
                }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ lineHeight: 1.5 }}>{opt}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeedbackScreen({ q, selected, timedOut, onNext, isLast, autoAdvanceIn }) {
  const isCorrect = !timedOut && selected === q.correct
  const accent = isCorrect ? "#10B981" : "#EF4444"
  const catColor = categoryColor(q.category)

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", flexDirection: "column", fontFamily: "'Calibri', sans-serif" }}>
      {/* Status banner */}
      <div style={{ background: isCorrect ? "#052E16" : "#2D0A0A", borderBottom: `3px solid ${accent}`, padding: "20px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 32 }}>{timedOut ? "⏱️" : isCorrect ? "✅" : "❌"}</div>
        <div>
          <div style={{ color: accent, fontWeight: 800, fontSize: 20 }}>
            {timedOut ? "Time's up!" : isCorrect ? "Correct!" : "Not quite"}
          </div>
          <div style={{ color: "#94A3B8", fontSize: 14, marginTop: 2 }}>
            {q.category}
          </div>
        </div>
        {autoAdvanceIn > 0 && (
          <div style={{ marginLeft: "auto", color: "#64748B", fontSize: 14 }}>
            Next in {autoAdvanceIn}s…
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: 720, width: "100%" }}>
          {/* Show options with highlights */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {q.options.map((opt, i) => {
              const isSelected = i === selected
              const isAnswer = i === q.correct
              let borderColor = "#334155"
              let bg = "#1E293B"
              let labelBg = "#0F172A"
              let labelColor = "#94A3B8"

              if (isAnswer) { borderColor = "#10B981"; bg = "#052E16"; labelBg = "#10B981"; labelColor = "#fff" }
              else if (isSelected && !isAnswer) { borderColor = "#EF4444"; bg = "#2D0A0A"; labelBg = "#EF4444"; labelColor = "#fff" }

              return (
                <div key={i} style={{ background: bg, border: `2px solid ${borderColor}`, borderRadius: 12, padding: "16px 22px", display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{ minWidth: 30, height: 30, borderRadius: "50%", background: labelBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: labelColor, flexShrink: 0 }}>
                    {isAnswer ? "✓" : isSelected ? "✗" : String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ color: isAnswer ? "#D1FAE5" : isSelected ? "#FEE2E2" : "#64748B", lineHeight: 1.5 }}>{opt}</span>
                </div>
              )
            })}
          </div>

          {/* Explanation */}
          <div style={{ background: "#1E293B", borderRadius: 14, padding: "24px", borderLeft: `5px solid ${catColor}`, marginBottom: 24 }}>
            <div style={{ color: catColor, fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              Explanation
            </div>
            <p style={{ color: "#CBD5E1", fontSize: 16, lineHeight: 1.7, margin: 0 }}>
              {q.explanation}
            </p>
          </div>

          <button
            onClick={onNext}
            style={{
              width: "100%", padding: "16px", borderRadius: 10, border: "none", cursor: "pointer",
              background: catColor, color: "#0F172A", fontSize: 17, fontWeight: 700,
            }}
          >
            {isLast ? "See Results →" : "Next Question →"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ResultsScreen({ name, score, answers, onRetake }) {
  const total = QUESTIONS.length
  const grade = getGrade(score, total)
  const wrong = answers.filter(a => !a.correct)

  // Group score by category
  const categoryScores = {}
  answers.forEach(a => {
    const cat = QUESTIONS[a.questionIndex].category.split(" · ")[0]
    if (!categoryScores[cat]) categoryScores[cat] = { right: 0, total: 0 }
    categoryScores[cat].total++
    if (a.correct) categoryScores[cat].right++
  })

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", fontFamily: "'Calibri', sans-serif", padding: "40px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{grade.emoji}</div>
          <h1 style={{ color: "#F8FAFC", fontSize: 36, fontWeight: 800, margin: "0 0 8px" }}>
            {name}, {grade.label}
          </h1>
          <div style={{ color: "#94A3B8", fontSize: 17, marginBottom: 32 }}>
            You scored <span style={{ color: grade.color, fontWeight: 700, fontSize: 22 }}>{score}</span> out of {total}
          </div>

          {/* Big score ring */}
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 120, height: 120, borderRadius: "50%", border: `6px solid ${grade.color}`, background: "#1E293B", marginBottom: 16 }}>
            <div>
              <div style={{ color: grade.color, fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{score}</div>
              <div style={{ color: "#64748B", fontSize: 14 }}>/ {total}</div>
            </div>
          </div>
        </div>

        {/* Breakdown by section */}
        <div style={{ background: "#1E293B", borderRadius: 16, padding: "24px", marginBottom: 24 }}>
          <h2 style={{ color: "#CBD5E1", fontSize: 16, fontWeight: 700, margin: "0 0 20px", letterSpacing: 1, textTransform: "uppercase" }}>
            Score by Section
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(categoryScores).map(([cat, s]) => {
              const catAccent = categoryColor(cat + " ·")
              const pct = Math.round((s.right / s.total) * 100)
              return (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#94A3B8", fontSize: 14 }}>{cat}</span>
                    <span style={{ color: catAccent, fontWeight: 700, fontSize: 14 }}>{s.right}/{s.total}</span>
                  </div>
                  <div style={{ height: 8, background: "#0F172A", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: catAccent, borderRadius: 4, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Wrong answers review */}
        {wrong.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ color: "#CBD5E1", fontSize: 16, fontWeight: 700, margin: "0 0 16px", letterSpacing: 1, textTransform: "uppercase" }}>
              Review — Questions to Revisit
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {wrong.map(a => {
                const q = QUESTIONS[a.questionIndex]
                const acc = categoryColor(q.category)
                return (
                  <div key={a.questionIndex} style={{ background: "#1E293B", borderRadius: 12, padding: "20px", borderLeft: `4px solid ${acc}` }}>
                    <div style={{ color: acc, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                      Q{a.questionIndex + 1} · {q.category}
                    </div>
                    <p style={{ color: "#94A3B8", fontSize: 14, margin: "0 0 12px", lineHeight: 1.5 }}>
                      {q.scenario}
                    </p>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      {a.selectedIndex >= 0 && (
                        <span style={{ background: "#2D0A0A", color: "#FCA5A5", fontSize: 13, padding: "4px 12px", borderRadius: 6 }}>
                          ✗ You chose: {q.options[a.selectedIndex]}
                        </span>
                      )}
                      {a.selectedIndex === -1 && (
                        <span style={{ background: "#292524", color: "#D1D5DB", fontSize: 13, padding: "4px 12px", borderRadius: 6 }}>
                          ⏱ Time expired
                        </span>
                      )}
                    </div>
                    <div style={{ background: "#052E16", borderRadius: 8, padding: "10px 14px" }}>
                      <span style={{ color: "#86EFAC", fontSize: 13 }}>
                        ✓ Correct: {q.options[q.correct]}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Retake button */}
        <button
          onClick={onRetake}
          style={{
            width: "100%", padding: "16px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "#06B6D4", color: "#0F172A", fontSize: 17, fontWeight: 700,
          }}
        >
          ↩ Retake Quiz
        </button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AIDevQuiz() {
  const [phase, setPhase] = useState("welcome")   // welcome | question | feedback | results
  const [playerName, setPlayerName] = useState("")
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState([])
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [timedOut, setTimedOut] = useState(false)
  const [autoAdvanceIn, setAutoAdvanceIn] = useState(FEEDBACK_DELAY / 1000)
  const autoAdvanceRef = useRef(null)

  // Timer countdown during question
  useEffect(() => {
    if (phase !== "question") return
    if (timeLeft <= 0) {
      setTimedOut(true)
      setAnswers(prev => [...prev, { questionIndex: currentQ, selectedIndex: -1, correct: false }])
      setPhase("feedback")
      return
    }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft, currentQ])

  // Auto-advance countdown during feedback
  useEffect(() => {
    if (phase !== "feedback") return
    setAutoAdvanceIn(Math.ceil(FEEDBACK_DELAY / 1000))

    const countDown = setInterval(() => {
      setAutoAdvanceIn(n => Math.max(0, n - 1))
    }, 1000)

    autoAdvanceRef.current = setTimeout(() => {
      clearInterval(countDown)
      advanceToNext()
    }, FEEDBACK_DELAY)

    return () => {
      clearTimeout(autoAdvanceRef.current)
      clearInterval(countDown)
    }
  }, [phase, currentQ])

  const advanceToNext = useCallback(() => {
    clearTimeout(autoAdvanceRef.current)
    const nextQ = currentQ + 1
    if (nextQ >= QUESTIONS.length) {
      setPhase("results")
    } else {
      setCurrentQ(nextQ)
      setTimeLeft(TIMER_SECONDS)
      setSelectedAnswer(null)
      setTimedOut(false)
      setPhase("question")
    }
  }, [currentQ])

  const handleStart = () => {
    if (!playerName.trim()) return
    setPhase("question")
    setCurrentQ(0)
    setTimeLeft(TIMER_SECONDS)
    setAnswers([])
    setSelectedAnswer(null)
    setTimedOut(false)
  }

  const handleAnswer = useCallback((index) => {
    if (selectedAnswer !== null) return
    clearTimeout(autoAdvanceRef.current)
    setSelectedAnswer(index)
    const correct = index === QUESTIONS[currentQ].correct
    setAnswers(prev => [...prev, { questionIndex: currentQ, selectedIndex: index, correct }])
    setPhase("feedback")
  }, [selectedAnswer, currentQ])

  const handleRetake = () => {
    setPhase("welcome")
    setPlayerName("")
    setCurrentQ(0)
    setAnswers([])
    setSelectedAnswer(null)
    setTimedOut(false)
  }

  if (phase === "welcome") {
    return <WelcomeScreen name={playerName} setName={setPlayerName} onStart={handleStart} />
  }

  if (phase === "question") {
    return (
      <QuestionScreen
        q={QUESTIONS[currentQ]}
        index={currentQ}
        timeLeft={timeLeft}
        onAnswer={handleAnswer}
        selectedAnswer={selectedAnswer}
      />
    )
  }

  if (phase === "feedback") {
    return (
      <FeedbackScreen
        q={QUESTIONS[currentQ]}
        selected={selectedAnswer}
        timedOut={timedOut}
        onNext={advanceToNext}
        isLast={currentQ === QUESTIONS.length - 1}
        autoAdvanceIn={autoAdvanceIn}
      />
    )
  }

  if (phase === "results") {
    return (
      <ResultsScreen
        name={playerName}
        score={answers.filter(a => a.correct).length}
        answers={answers}
        onRetake={handleRetake}
      />
    )
  }
}
