<script>
    import {forecastState} from '$lib/state.svelte'; 
    import {Moon, CloudMoon, Sun, CloudSun, CloudRain, CloudSnow, CloudFog, CloudLightning, Cloud} from 'phosphor-svelte';
</script>

<div class="content">
    <div class="block">
        <h2 style="margin-bottom: -2vh">Hourly Forecast</h2>
        {#if forecastState.forecast}
            <p>Weather in {forecastState.forecast.location.name}, {forecastState.forecast.location.region}, {forecastState.forecast.location.country}.</p>
        {/if}
    </div>
    <br>
    <div class="block">
        <table style="width: 100%;">
            {#if forecastState.forecast && forecastState.hour_icons}
                <tbody>
                    {#each Array(24) as _, i}
                        <tr>
                            <td>{forecastState.forecast.forecast.forecastday[0].hour[i].time}</td>
                            <td>
                                {#if forecastState.hour_icons[i] === 'sun'}
                                    <div class="icon"><Sun/></div>
                                {:else if forecastState.hour_icons[i] === 'cloudsun'}
                                    <div class="icon"><CloudSun /></div>
                                {:else if forecastState.hour_icons[i] === 'cloud'}
                                    <div class="icon"><Cloud /></div>
                                {:else if forecastState.hour_icons[i] === 'cloudrain'}
                                    <div class="icon"><CloudRain /></div>
                                {:else if forecastState.hour_icons[i] === 'cloudsnow'}
                                    <div class="icon"><CloudSnow /></div>
                                {:else if forecastState.hour_icons[i] === 'cloudfog'}
                                    <div class="icon"><CloudFog /></div>
                                {:else if forecastState.hour_icons[i] === 'cloudslightning'}
                                    <div class="icon"><CloudLightning /></div>
                                {:else}
                                {/if}
                            </td>
                            <td>{forecastState.forecast.forecast.forecastday[0].hour[i].condition.text}</td>
                            <td>{forecastState.forecast.forecast.forecastday[0].hour[i].temp_f}°F/{forecastState.forecast.forecast.forecastday[0].hour[i].temp_c}°C</td>
                            <td>Feels like:<br>
                                {forecastState.forecast.forecast.forecastday[0].hour[i].feelslike_f}°F/{forecastState.forecast.forecast.forecastday[0].hour[i].feelslike_c}°C</td>
                            <td>Rain: {forecastState.forecast.forecast.forecastday[0].hour[i].chance_of_rain}%</td>
                            <td>Snow: {forecastState.forecast.forecast.forecastday[0].hour[i].chance_of_snow}%</td>
                        </tr>
                    {/each}
                </tbody>
            {/if}
        </table>
    </div>
    <br>
    <div class="block">
        <h2 style="margin-bottom: -2vh">7-Day Forecast</h2>
        {#if forecastState.forecast}
            <p>Weather in {forecastState.forecast.location.name}, {forecastState.forecast.location.region}, {forecastState.forecast.location.country}.</p>
        {/if}
    </div>
    <br>
    <div class="block">
        <table style="width: 100%;">
            {#if forecastState.forecast && forecastState.icons}
                <tbody>
                    {#each Array(7) as _, i}
                        <tr>
                            <td>{forecastState.forecast.forecast.forecastday[i].date}</td>
                            <td>
                                {#if forecastState.icons[i] === 'sun'}
                                    <div class="icon"><Sun/></div>
                                {:else if forecastState.icons[i] === 'cloudsun'}
                                    <div class="icon"><CloudSun /></div>
                                {:else if forecastState.icons[i] === 'cloud'}
                                    <div class="icon"><Cloud /></div>
                                {:else if forecastState.icons[i] === 'cloudrain'}
                                    <div class="icon"><CloudRain /></div>
                                {:else if forecastState.icons[i] === 'cloudsnow'}
                                    <div class="icon"><CloudSnow /></div>
                                {:else if forecastState.icons[i] === 'cloudfog'}
                                    <div class="icon"><CloudFog /></div>
                                {:else if forecastState.icons[i] === 'cloudslightning'}
                                    <div class="icon"><CloudLightning /></div>
                                {:else}
                                {/if}
                            </td>
                            <td>{forecastState.forecast.forecast.forecastday[i].day.condition.text}</td>
                            <td>{forecastState.forecast.forecast.forecastday[i].day.maxtemp_f}°F/{forecastState.forecast.forecast.forecastday[i].day.mintemp_f}°F</td>
                            <td>{forecastState.forecast.forecast.forecastday[i].day.maxtemp_c}°C/{forecastState.forecast.forecast.forecastday[i].day.mintemp_c}°C</td>
                            <td>Rain: {forecastState.forecast.forecast.forecastday[i].day.daily_chance_of_rain}%</td>
                            <td>Snow: {forecastState.forecast.forecast.forecastday[i].day.daily_chance_of_snow}%</td>
                        </tr>
                    {/each}
                </tbody>
            {/if}
        </table>
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
    td{
        padding: 1vh 0;
    }
    .icon {
        font-size: 4vh;
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