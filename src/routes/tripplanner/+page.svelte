<svelte:head>
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css' rel='stylesheet' />
    <script src='https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js'></script>
    <title>Trip Planner</title>
</svelte:head>

<script>
    import { onMount } from 'svelte';
    import mapboxgl from 'mapbox-gl';

    import { PUBLIC_API_KEY, PUBLIC_URL, PUBLIC_GEMINI_API_KEY } from '$env/static/public';
    import { GoogleGenerativeAI } from "@google/generative-ai";

    import {weatherState} from '$lib/state.svelte';

    import {Moon, CloudMoon, Sun, CloudSun, CloudRain, CloudSnow, CloudFog, CloudLightning, Cloud} from 'phosphor-svelte';

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

    let map;
    let mapContainer;
    let origin = '';
    let destination = '';
    let origin_weather;
    let destination_weather;
    let markers = [];
    let geminiTripReport;
    let coordinates;

    const api_key = PUBLIC_GEMINI_API_KEY;

    onMount(() => {
        map = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-122.308954, 47.608027],
            zoom: 12
        });
        map.addControl(new mapboxgl.NavigationControl());
    });

    async function getWeatherAtTime(coordinates, datetime=null) {
        if (datetime) {
            const date = datetime.toISOString().split('T'); 
            const hour = datetime.toLocaleTimeString({ hour: '2-digit'}).split(":")[0];
            
            const response = await fetch(`${PUBLIC_URL}/forecast.json?key=${PUBLIC_API_KEY}&q=${coordinates[1]},${coordinates[0]}&aqi=yes&dt=${date}&hour=${hour}`);
            const data = await response.json()
            console.log(data);
            return data
        } else {
            const response = await fetch(`${PUBLIC_URL}/current.json?key=${PUBLIC_API_KEY}&q=${coordinates[1]},${coordinates[0]}&aqi=yes`)
            const data = await response.json()
            console.log(data);
            return data
        }
    }

    async function getRoute(originPlace, destinationPlace) {
        if (!originPlace || !destinationPlace) {
            alert("Please enter both origin and destination.");
            return;
        }
        let originCoords;

        if (originPlace === 'My Location') {
            originCoords = await getPosition();;
        } else {
            originCoords = await geocode(originPlace);
        }

        const destinationCoords = await geocode(destinationPlace);
        origin_weather = await getWeatherAtTime(originCoords);
        destination_weather = await getWeatherAtTime(destinationCoords);
        //console.log(`https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.join(',')};${destinationCoords.join(',')}?access_token=${mapboxgl.accessToken}`);
        const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${await originCoords.join(',')};${destinationCoords.join(',')}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();

        if (await data.code === 'Ok' && await data.routes.length > 0) {
            const route = await data.routes[0].geometry.coordinates;
            coordinates = await extractCoordinatesAtInterval(data.routes[0], 3600);
            addPinsToMap(coordinates);
            getTripReport(coordinates);
            //addPinsToMap([originCoords, destinationCoords])
            const geojson = {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: route
                }
            };

            if (map.getSource('route')) {
                map.getSource('route').setData(geojson);
            } else {
                map.addLayer({
                    id: 'route',
                    type: 'line',
                    source: {
                        type: 'geojson',
                        data: geojson
                    },
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#3887be',
                        'line-width': 5,
                        'line-opacity': 0.75
                    }
                });
            }

        } else {
            alert("check spelling");
        }
    }

    async function geocode(placeName) {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(placeName)}.json?access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();

        if(data.features && data.features.length > 0) {
            return data.features[0].center;
        } else {
            throw new Error("Location not found");
        }
    }

    async function extractCoordinatesAtInterval(route, intervalSeconds) {
        let coordinates = [];
        let accumulatedDuration = 0;
        let currentStepIndex = 0;
        const now = new Date();
        const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
        let nextInterval = Math.round((nextHour.getTime() - now.getTime()) / 1000);

        console.log(route);
        const originCoordinates = route.geometry.coordinates[0];
        const originCity = await getCityName(originCoordinates);
        const originWeather = await getWeatherAtTime(originCoordinates);
        
        coordinates.push([originCoordinates, now, originCity, originWeather.current.temp_f, originWeather.current.condition.text, originWeather]);
        
        while (currentStepIndex < route.legs[0].steps.length) {
            const step = route.legs[0].steps[currentStepIndex];
            const stepDuration = step.duration;
            const stepGeometry = step.geometry.coordinates;

            while (accumulatedDuration + stepDuration >= nextInterval) {
                const timeDifference = nextInterval - accumulatedDuration;
                const percentage = timeDifference / stepDuration;

                const interpolatedCoordinates = interpolateCoordinates(stepGeometry, percentage);
                const intervalDatetime = new Date(now.getTime() + (accumulatedDuration + timeDifference) * 1000);

                const city = await getCityName(interpolatedCoordinates);
                const weather = await getWeatherAtTime(interpolatedCoordinates, intervalDatetime);
                //console.log(weather);

                coordinates.push([interpolatedCoordinates, intervalDatetime, city, weather.forecast.forecastday[0].hour[0].temp_f, weather.forecast.forecastday[0].hour[0].condition.text, weather])

                nextInterval += 3600; 
            }

            accumulatedDuration += stepDuration;
            currentStepIndex++;
        }

        const destinationCoordinates = route.geometry.coordinates.slice(-1)[0];
        const destinationCity = await getCityName(destinationCoordinates);
        const destinationDatetime = new Date(now.getTime() + accumulatedDuration * 1000);
        const destinationWeather = await getWeatherAtTime(destinationCoordinates, destinationDatetime);
        coordinates.push([destinationCoordinates, destinationDatetime, destinationCity, destinationWeather.forecast.forecastday[0].hour[0].temp_f, destinationWeather.forecast.forecastday[0].hour[0].condition.text, destinationWeather]);

        return coordinates;
    }

    async function getCityName(coordinates) {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.join(',')}.json?types=place&access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            return data.features[0].place_name; 
        } else {
            return "Unknown City";
        }
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
    function getMyLocation(){
        origin = "My Location"
    }

    function interpolateCoordinates(geometry, percentage) {
        if (geometry.length < 2) {
            return geometry[0];
        }

        const index = Math.floor((geometry.length - 1) * percentage);
        const fraction = (geometry.length - 1) * percentage - index;

        const startCoordinates = geometry[index];
        const endCoordinates = geometry[index + 1];

        const interpolatedLng = startCoordinates[0] + (endCoordinates[0] - startCoordinates[0]) * fraction;
        const interpolatedLat = startCoordinates[1] + (endCoordinates[1] - startCoordinates[1]) * fraction;

        return [interpolatedLng, interpolatedLat];
    }

    function addPinsToMap(coordinates) {
        markers.forEach(marker => marker.remove());
        markers = [];

        coordinates.forEach((coordinate, index) => {
            const marker = new mapboxgl.Marker()
              .setLngLat(coordinate[0])
              .setPopup(new mapboxgl.Popup().setHTML(`<h3>Time: ${coordinate[1]}}<br>City: ${coordinate[2]}<br>Temperature: ${coordinate[3]}°F<br>Weather: ${coordinate[4]}</h3>`))
              .addTo(map);
            markers.push(marker);
        });
    }

    async function getTripReport(coordinates) {
        let now = new Date();

		const genAI = new GoogleGenerativeAI(api_key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });


		let prompt =  `Generate a trip report of what weather I should expect when driving from ${coordinates[0][2]} to ${coordinates[coordinates.length - 1][2]}? Give me a paragraph about what I should expect (for example: Expect moderate rainfall when passing Snoqualmie Pass). Do not say here's a trip report. Use this data: `;
        coordinates.forEach((coordinate, index) => {
            prompt += `${index+1}: ${coordinate[2]} - ${coordinate[1]} - ${coordinate[3]}°F - ${coordinate[4]}. `
        });
        try {
            const response = await model.generateContent(prompt);
            geminiTripReport = response.response.text();
        } catch (e) {
            console.error(e);
        }
    }
