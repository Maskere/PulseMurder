namespace PulseMurdererV3 {
    public class Player {
        private int id;
        private string? name;
        private string? avatar;
        private bool isMurderer;
        private bool hasVoted;
        private bool isAlive;
        private int votesRecieved;


        public Player(int id, string? name, string? avatar, bool isMurderer, int votesRecieved) 
        {
            Id = id;
            Name = name;
            Avatar = avatar;
            IsMurderer = isMurderer;
            HasVoted = hasVoted;
            IsAlive = isAlive;
            VotesRecieved = votesRecieved;
        }

        public Player() {
        }

        public int Id {
            get => id;
            set{
                id = value;
            }
        }

        public string? Name {
            get => name;
            set
            {
                if (value == null)
                    throw new ArgumentNullException("Name is null");
                if (value.Length < 2)
                    throw new ArgumentException("Name must be at least 4 characters long");
                name = value;
            }
        }

        public string? Avatar { 
            get => avatar;
            set{
                avatar = value;
            }
        }

        public bool IsMurderer { 
            get => isMurderer;
            set{
                isMurderer = value;
            }
        }

        public bool HasVoted{
            get => hasVoted;
            set{
                hasVoted = value;
            }
        }

        public bool IsAlive
        {
            get => isAlive;
            set
            {
                isAlive = value;
            }
        }

        public int VotesRecieved{
            get => votesRecieved;
            set{
                votesRecieved = value;
            }
        }


        public override string? ToString() {
            return $"Id: {Id}, Name: {Name}, Avatar: {Avatar}, IsMurderer: {IsMurderer}";
        }
    }
}
