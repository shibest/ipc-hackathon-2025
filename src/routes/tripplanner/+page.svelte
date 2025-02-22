<svelte:head>
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css' rel='stylesheet' />
</svelte:head>

<script>
    import { onMount } from 'svelte';
    import mapboxgl from 'mapbox-gl';

    import {weatherState} from '$lib/state.svelte';

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

    let map;
    let mapContainer;
    let origin = '';
    let destination = '';
    let markers = [];

    onMount(() => {
        map = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-122.308954, 47.608027],
            zoom: 12
        });
    });

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

        console.log(await originCoords + ', ' + await destinationCoords);
        //console.log(`https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.join(',')};${destinationCoords.join(',')}?access_token=${mapboxgl.accessToken}`);
        const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${await originCoords.join(',')};${destinationCoords.join(',')}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();

        if (data.code === 'Ok' && data.routes.length > 0) {
            const route = data.routes[0].geometry.coordinates;
            const coordinates = extractCoordinatesAtInterval(data.routes[0], 1200);
            addPinsToMap(coordinates);
            console.log("Coordinates at 20-minute intervals:", coordinates);
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

    function extractCoordinatesAtInterval(route, intervalSeconds) {
        const coordinates = [];
        let accumulatedDuration = 0;
        let currentStepIndex = 0;
        let nextInterval = intervalSeconds;

        while (currentStepIndex < route.legs[0].steps.length) {
            const step = route.legs[0].steps[currentStepIndex];
            const stepDuration = step.duration;
            const stepGeometry = step.geometry.coordinates;

            while (accumulatedDuration + stepDuration >= nextInterval) {
                const timeDifference = nextInterval - accumulatedDuration;
                const percentage = timeDifference / stepDuration;

                const interpolatedCoordinates = interpolateCoordinates(stepGeometry, percentage);
                coordinates.push(interpolatedCoordinates);

                nextInterval += intervalSeconds;
            }

            accumulatedDuration += stepDuration;
            currentStepIndex++;
        }
        return coordinates;
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

        coordinates.forEach((coord, index) => {
            const marker = new mapboxgl.Marker()
              .setLngLat(coord)
              .setPopup(new mapboxgl.Popup().setHTML(`<h3>Waypoint ${index + 1}</h3>`))
              .addTo(map);
            markers.push(marker);
        });
    }
</script>

<div class="map" bind:this={mapContainer}></div>
<form class="sidebar" on:submit|preventDefault={() => getRoute(origin, destination)}>
    <label for="origin">Origin:</label>
    <input type="text" id="origin" bind:value={origin} placeholder="Origin" required>

    <label for="destination">Destination:</label>
    <input type="text" id="destination" bind:value={destination} placeholder="Destination" required>

    <button style="margin-right: 1vh;" on:click={getMyLocation}>Get My Position</button>
    <button type="submit" class="plot-route">Plot Route</button>
</form>

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
        padding: 2vh 2vw;
        font-family: 'Urbanist', serif;
        z-index: 1;
        position: absolute;
        top: 0;
        left: 0;
        margin: 0 1vw;
        border-radius: 2vh;
    }

    .row{
        width: 100%;
        gap: 2%;
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
</style>