</script>

<div class="map" bind:this={mapContainer}></div>
<form class="sidebar" on:submit|preventDefault={() => getRoute(origin, destination)}>
    <div class="row">
        <div class="together" style="flex: 1;">
            <label for="origin">Origin:</label>
            <input type="text" id="origin" bind:value={origin} placeholder="Origin" required>
        </div>
        <div class="together" style="flex: 1;">
            <label for="destination">Destination:</label>
            <input type="text" id="destination" bind:value={destination} placeholder="Destination" required>
        </div>
    </div>
    <button type="button" style="margin-right: 1vh;" on:click|preventDefault={() => getMyLocation()}>Get My Position</button>
    <button type="button" style="margin-right: 1vh;" on:click|preventDefault={() => {origin = ''; destination = '';}}>Reset</button>
    <button type="submit" class="plot-route" style="float: right">Plot Route</button>
</form>
<div class="contents">
    <h2>Weather</h2>
    {#if coordinates}
        <h3>Weather in {coordinates[0][5].location.name}, {coordinates[0][5].location.region} ({coordinates[0][1]})</h3>
        <p>{#if coordinates[0][5].current.condition.text.includes('thunder')}
            <CloudLightning />
        {:else if coordinates[0][5].current.condition.text.includes('rain') || coordinates[0][5].current.condition.text.includes('drizzle') || coordinates[0][5].current.condition.text.includes('sleet') || coordinates[0][5].current.condition.text.includes('shower')}
            <CloudRain/>
        {:else if coordinates[0][5].current.condition.text.includes('snow') || coordinates[0][5].current.condition.text.includes('ice') || coordinates[0][5].current.condition.text.includes('bliz')}
            <CloudSnow />
        {:else if coordinates[0][5].current.condition.text.includes('fog') || coordinates[0][5].current.condition.text.includes('mist')}
            <CloudFog />
        {:else if coordinates[0][5].current.condition.text.includes('unny')}
            <Sun />
        {:else if coordinates[0][5].current.condition.text.includes('lear')}
            <Moon />
        {:else if coordinates[0][5].current.condition.text.includes('part') && coordinates[0][5].current.is_day == 1}
            <CloudSun />
        {:else if coordinates[0][5].current.condition.text.includes('part') && coordinates[0][5].current.is_day == 0}
            <CloudMoon />
        {:else}
            <Cloud />
        {/if}
        {coordinates[0][5].current.condition.text} | {coordinates[0][5].current.temp_f}°F/{coordinates[0][5].current.temp_c}°C | Feels like: {coordinates[0][5].current.feelslike_f}°F/{coordinates[0][5].current.feelslike_c}°C</p>

        <h3>Weather in {coordinates[coordinates.length - 1][5].location.name}, {coordinates[coordinates.length - 1][5].location.region} ({coordinates[coordinates.length - 1][1]})</h3>
        <p>{#if coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text.includes('thunder')}
            <CloudLightning />
        {:else if coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text.includes('rain') || coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text.includes('drizzle') || coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text.includes('sleet') || coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text.includes('shower')}
            <CloudRain/>
        {:else if coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text.includes('snow') || coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text.includes('ice') || coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text.includes('bliz')}
            <CloudSnow />
        {:else if coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text.includes('fog') || coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text.includes('mist')}
            <CloudFog />
        {:else if coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text.includes('unny')}
            <Sun />
        {:else if coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text.includes('lear')}
            <Moon />
        {:else if coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text.includes('part') && coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].is_day == 1}
            <CloudSun />
        {:else if coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text.includes('part') && coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].is_day == 0}
            <CloudMoon />
        {:else}
            <Cloud />
        {/if}
        {coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].condition.text} | {coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].temp_f}°F/{coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].temp_c}°C | Feels like: {coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].feelslike_f}°F/{coordinates[coordinates.length - 1][5].forecast.forecastday[0].hour[0].feelslike_c}°C</p>
    {/if}
    {#if geminiTripReport}
        <h2 style="margin-bottom:-2vh;">What to Expect?</h2>
        <p>Provided by Google Gemini</p>
        <p>{geminiTripReport}</p>
    {/if}
</div>

<style>
    .map {
        position: absolute;
        margin: 0 1vw;
        width: 60vw;
        height: 84vh;
        margin-left: 20vw;
        margin-right: 20vw;
        border-radius: 2vh;
    }

    .sidebar {
        background-color: rgb(35 55 75 / 90%);
        color: #fff;
        padding: 2vh 2vw 3vh 2vw;
        font-family: 'Urbanist', serif;
        z-index: 1;
        position: absolute;
        top: 0;
        left: 20vw;
        margin: 2vh 2vw;
        border-radius: 2vh;
        width: 20vw;
        box-sizing: border-box;
    }

    .contents {
        position: absolute;
        top: 18vh;
        left: 20vw;
        width: 20vw;
        height: 62vh;
        margin: 2vh 2vw;
        border-radius: 2vh;
        padding: 1vh 1vw;
        background-color: rgb(35 55 75 / 90%);
        color: white;
        z-index: 1;
        font-family: 'Urbanist', serif;
        overflow-y: scroll;
        box-sizing: border-box;
    }

    .row{
        width: 100%;
        gap: 2vw;
        display: flex;
        box-sizing: border-box;
    }

    .together {
        flex: 1;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }

    .together label {
        margin-bottom: 0.5vh;
    }

    .together input[type="text"] {
        width: 100%;
        box-sizing: border-box;
    }

    label{
        padding-bottom: 2vh;
    }
    input{
        margin-bottom: 2vh;
        font-family: 'Urbanist', serif;
        font-size: 1rem;
    }
    button{
        flex: 49%;
        font-family: 'Urbanist', serif;
        border: none;
        padding: .6vh .6vw;
        border-radius: 1vh;
        cursor: pointer;
        background-color: white;
        transition: .2s;
    }
    button:hover{
        background-color: rgb(199, 199, 199);
    }

    .mapboxgl-popup {
        width: 5vw;
    }

    .mapboxgl-popup-content {
        text-align: left;
        font-family: 'Urbanist', serif;
    }

    ::-webkit-scrollbar {
		width: .75vw;
	}
	::-webkit-scrollbar-track {
		background: rgb(0, 0, 0, 0);
	}
	::-webkit-scrollbar-thumb {
		background-color: rgb(255,255,255,.5);
		border-radius: 1vh;
		transition: 0.2s;
	}
	::-webkit-scrollbar-thumb:hover {
		background-color: rgb(255, 255, 255,.8);
	}
    
</style>