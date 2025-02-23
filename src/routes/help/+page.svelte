<script>
    import {weatherAdvisoryGeminiOutput} from '$lib/state.svelte';

</script>

<div class="content">
    <div class="block">
        <h2 style="margin-bottom:-2vh;">Guide and Resources</h2>
        <p>For those facing adverse weather conditions - provided by Gemini</p>
        {#if weatherAdvisoryGeminiOutput.result}
            <p>{weatherAdvisoryGeminiOutput.result}</p>
        {/if}
    </div>
    <br>
    <div class="conversation">
        <div class="block">
            <p>Gemini generated response that goes over possible hazardous conditions that might happen in user's area, how to prepare for it, what to do when it happens, resources to contact</p>
        </div>
        <div class="block">
            <p>Gemini generated response that goes over possible hazardous conditions that might happen in user's area, how to prepare for it, what to do when it happens, resources to contact</p>
        </div>
        <div class="block">
            <p>Gemini generated response that goes over possible hazardous conditions that might happen in user's area, how to prepare for it, what to do when it happens, resources to contact</p>
        </div>
        <div class="block">
            <p>Gemini generated response that goes over possible hazardous conditions that might happen in user's area, how to prepare for it, what to do when it happens, resources to contact</p>
        </div>
    </div>
</div>
<div class="inquiry">
    <div class="inquire">
        <textarea />
        <button>-></button>
        <!--<p>Prompt: (turn this into textbox which on enter sends prompt to gemini for extra questions user may have)</p>-->
    </div>
</div>

<style>
    .content{
        position: absolute;
        width: 60vw;
        height: 70vh;
        margin-left: 20vw;
        margin-right: 20vw;
        overflow: auto;
    }
    .inquiry{
        position: absolute;
        width: 60vw;
        height: 12vh;
        max-height: 12vh;
        margin-left: 20vw;
        margin-right: 20vw;
        overflow: auto;
        top: auto;
        bottom: -2vh;
    }
    .inquire{
        /*background-color: rgba(255,255,255,.6);*/
        backdrop-filter: blur(2vh);
        border-radius: 2vh;
        height: 100%;
    }
    .block{
        background-color: rgba(255,255,255,.6);
        backdrop-filter: blur(2vh);
        border-radius: 2vh;
        padding: 2vh 2vw;
    }
    textarea {
        width: 96%;
        height: 95%;
        resize: none;
        border: none;
        outline: none;
        background-color: rgba(255,255,255,.6);
        border-radius: 1vh 0 0 1vh;
        padding: 1.5vh 1vw;
        font-family: 'Urbanist', serif;
        font-size: 2vh;
    }
    textarea:focus {
        outline: none;
    }
    button {
        position:absolute;
        width: 4%;
        height: 95%;
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