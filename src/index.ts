import { env } from 'cloudflare:workers';
export default `

<!DOCTYPE html>
<head>
	<title>ChiefArug's WAIFU Helper</title>
	<meta name="twitter:title" content="ChiefArug's Minecraft Modding Crash Helper Bot">
	<meta name="twitter:description" content="A helper Discord bot for querying NeoForged's WAIFU database">
	<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect x='0' y='0' width='64' height='64' fill='rgb(216, 130, 49)'/%3E%3C/svg%3E%0A"/>
	<meta name="darkreader-lock">
</head>
<body style="background-color:rgb(34, 36, 39); text-align: center;color: rgb(231, 217, 211); font-family: 'Noto Sans', 'Open Sans', Helvetica, Arial, sans-serif; margin: 30px">
	<h1>ChiefArug's Minecraft Modding Crash Helper Bot</h1>
	<p style="margin: 40px">A helper bot for querying NeoForged's WAIFU database</p>
	<a href="https://discord.com/oauth2/authorize?client_id=${env.DISCORD_APPLICATION_ID}" target="_blank" rel="noopener noreferrer" style="padding: 10px 20px; margin: 8px 4px; background-color: rgb(216, 130, 49); border-radius: 4px; text-decoration: none; color: rgb(231, 217, 211); text-shadow: black 0 0 2px; font-size: 16px; font-weight: 700">Install</a>
</body>


`.trim();
