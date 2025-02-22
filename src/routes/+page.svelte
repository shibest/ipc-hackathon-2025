<script>
    import {weatherState, iconState, astronomyState} from '$lib/state.svelte';

    import {Moon, CloudMoon, Sun, CloudSun, CloudRain, CloudSnow, CloudFog, CloudLightning, Cloud, ArrowClockwise} from 'phosphor-svelte';

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
        <a href="/" class="refresh-button" data-sveltekit-reload><ArrowClockwise /></a>
        <div class="row">
            <div class="title">
                {#if weatherState.weather}
                    <h1>{weatherState.weather.current.condition.text}</h1>
                {/if}
            </div>
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
            <div class="text">
                {#if weatherState.weather}
                    <p>Temperature: {weatherState.weather.current.temp_f}°F/{weatherState.weather.current.temp_c}°C<br>
                        Feels like: {weatherState.weather.current.feelslike_f}°F/{weatherState.weather.current.feelslike_c}°C<br>
                        Humidity: {weatherState.weather.current.humidity}%</p>
                {/if}
            </div>
        </div>
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
        left: 90%;
        top: 17.5%;
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
        padding: 0 4vw;
    }
    .title {
        flex: 32%;
    }
    .weather-icon {
        flex: 24%;
        font-size: 12vh;
    }
    .text { 
        flex: 40%;
    }
</style>