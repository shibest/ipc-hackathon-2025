<script>
	import { PUBLIC_API_KEY, PUBLIC_URL } from '$env/static/public';
	import { onMount } from "svelte";
	import { weatherState, iconState, astronomyState } from '$lib/state.svelte';

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

	async function getCurrentWeather() {
		//console.log(PUBLIC_API_KEY);
		//console.log(PUBLIC_URL+'/current.json?key='+PUBLIC_API_KEY+'&q='+lat+','+long+'&aqi=yes');
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
				weatherState.danger = ['visibility'];
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
				weatherState.danger = ['visibility', 'freeze'];
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
			} else if (weather.current.condition.text === "Heavy freezing drizzle") {
				clouds = 3;
				rain = 4;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = true;
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
				weatherState.danger = ['driving'];
			} else if (weather.current.condition.text === "Heavy rain") {
				clouds = 3;
				rain = 4;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
				weatherState.danger = ['driving'];
			} else if (weather.current.condition.text === "Light freezing rain") {
				clouds = 3;
				rain = 2;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = true;
			} else if (weather.current.condition.text === "Moderate or heavy freezing rain") {
				clouds = 3;
				rain = 3;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = true;
			} else if (weather.current.condition.text === "Light sleet") {
				clouds = 3;
				rain = 2;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = true;
			} else if (weather.current.condition.text === "Moderate or heavy sleet") {
				clouds = 3;
				rain = 3;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = true;
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
				weatherState.danger = ['visibility'];
			} else if (weather.current.condition.text === "Patchy heavy snow") {
				clouds = 2;
				rain = 0;
				snow = 4;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = true;
			} else if (weather.current.condition.text === "Heavy snow") {
				clouds = 3;
				rain = 0;
				snow = 4;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = true;
			} else if (weather.current.condition.text === "Ice pellets") {
				clouds = 3;
				rain = 0;
				snow = 0;
				ice_pellets = 2;
				thunder = false;
				freezing = false;
				fog = false;
				warning = true;
			} else if (weather.current.condition.text === "Light rain shower") {
				clouds = 3;
				rain = 2;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
			} else if (weather.current.condition.text === "Moderate or heavy rain shower") {
				clouds = 3;
				rain = 3;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
			} else if (weather.current.condition.text === "Torrential rain shower") {
				clouds = 3;
				rain = 4;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = true;
			} else if (weather.current.condition.text === "Light sleet showers") {
				clouds = 3;
				rain = 2;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = false;
			} else if (weather.current.condition.text === "Moderate or heavy sleet showers") {
				clouds = 3;
				rain = 3;
				snow = 0;
				ice_pellets = 0;
				thunder = false;
				freezing = true;
				fog = false;
				warning = true;
			} else if (weather.current.condition.text === "Light snow showers") {
				clouds = 3;
				rain = 0;
				snow = 2;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
			} else if (weather.current.condition.text === "Moderate or heavy snow showers") {
				clouds = 3;
				rain = 0;
				snow = 3;
				ice_pellets = 0;
				thunder = false;
				freezing = false;
				fog = false;
				warning = true;
			} else if (weather.current.condition.text === "Light showers of ice pellets") {
				clouds = 3;
				rain = 0;
				snow = 0;
				ice_pellets = 2;
				thunder = false;
				freezing = false;
				fog = false;
				warning = false;
			} else if (weather.current.condition.text === "Moderate or heavy showers of ice pellets") {
				clouds = 3;
				rain = 0;
				snow = 0;
				ice_pellets = 3;
				thunder = false;
				freezing = false;
				fog = false;
				warning = true;
			} else if (weather.current.condition.text === "Patchy light rain with thunder") {
				clouds = 2;
				rain = 1;
				snow = 0;
				ice_pellets = 0;
				thunder = true;
				freezing = false;
				fog = false;
				warning = false;
			} else if (weather.current.condition.text === "Moderate or heavy rain with thunder") {
				clouds = 3;
				rain = 3;
				snow = 0;
				ice_pellets = 0;
				thunder = true;
				freezing = false;
				fog = false;
				warning = true;
			} else if (weather.current.condition.text === "Patchy light snow with thunder") {
				clouds = 2;
				rain = 0;
				snow = 1;
				ice_pellets = 0;
				thunder = true;
				freezing = false;
				fog = false;
				warning = false;
			} else if (weather.current.condition.text === "Moderate or heavy snow with thunder") {
				clouds = 3;
				rain = 0;
				snow = 3;
				ice_pellets = 0;
				thunder = true;
				freezing = false;
				fog = false;
				warning = true;
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
		//console.log(getWeatherFromPosition());
		getCurrentWeather();

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
		/*setInterval(function () {
			getCurrentWeather();
		}, 300000);*/
    });
</script>

<div class="weather" style="background-color: {bg_color}; color: {txt_color}">
	{#if weather && astronomy}
		<!--<h1>Your Current Weather: {weather.current.condition.text}</h1>-->
		{#if day}
		{:else}
			<!--Show stars if no clouds-->
			{#if clouds == 0}
				<div class="stars">
					{#each Array(69) as _, i}
						<div class="star" style="left: {Math.random()*100}vw; top: {Math.random()*100}vh; animation-duration: {Math.random()*3+1}s">
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	{/if}
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
		z-index: -2;
		overflow: hidden;
		transition: .2s;
	}
	.stars{
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
	.star{
		position: inherit;
		background-color: rgba(255,255,255,1);
		height: .8vh;
		width: .8vh;
		border-radius: 1vh;
		animation: pulse 2s infinite ease-in-out;
	}


	.main{
		position: absolute;
		top: 0;
		left:0;
	}
	.gg {
		background-color: rgb(10, 12, 31);
	}

	@keyframes pulse {

		0% { transform: scale(1); }

		50% { transform: scale(1.3); }

		100% { transform: scale(1); }

	}
</style>