document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("playerName").value.trim();
    if (!name) return alert("Please enter your name");

    try {
        const response = await fetch("http://localhost:5235/api/Players/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                avatar: null,
                isMurderer: false
            })
        });
        if (!response.ok) throw new Error("Login failed");

        const player = await response.json();
        localStorage.setItem("player", JSON.stringify(player));
        window.location.href = "player.html";
    }
    catch (err) {
        alert("Error: " + err.message);
    }
});
