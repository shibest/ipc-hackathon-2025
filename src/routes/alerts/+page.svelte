<script>
    import {alertState} from '$lib/state.svelte'; 
    import {Warning, Info} from 'phosphor-svelte';
</script>

<div class="content">
    <div class="block">
        <h2 style="margin-bottom: -2vh">Current Alerts ({#if alertState.alerts}
                {alertState.alerts.alerts.alert.length}
            {/if})
        </h2>
        {#if alertState.alerts}
            <p>Alerts in the area of {alertState.alerts.location.name}, {alertState.alerts.location.region}, {alertState.alerts.location.country}.</p>
        {/if}
    </div>
    {#if alertState.alerts}
        {#each alertState.alerts.alerts.alert as _, i}
            <br>
            <div class="block">
                <h2 style="margin-bottom:-2vh;">
                    {#if alertState.alerts.alerts.alert[i].severity === 'Severe'}
                            <Warning />
                        {:else}
                            <Info />
                        {/if}
                        {alertState.alerts.alerts.alert[i].event}
                </h2>
                <p>{alertState.alerts.alerts.alert[i].headline}</p>
                <p class="taut">Areas: {alertState.alerts.alerts.alert[i].areas}</p>
                {#if alertState.alerts.alerts.alert[i].instruction != ""}
                    <p class="taut">Instructions: {alertState.alerts.alerts.alert[i].instruction}</p>
                {/if}
                {#if alertState.alerts.alerts.alert[i].note != ""}
                    <p class="taut">Note: {alertState.alerts.alerts.alert[i].note}</p>
                {/if}
                <p class="taut">Certainty: {alertState.alerts.alerts.alert[i].certainty}</p>
                <p class="taut">Severity: {alertState.alerts.alerts.alert[i].severity}</p>
                <p class="taut">Urgency: {alertState.alerts.alerts.alert[i].urgency}</p>
                <p class="taut">Effective: {alertState.alerts.alerts.alert[i].effective}</p>
                <p>Expires: {alertState.alerts.alerts.alert[i].expires}</p>
            </div>
        {/each}
    {/if}
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
    .taut {
        margin-bottom: -1vh;
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