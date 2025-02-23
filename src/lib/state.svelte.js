export let weatherState = $state({ weather: null, danger: null });
export let forecastState = $state({ forecast: null, icons: null , hour_icons: null});
export let alertState = $state({ alerts: null });
export let iconState = $state({ icon: null });
export let astronomyState = $state({ astronomy: null });
export let thingsToDoGeminiOutput = $state({ result: 'Generating...' });
export let weatherAdvisoryGeminiOutput = $state({ result: 'Generating...' });