/* Section 12 - MoSCoW Agile Plan (replaces Scrum) */
"use strict";
const { B, table: T } = require("./docxkit");

module.exports = function () {
  const out = [];

  out.push(B.h1("12. MoSCoW Agile Plan"));
  out.push(B.p("The project runs as a fixed-date, fixed-cost, variable-scope delivery: 24 working days from 06 October to 06 November 2026, a zero cash budget, and a scope that must be trimmed rather than a date that must slip. That shape suits **MoSCoW prioritisation inside one-week timeboxes** (the DSDM agile approach) better than Scrum, whose velocity-driven planning assumes a team and a movable end date."));

  out.push(B.h2("12.1 Why MoSCoW rather than Scrum"));
  out.push(
    T(
      [
        ["Dimension", "Scrum", "MoSCoW agile used here"],
        ["Planning unit", "Sprint with committed velocity", "One-week timebox with a fixed end date"],
        ["Scope behaviour", "Re-negotiated at each sprint boundary", "Prioritised once with MoSCoW, then flexed inside the timebox"],
        ["Roles", "Product Owner, Scrum Master, Developers", "Business Sponsor, Business Visionary, Technical Coordinator, Solution Developer, Business Ambassador, Advisor"],
        ["Progress measure", "Story points burned per sprint", "Must-haves demonstrated at each timebox review"],
        ["Change handling", "Waits for the next sprint", "A new Must displaces an existing Should or Could immediately"],
        ["Team fit", "Five to nine people with daily coordination", "One developer with a sponsor and no coordination overhead"],
      ],
      { widths: [18, 38, 44] }
    )
  );

  out.push(B.h2("12.2 Roles"));
  out.push(
    T(
      [
        ["MoSCoW / DSDM role", "Filled by", "Responsibility"],
        ["Business Sponsor", "Project owner", "Funds the work, owns the end date, arbitrates priority conflicts, signs off release"],
        ["Business Visionary", "Project owner", "Holds the product vision and accepts the increment at each timebox review"],
        ["Technical Coordinator", "Lead developer", "Architecture, technical coherence, non-functional requirements"],
        ["Solution Developer", "Lead developer", "Builds, tests and documents the increment"],
        ["Business Ambassador", "Personas SH-03 to SH-05 (proxy review)", "Represents the traveller's view during reviews"],
        ["Advisor", "API documentation and provider terms", "Supplies constraints on rate limits, licensing and data quality"],
      ],
      { widths: [24, 28, 48] }
    )
  );

  out.push(B.h2("12.3 MoSCoW rules of engagement"));
  out.push(B.bullet("**Must have (M):** without it the release is not viable. Musts are capped at **58% of total effort** so that contingency is real, not theoretical."));
  out.push(B.bullet("**Should have (S):** important and painful to omit, but the release still works without it. Target **24% of effort**; these are the first buffer drawn on when a Must runs late."));
  out.push(B.bullet("**Could have (C):** desirable polish that improves the demo. Target **4% of effort**; dropped without escalation."));
  out.push(B.bullet("**Won't have this time (W):** explicitly excluded and written down, so exclusion is a decision rather than an oversight. Reviewed at the start of every timebox."));
  out.push(B.bullet("**Rule 1:** a Must without testable acceptance criteria is not a Must \u2014 it returns to the list."));
  out.push(B.bullet("**Rule 2:** no new Must enters a live timebox unless an existing Should or Could of equal or greater effort is removed in the same decision."));
  out.push(B.bullet("**Rule 3:** Musts are never traded silently. Any change to the Must set needs the Business Sponsor, a logged change request, and a re-stated end date or scope."));
  out.push(B.bullet("**Rule 4:** at the end of each timebox the increment is demonstrated; a Must that cannot be demonstrated is reported as a slipped Must, not re-labelled as a Should."));

  out.push(B.h2("12.4 MoSCoW classification of the requirements"));
  out.push(
    T(
      [
        ["Category", "Requirements", "Count", "Effort share", "Rationale"],
        ["Must", "FR-01, 02, 03, 05, 06, 08, 09, 10, 11, 12, 13, 14, 16, 19, 23, 24", "16", "58%", "The minimum viable journey: find a place, understand it, plan it, and act on it"],
        ["Should", "FR-04, 07, 15, 17, 18, 21, 22", "7", "24%", "Depth and trust: country facts, district listings, comparison, hand-off, restore, accessibility"],
        ["Could", "FR-20", "1", "4%", "Print/export convenience"],
        ["Won't (this release)", "Accounts, payments, native apps, multi-language, saved/shared plans, price alerts, LLM narration", "\u2013", "0%", "Excluded by the scope boundary in Section 5.2 or deferred to the roadmap in Section 11.9"],
        ["Contingency", "Unallocated", "\u2013", "14%", "Held for parser rework and API surprises; released only by sponsor decision"],
      ],
      { widths: [16, 44, 8, 10, 22] }
    )
  );
  out.push(B.caption("Table 12.1 \u2013 Must effort is deliberately below the 60% ceiling; the contingency was consumed by the Wikivoyage parser in timebox I2."));

  out.push(B.h2("12.5 Timebox plan"));
  out.push(
    T(
      [
        ["Timebox", "Dates", "Goal", "Musts in scope", "Should / Could", "Outcome"],
        ["I1", "06\u201309 Oct", "A searched destination shows weather and a usable briefing", "FR-01, FR-02, FR-03", "\u2013", "Met"],
        ["I2", "12\u201316 Oct", "Guide content is deep enough to plan from", "FR-05, FR-06", "FR-04, FR-07", "Met \u2013 district traversal absorbed the contingency"],
        ["I3", "19\u201323 Oct", "Booking surfaces work with and without a token", "FR-08, FR-09, FR-10, FR-11", "FR-18", "Met"],
        ["I4", "26\u201330 Oct", "The planner and advisor produce a complete plan", "FR-12, FR-13, FR-14, FR-16", "FR-15, FR-17, FR-21", "Met \u2013 FR-15 delivered late in the timebox"],
        ["I5", "02\u201306 Nov", "Release-quality increment and handover", "FR-19, FR-23, FR-24", "FR-22", "Met \u2013 FR-20 (Could) deferred to v1.1"],
      ],
      { widths: [7, 12, 30, 22, 15, 14] }
    )
  );

  out.push(B.h2("12.6 Timebox control"));
  out.push(B.num("**Time is fixed; scope flexes.** The end date does not move. If the timebox is behind on Thursday, a Could is dropped first, then a Should.", 1));
  out.push(B.num("**Daily checkpoint (10 minutes).** What is demonstrable now, what is at risk, which Must is threatened.", 2));
  out.push(B.num("**Mid-timebox triage.** Anything less than 60% complete at the halfway point triggers an explicit drop decision, not a hope that it catches up.", 3));
  out.push(B.num("**Demonstrate, do not report.** A Must is complete only when it can be shown in the browser against its acceptance criteria.", 4));
  out.push(B.num("**Escalate early.** A threatened Must is raised to the Business Sponsor the same day, with two options: drop a Should, or move the Must to the next timebox and accept a reduced release.", 5));

  out.push(B.h2("12.7 Facilitated workshops (in place of Scrum ceremonies)"));
  out.push(
    T(
      [
        ["Workshop", "When", "Timebox", "Output"],
        ["Prioritisation workshop", "Start of project and start of each timebox", "30 min", "Agreed Must/Should/Could/Won't set for the timebox"],
        ["Modelling workshop", "I1", "45 min", "Context diagram, data flow, planner scoring model"],
        ["Timebox planning", "Monday 09:00", "30 min", "Timebox goal, Must list, task breakdown, risks"],
        ["Daily checkpoint", "Each morning", "10 min", "Progress, blockers, threatened Musts"],
        ["Timebox review and demo", "Friday 15:00", "30 min", "Increment demonstrated; Musts accepted or reported slipped"],
        ["Retrospective", "Friday 15:30", "25 min", "Two practices to keep, two to change"],
        ["Release sign-off", "06 Nov", "30 min", "Approvals in Section 20.3"],
      ],
      { widths: [24, 26, 12, 38] }
    )
  );

  out.push(B.h2("12.8 Definition of Done"));
  out.push(B.p("An increment is done when: every Must in the timebox is demonstrated against its acceptance criteria; loading, empty and error states exist; it works at 360 px and 1440 px and is keyboard reachable; it degrades gracefully without a Duffel token; the regression checklist passes with no console errors; documentation is updated; and any Should or Could that was dropped is recorded with the sponsor's agreement."));

  out.push(B.h2("12.9 Prioritisation governance"));
  out.push(B.bullet("**Intake:** every new request is classified before build \u2014 Must, Should, Could or Won't \u2014 with a one-line justification and an effort estimate."));
  out.push(B.bullet("**Won't list:** reviewed at the start of each timebox; an item leaves the list only by displacing something of equal or greater effort."));
  out.push(B.bullet("**Change record:** decisions are logged as CR-xx in Section 20.2, with the date, the category change and the trade-off made."));
  out.push(B.bullet("**Traceability:** each Must maps to a story (Section 9), a test (Section 18) and an acceptance criterion (Section 7)."));
  out.push(B.bullet("**Release gate:** no release while a Must is unmet, a severity-1 defect is open, or a security control in Section 8.2 is failing."));

  out.push(B.h2("12.10 Effort and delivery by timebox"));
  out.push(
    T(
      [
        ["Timebox", "Dates", "Effort (days)", "Musts delivered", "Shoulds delivered", "Coulds", "Notes"],
        ["I1", "06\u201309 Oct", "4", "3 / 3", "0 / 0", "\u2013", "Foundation-heavy; architecture spike absorbed"],
        ["I2", "12\u201316 Oct", "5", "2 / 2", "2 / 2", "\u2013", "Parser complexity consumed the contingency"],
        ["I3", "19\u201323 Oct", "5", "4 / 4", "1 / 1", "\u2013", "Two integrations in parallel"],
        ["I4", "26\u201330 Oct", "5", "4 / 4", "3 / 3", "\u2013", "Planner logic dominated; advisor added late"],
        ["I5", "02\u201306 Nov", "3", "3 / 3", "1 / 1", "0 / 1", "FR-20 deferred with sponsor agreement"],
        ["Total", "24 working days", "22", "16 / 16", "7 / 7", "0 / 1", "2 days of the 24 reserved as buffer"],
      ],
      { widths: [8, 14, 12, 14, 14, 8, 30] }
    )
  );
  out.push(B.p("Effort is measured in productive person-days (six focused hours). The two unallocated days were spent on regression testing rather than new scope, which is why the released scope matches the Must and Should sets exactly."));
  out.push(B.pageBreak());

  return out.join("");
};
