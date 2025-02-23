<script>
	import { PUBLIC_API_KEY, PUBLIC_URL, PUBLIC_GEMINI_API_KEY } from '$env/static/public';
	import { onMount } from "svelte";
	import { weatherState, iconState, alertState, forecastState, astronomyState, thingsToDoGeminiOutput, weatherAdvisoryGeminiOutput } from '$lib/state.svelte';
	import { GoogleGenerativeAI } from "@google/generative-ai";
	import { SunHorizon } from 'phosphor-svelte';

	import '../app.css'

	import { fade } from "svelte/transition";

	export let data;

	let bg_color = 'rgb(255, 255, 255)';
	let txt_color = 'rgb(0, 0, 0)';
	let weather;
	let astronomy;

	let sun = false;
	let day = true;
	let moon = false;
	let moon_phase = 'Full Moon';
	//clouds: 0=none, 1=partly, 2=cloudy, 3=overcast/rain/snow/etc
	let clouds = 0;
	//rain/snow/ice_pellets: 0=none, 1=patchylight, 2=light, 3=moderate, 4=heavy
	let rain = 0;
	let snow = 0;
	let ice_pellets = 0;
	let thunder = false;
	let freezing = false;
	let fog = false;
	let warning = false;
    let position;

	const api_key = PUBLIC_GEMINI_API_KEY;

	async function callGeminiThingsToDo(weathering) {
		let now = new Date();
        console.log("weathering");
		console.log(weathering);

		const genAI = new GoogleGenerativeAI(api_key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
		let prompt = "Give me some suggestions of what I can do today? Date and time: " + now + ". Weather: " + weathering.current.condition.text + '. Outside temperature: ' + weathering.current.temp_f +' degrees fahrenheit. Location: ' + weathering.location.name + ' ' + weathering.location.region + ', ' + weathering.location.country + '. Give me a paragraph. Don\'t say here are some suggestions.';
        try {
            const response = await model.generateContent(prompt);
            thingsToDoGeminiOutput.result = await response.response.text();
        } catch (e) {
            console.error(e);
        }
	}

    async function callGeminiWeatherAdvisory(weathering) {
		let now = new Date();

		const genAI = new GoogleGenerativeAI(api_key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
		let prompt =  "What weather-related preperation should I make with these conditions? Date and time: " + now + ". Weather: " + weathering.current.condition.text + '. Outside temperature: ' + weathering.current.temp_f +' degrees fahrenheit. Location: ' + weathering.location.name + ' ' + weathering.location.region + ', ' + weathering.location.country + '. Give me a paragraph. Don\'t say here are some suggestions.';
        try {
            const response = await model.generateContent(prompt);
            weatherAdvisoryGeminiOutput.result = await response.response.text();
        } catch (e) {
            console.error(e);
        }
	}

	async function getCurrentWeather() {
		const position = await getPosition();

		const fetchWeatherPromise = await fetch(PUBLIC_URL+'/current.json?key='+PUBLIC_API_KEY+'&q='+ await position[1]+','+await position[0]+'&aqi=yes')
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			console.log("Response received.")
			return response.json();
		}).then(json => {
			console.log(json);
			weather = json;
			weatherState.weather = json;
			//console.log("Weather: " + weather.current.condition.text);
			if (thingsToDoGeminiOutput.result === 'Generating...') {
				callGeminiThingsToDo(weather);
			}

            if (weatherAdvisoryGeminiOutput.result === 'Generating...') {
				callGeminiWeatherAdvisory(weather);
			}

			//check if day/night
			if (weather.current.condition.text === "Sunny" || weather.current.condition.text === "Clear") {
				clouds = 0;
				rain = 0;
				snow = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
				/*bg_color = 'rgb(122, 195, 224)';
				txt_color = 'rgb(0,0,0)';*/
				/*bg_color = 'rgb(10, 12, 31)';
				txt_color = 'rgb(255,255,255)';*/
			} else if (weather.current.condition.text === "Partly cloudy") {
				clouds = 1;
				rain = 0;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Cloudy") {
				clouds = 2;
				rain = 0;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Overcast") {
				clouds = 3;
				rain = 0;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Mist") {
				clouds = 3;
				rain = 0;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Patchy rain possible") {
				clouds = 2;
				rain = 1;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Patchy snow possible") {
				clouds = 2;
				rain = 0;
				snow = 1;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Patchy sleet possible") {
				clouds = 2;
				rain = 1;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Patchy freezing drizzle possible") {
				clouds = 2;
				rain = 1;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Thundery outbreaks possible") {
				clouds = 3;
				rain = 1;
				snow = 0;
				ice_pellets = 0;
				thunder = true;
				freezing = true;
				fog = false;
				warning = true;
				weatherState.danger = ['storm'];
			} else if (weather.current.condition.text === "Blowing snow") {
				clouds = 3;
				rain = 0;
				snow = 3;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = true;
				warning = true;
				weatherState.danger = ['visibility'];
			} else if (weather.current.condition.text === "Blizzard") {
				clouds = 3;
				rain = 0;
				snow = 4;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = true;
				weatherState.danger = ['visibility', 'storm', 'road'];
			} else if (weather.current.condition.text === "Fog") {
				clouds = 3;
				rain = 0;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = true;
				warning = true;
				weatherState.danger = ['visibility'];
			} else if (weather.current.condition.text === "Freezing fog") {
				clouds = 3;
				rain = 0;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = true;
				warning = true;
				weatherState.danger = ['visibility', 'freezing'];
			} else if (weather.current.condition.text === "Patchy light drizzle") {
				clouds = 2;
				rain = 1;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Light drizzle") {
				clouds = 3;
				rain = 2;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Freezing drizzle") {
				clouds = 3;
				rain = 2;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = true;
				weatherState.danger = ['freezing', 'road'];
			} else if (weather.current.condition.text === "Heavy freezing drizzle") {
				clouds = 3;
				rain = 4;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = true;
				weatherState.danger = ['storm', 'freezing', 'road'];
			} else if (weather.current.condition.text === "Patchy light rain") {
				clouds = 2;
				rain = 1;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Light rain") {
				clouds = 3;
				rain = 2;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Moderate rain at times") {
				clouds = 3;
				rain = 3;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Moderate rain") {
				clouds = 3;
				rain = 3;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Heavy rain at times") {
				clouds = 3;
				rain = 4;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = ['road', 'storm'];
			} else if (weather.current.condition.text === "Heavy rain") {
				clouds = 3;
				rain = 4;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = ['road', 'storm'];
			} else if (weather.current.condition.text === "Light freezing rain") {
				clouds = 3;
				rain = 2;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = true;
				weatherState.danger = ['freezing', 'road'];
			} else if (weather.current.condition.text === "Moderate or heavy freezing rain") {
				clouds = 3;
				rain = 3;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = true;
				weatherState.danger = ['storm', 'freezing', 'road'];
			} else if (weather.current.condition.text === "Light sleet") {
				clouds = 3;
				rain = 2;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = true;
				weatherState.danger = ['freezing', 'road'];
			} else if (weather.current.condition.text === "Moderate or heavy sleet") {
				clouds = 3;
				rain = 3;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = true;
				weatherState.danger = ['storm', 'freezing', 'road'];
			} else if (weather.current.condition.text === "Patchy light snow") {
				clouds = 2;
				rain = 0;
				snow = 1;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Light snow") {
				clouds = 3;
				rain = 0;
				snow = 2;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Patchy moderate snow") {
				clouds = 2;
				rain = 0;
				snow = 3;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Moderate snow") {
				clouds = 3;
				rain = 0;
				snow = 3;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = true;
				weatherState.danger = ['road'];
			} else if (weather.current.condition.text === "Patchy heavy snow") {
				clouds = 2;
				rain = 0;
				snow = 4;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = true;
				weatherState.danger = ['road'];
			} else if (weather.current.condition.text === "Heavy snow") {
				clouds = 3;
				rain = 0;
				snow = 4;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = true;
				weatherState.danger = ['storm', 'road'];
			} else if (weather.current.condition.text === "Ice pellets") {
				clouds = 3;
				rain = 0;
				snow = 0;
				ice_pellets = 2;
				thunder = false;
				freezing = false;
				fog = false;
				warning = true;
				weatherState.danger = ['storm'];
			} else if (weather.current.condition.text === "Light rain shower") {
				clouds = 3;
				rain = 2;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Moderate or heavy rain shower") {
				clouds = 3;
				rain = 3;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = ['road'];
			} else if (weather.current.condition.text === "Torrential rain shower") {
				clouds = 3;
				rain = 4;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = true;
				weatherState.danger = ['storm', 'road'];
			} else if (weather.current.condition.text === "Light sleet showers") {
				clouds = 3;
				rain = 2;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Moderate or heavy sleet showers") {
				clouds = 3;
				rain = 3;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = true;
				weatherState.danger = ['storm', 'road', 'freezing'];
			} else if (weather.current.condition.text === "Light snow showers") {
				clouds = 3;
				rain = 0;
				snow = 2;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Moderate or heavy snow showers") {
				clouds = 3;
				rain = 0;
				snow = 3;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = true;
				weatherState.danger = ['storm', 'road'];
			} else if (weather.current.condition.text === "Light showers of ice pellets") {
				clouds = 3;
				rain = 0;
				snow = 0;
				ice_pellets = 2;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Moderate or heavy showers of ice pellets") {
				clouds = 3;
				rain = 0;
				snow = 0;
				ice_pellets = 3;
				thunder = false;
				freezing = false;
				fog = false;
				warning = true;
				weatherState.danger = ['storm'];
			} else if (weather.current.condition.text === "Patchy light rain with thunder") {
				clouds = 2;
				rain = 1;
				snow = 0;
				ice_pellets = 0;
				thunder = true;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Moderate or heavy rain with thunder") {
				clouds = 3;
				rain = 3;
				snow = 0;
				ice_pellets = 0;
				thunder = true;
				freezing = false;
				fog = false;
				warning = true;
				weatherState.danger = ['storm', 'road'];
			} else if (weather.current.condition.text === "Patchy light snow with thunder") {
				clouds = 2;
				rain = 0;
				snow = 1;
				ice_pellets = 0;
				thunder = true;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = null;
			} else if (weather.current.condition.text === "Moderate or heavy snow with thunder") {
				clouds = 3;
				rain = 0;
				snow = 3;
				ice_pellets = 0;
				thunder = true;
				freezing = false;
				fog = false;
				warning = true;
				weatherState.danger = ['storm', 'road'];
			}
		}).catch(error => {
			console.error('There was a problem with the fetch operation:', error);
		});

		const fetchAstroPromise = await fetch(PUBLIC_URL+'/astronomy.json?key='+PUBLIC_API_KEY+'&q='+ await position[1]+','+await position[0])
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			console.log("Response received.")
			return response.json();
		}).then(json => {
			console.log(json);
			astronomy = json;
			astronomyState.astronomy = json;

			let now = new Date();
			//console.log(now.getHours())
			let sunrise = astronomy.astronomy.astro.sunrise;
			let sunset = astronomy.astronomy.astro.sunset;
			if (sunrise.slice(6) === 'PM') {
				sunrise = parseInt(sunrise.slice(0,2),10) + 12;
			} else {
				sunrise = parseInt(sunrise.slice(0,2),10)
			}
			if (sunset.slice(6) === 'PM') {
				sunset = parseInt(sunset.slice(0,2),10) + 12;
			} else {
				sunset = parseInt(sunset.slice(0,2),10)
			}
			if (now.getHours() >= sunrise && now.getHours() <= sunset) {
				day = true;
				if (astronomy.astronomy.astro.is_sun_up == 1) {
					sun = true;
				} else {
					sun = false;
				}
			} else {
				day = false;
				moon_phase = astronomy.astronomy.astro.moon_phase;
				if (astronomy.astronomy.astro.is_moon_up == 1) {
					moon = true;
				} else {
					moon = false;
				}
			}
			/*if (astronomy.astronomy.is_sun_up == 1) {
				day = true;
				sun = true;
				moon = false;
			} else {
				day = false;
				sun = false;
				moon = true;
				moon_phase = 
			}*/
			//console.log("Weather: " + weather.current.condition.text);
		}).catch(error => {
			console.error('There was a problem with the fetch operation:', error);
		});
	}

	async function getWeatherForecast() {
		const position = await getPosition();
		const fetchWeatherPromise = await fetch(PUBLIC_URL+'/forecast.json?key='+PUBLIC_API_KEY+'&q='+ await position[1]+','+await position[0]+'&days=7&aqi=yes&alerts=yes')
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			console.log("Response received.")
			return response.json();
		}).then(json => {
			console.log(json);
			forecastState.forecast = json;
			let icons = [];
			let hour_icons = [];
			for (let i = 0; i < forecastState.forecast.forecast.forecastday.length; i++) {
				if (forecastState.forecast.forecast.forecastday[i].day.condition.text === "Sunny" || forecastState.forecast.forecast.forecastday[i].day.condition.text === "Clear") {
					icons.push('sun')

				} else if (forecastState.forecast.forecast.forecastday[i].day.condition.text.includes("Partly")) {
					icons.push('cloudsun')

				} else if (forecastState.forecast.forecast.forecastday[i].day.condition.text.includes("Cloudy")) {
					icons.push('cloud')

				} else if (forecastState.forecast.forecast.forecastday[i].day.condition.text.includes("Overcast")) {
					icons.push('cloud')

				} else if (forecastState.forecast.forecast.forecastday[i].day.condition.text === "Mist") {
					icons.push('cloudfog')

				} else if (forecastState.forecast.forecast.forecastday[i].day.condition.text.includes("thunder")) {
					icons.push('cloudlightning')

				} else if (forecastState.forecast.forecast.forecastday[i].day.condition.text.includes("rain") || forecastState.forecast.forecast.forecastday[i].day.condition.text.includes("drizzle") || forecastState.forecast.forecast.forecastday[i].day.condition.text.includes("sleet") || forecastState.forecast.forecast.forecastday[i].day.condition.text.includes("shower")) {
					icons.push('cloudrain')
				} else if (forecastState.forecast.forecast.forecastday[i].day.condition.text.includes("snow") || forecastState.forecast.forecast.forecastday[i].day.condition.text.includes("ice")) {
					icons.push('cloudsnow')
				} else if (forecastState.forecast.forecast.forecastday[i].day.condition.text === "Blizzard") {
					icons.push('cloudsnow')
				} else if (forecastState.forecast.forecast.forecastday[i].day.condition.text === "Fog") {
					icons.push('cloudfog')
				} else if (forecastState.forecast.forecast.forecastday[i].day.condition.text === "Freezing fog") {
					icons.push('cloudfog')
				}
			}
			for (let i = 0; i < forecastState.forecast.forecast.forecastday[0].hour.length; i++) {
				
				if (forecastState.forecast.forecast.forecastday[0].hour[i].condition.text === "Sunny" || forecastState.forecast.forecast.forecastday[0].hour[i].condition.text === "Clear") {
					hour_icons.push('sun')
				} else if (forecastState.forecast.forecast.forecastday[0].hour[i].condition.text.includes("Partly")) {
					hour_icons.push('cloudsun')
				} else if (forecastState.forecast.forecast.forecastday[0].hour[i].condition.text.includes("Cloudy")) {
					hour_icons.push('cloud')
				} else if (forecastState.forecast.forecast.forecastday[0].hour[i].condition.text.includes("Overcast")) {
					hour_icons.push('cloud')
				} else if (forecastState.forecast.forecast.forecastday[0].hour[i].condition.text === "Mist") {
					hour_icons.push('cloudfog')
				} else if (forecastState.forecast.forecast.forecastday[0].hour[i].condition.text.includes("thunder") || forecastState.forecast.forecast.forecastday[0].hour[i].condition.text.includes("outbreaks")) {
					hour_icons.push('cloudlightning')
				} else if (forecastState.forecast.forecast.forecastday[0].hour[i].condition.text.includes("rain") || forecastState.forecast.forecast.forecastday[0].hour[i].condition.text.includes("drizzle") || forecastState.forecast.forecast.forecastday[0].hour[i].condition.text.includes("sleet") || forecastState.forecast.forecast.forecastday[0].hour[i].condition.text.includes("shower")) {
					hour_icons.push('cloudrain')
				} else if (forecastState.forecast.forecast.forecastday[0].hour[i].condition.text.includes("snow") || forecastState.forecast.forecast.forecastday[0].hour[i].condition.text.includes("ice")) {
					hour_icons.push('cloudsnow')
				} else if (forecastState.forecast.forecast.forecastday[0].hour[i].condition.text === "Blizzard") {
					hour_icons.push('cloudsnow')
				} else if (forecastState.forecast.forecast.forecastday[0].hour[i].condition.text === "Fog") {
					hour_icons.push('cloudfog')
				} else if (forecastState.forecast.forecast.forecastday[0].hour[i].condition.text === "Freezing fog") {
					hour_icons.push('cloudfog')
				}
			}
			forecastState.icons = icons;
			forecastState.hour_icons = hour_icons;
			console.log(icons)
			console.log(hour_icons)
		}).catch(error => {
			console.error('There was a problem with the fetch operation:', error);
		});
	}

	async function getAlertsToday() {
		const position = await getPosition();
		const fetchAlertPromise = await fetch(PUBLIC_URL+'/alerts.json?key='+PUBLIC_API_KEY+'&q='+ await position[1]+','+await position[0])
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			console.log("Response received.")
			return response.json();
		}).then(json => {
			console.log(json);
			alertState.alerts = json;
		}).catch(error => {
			console.error('There was a problem with the fetch operation:', error);
		});
	}

    async function getPosition() {
		// default position in case geolocation fails
		let userLocation = [-122.205, 47.613];
		// get user location if possible
		try {
			const position = await new Promise((resolve, reject) => {
				if (!navigator.geolocation) {
					reject(new Error('Geolocation not supported'));
				}
				navigator.geolocation.getCurrentPosition(
					(position) => resolve(position),
					(error) => reject(error),
					{
						enableHighAccuracy: true
					}
				);
			});
			userLocation = [position.coords.longitude, position.coords.latitude];
			console.log('Got position:', position);
		} catch (error) {
			console.warn('Failed to get location:', error);
		}

		return userLocation;
	}

    onMount(async () => {
		getCurrentWeather();
		getWeatherForecast();
		getAlertsToday();

		/*if (current_weather.currrent.condition === "Overcast") {
			bg_color = "gray";
		} else if (current_weather.currrent.condition === "Sunny") {
			bg_color = "sky_blue";
		}*/
		setInterval(function () {
			weatherState.weather = weather;
			astronomyState.astronomy = astronomy;
			if(clouds == 0){
				if (day) {
					bg_color = 'rgb(92, 203, 255)';
					iconState.icon = "Sun";
				} else{
					bg_color = 'rgb(10, 12, 59)';
					iconState.icon = "Moon";
				}
			} else if (clouds == 1) {
				if (day) {
					bg_color = 'rgb(140, 171, 186)';
					iconState.icon = "SunCloud";
				} else{
					bg_color = 'rgb(28, 29, 61)';
					iconState.icon = "MoonCloud";
				}
			} else if (clouds == 2) {
				if (day) {
					bg_color = 'rgb(145, 155, 161)'
				} else{
					bg_color = 'rgb(36, 36, 51)'
				}
				if (rain>0 || ice_pellets>0) {
					iconState.icon = "Rain"
				} else if (snow>0) {
					iconState.icon = "Snow"
				} else if (fog) {
					iconState.icon = "Fog"
				} else {
					iconState.icon = "Cloud"
				}
			} else {
				if (day) {
					bg_color = 'rgb(103, 107, 110)'
				} else{
					bg_color = 'rgb(36, 36, 38)'
				}

				if (thunder) {
					iconState.icon = "Thunder"
				} else if (rain>0 || ice_pellets>0) {
					iconState.icon = "Rain"
				} else if (snow>0) {
					iconState.icon = "Snow"
				} else if (fog) {
					iconState.icon = "Fog"
				} else {
					iconState.icon = "Cloud"
				}
			}
		}, 100);
		setInterval(function () {
			getCurrentWeather(position);
		}, 120000);
    });
