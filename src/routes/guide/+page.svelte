<svelte:head>
    <title>Guide</title>
</svelte:head>

<script>
    import {weatherAdvisoryGeminiOutput, conversationGeminiOutput, weatherState} from '$lib/state.svelte';
    import {ArrowRight} from 'phosphor-svelte';

    import {PUBLIC_GEMINI_API_KEY} from '$env/static/public';
    import { GoogleGenerativeAI } from "@google/generative-ai";

    const api_key = PUBLIC_GEMINI_API_KEY;

    let question;

	async function callGeminiviaPrompt(ask) {
		let now = new Date();
        conversationGeminiOutput.prompts.push(ask);
		const genAI = new GoogleGenerativeAI(api_key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
		let prompt = "Respond to the following question/prompt: '" + ask + "' given the context that the date and time is " + now + ", the user's location is " + weatherState.weather.location.name + ', ' + weatherState.weather.location.region + ', ' + weatherState.weather.location.country + '. Give me a paragraph. Don\'t say here are some suggestions.';
        //console.log(prompt)
        question = "";
        try {
            const response = await model.generateContent(prompt);
            conversationGeminiOutput.responses.push(await response.response.text());
        } catch (e) {
            console.error(e);
        }
	}
</script>

<div class="content">
    <div class="block">
        <h2 style="margin-bottom:-2vh;">Guide and Resources</h2>
        <p>Provided by Google Gemini</p>
        {#if weatherAdvisoryGeminiOutput.result}
            <p>{weatherAdvisoryGeminiOutput.result}</p>
        {/if}
    </div>
    <br>
    {#each conversationGeminiOutput.prompts as _, i}
        {#if i > 0}
            <br>
        {/if}
        <div class="block">
            <p>Prompt: {conversationGeminiOutput.prompts[i]}</p>
            <p>Response: 
                {#if conversationGeminiOutput.responses[i]}
                    {conversationGeminiOutput.responses[i]}
                {:else}
                    ...
                {/if}
            </p>
        </div>
    {/each}
</div>
<div class="inquiry">
    <div class="inquire">
        <textarea placeholder="Ask for more info here and press the arrow..." bind:value={question}></textarea>
        <button title="Send prompt" on:click|preventDefault={() => callGeminiviaPrompt(question)}><ArrowRight /></button>
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
        padding: 2vh 2vw;
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
        border: none;
        outline: none;
        border-radius: 0 1vh 1vh 0;
        background-color: rgba(255,255,255,.6);
        transition: .2s;
        font-size: 2vh;
    }
    button:hover{
        background-color: rgba(255, 255, 255, 0.9);
        cursor:pointer;
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

    textarea::-webkit-scrollbar {
		width: .75vw;
	}
	textarea::-webkit-scrollbar-track {
		background: rgb(0, 0, 0, 0);
	}
	textarea::-webkit-scrollbar-thumb {
		background-color: rgb(255,255,255,.5);
		border-radius: 1vh;
		transition: 0.2s;
        cursor: default;
	}
	textarea::-webkit-scrollbar-thumb:hover {
		background-color: rgb(255, 255, 255,.8);
	}
</style>