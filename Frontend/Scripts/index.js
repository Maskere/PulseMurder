const qrUrlApi = 'https://image-charts.com/chart?cht=qr&chs=200x200&chl='
const gameStateUrl = "https://gamerest-gdenbrcxfxggb4ar.northeurope-01.azurewebsites.net/api/GameState"
const baseUrl = "https://pulsemurdererrest-f4fxeyhwbzexezb5.northeurope-01.azurewebsites.net/api/players"


// Create an audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Load an audio file
// const audioElement = new Audio('path/to/your/audio/file.mp3');
const audioElement = new Audio("../Assets/mixkit-church-bell-calling-603.wav")
const heartBeat = new Audio("../Assets/mixkit-heartbeat-medium-speed-495.wav")
const cock = new Audio("../Assets/mixkit-cock-calling-1759.wav")

// Create a media element source
const source = audioContext.createMediaElementSource(audioElement);

// Create a gain node
const gainNode = audioContext.createGain();

// Connect the source to the gain node and the gain node to the destination
source.connect(gainNode);
gainNode.connect(audioContext.destination);

// Set initial volume
gainNode.gain.value = 1.0; // Full volume

// Function to fade out the volume
function fadeOutAudio(duration) {
    const currentTime = audioContext.currentTime;
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, currentTime + duration);
}

function Sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const ws = new WebSocket("ws://192.168.14.248:8082")
// const ws = new WebSocket("ws://192.168.0.220:8082")

function broadcastData(data){
    console.log(data)
    if(ws.readyState === WebSocket.OPEN){
        ws.send(data)
    }
    else{
        console.error("Websocket error!",ws.readyState)
    }
}

