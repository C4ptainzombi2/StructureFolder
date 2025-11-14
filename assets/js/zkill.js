function isk(n) {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + "T ISK";
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B ISK";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M ISK";
    return Math.floor(n).toLocaleString() + " ISK";
}

function loadPage(p = 1) {
    fetch(`api/zkill_fetch.php?page=${p}`)
    .then(r => r.json())
    .then(data => displayKills(data));
}

function displayKills(data) {
    document.getElementById("totalIsk").textContent = isk(data.total_isk);
    document.getElementById("pageIsk").textContent = isk(data.page_isk);

    const box = document.getElementById("killList");
    box.innerHTML = "";

    data.kills.forEach(k => {
        box.innerHTML += `
        <div class="kill">
            <img src="https://images.evetech.net/types/${k.victim.ship_type_id}/icon?size=64">
            <div>
                <strong>${k.victim.ship_type_id}</strong><br>
                ${k.killmail_time}<br>
                Valeur : ${isk(k.zkb.totalValue)}
            </div>
        </div>`;
    });

    document.getElementById("pagination").innerHTML = `
        <button onclick="loadPage(${data.page - 1})" ${data.page === 1 ? "disabled" : ""}>⬅️</button>
        Page ${data.page} / ${data.total_pages}
        <button onclick="loadPage(${data.page + 1})" ${data.page === data.total_pages ? "disabled" : ""}>➡️</button>
    `;
}

// AUTO REFRESH
setInterval(() => loadPage(window.currentPage || 1), 60000);

loadPage(1);
