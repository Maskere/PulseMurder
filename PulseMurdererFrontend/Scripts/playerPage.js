let playerId = localStorage.getItem("playerId");
let thisPlayer = null;

// Initialize WebSocket connection in the browser
const ws = new WebSocket('ws://192.168.0.95:8080');

ws.onopen = function() {
    console.log('WebSocket connection established');
};

ws.onerror = function(error) {
    console.error('WebSocket error:', error);
};

ws.onclose = function(){
    console.log("Websocket closed")
}

ws.onmessage = function(event){
    if(event.data instanceof Blob){
        const reader = new FileReader()
        reader.onload = function(){
            if(reader.result === 'nextRound' || reader.result === 'start' || reader.result === 'time'){
                window.location.reload()
            }
        }
        reader.readAsText(event.data)
    }
    else{
        if(event.data === 'nextRound' || event.data === 'start' || event.data === 'time'){
            window.location.reload()
        }
    }
}

Vue.createApp({
    data() {
        return {
            Players: [
            ],
        }
    }
}).mount("#playerInfo");

window.onload = async function () {
    if (!playerId) {
        alert("Missing player ID");
        return;
    }

    await loadPlayer()
    await loadPlayers()

    document.getElementById("voteButton").onclick = vote;
    document.getElementById("killButton").onclick = kill;
}


// Try to get ID from URL if not in storage
if (!playerId) {
    let urlParams = new URLSearchParams(window.location.search);
    playerId = urlParams.get("id");

    if (playerId) {
        localStorage.setItem("playerId", playerId);
    }
}

if (!playerId) {
    document.body.innerHTML = "<h3>Error: No player ID provided. Please join using a valid player link.</h3>";
}
else {
    fetch(`https://pulsemurdererrest20250508143404-fgb6aucvcwhgbtb6.canadacentral-01.azurewebsites.net/api/players/${playerId}`)
        .then(res => {
            if (!res.ok) throw new Error("Player not found");
            return res.json();
        })
        .then(player => {
            document.getElementById("playerName").textContent = player.name;
            document.getElementById("playerId").textContent = player.id;
            document.getElementById("playerStatus").textContent = player.isAlive ? "Alive" : "Dead";
            document.getElementById("playerInfo").classList.remove("hidden");
        })
        .catch(err => {
            document.body.innerHTML = `<h3>Error: ${err.message}</h3>`;
        });
}

async function loadPlayer() {
    let res = await fetch(`https://pulsemurdererrest20250508143404-fgb6aucvcwhgbtb6.canadacentral-01.azurewebsites.net/api/players/${playerId}`);
    let player = await res.json();
    thisPlayer = player;

    let resPlayers = await fetch(`https://pulsemurdererrest20250508143404-fgb6aucvcwhgbtb6.canadacentral-01.azurewebsites.net/api/players/`);
    let players = await resPlayers.json();


    document.getElementById("playerName").innerText = player.name;
    document.getElementById("roleInfo").innerText = player.isMurderer ? "🔪 You are the Murderer" : "🧑 Civilian";
    document.getElementById("status").innerText = player.isAlive ? "Alive" : "Eliminated";

    if (!player.isAlive || player.hasVoted) {
        document.getElementById("voteSection").style.display = "none";
    }

    if (player.isMurderer && player.isAlive) {
        document.getElementById("killSection").style.display = "block";
    }
}

async function loadPlayers() {
    let res = await fetch(`https://pulsemurdererrest20250508143404-fgb6aucvcwhgbtb6.canadacentral-01.azurewebsites.net/api/players/`);
    let players = await res.json();
    this.Players = res;

    const voteSelect = document.getElementById("voteTarget");
    voteSelect.innerHTML = "";
    players
        .filter(p => p.id != playerId && p.isAlive)
        .forEach(p => {
            let opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.name;
            voteSelect.appendChild(opt);
        });

    loadKillTargets(players);
}

function loadKillTargets(players) {
    let killSelect = document.getElementById("killTarget");
    killSelect.innerHTML = "";

    players
        .filter(p => p.id != playerId && p.isAlive)
        .forEach(p => {
            let opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.name;
            killSelect.appendChild(opt);
        });
}

async function vote() {
    let target = document.getElementById("voteTarget").value;
    await fetch(`https://pulsemurdererrest20250508143404-fgb6aucvcwhgbtb6.canadacentral-01.azurewebsites.net/api/players/${playerId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: parseInt(target) })
    });
    alert("Vote submitted");
    document.getElementById("voteSection").style.display = "none";
}

async function kill() {
    let target = document.getElementById("killTarget").value;
    await fetch(`https://pulsemurdererrest20250508143404-fgb6aucvcwhgbtb6.canadacentral-01.azurewebsites.net/api/players/${playerId}/kill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: parseInt(target) })
    });
    alert("Player killed");
    document.getElementById("killSection").style.display = "none";
}
