const baseUrl = 'https://pulsemurdererrest20250508143404-fgb6aucvcwhgbtb6.canadacentral-01.azurewebsites.net/api/players'

function Sleep(ms){
    return new Promise(resolve => setTimeout(resolve,ms))
}

Vue.createApp({
    data(){
        return{
            newPlayer: {
                Id:0,
                Name: null,
                Avatar:"",
                IsMurderer:false,
                IsAlive:true
            },
            Players:[],
            newPlayerId:null
        }
    },
    async created(){
    },
    methods:{
        async getAllPlayers() {
            this.Players = await axios.get(baseUrl)
        },
        async addPlayer() {
            try {
                let response = await axios.post(baseUrl, this.newPlayer)
                this.newPlayerId = response.data.id
                this.message = response.status + '' + response.statusText
                this.Players = this.getAllPlayers()
            }
            catch {
                alert(error.message)
            }
        },
        async joinGame() {
            try {
                await this.addPlayer()

                Sleep(2000)
                window.location.href = `./playerPage.html?id=${this.newPlayerId}`
            }
            catch (error) {
                console.error('Error joining game:', error);
            }
        },
    }
}).mount("#app")

