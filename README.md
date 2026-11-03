# Econ with K Token of Trust Case Lab

A focused browser-local discussion companion for AP Business with Personal Finance Topic 2.1.

## Classroom use

Read the supplied four-page case first. Use one shared device for each team of four. With 28 students, this gives seven teams. Preparation, equal timed turns, a challenge conversation and an individual exit keep attention on evidence and reasoning. Print or save the final team record through the browser print dialog.

The site is a Kagan-inspired adaptation, not an official Kagan script. Each next speaker fairly paraphrases the previous speaker. Responsibility for listening, checking evidence and noting a useful point rotates with the speaking turn.

Names and work are saved in localStorage on the current browser/device. Export and print are manual. There is no teacher collection backend, live class dashboard, audio recording, transcription or automatic scoring. A completed field or timer is not proof of meaningful collaboration; teacher observation and a brief individual follow-up remain essential.

## Curriculum instruction and assessment check

Central outcome: evaluate the founders' customer-selection and data-policy decisions by interpreting case evidence, comparing alternatives against justified criteria, and explaining a supported judgment.

- Case evidence on PDF pages 1–2 supports Skill 1.B and EK 2.1.A.2/A.4.
- A hypothetical B2C customer profile supports Skill 1.C and EK 2.1.A.3.i/A.3.ii/B.1–B.3. Student-generated details must be labelled hypotheses.
- Criteria-based B2C/B2B comparison on pages 2–3 supports Skill 3.C and EK 2.1.B.2/B.4/C.2/C.3.
- The data-policy dilemma on pages 3–4 supports Skill 3.D and EK 2.1.D.1–D.3.
- The final brief has a founder audience and business purpose, making Skill 4.B relevant. Agreed rotating responsibilities and usable contributions provide opportunities for 5.B/5.D; observations are needed to assess those skills.

The teacher panel explains the case-to-skill-to-EK connection. This is a bounded sample, not a claim that one discussion assesses every Topic 2.1 expectation. In particular, proposing a profile is not the same as testing it with real customers, and describing the founders' experiment is not student performance of a complete hypothesis test.

Useful diagnostic checks: distinguish problem evidence from solution-value evidence; distinguish CAC from lifetime spending; explain why higher CAC can coexist with a better business choice; identify the pie chart's denominator; connect data choices to consumer harms and business consequences.

Checked in materials: source references, task demands, access supports, and the relationship between discussion prompts and final evidence. Awaiting classroom evidence: whether timed paraphrasing improves listening and whether independent exits show understanding. Observe two teams, compare individual exits, and adjust timing or question scaffolds from that evidence.

## Source boundary

The case PDF was supplied by the teacher: College Board, Token of Trust, revised July 2026; relevant case years 2012–2015. The source text's numerical estimates are historical case estimates, not current product pricing or verified achieved profits. The case's reported payback periods are preserved rather than recomputed as profits from gross subscription revenue.

Only the student case PDF is included in dist/case. The pasted teacher notes, model responses and student-result interface text are not included in the site. The teacher guidance in the app is original facilitation guidance and curriculum mapping, not an answer-key reproduction.

Official curriculum: https://apcentral.collegeboard.org/media/pdf/ap-business-personal-finance-course-and-exam-description.pdf (printed pages 14–15, 49–51).

Structure references: https://www.kaganonline.com/catalog/Instant_Engagement/team_structures_demo.php and https://www.kaganonline.com/free_articles/dr_spencer_kagan/ASK14.php.

## Implementation

Buildless HTML, CSS and JavaScript in dist. Netlify serves a direct upload of the contents of dist with no build command or installation step. This initial deployment is manual and is not linked for automatic GitHub redeployments. netlify.toml also records the dist publish directory for a future repository-linked deployment. Syntax check: node --check dist/app.js. No external client dependencies, fonts, analytics or microphone requests.

The GitHub repository and production website are public. The supplied student article is publicly downloadable; teacher model responses are excluded.