Vue.createApp({
    data(){
        return{
            Players:[],
            qrCodeUrl:null,
            roundCount:0,
            result: null,
            resolving:false,
            killer:null
        }
    },
    async created(){
        await this.GetAllPlayers()
        const setRound = await axios.put(gameStateUrl+"/1",{"Round":1})
        const response = await axios.get(gameStateUrl)
        this.roundCount = response.data

        this.result = localStorage.getItem('gameResult') || 'No result available';
        console.log('Game result:', this.result)
    },
    mounted() {
        if (window.location.pathname.includes('sharedPage.html')) {
            this.startCountdown(); // Start the countdown if on the shared page
        }
    },
    methods:{
        async GetAllPlayers(){
            const response = await axios.get(baseUrl)
            this.Players = response.data
        },
        async GetGameState(){
            const response = await axios.get(gameStateUrl)
            this.roundCount = response.data
        },
        async getQR() {
            try {
                const redirectURL = 'http://192.168.14.248:8080/join.html'
                this.qrCodeUrl = qrUrlApi + encodeURIComponent(redirectURL) + '&chf=bg,s,00000000&icqrf=880000&icqrb=dfdcdb';

                const qrCodeImage = document.getElementById('qrCodeImage');
                qrCodeImage.src = this.qrCodeUrl;
            }
            catch (error) {
                console.error('Error fetching QR code:', error);
            }
        }, 
        async updatePlayerRole(player) {
            try {
                //Indsæt random 
                const response = await axios.put(`${baseUrl}/${player.id}`, player)
                this.message = response.status + '' + response.statusText
            }
            catch (error) {
                alert(error.message)
            }
        },
        async chooseMurderer() {
            try {
                const randomIndex = Math.floor(Math.random() * this.Players.length);
                const randomPlayer = this.Players[randomIndex];
                randomPlayer.isMurderer = true
                await this.updatePlayerRole(randomPlayer)
            }
            catch (error) {
                alert(error.message)
            }
        },
        async startGame(){
            await this.resetMurder()
            await Sleep(3000)

            await this.chooseMurderer();

            broadcastData('start')
            await Sleep(100)
            window.location.href = 'sharedPage.html'
        },
        async resetMurder(){
            const response = await axios.get(baseUrl)
            for (let i = 0; i < this.Players.length; i++) {
                try {
                    const update = await axios.put(`${baseUrl}/${response.data[i].id}`, { "id": 0, "name": "aaaa", "avatar": "", "hasVoted": false, "votesRecieved": 0, "isAlive": true, "isMurderer": false })
                }
                catch (error) {
                    console.log(error.message)
                }
            }
            const resetGameResponse = await axios.put(gameStateUrl+"/1",{"Round":0})
            this.roundCount = resetGameResponse.data
            // localStorage.setItem('roundCount', this.roundCount)
            Sleep(1000)
            // window.location.reload()
        },
        async nextRound() {
            await this.GetAllPlayers()
            let alivePlayers = []
            let deadPlayers = []
            let votedPlayers = []

            for(let i = 0; i < this.Players.length; i++){
                if(this.Players[i].isAlive === true){
                    alivePlayers.push(this.Players[i])
                }
                else{
                    deadPlayers.push(this.Players[i])
                }
            }

            for(let i = 0; i < alivePlayers.length; i++){
                if(alivePlayers[i].hasVoted){
                    votedPlayers.push(this.Players[i])
                }
                if(alivePlayers[i].isMurderer === true){
                    this.killer = alivePlayers[i]
                }
            }

            console.log(alivePlayers.length,votedPlayers.length)

            if(alivePlayers.length <= votedPlayers.length || this.killer.hasKilled){
                await axios.put(`${baseUrl}/${this.killer.id}`,{ "id": 0, "name": "aaaa", "avatar": "", "hasVoted": this.killer.hasVoted,"hasKilled":false, "votesRecieved": this.killer.votesRecieved, "isAlive": this.killer.isAlive, "isMurderer": this.killer.isMurderer })
                await this.resolve()
                const updateResponse = await axios.put(gameStateUrl+"/1",{"Round":this.roundCount+1})
                const getGameState = await axios.get(gameStateUrl)
                this.roundCount = getGameState.data
                this.startCountdown()
                broadcastData('nextRound')
            }
            await this.determineWinner()
        },
        async resolve() {
            if(this.resolving || this.roundCount === 2 || this.roundCount === 4 || this.killer.hasKilled) return;
            this.resolving = true
            // Filter alive players
            await this.GetAllPlayers()
            let alivePlayers = this.Players.filter(player => player.isAlive);
            let sorted = alivePlayers.sort((a,b) => Number(b.votesRecieved) - Number(a.votesRecieved))

            // Get the player with the highest votes
            await axios.put(
                `${baseUrl}/${sorted[0].id}`,
                {
                    id: 0,
                    name: "aaaa",
                    avatar: "",
                    hasVoted: sorted[0].hasVoted,
                    votesRecieved: sorted[0].votesRecieved,
                    isAlive: false,
                    isMurderer: sorted[0].isMurderer,
                    hasKilled: sorted[0].hasKilled
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            // Reset votes for all players
            const { data: players } = await axios.get(baseUrl);

            await Promise.all(players
                .filter(player => player.isAlive)
                .map(player =>
                    axios.put(`${baseUrl}/${player.id}`, {
                        id: 0,
                        name: "aaaa",
                        avatar: "",
                        hasVoted: false,
                        votesRecieved: 0,
                        isAlive: player.isAlive,
                        isMurderer: player.isMurderer,
                        hasKilled: player.hasKilled
                    }, {
                            headers: { "Content-Type": "application/json" }
                        })
                )
            );
        },
        async startCountdown() {
            const countdownDuration = 60; // Countdown duration in seconds
            let remainingTime = countdownDuration;

            const countdownElement = document.getElementById('countdown');

            const timer = setInterval(() => {
                for(let i = 0; i < this.Players.length; i++){
                    if(this.Players[i].isMurderer){
                        this.killer = this.Players[i]
                    }
                }
                if(remainingTime > 57){
                    audioElement.play()
                }
                if(remainingTime < 56){
                    fadeOutAudio(5)
                }
                if(this.roundCount === 2){
                    heartBeat.play()
                    if(this.killer.hasKilled){
                        cock.play()
                    }
                }
                else{
                    heartBeat.pause()
                }


                if (remainingTime <= 0) {
                    // broadcastData('time')
                    clearInterval(timer);
                    countdownElement.textContent = "Time's up!";

                    this.nextRound()
                    const checkInterval = setInterval(() => {
                        this.nextRound();
                    }, 2000);
                    return;
                }

                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;

                countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                remainingTime--;
            }, 1000);
        },
        async determineWinner() {
            this.result = null
            localStorage.setItem('gameResult', this.result)

            await this.GetAllPlayers()
            let playersAlive = this.Players.filter(player => player.isAlive);

            let murderer = null
            for(let i = 0;i < playersAlive.length; i++){
                murderer = playersAlive.filter(player => player.isMurderer)
            }

            if(murderer.length === 0){
                this.result = 'Civilians win!';
                localStorage.setItem('gameResult', this.result)
                //naviger til rasultat-side
                window.location.href = '../gameResult.html'
            }

            if (playersAlive.length === 2) {
                if (playersAlive[0].isMurderer || playersAlive[1].isMurderer) {
                    this.result = 'The Murderer wins!';
                } 
                else {
                    this.result = 'Civilians win!';
                }
                //resultat gemmes lokalt - skal nok laves om ift sessions?
                localStorage.setItem('gameResult', this.result)
                //naviger til rasultat-side
                window.location.href = '../gameResult.html'
            }
            else if (playersAlive.length === 1) {
                let player1 = playersAlive.find(player => player.id === Number(this.player1Id));
                if (player1.isMurderer) {
                    this.result = 'The Murderer wins!';
                }
                else {
                    this.result = 'Civilians win!';
                }
                localStorage.setItem('gameResult', this.result)
                window.location.href = '../gameResult.html'
            }
            this.resolving = false
        },
    }
}).mount("#app")
