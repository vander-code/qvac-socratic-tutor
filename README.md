# Socratic Tutor (QVAC)

A tiny web app where an AI tutor **never gives you the answer**. You enter a topic, and it asks
progressively deeper questions so you work it out yourself.

Example: *"Teach me photosynthesis."* → *"What do you think plants need in order to make food?"*

All AI runs **on your own computer** using [QVAC](https://github.com/tetherto/qvac), Tether's open-source
AI SDK. No API key, no cloud service, and your conversation never leaves your machine.

![screenshot](screenshot.png)

## SDK version

`@qvac/sdk` **0.19.0** (declared in `package.json`)

Functions used: `loadModel` and `completion`, with the `LLAMA_3_2_1B_INST_Q4_0` model.

## Install

You need [Node.js](https://nodejs.org) (current LTS) and about 1 GB of free disk space for the model.

```bash
git clone https://github.com/YOUR-USERNAME/qvac-socratic-tutor.git
cd qvac-socratic-tutor
npm install
```

## Run

```bash
npm start
```

Then open **http://localhost:3000** in your browser.

The first start downloads the model, which can take a few minutes. After that it loads from your disk.
Wait for the green "AI model ready" message, then type a topic and press **Start**.

## How it works

It will not give you the answer until you figure it out through its questions

- `server.js` loads the model with `loadModel`, then calls `completion` for each turn and streams the tokens to the browser.
- `public/index.html` is the whole interface (plain HTML, CSS and JavaScript, no build step).
- The tutor's behavior is a short `SYSTEM_PROMPT` in `server.js`. Edit the rules to change how it teaches.

## License

MIT
