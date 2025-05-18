const baseUrl = 'https://pulsemurdererrest20250508143404-fgb6aucvcwhgbtb6.canadacentral-01.azurewebsites.net/api/players'

function Sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const ws = new WebSocket("ws://192.168.0.95:8080")

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
    data() {
        return {
            id: 0,
            name: "",
            isAlive: true,
            Muderer: true,
            Winner: false,
            player1Id: null,
            player2Id: null,
            // voteCount: 0,
            voterButtonClicked: false,
            newPlayer: {
                id: 0,
                name: "New Player",
                avatar: "",
                isMurderer: true,
                isAlive: false,
                //hasVoted: false
            },
            message: '',

            //VIGTIGT
            //en funktion til gamemaster 'end game' som sletter spillerne fra listen når spillet er slut
            player: null,
            Players: [],
            selectedPlayerId: null,
            result: '',
            roundCount: 1,
        };
    },

    created() {
        this.getAllPlayers()

        // Retrieve the result from localStorage
        this.result = localStorage.getItem('gameResult') || 'No result available';
        console.log('Game result:', this.result)

        const savedRoundCount = localStorage.getItem('roundCount')
        if(savedRoundCount){
            this.roundCount = parseInt(savedRoundCount, 10)
        }
    },

    mounted() {
        if (window.location.pathname.includes('sharedPage.html')) {
            this.startCountdown(); // Start the countdown if on the shared page
        }
    },

    methods: {
        async determineWinner() {
            this.result = null
            localStorage.setItem('gameResult', this.result)

            let playersAlive = this.Players.filter(player => player.isAlive);

            let murderer = null
            for(let i = 0;i < playersAlive.length; i++){
                murderer = playersAlive.filter(player => player.isMurderer)
            }

            if(murderer.length === 0){
                this.result = 'Civilians win!';
                localStorage.setItem('gameResult', this.result)
                //naviger til rasultat-side
                window.location.href = 'gameResult.html'
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
                window.location.href = 'gameResult.html'
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
                window.location.href = 'gameResult.html'
            }
        },
        async vote(id) {
            this.Players.forEach(player => {
                player.hasVoted = false
            })

            const player = this.Players.find(p => p.id === id)
            player.hasVoted = !player.hasVoted
        },

        //Axios methods:
        async getPlayers(url) {
            try {
                const response = await axios.get(url)
                this.Players = response.data
            }
            catch {
                alert(error.message)
            }
        },

        async getAllPlayers() {
            this.getPlayers(baseUrl)
        },
        async updatePlayerRole(player) {
            try {
                //Indsæt random 
                const response = await axios.put(`${baseUrl}/${player.id}`, player)
                this.message = response.status + '' + response.statusText
                //this.getAllPlayers()
            }
            catch (error) {
                alert(error.message)
            }
        },
        vote(playerId) {
            this.Players.forEach(player => {
                player.hasVoted = player.id === playerId;
            });
            this.selectedPlayerId = playerId;
        },
        async nextRound() {
            this.determineWinner()
            this.getAllPlayers()
            let alivePlayers = this.Players.filter(player => player.isAlive);

            
            let votedPlayers = this.Players.filter(player => player.hasVoted);

            if(alivePlayers.length === votedPlayers.length){
                this.roundCount++;
                localStorage.setItem('roundCount', this.roundCount)

                await Sleep(2000)
                broadcastData('nextRound')
                window.location.reload();
                this.startCountdown()
            }
        },
        async startGame() {
            if (this.Players.length === 5) {
                try {
                    await this.chooseMurderer();
                    broadcastData('start')
                    await Sleep(100)
                    window.location.href = 'sharedPage.html'
                }
                catch (error) {
                    alert(error.message)
                }
            }
        },
        async chooseMurderer() {
            try {
                const randomIndex = Math.floor(Math.random() * this.Players.length);
                const randomPlayer = this.Players[randomIndex];
                randomPlayer.isMurderer = true
                await this.updatePlayerRole(randomPlayer)
                if (randomPlayer.name !== "") {
                    //window.location.href = 'sharedPage.html'
                }
            }
            catch (error) {
                alert(error.message)
            }
        },
        async resetMurder() {
            for (let i = 0; i < this.Players.length; i++) {
                try {
                    const response = await axios.get(baseUrl)
                    const update = await axios.put(`${baseUrl}/${response.data[i].id}`, { "id": 0, "name": "aaaa", "avatar": "", "hasVoted": false, "votesRecieved": 0, "isAlive": true, "isMurderer": false })
                }
                catch (error) {
                    console.log(error.message)
                }
            }
            this.roundCount = 1
            localStorage.setItem('roundCount', this.roundCount)
            Sleep(1000)
            window.location.reload()
        },
        async startCountdown() {
            const countdownDuration = 5; // Countdown duration in seconds
            let remainingTime = countdownDuration;

            const countdownElement = document.getElementById('countdown');

            const timer = setInterval(() => {
                if (remainingTime <= 0) {
                    broadcastData('time')
                    clearInterval(timer);
                    countdownElement.textContent = "Time's up!";

                    this.nextRound();
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
    }
}).mount('#app');
