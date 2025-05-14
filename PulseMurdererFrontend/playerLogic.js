const urlParams = new URLSearchParams(window.location.search);
const playerId = urlParams.get("id");
const ws = new WebSocket("ws://localhost:13000");
let currentPlayer = null;

ws.onmessage = (event) => {
    const players = JSON.parse(event.data);
    const me = players.find(p => p.id == playerId);
    currentPlayer = me;

    document.getElementById("playerName").innerText = me.name;
    document.getElementById("role").innerText = me.isMurderer ? "🔪 Murderer" : "🧑 Civilian";
    document.getElementById("status").innerText = me.isAlive ? "Alive" : "Dead";

    if (!me.isAlive || me.hasVoted) {
        document.getElementById("voteSection").style.display = "none";
    } else {
        populateSelect("voteTarget", players.filter(p => p.id != me.id && p.isAlive));
    }

    if (me.isMurderer && me.isAlive) {
        document.getElementById("killSection").style.display = "block";
        populateSelect("killTarget", players.filter(p => p.id != me.id && p.isAlive));
    }
};

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    select.innerHTML = "";
    options.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.text = p.name;
        select.appendChild(opt);
    });
}

async function submitVote() {
    const targetId = document.getElementById("voteTarget").value;
    await fetch(`/api/players/${playerId}/vote`, {
        method: "POST",
        body: JSON.stringify({ targetId }),
        headers: { "Content-Type": "application/json" }
    });
    alert("Vote submitted.");
}

async function submitKill() {
    const targetId = document.getElementById("killTarget").value;
    await fetch(`/api/players/${playerId}/kill`, {
        method: "POST",
        body: JSON.stringify({ targetId }),
        headers: { "Content-Type": "application/json" }
    });
    alert("Player eliminated.");
}

