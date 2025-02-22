<svelte:head>
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css' rel='stylesheet' />
</svelte:head>

<script>
    import { onMount } from 'svelte';
    import mapboxgl from 'mapbox-gl';

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

    let map;
    let mapContainer;
    let origin = '';
    let destination = '';
    let route = null;

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

        const originCoords = await geocode(originPlace);
        const destinationCoords = await geocode(destinationPlace);
        //console.log(`https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.join(',')};${destinationCoords.join(',')}?access_token=${mapboxgl.accessToken}`);
        const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.join(',')};${destinationCoords.join(',')}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();

        if (data.code === 'Ok' && data.routes.length > 0) {
            route = data.routes[0].geometry.coordinates;
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
</script>

<div class="map" bind:this={mapContainer}></div>
<form class="sidebar" on:submit|preventDefault={() => getRoute(origin, destination)}>
    <label for="origin">Origin:</label>
    <input type="text" id="origin" bind:value={origin} placeholder="Origin" required>

    <label for="destination">Destination:</label>
    <input type="text" id="destination" bind:value={destination} placeholder="Destination" required>

    <button type="submit" class="plot-route">Plot Route</button>
</form>

<style>
    .map {
        position: absolute;
        width: 100vw;
        height: 100vh;
    }

    .sidebar {
        background-color: rgb(35 55 75 / 90%);
        color: #fff;
        padding: 6px 12px;
        font-family: monospace;
        z-index: 1;
        position: absolute;
        top: 0;
        left: 0;
        margin: 12px;
        border-radius: 4px;
    }

    .plot-route {
        top: 50px;
        z-index: 1;
        left: 12px;
        padding: 4px 10px;
        border-radius: 10px;
        cursor: pointer;
    }
</style>