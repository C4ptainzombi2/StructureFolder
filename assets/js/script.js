async function initStrategicMap(structures) {
  console.log("🗺️ Initialisation de la carte stratégique…");

  const mapContainer = document.getElementById("strategicMap");
  const timersList = document.getElementById("mapTimersList");
  const regionTitle = document.getElementById("mapRegionTitle");
  const backButton = document.getElementById("mapBackButton");
  if (!mapContainer) return;

  // === Empêche les clics Dotlan de rediriger ===
  function sanitizeSVG(svg) {
    if (!svg) return;
    svg.querySelectorAll("a").forEach(a => {
      a.removeAttribute("href");
      a.removeAttribute("xlink:href");
      a.addEventListener("click", e => e.preventDefault());
    });
  }

  // === Nettoie & ajoute la légende personnalisée ===
  function addCustomLegend(svg) {
    if (!svg) return;

    // 1️⃣ Supprimer les textes de souveraineté : "S.R (3)", "M.O (5)", etc.
    const sovereigntyPattern = /^[A-Z]{1,3}\.[A-Z]{1,3}\s*\(\d+\)$/i;
    svg.querySelectorAll("text").forEach(t => {
      if (sovereigntyPattern.test(t.textContent.trim())) t.remove();
    });

    // 2️⃣ Supprimer les anciennes légendes Dotlan
    svg.querySelectorAll("g").forEach(g => {
      const texts = Array.from(g.querySelectorAll("text")).map(t => t.textContent.toLowerCase());
      const unwanted = ["refinery", "factory", "research", "outpost", "system", "wollari", "contested"];
      if (texts.some(t => unwanted.some(u => t.includes(u)))) g.remove();
    });

    // 3️⃣ Calcul position sans écraser la carte
    let viewBox = svg.viewBox?.baseVal;
    if (!viewBox || viewBox.width === 0) {
      try {
        const bbox = svg.getBBox();
        viewBox = { width: bbox.width || 1000, height: bbox.height || 800 };
      } catch {
        viewBox = { width: 1000, height: 800 };
      }
    }

    // 4️⃣ Création de la légende custom
    const legendX = viewBox.width - 240;
    const legendY = viewBox.height - 60;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", "custom-legend");

    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", legendX);
    bg.setAttribute("y", legendY);
    bg.setAttribute("width", "220");
    bg.setAttribute("height", "40");
    bg.setAttribute("fill", "#111");
    bg.setAttribute("stroke", "#333");
    bg.setAttribute("rx", "6");
    bg.setAttribute("ry", "6");
    bg.setAttribute("opacity", "0.9");
    g.appendChild(bg);

    const txt1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt1.setAttribute("x", legendX + 12);
    txt1.setAttribute("y", legendY + 16);
    txt1.setAttribute("fill", "#ccc");
    txt1.setAttribute("font-size", "11");
    txt1.textContent = "⚙️ Gris = structures présentes";
    g.appendChild(txt1);

    const txt2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt2.setAttribute("x", legendX + 12);
    txt2.setAttribute("y", legendY + 32);
    txt2.setAttribute("fill", "#ff5555");
    txt2.setAttribute("font-size", "11");
    txt2.textContent = "🔥 Rouge = structures renforcées";
    g.appendChild(txt2);

    svg.appendChild(g);
  }

  // === Chargement d’un SVG avec proxy ===
  async function loadSVG(svgPath) {
    try {
      if (svgPath.startsWith("https://evemaps.dotlan.net/")) {
        svgPath = `/api/proxy_svg.php?url=${encodeURIComponent(svgPath)}`;
      }
      const res = await fetch(svgPath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const svgText = await res.text();

      // On remplace uniquement le contenu du conteneur
      mapContainer.innerHTML = svgText;
      const svg = mapContainer.querySelector("svg");
      if (!svg) throw new Error("Le SVG est vide ou invalide");

      sanitizeSVG(svg);
      // on attend un tick pour que le rendu soit prêt avant modif
      requestAnimationFrame(() => addCustomLegend(svg));

      return svg;
    } catch (err) {
      console.error("Erreur SVG :", err);
      mapContainer.innerHTML = `<div style="color:red;padding:10px;">Erreur lors du chargement du SVG : ${svgPath}<br>${err.message}</div>`;
      return null;
    }
  }

  // === Chargement de la carte univers ===
  let svgDoc = await loadSVG("/data/maps/New_Eden.svg");
  if (!svgDoc) return;

  // === Clic sur région ===
  function attachUniverseHandlers() {
    svgDoc.querySelectorAll("text").forEach(text => {
      const name = text.textContent.trim();
      if (!name) return;
      text.style.cursor = "pointer";
      text.addEventListener("click", async e => {
        e.preventDefault();
        e.stopPropagation();

        const regionName = name.replace(/ /g, "_");
        regionTitle.textContent = `🪐 ${name}`;
        backButton.style.display = "block";

        const dotlanURL = `https://evemaps.dotlan.net/svg/${regionName}.svg`;
        svgDoc = await loadSVG(dotlanURL);
        if (svgDoc) attachRegionHandlers(name);
      });
    });
  }

  // === Clic sur système ===
  function attachRegionHandlers(regionName) {
    const links = svgDoc.querySelectorAll("a");
    timersList.innerHTML = "";

    links.forEach(link => {
      link.removeAttribute("href");
      link.removeAttribute("xlink:href");

      link.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();

        const sysText = link.querySelector("text");
        const sysName = sysText ? sysText.textContent.trim() : "";
        if (!sysName) return;

        timersList.innerHTML = "";
        const timers = structures.filter(
          s => s["Nom du système"]?.toUpperCase() === sysName.toUpperCase()
        );

        if (!timers.length) {
          timersList.innerHTML = `<li>Aucune structure dans ${sysName}</li>`;
          return;
        }

        timers.forEach(s => {
          const date = new Date(s["Date"]);
          const expired = date < new Date();
          const li = document.createElement("li");
          li.style.borderLeft = `4px solid ${expired ? "#ff4444" : "#ffaa00"}`;
          li.textContent = `${sysName} — ${s["Nom de la structure"]}`;
          timersList.appendChild(li);
        });
      });
    });
  }

  // === Retour à la carte univers ===
  backButton.addEventListener("click", async () => {
    regionTitle.textContent = "🪐 New Eden";
    backButton.style.display = "none";
    timersList.innerHTML = "";
    svgDoc = await loadSVG("/data/maps/New_Eden.svg");
    if (svgDoc) attachUniverseHandlers();
  });

  attachUniverseHandlers();
}
