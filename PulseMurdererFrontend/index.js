const baseUrl = 'https://pulsemurdererrest20250508143404-fgb6aucvcwhgbtb6.canadacentral-01.azurewebsites.net/api/players'

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
            voteCount: 0,
            voterButtonClicked: false,
            newPlayer: {
                id: 0,
                name: "New Player",
                avatar: "",
                isMurderer: true,
                isAlive: false,
                //clicked: false
            },
            message: '',

            //VIGTIGT
            //Vi skal bruge en metode til at slette spillere, så listen i backend ikke bliver for lang!
            //Fx beforeunload event, som sletter spilleren fra listen når de lukker siden
            //eller en knap til gamemaster 'end game' som sletter spillerne fra listen
            player: null,
            Players: [
                /* { id: 1, name: "Peter", role: 'Murderer',clicked: false },
                 { id: 2, name: "John", role: 'name',clicked:false },
                 { id: 3, name: "Mary", role: 'name',clicked:false },
                 { id: 4, name: "Sophie", role: 'name',clicked:false },
                 { id: 5, name: "Tom", role: 'name',clicked:false }, */
            ],
            selectedPlayerId: null,
            result: ''
        };
    },

    created() {
        this.getAllPlayers()
    },

    methods: {
        determineWinner() {
            const player1 = this.Players.find(player => player.id === Number(this.player1Id));
            const player2 = this.Players.find(player => player.id === Number(this.player2Id));

            if (!player1 || !player2) {
                this.result = 'Invalid player IDs. Please try again.';
                return;
            }

            if (player1.role === 'Murderer' || player2.role === 'Murderer') {
                this.result = 'The Murderer wins!';
            } else {
                this.result = 'The two players win!';
            }
        },
        async vote(id) {
            this.Players.forEach(player => {
                player.clicked = false
            })

            const player = this.Players.find(p => p.id === id)
            player.clicked = !player.clicked
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

        async addPlayer() {
            try {
                response = await axios.post(baseUrl, this.newPlayer)
                this.message = response.status + '' + response.statusText
                this.getAllPlayers()
            }
            catch {
                alert(error.message)
            }
        },
        async joinGame() {
            try {
                await this.addPlayer()
                if (this.newPlayer.name !== "") {
                    window.location.href = 'lobby.html'
                }
            }
            catch (error) {
                console.error('Error joining game:', error);
            }
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
                player.clicked = player.id === playerId;
            });
            this.selectedPlayerId = playerId;
        },
        async nextRound() {
            if (!this.selectedPlayerId) {
                alert("Please select a player before proceeding to the next round.");
                return;
            }

            try {
                const response = await axios.put(
                    `${baseUrl}/${this.selectedPlayerId}`,
                    { "id": 0, "name": "aaaa", "avatar": null, "isAlive": false, "isMurdere": false }
                );

                const player = this.Players.find(p => p.id === this.selectedPlayerId);
                if (player) {
                    player.isAlive = false;
                }

                alert("Player has been marked as dead. Proceeding to the next round.");
            } catch (error) {
                console.error("Error updating player:", error);
                alert("Failed to update the player. Please try again.");
            }
        },
        async chooseMurderer() {
            try {
                const randomIndex = Math.floor(Math.random() * this.Players.length);
                const randomPlayer = this.Players[randomIndex];
                console.log(randomPlayer)
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
                this.Players[i].isMurderer = false
            }
        },
    }
}).mount('#app');