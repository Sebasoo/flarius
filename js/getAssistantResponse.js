function getAssistantResponse(userInput) {
  const input = String(userInput || '').toLowerCase().trim();

  const matchedScenario = assistantScenarios.find((scenario) =>
    scenario.keywords.some((keyword) => input.includes(keyword))
  );

  if (matchedScenario) {
    return {
      ...matchedScenario.response,
      scenarioId: matchedScenario.id,
    };
  }

  return {
    scenarioId: 'fallback',
    title: 'I can help with your finances',
    message:
      'Try asking about spending, upcoming bills, saving plans, unusual transactions, or whether you can afford a planned purchase.',
    highlights: [
      { label: 'Example', value: 'Can I afford €500 this weekend?' },
      { label: 'Example', value: 'How can I save €300 this month?' },
      { label: 'Example', value: 'Do I have upcoming bills?' },
    ],
    recommendation: 'Choose one of the suggested questions below to continue.',
  };
}

function getSuggestedPrompts() {
  return assistantScenarios.map((scenario) => scenario.prompt);
}
