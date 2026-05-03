import { env } from 'cloudflare:workers';
import { COMMANDS } from './commands.ts';
export default `

<!DOCTYPE html>
<head>
	<title>ChiefArug's WAIFU Helper</title>
	<meta name="twitter:title" content="ChiefArug's Minecraft Modding Crash Helper Bot">
	<meta name="twitter:description" content="A helper Discord bot for querying NeoForged's WAIFU database">
	<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect x='0' y='0' width='64' height='64' fill='rgb(216, 130, 49)'/%3E%3C/svg%3E%0A"/>
	<meta name="darkreader-lock">
</head>
<body>
	<h1>ChiefArug's Minecraft Modding Crash Helper Bot</h1>
	<p style="margin: 40px">A helper bot for querying NeoForged's WAIFU database</p>
	<a href="https://discord.com/oauth2/authorize?client_id=${env.DISCORD_APPLICATION_ID}" target="_blank" rel="noopener noreferrer" style="padding: 10px 20px; margin: 8px 4px; background-color: #d88231; border-radius: 1rem; text-decoration: none; color: #e7d9d3; text-shadow: black 0 0 2px; font-weight: 700; box-shadow: 5px 5px 10px #261709">Install</a>
	<br/><br style="line-height: 5rem" />
	<h2>Commands</h2>
	<div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: safe center">
		${Object.values(COMMANDS).map((command) => `
			<div class="card">
				<h4>/${command.name} ${command.options.map((o) => (o.required ? `&lt;${o.name}&gt;` : `[${o.name}]`)).join(', ')}</h4>
				<hr>
				<p>${command.description.replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>
			</div>
		`.trim()).join('')}
	</div>
</body>
<style>
body {background-color: #222427; text-align: center; color: #e7d9d3; font-family: 'Noto Sans', 'Open Sans', Helvetica, Arial, sans-serif; margin: 30px;}
.card {width: 400px; border-radius: 10px; background: #16161a; padding: 10px; margin: 10px; box-shadow: 5px 5px 10px black; > * {margin: 10px}}
h4 { font-family: monospace, monospace }
@media screen and (width <= 70rem) { * { font-size: 20pt; } a { font-size: 32pt; } h1 { font-size: 42pt; } h2 { font-size: 36pt; }}
</style>

`.trim();
