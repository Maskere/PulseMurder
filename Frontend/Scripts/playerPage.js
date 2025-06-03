// const baseUrl = 'http://192.168.14.248:5174/api/players'
const baseUrl = "https://pulsemurdererrest-f4fxeyhwbzexezb5.northeurope-01.azurewebsites.net/api/players"
const gameStateUrl = "https://gamerest-gdenbrcxfxggb4ar.northeurope-01.azurewebsites.net/api/GameState"

function Sleep(ms){
    return new Promise(resolve => setTimeout(resolve,ms))
}

async function GetGameRound(){
    const getGameRound = await axios.get(gameStateUrl)
    return getGameRound
}

let playerId = localStorage.getItem("playerId");
let thisPlayer = null;
let alivePlayersLength = 0
let round = null
let canVote = false

// const ws = new WebSocket(`ws://192.168.14.248:8082`);
const ws = new WebSocket(`ws://192.168.14.248:8082`);

function broadcastData(data){
    console.log(data)
    if(ws.readyState === WebSocket.OPEN){
        ws.send(data)
    }
    else{
        console.error("Websocket error!",ws.readyState)
    }
}
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
            alivePlayersLength = reader.result
            if(reader.result === 'killed' || reader.result === 'nextRound' || reader.result === 'start'){
                window.location.reload()
                canVote = true
            }
        }
        reader.readAsText(event.data)
    }
    else{
        if(event.data === 'killed' || event.data === 'nextRound' || event.data === 'start'){
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
    const response = await axios.get(gameStateUrl)
    round = response.data
    canVote = false

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
    // fetch(`https://pulsemurdererrest20250508143404-fgb6aucvcwhgbtb6.canadacentral-01.azurewebsites.net/api/players/${playerId}`)
    fetch(`${baseUrl+"/"+playerId}`)
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
    const getGameRound = await axios.get(gameStateUrl)
    let round = getGameRound.data
    const response = await fetch(`${baseUrl}/${playerId}`);
    let player = await response.json();
    thisPlayer = player;

    document.getElementById("playerName").innerText = player.name;
    document.getElementById("roleInfo").innerText = player.isMurderer ? "🔪 You are the Murderer" : "🧑 Civilian";
    document.getElementById("status").innerText = player.isAlive ? "Alive" : "Eliminated";

    if(round === 2 || round === 4){
        const shouldShowKillSection = player.isMurderer && !player.hasKilled;
        document.getElementById("killSection").style.display = shouldShowKillSection ? "block" : "none";
        document.getElementById("voteSection").style.display = "none"
    }
    else{
        document.getElementById("voteSection").style.display = (player.hasVoted || !player.isAlive) ? "none" : "block";
        document.getElementById("killSection").style.display = "none";
    }
}

async function loadPlayers() {
    let res = await fetch(`${baseUrl}`);
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
    let killSelect = document.getElementById("killTarget"); killSelect.innerHTML = "";

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
    const contextPlayer = await axios.get(baseUrl+`/${playerId}`)
    const contextPlayerUpdate = await axios.put(
        `${baseUrl}/${playerId}`,
        JSON.stringify({
            id: 0,
            name: "aaaa",
            avatar: "",
            hasVoted: true,
            votesRecieved: contextPlayer.data.votesRecieved,
            isAlive: contextPlayer.data.isAlive,
            isMurderer: contextPlayer.data.isMurderer,
            hasKilled: contextPlayer.data.hasKilled
        }), {
            headers: {
                "Content-Type": "application/json"
            }
        }
    )

    const target = await axios.get(baseUrl+`/${document.getElementById("voteTarget").value}`)
    const targetUpdate = await axios.put(
        `${baseUrl}/${target.data.id}`, JSON.stringify({
            id: 0,
            name: "aaaa",
            avatar: "",
            hasVoted: target.data.hasVoted,
            votesRecieved: target.data.votesRecieved + 1,
            isAlive: target.data.isAlive,
            isMurderer: target.data.isMurderer,
            hasKilled: target.data.hasKilled
        }), {
            headers: {
                "Content-Type": "application/json"
            }
        }
    )
    window.location.reload()
    this.canVote = false
    alert("Vote submitted");
}

async function kill() {
    const target = await axios.get(baseUrl+`/${document.getElementById("killTarget").value}`)
    const contextPlayer = await axios.get(baseUrl+`/${playerId}`)
    if(window.confirm(`Kill ${target.data.name}?`)){
        txt = `You killed ${target.data.name}`

        await axios.put(`${baseUrl}/${target.data.id}`,{ "id": 0, "name": "aaaa", "avatar": "", "hasVoted": false, "votesRecieved": 0, "isAlive": false, "isMurderer": false })
        await axios.put(`${baseUrl}/${contextPlayer.data.id}`,{ "id": 0, "name": "aaaa", "avatar": "", "hasVoted": false,"hasKilled":true, "votesRecieved": 0, "isAlive": true, "isMurderer": true })
        window.location.reload()
    }
    else{
        txt = "No one is killed"
    }
    // await fetch(`${baseUrl}/${playerId}/kill`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ targetId: parseInt(target) })
    // });
}

