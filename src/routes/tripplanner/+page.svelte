<svelte:head>
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css' rel='stylesheet' />
</svelte:head>

<script>
    import { onMount } from 'svelte';
    import mapboxgl from 'mapbox-gl';

    import { PUBLIC_API_KEY, PUBLIC_URL } from '$env/static/public';

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
            const coordinates = await extractCoordinatesAtInterval(data.routes[0], 3600);
            addPinsToMap(coordinates);
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
        
        coordinates.push([originCoordinates, now, originCity, originWeather.current.temp_f]);
        
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

                coordinates.push([interpolatedCoordinates, intervalDatetime, city, weather.forecast.forecastday[0].hour[0].temp_f])

                nextInterval += 3600; 
            }

            accumulatedDuration += stepDuration;
            currentStepIndex++;
        }

        const destinationCoordinates = route.geometry.coordinates.slice(-1)[0];
        const destinationCity = await getCityName(destinationCoordinates);
        const destinationDatetime = new Date(now.getTime() + accumulatedDuration * 1000);
        const destinationWeather = await getWeatherAtTime(destinationCoordinates, destinationDatetime);
        coordinates.push([destinationCoordinates, destinationDatetime, destinationCity, destinationWeather.forecast.forecastday[0].hour[0].temp_f]);

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

    function addPinsToMap(coordinates) { // testing function
        markers.forEach(marker => marker.remove());
        markers = [];

        coordinates.forEach((coordinate, index) => {
            const marker = new mapboxgl.Marker()
              .setLngLat(coordinate[0])
              .setPopup(new mapboxgl.Popup().setHTML(`<h3>Time: ${coordinate[1]}}. City: ${coordinate[2]}. Weather: ${coordinate[3]}</h3>`))
              .addTo(map);
            markers.push(marker);
        });
    }
</script>

<div class="map" bind:this={mapContainer}></div>
<form class="sidebar" on:submit|preventDefault={() => getRoute(origin, destination)}>
    <div class="row">
        <div class="together">
            <label for="origin">Origin:</label>
            <input type="text" id="origin" bind:value={origin} placeholder="Origin" required>
        </div>
        <div class="together">
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
    {#if origin_weather}
        <h3>Weather in {origin_weather.location.name}, {origin_weather.location.region}</h3>
        <p>{#if origin_weather.current.condition.text.includes('thunder')}
            <CloudLightning />
        {:else if origin_weather.current.condition.text.includes('rain') || origin_weather.current.condition.text.includes('drizzle') || origin_weather.current.condition.text.includes('sleet') || origin_weather.current.condition.text.includes('shower')}
            <CloudRain/>
        {:else if origin_weather.current.condition.text.includes('snow') || origin_weather.current.condition.text.includes('ice') || origin_weather.current.condition.text.includes('bliz')}
            <CloudSnow />
        {:else if origin_weather.current.condition.text.includes('fog') || origin_weather.current.condition.text.includes('mist')}
            <CloudFog />
        {:else if origin_weather.current.condition.text.includes('unny')}
            <Sun />
        {:else if origin_weather.current.condition.text.includes('lear')}
            <Moon />
        {:else if origin_weather.current.condition.text.includes('part') && origin_weather.current.is_day == 1}
            <CloudSun />
        {:else if origin_weather.current.condition.text.includes('part') && origin_weather.current.is_day == 0}
            <CloudMoon />
        {:else}
            <Cloud />
        {/if}
        {origin_weather.current.condition.text} | {origin_weather.current.temp_f}°F/{origin_weather.current.temp_c}°C | Feels like: {origin_weather.current.feelslike_f}°F/{origin_weather.current.feelslike_c}°C</p>
    {/if}
    {#if destination_weather}
        <h3>Weather in {destination_weather.location.name}, {destination_weather.location.region}</h3>
        <p>{#if origin_weather.current.condition.text.includes('thunder')}
            <CloudLightning />
        {:else if origin_weather.current.condition.text.includes('rain') || origin_weather.current.condition.text.includes('drizzle') || origin_weather.current.condition.text.includes('sleet') || origin_weather.current.condition.text.includes('shower')}
            <CloudRain/>
        {:else if origin_weather.current.condition.text.includes('snow') || origin_weather.current.condition.text.includes('ice') || origin_weather.current.condition.text.includes('bliz')}
            <CloudSnow />
        {:else if origin_weather.current.condition.text.includes('fog') || origin_weather.current.condition.text.includes('mist')}
            <CloudFog />
        {:else if origin_weather.current.condition.text.includes('unny')}
            <Sun />
        {:else if origin_weather.current.condition.text.includes('lear')}
            <Moon />
        {:else if origin_weather.current.condition.text.includes('part') && origin_weather.current.is_day == 1}
            <CloudSun />
        {:else if origin_weather.current.condition.text.includes('part') && origin_weather.current.is_day == 0}
            <CloudMoon />
        {:else}
            <Cloud />
        {/if}
        {destination_weather.current.condition.text} | {destination_weather.current.temp_f}°F/{destination_weather.current.temp_c}°C | Feels like: {destination_weather.current.feelslike_f}°F/{destination_weather.current.feelslike_c}°C</p>
    {/if}
</div>

<style>
    .map {
        position: absolute;
        margin: 0 1vw;
        width: 98vw;
        height: 84vh;
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
        left: 0;
        margin: 2vh 2vw;
        border-radius: 2vh;
        width: 32vw;
    }

    .contents {
        position: absolute;
        top: 18vh;
        left: 0;
        width: 32vw;
        margin: 2vh 2vw;
        border-radius: 2vh;
        padding: 1vh 2vw;
        background-color: rgb(35 55 75 / 90%);
        color: white;
        z-index: 1;
        font-family: 'Urbanist', serif;
    }

    .row{
        width: 100%;
        gap: 2vw;
        display: flex;
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
    
</style>