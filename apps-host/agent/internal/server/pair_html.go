package server

// approvalHTML is rendered for the GET /pair endpoint. The {{Origin}}
// placeholder is substituted with the requesting origin.
const approvalHTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Beak agent — pair</title>
<style>
	:root { color-scheme: light dark; font-family: -apple-system, system-ui, sans-serif; }
	body { display: grid; place-items: center; min-height: 100vh; margin: 0; background: #fafafa; }
	@media (prefers-color-scheme: dark) { body { background: #161616; color: #f0f0f0; } }
	.card { max-width: 420px; padding: 32px 28px; border-radius: 12px; background: #fff;
	        box-shadow: 0 12px 36px rgba(0,0,0,0.08); text-align: center; }
	@media (prefers-color-scheme: dark) { .card { background: #1f1f1f; box-shadow: 0 12px 36px rgba(0,0,0,0.4); } }
	h1 { margin: 0 0 4px; font-size: 18px; }
	p { margin: 6px 0 0; line-height: 1.4; font-size: 14px; color: #555; }
	@media (prefers-color-scheme: dark) { p { color: #aaa; } }
	.origin { display: inline-block; margin-top: 10px; padding: 4px 10px; border-radius: 6px;
	          background: #f0f0f0; color: #222; font-family: ui-monospace, monospace; font-size: 13px; }
	@media (prefers-color-scheme: dark) { .origin { background: #2a2a2a; color: #eee; } }
	.actions { margin-top: 20px; display: flex; gap: 10px; justify-content: center; }
	button { font: inherit; padding: 8px 20px; border-radius: 6px; cursor: pointer; border: none;
	         font-weight: 600; }
	.allow { background: #d63a82; color: #fff; }
	.allow:hover { filter: brightness(1.1); }
	.deny { background: transparent; color: #555; border: 1px solid #ccc; }
	.deny:hover { background: #eee; }
	@media (prefers-color-scheme: dark) {
		.deny { color: #aaa; border-color: #444; }
		.deny:hover { background: #2a2a2a; }
	}
</style>
</head>
<body>
	<div class="card">
		<h1>Beak agent</h1>
		<p>The following origin is asking to pair with this agent.</p>
		<p class="origin">{{Origin}}</p>
		<p>If you started this from Beak, click <strong>Allow</strong>.</p>
		<form class="actions" method="POST" action="{{ActionPath}}?state={{State}}">
			<button type="submit" name="decision" value="deny" class="deny" autofocus>Deny</button>
			<button type="submit" name="decision" value="allow" class="allow">Allow</button>
		</form>
	</div>
</body>
</html>`
