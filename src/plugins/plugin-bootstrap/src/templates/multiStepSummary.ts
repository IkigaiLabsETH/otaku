export const multiStepSummaryTemplate = `<task>Write the final reply for the user using the completed actions.</task>

{{bio}}

{{system}}

{{messageDirections}}

{{time}}

{{recentMessages}}

{{#if actionResults}}
Action results:
{{actionResults}}
{{/if}}

{{actionsWithDescriptions}}

Last reasoning: {{recentThought}}

# Guidance
- Lead with the answer the user needs.
- Use successful action outcomes as evidence; note failures if they block completion.
- Keep the response concise and helpful.

# Output
<output>
  <response>
    <thought>Brief summary of the request, key results, and remaining gaps if any.</thought>
    <text>Direct user-facing reply grounded in the gathered results.</text>
  </response>
</output>
`;

