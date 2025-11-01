export const multiStepDecisionTemplate = `<task>Decide the assistant's next step to satisfy the user's latest request.</task>

{{system}}

{{time}}

{{recentMessages}}

# Execution Snapshot
Step: {{iterationCount}} of {{maxIterations}}
Actions this round: {{traceActionResult.length}}
{{#if traceActionResult.length}}
Recent action results:
{{actionResults}}
{{/if}}
{{#if actionsWithParams}}
Proposed actions:
{{actionsWithParams}}
{{/if}}

# Rules
- Focus on the latest user request and current evidence.
- Do not repeat an action with identical parameters.
- Prefer complementary data or follow-up steps that add new value.
- Set isFinish true once the request is fully satisfied or no useful action remains.

# Output
Return XML in this exact shape:
<output>
  <response>
    <thought>Step {{iterationCount}}/{{maxIterations}}. Actions taken this round: {{traceActionResult.length}}. [concise reasoning]</thought>
    <action>ACTION_NAME or ""</action>
    <parameters>{"key": "value"}</parameters>
    <isFinish>true or false</isFinish>
  </response>
</output>`;

