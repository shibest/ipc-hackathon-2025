<script>
	import { goto } from '$app/navigation';
    import {weatherState, iconState, alertState, astronomyState, thingsToDoGeminiOutput} from '$lib/state.svelte';
    import {Moon, CloudMoon, Sun, CloudSun, CloudRain, CloudSnow, CloudFog, CloudLightning, Cloud, ArrowClockwise, Warning, Info, ArrowSquareOut} from 'phosphor-svelte';

    let greeting = "morning";
    let now = new Date();
    if (now.getHours() < 3) {
        greeting = "night";
    } else if (now.getHours() < 12) {
        greeting = "morning";
    } else if (now.getHours() < 18) {
        greeting = "afternoon";
    } else if (now.getHours() < 22) {
        greeting = "evening";
    } else {
        greeting = "night";
    }

    function timeFormatted(time) {
        if (parseInt(time.slice(0,2),10) > 12) {
            return (parseInt(time.slice(0,2),10)-12)+time.slice(2)+" PM"
        } else if (parseInt(time.slice(0,2),10) == 0){
            return "12"+time.slice(2)+" AM"
        } else {
            return time+" AM"
        }
    }
    
</script>

<div class="content">
    <div class="block">
        <h2 style="margin-bottom:-2vh;">Good {greeting}.</h2>
        {#if weatherState.weather}
            <p>Weather in {weatherState.weather.location.name}, {weatherState.weather.location.region}, {weatherState.weather.location.country}.</p>
        {/if}
    </div>
    <br>
    <div class="block">
        <h2 style="margin-bottom:-2vh;">Current Weather</h2>
        {#if weatherState.weather}
            <p>Last refreshed: {timeFormatted(weatherState.weather.location.localtime.slice(11))}</p>
        {/if}
        <a href="/" class="refresh-button" title="Page Refresh" data-sveltekit-reload><ArrowClockwise /></a>
        <div class="row">
            <div class="weather-icon">
                {#if iconState.icon}
                    {#if iconState.icon === "Sun"}
                        <Sun />
                    {:else if iconState.icon === "Moon"}
                        <Moon />
                    {:else if iconState.icon === "SunCloud"}
                        <CloudSun />
                    {:else if iconState.icon === "MoonCloud"}
                        <CloudMoon />
                    {:else if iconState.icon === "Cloud"}
                        <Cloud />
                    {:else if iconState.icon === "Rain"}
                        <CloudRain />
                    {:else if iconState.icon === "Snow"}
                        <CloudSnow />
                    {:else if iconState.icon === "Fog"}
                        <CloudFog />
                    {:else if iconState.icon === "Thunder"}
                        <CloudLightning />
                    {/if}
                {/if}
            </div>
            <div class="title">
                {#if weatherState.weather}
                    <h1>{weatherState.weather.current.condition.text}</h1>
                {/if}
            </div>
            <div class="temps">
                {#if weatherState.weather}
                    <h1>{weatherState.weather.current.temp_f}°F/{weatherState.weather.current.temp_c}°C</h1>
                {/if}
            </div>
            <div class="text">
                {#if weatherState.weather}
                    <p>Feels like: {weatherState.weather.current.feelslike_f}°F/{weatherState.weather.current.feelslike_c}°C<br>
                        Humidity: {weatherState.weather.current.humidity}%</p>
                {/if}
            </div>
        </div>
    </div>
    <br>
    <div class="block-row">
        <div class="blocks">
            <h2>More Weather Info</h2>
            {#if weatherState.weather}
                <p class="taut">Cloud Coverage: {weatherState.weather.current.cloud}%</p>
                <p class="taut">AQI: {weatherState.weather.current.air_quality['pm2_5']}</p>
                <p class="taut">Visibility: {weatherState.weather.current.vis_miles} mi / {weatherState.weather.current.vis_km} km</p>
                <p class="taut">Wind Speed: {weatherState.weather.current.wind_mph} mph / {weatherState.weather.current.wind_kph} kph</p>
                <p>Wind Direction: {weatherState.weather.current.wind_dir} ({weatherState.weather.current.wind_degree}°)</p>
            {/if}
        </div>
        <div class="blocks">
            <h2>Advisories</h2>
            {#if alertState.alerts}
                {#each alertState.alerts.alerts.alert as _, i}
                    <p class="alert-link taut" title={alertState.alerts.alerts.alert[i].event} on:click={() => goto('/alerts')}>
                        {#if alertState.alerts.alerts.alert[i].severity === 'Severe'}
                            <Warning />
                        {:else}
                            <Info />
                        {/if}
                        {alertState.alerts.alerts.alert[i].event}
                        <ArrowSquareOut />
                    </p>
                {/each}
            {:else}
                <p>No advisories currently.</p>
            {/if}
        </div>
    </div>
    <br>
    <div class="block">
        <h2 style="margin-bottom:-2vh;">Things To Do</h2>
        <p>Provided by Gemini</p>
        {#if thingsToDoGeminiOutput.result}
            <p>{thingsToDoGeminiOutput.result}</p>
        {/if}
    </div>
</div>

<style>
    .content{
        position: absolute;
        width: 60vw;
        height: 84vh;
        margin-left: 20vw;
        margin-right: 20vw;
        overflow: auto;
    }
    .block{
        background-color: rgba(255,255,255,.6);
        backdrop-filter: blur(2vh);
        border-radius: 2vh;
        padding: 2vh 2vw;
    }
    .refresh-button {
        position: absolute;
        left: 92.5%;
        top: 15%;
        width: 6vh;
        height: 6vh;
        padding: 1.5vh;
        background-color: rgba(255,255,255,.4);
        border-radius: 6vh;
        font-size: 3vh;
        transition: .2s;
        color: black;
    }
    .refresh-button:hover{
        cursor: pointer;
        background-color: rgba(255,255,255,1);
    }
    .row {
        display: flex;
        gap: 2%;
        padding: 0 2vw;
    }
    .block-row{
        display: flex;
        gap: 2%;
    }
    .blocks{
        flex: 49%;
        background-color: rgba(255,255,255,.6);
        backdrop-filter: blur(2vh);
        border-radius: 2vh;
        padding: 2vh 2vw;
    }
    .title {
        flex: 30%;
    }
    .weather-icon {
        flex: 14%;
        font-size: 12vh;
    }
    .temps{
        flex: 25%;
    }
    .text { 
        flex: 25%;
    }
    .taut {
        margin-bottom: -1vh;
    }
    .alert-link{
        color: black;
        transition: .2s;
    }
    .alert-link:hover {
        cursor: pointer;
        color: rgb(157, 157, 157);
        text-decoration: underline;
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