</script>

<div class="weather" style="background-color: {bg_color}; color: {txt_color}" in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}>
	{#if weather && astronomy}
		<!--<h1>Your Current Weather: {weather.current.condition.text}</h1>-->
		{#if rain == 1}
			<div class="anim_container">
				<div class="droplet" style="animation-delay: {Math.random()*4}s; left: 4vw;">
				</div>
				<div class="droplet" style="animation-delay: {Math.random()*4}s; left: 94vw;">
				</div>
				{#each Array(5) as _, i}
					<div class="droplet" style="animation-delay: {Math.random()*4}s; left: {Math.random()*100}vw;">
					</div>
				{/each}
			</div>
		{:else if rain == 2}
			<div class="anim_container">
				<div class="droplet" style="animation-delay: {Math.random()*4}s; left: 4vw;">
				</div>
				<div class="droplet" style="animation-delay: {Math.random()*4}s; left: 94vw;">
				</div>
				{#each Array(10) as _, i}
					<div class="droplet" style="animation-delay: {Math.random()*4}s; left: {Math.random()*100}vw;">
					</div>
				{/each}
			</div>
		{:else if rain == 3}
			<div class="anim_container">
				<div class="droplet" style="animation-delay: {Math.random()*4}s; left: 4vw;">
				</div>
				<div class="droplet" style="animation-delay: {Math.random()*4}s; left: 94vw;">
				</div>
				{#each Array(30) as _, i}
					<div class="droplet" style="animation-delay: {Math.random()*4}s; left: {Math.random()*100}vw;">
					</div>
				{/each}
			</div>
		{:else if rain == 4}
			<div class="anim_container">
				<div class="droplet" style="animation-delay: {Math.random()*4}s; left: 4vw;">
				</div>
				<div class="droplet" style="animation-delay: {Math.random()*4}s; left: 94vw;">
				</div>
				{#each Array(70) as _, i}
					<div class="droplet" style="animation-delay: {Math.random()*4}s; left: {Math.random()*100}vw;">
					</div>
				{/each}
			</div>
		{/if}

		{#if snow == 1}
			<div class="anim_container">
				<div class="flake" style="animation-delay: {Math.random()*8}s; left: 4vw;">
				</div>
				<div class="flake" style="animation-delay: {Math.random()*8}s; left: 94vw;">
				</div>
				{#each Array(10) as _, i}
					<div class="flake" style="animation-delay: {Math.random()*8}s; left: {Math.random()*100}vw;">
					</div>
				{/each}
			</div>
		{:else if snow == 2}
			<div class="anim_container">
				<div class="flake" style="animation-delay: {Math.random()*8}s; left: 4vw;">
				</div>
				<div class="flake" style="animation-delay: {Math.random()*8}s; left: 94vw;">
				</div>
				{#each Array(20) as _, i}
					<div class="flake" style="animation-delay: {Math.random()*8}s; left: {Math.random()*100}vw;">
					</div>
				{/each}
			</div>
		{:else if snow == 3}
			<div class="anim_container">
				<div class="flake" style="animation-delay: {Math.random()*8}s; left: 4vw;">
				</div>
				<div class="flake" style="animation-delay: {Math.random()*8}s; left: 94vw;">
				</div>
				{#each Array(40) as _, i}
					<div class="flake" style="animation-delay: {Math.random()*8}s; left: {Math.random()*100}vw;">
					</div>
				{/each}
			</div>
		{:else if snow == 4}
			<div class="anim_container">
				<div class="flake" style="animation-delay: {Math.random()*8}s; left: 4vw;">
				</div>
				<div class="flake" style="animation-delay: {Math.random()*8}s; left: 94vw;">
				</div>
				{#each Array(80) as _, i}
					<div class="flake" style="animation-delay: {Math.random()*8}s; left: {Math.random()*100}vw;">
					</div>
				{/each}
			</div>
		{/if}

		{#if ice_pellets == 1}
			<div class="anim_container">
				<div class="pellet" style="animation-delay: {Math.random()*8}s; left: 4vw;">
				</div>
				<div class="pellet" style="animation-delay: {Math.random()*8}s; left: 94vw;">
				</div>
				{#each Array(10) as _, i}
					<div class="pellet" style="animation-delay: {Math.random()*8}s; left: {Math.random()*100}vw;">
					</div>
				{/each}
			</div>
		{:else if ice_pellets == 2}
			<div class="anim_container">
				<div class="pellet" style="animation-delay: {Math.random()*8}s; left: 4vw;">
				</div>
				<div class="pellet" style="animation-delay: {Math.random()*8}s; left: 94vw;">
				</div>
				{#each Array(20) as _, i}
					<div class="pellet" style="animation-delay: {Math.random()*8}s; left: {Math.random()*100}vw;">
					</div>
				{/each}
			</div>
		{:else if ice_pellets == 3}
			<div class="anim_container">
				<div class="pellet" style="animation-delay: {Math.random()*8}s; left: 4vw;">
				</div>
				<div class="pellet" style="animation-delay: {Math.random()*8}s; left: 94vw;">
				</div>
				{#each Array(40) as _, i}
					<div class="pellet" style="animation-delay: {Math.random()*8}s; left: {Math.random()*100}vw;">
					</div>
				{/each}
			</div>
		{:else if ice_pellets == 4}
			<div class="anim_container">
				<div class="pellet" style="animation-delay: {Math.random()*8}s; left: 4vw;">
				</div>
				<div class="pellet" style="animation-delay: {Math.random()*8}s; left: 94vw;">
				</div>
				{#each Array(80) as _, i}
					<div class="pellet" style="animation-delay: {Math.random()*8}s; left: {Math.random()*100}vw;">
					</div>
				{/each}
			</div>
		{/if}

		{#if day}
			{#if clouds == 0}
				<div class="anim_container">
					<div class="sun"></div>
				</div>
			{:else if clouds == 1 && snow == 0 && rain == 0 && ice_pellets == 0}
				<div class="anim_container">
					<div class="sun"></div>
					{#each Array(10) as _, i}
						<div class="cloud" style="animation-delay: {Math.random()*60}s; top: {Math.random()*80}vh; scale: {Math.random()+3}; animation-duration: {Math.random()*24+60}s;">
							<div class="plume1" style="background-color: rgb(196, 196, 196);"></div>
							<div class="plume2" style="background-color: rgb(193, 193, 193);"></div>
							<div class="plume3" style="background-color: rgb(186, 186, 186);"></div>
						</div>
					{/each}
				</div>
			{:else if clouds == 2 && snow == 0 && rain == 0 && ice_pellets == 0}
				<div class="anim_container">
					{#each Array(40) as _, i}
						<div class="cloud" style="animation-delay: {Math.random()*60}s; top: {Math.random()*80}vh; scale: {Math.random()+3}; animation-duration: {Math.random()*24+60}s;">
							<div class="plume1" style="background-color: rgb(196, 196, 196);"></div>
							<div class="plume2" style="background-color: rgb(193, 193, 193);"></div>
							<div class="plume3" style="background-color: rgb(186, 186, 186);"></div>
						</div>
					{/each}
				</div>
			{:else if clouds == 3 && snow == 0 && rain == 0 && ice_pellets == 0}
				<div class="anim_container">
					{#each Array(80) as _, i}
						<div class="cloud" style="animation-delay: {Math.random()*60}s; top: {Math.random()*80}vh; scale: {Math.random()+3}; animation-duration: {Math.random()*24+60}s;">
							<div class="plume1" style="background-color: rgb(196, 196, 196);"></div>
							<div class="plume2" style="background-color: rgb(193, 193, 193);"></div>
							<div class="plume3" style="background-color: rgb(186, 186, 186);"></div>
						</div>
					{/each}
				</div>
			{/if}
			{#if thunder}
				<div class="anim_container">
					<div class="flash">
					</div>
				</div>
			{/if}
		{:else}
			<!--Show stars if no clouds-->
			{#if clouds == 0}
				<div class="anim_container">
					{#each Array(69) as _, i}
						<div class="star" style="left: {Math.random()*100}vw; top: {Math.random()*100}vh; animation-duration: {Math.random()*3+1}s">
						</div>
					{/each}
				</div>
				{:else if clouds == 1 && snow == 0 && rain == 0 && ice_pellets == 0}
				<div class="anim_container">
					{#each Array(69) as _, i}
						<div class="star" style="left: {Math.random()*100}vw; top: {Math.random()*100}vh; animation-duration: {Math.random()*3+1}s">
						</div>
					{/each}
					{#each Array(10) as _, i}
						<div class="cloud" style="animation-delay: {Math.random()*60}s; top: {Math.random()*80}vh; scale: {Math.random()+3}; animation-duration: {Math.random()*24+60}s;">
							<div class="plume1" style="background-color: rgb(96, 96, 96);"></div>
							<div class="plume2" style="background-color: rgb(93, 93, 93);"></div>
							<div class="plume3" style="background-color: rgb(86, 86, 86);"></div>
						</div>
					{/each}
				</div>
			{:else if clouds == 2 && snow == 0 && rain == 0 && ice_pellets == 0}
				<div class="anim_container">
					{#each Array(40) as _, i}
						<div class="cloud" style="animation-delay: {Math.random()*60}s; top: {Math.random()*80}vh; scale: {Math.random()+3}; animation-duration: {Math.random()*24+60}s;">
							<div class="plume1" style="background-color: rgb(96, 96, 96);"></div>
							<div class="plume2" style="background-color: rgb(93, 93, 93);"></div>
							<div class="plume3" style="background-color: rgb(86, 86, 86);"></div>
						</div>
					{/each}
				</div>
			{:else if clouds == 3 && snow == 0 && rain == 0 && ice_pellets == 0}
				<div class="anim_container">
					{#each Array(80) as _, i}
						<div class="cloud" style="animation-delay: {Math.random()*60}s; top: {Math.random()*80}vh; scale: {Math.random()+3}; animation-duration: {Math.random()*24+60}s;">
							<div class="plume1" style="background-color: rgb(96, 96, 96);"></div>
							<div class="plume2" style="background-color: rgb(93, 93, 93);"></div>
							<div class="plume3" style="background-color: rgb(86, 86, 86);"></div>
						</div>
					{/each}
				</div>
			{/if}
			{#if thunder}
				<div class="anim_container">
					<div class="flash">
					</div>
				</div>
			{/if}
		{/if}
	{/if}
</div>
<div class="navbar">
	<div class="bar">
		<a href="/" class="routeL" title="name">AccliMate</a>
		<div class="right" style="float:right">
			<a href="/" class="route" title="Weather Now">Now</a>
			<a href="/forecast" class="route" title="Forecast">Forecast</a>
			<a href="/alerts" class="route" title="Alerts">Alerts</a>
			<a href="/tripplanner" class="router" title="Trip Planner">Trip Planner</a>
			<a href="/guide" class="routeR" title="Guide">Guide</a>
		</div>
	</div>
</div>
{#key data.pathname}
	<div class="main" in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}>
		<slot />
	</div>
{/key}

<style>
	.weather {
		background-color: white;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		z-index: -3;
		overflow: hidden;
		transition: .2s;
	}
	.sun{
		position: absolute;
		top: 7.5vh;
		left: 15vw;
		width: 30vh;
		height: 30vh;
		border-radius: 20vh;
		background-color: rgb(255, 240, 154);
	}
	.anim_container{
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
	.flash{
		position: inherit;
		width: 100%;
		height: 100%;
		background-color: white;
		animation: flash 10s infinite linear;
		opacity: 100;
	}
	.star{
		position: inherit;
		background-color: rgba(255,255,255,1);
		height: .5vh;
		width: .5vh;
		border-radius: 1vh;
		animation: pulse 2s infinite ease-in-out;
	}
	.cloud{
		position: inherit;
		top: 5vw;
		left: -30vw;
		scale: 4;
		animation: drift 15s infinite linear;
	}
	.plume1{
		position: inherit;
		background-color: rgb(193, 193, 193);
		width: 8vh;
		height: 8vh;
		border-radius: 8vh;
		left: 2.5vh;
	}
	.plume2{
		position: inherit;
		background-color: rgb(196, 196, 196);
		width: 5vh;
		height: 5vh;
		border-radius: 5vh;
		top: 2.5vh;
		z-index: -1;
	}
	.plume3{
		position: inherit;
		background-color: rgb(186, 186, 186);
		width: 7vh;
		height: 7vh;
		border-radius: 7vh;
		left: 6vh;
		top: 1vh;
		z-index: -1;
	}
	.droplet{
		position: inherit;
		background-color: rgba(255,255,255,.4);
		height: 3vh;
		width: .2vh;
		top: -5vh;
		border-radius: 1vh;
		animation: fall .5s infinite linear;
	}
	.flake{
		position: inherit;
		background-color: rgba(255,255,255,.7);
		height: .5vh;
		width: .5vh;
		top: -5vh;
		border-radius: 1vh;
		animation: fall 5s infinite linear;
	}
	.pellet{
		position: inherit;
		background-color: rgba(255,255,255,.8);
		height: .5vh;
		width: .5vh;
		top: -5vh;
		animation: fall .5s infinite linear;
	}

	.navbar{
		position: absolute;
		top: 2vh;
		left: 0;
		margin: 0 20vw;
		width: 60vw;
		height: 3vh;
	}
	.bar{
		display: inline-block;
		padding: 2vh 2vw;
		border-radius: 2vh;
		background-color: rgba(255,255,255,.6);
        backdrop-filter: blur(2vh);
		width: 100%;
	}
	a{
		color:black;
		text-decoration: none;
		transition: .2s;
		display: inline-block;
		align-items: center;
	}
	a:hover{
		color: rgb(255, 255, 255);
	}
	.icon{
		display: inline;
	}
	.route {
		padding: 0 1vw;
	}
	.routeL {
		padding-right: 1vw;
	}
	.routeR {
		padding-left: 1vw; 
	}
	.main{
		position: absolute;
		top: 12vh;
		left:0;
		height: 84vh;
	}
	.gg {
		background-color: rgb(10, 12, 31);
	}

	@keyframes pulse {

		0% { transform: scale(1); }

		50% { transform: scale(2); }

		100% { transform: scale(1); }

	}

	@keyframes drift {

		100% { transform: translateX(1000px);}
	}

	@keyframes fall {
		100% { transform: translateY(120vh); }
	}

	@keyframes flash {
		0% {opacity: 0;}
		15% {opacity:0;}
		16% {opacity:1;}
		25% {opacity:0;}
		65% {opacity:0;}
		66% {opacity:1}
		69% {opacity:.2}
		70% {opacity:1}
		80% {opacity: 0}
		100% {opacity:0;}
	}
</style>