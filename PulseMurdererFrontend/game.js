const player = JSON.parse(localStorage.getItem("player"));
if (!player) window.location.href = "login.html";

document.getElementById("welcome").innerText = Welcome, ${player.name};

function logout() {
localStorage.removeItem("player");
window.location.href = "login.html";
}

async function fetchPlayers() {
const res = await fetch("/api/players");
if (!res.ok) return alert("Failed to fetch players");
const players = await res.json();
renderPlayers(players);
}

function renderPlayers(players) {
const alive = players.filter(p => p.isAlive);
const others = alive.filter(p => p.id !== player.id);
const list = document.getElementById("playersList");
list.innerHTML = "<h3>Alive Players</h3>";

others.forEach(p => {
const div = document.createElement("div");
div.innerHTML = <span>${p.name}</span> ${!player.hasVoted ?<button onclick="vote(${p.id})">Vote</button>: ""} ${player.isMurderer ?<button onclick="kill(${p.id})">Kill</button>: ""} ;
list.appendChild(div);
});
}

async function vote(targetId) {
const res = await fetch(/api/players/${player.id}/vote, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ targetId })
});
if (!res.ok) return alert("Failed to vote");
alert("Vote submitted");
await fetchPlayers();
}

async function kill(targetId) {
const res = await fetch(/api/players/${player.id}/kill, { method: "POST" });
if (!res.ok) return alert("Kill failed");
alert("Player killed");
await fetchPlayers();
}

function handleWebSocket(data) {
try {
const updated = JSON.parse(data);
renderPlayers(updated);
} catch {}
}

const ws = new WebSocket("ws://localhost:13000");
ws.onmessage = (e) => handleWebSocket(e.data);

fetchPlayers();
