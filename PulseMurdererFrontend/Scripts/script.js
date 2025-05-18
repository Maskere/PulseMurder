const playerId = new URLSearchParams(window.location.search).get("id");
const ws = new WebSocket("ws://localhost:13000");

let thisPlayer = null;

window.onload = async function () {
    if (!playerId) {
        alert("Missing player ID");
        return;
    }

    await loadPlayer();
    await loadPlayers();

    document.getElementById("voteButton").onclick = vote;
    document.getElementById("killButton").onclick = kill;
};

ws.onmessage = function (event) {
    const updatedPlayers = JSON.parse(event.data);
    thisPlayer = updatedPlayers.find(p => p.id == playerId);

    document.getElementById("status").innerText = thisPlayer?.isAlive ? "Alive" : "Eliminated";

    if (!thisPlayer?.isAlive || thisPlayer.hasVoted) {
        document.getElementById("voteSection").style.display = "none";
    }

    if (thisPlayer?.isMurderer && thisPlayer?.isAlive) {
        document.getElementById("killSection").style.display = "block";
        loadKillTargets(updatedPlayers);
    }
};

async function loadPlayer() {
    const res = await fetch(`/api/players/${playerId}`);
    const player = await res.json();
    thisPlayer = player;

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
    const res = await fetch(`/api/players`);
    const players = await res.json();

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
    const killSelect = document.getElementById("killTarget");
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
    const target = document.getElementById("voteTarget").value;
    await fetch(`/api/players/${playerId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: parseInt(target) })
    });
    alert("Vote submitted");
    document.getElementById("voteSection").style.display = "none";
}

async function kill() {
    const target = document.getElementById("killTarget").value;
    await fetch(`/api/players/${playerId}/kill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: parseInt(target) })
    });
    alert("Player killed");
    document.getElementById("killSection").style.display = "none";
}

