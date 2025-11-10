// === 🗺️ Carte stratégique ===
async function initStrategicMap(structures) {
  console.log("🗺️ Initialisation de la carte stratégique (version avec légende personnalisée)...");

  const mapContainer = document.getElementById("strategicMap");
  const timersList = document.getElementById("mapTimersList");
  const regionTitle = document.getElementById("mapRegionTitle");
  const backButton = document.getElementById("mapBackButton");

  if (!mapContainer) return;

  // 🔧 Supprime les liens Dotlan
  function sanitizeSVG(svg) {
    svg.querySelectorAll("a").forEach(a => {
      a.removeAttribute("href");
      a.removeAttribute("xlink:href");
      a.addEventListener("click", e => e.preventDefault());
    });
  }

  // 🔧 Charge un SVG depuis un fichier ou Dotlan (via proxy)
  async function loadSVG(svgPath) {
    try {
      if (svgPath.startsWith("https://evemaps.dotlan.net/")) {
        svgPath = `/api/proxy_svg.php?url=${encodeURIComponent(svgPath)}`;
      }
      const res = await fetch(svgPath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const svgText = await res.text();
      mapContainer.innerHTML = svgText;

      const svg = mapContainer.querySelector("svg");
      sanitizeSVG(svg);
      return svg;
    } catch (err) {
      mapContainer.innerHTML = `<div style="color:red;padding:10px;">Erreur lors du chargement du SVG : ${svgPath}<br>${err.message}</div>`;
      console.error("Erreur SVG :", err);
      return null;
    }
  }

  // === Fonction pour ajouter la légende personnalisée ===
  function addCustomLegend(svg) {
    // Supprime l’ancienne légende Dotlan
    svg.querySelectorAll("text, rect, g").forEach(el => {
      if (el.textContent?.includes("Outer Passage") || el.textContent?.includes("by Wollari")) {
        el.remove();
      }
    });

    // Crée un groupe pour ta légende
    const legendGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", "20");
    bg.setAttribute("y", "620");
    bg.setAttribute("width", "250");
    bg.setAttribute("height", "45");
    bg.setAttribute("fill", "#1a1a1a");
    bg.setAttribute("stroke", "#444");
    bg.setAttribute("rx", "6");
    legendGroup.appendChild(bg);

    const txt1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt1.setAttribute("x", "35");
    txt1.setAttribute("y", "638");
    txt1.setAttribute("fill", "#cccccc");
    txt1.setAttribute("font-size", "11");
    txt1.textContent = "⚙️ Gris = structures présentes";
    legendGroup.appendChild(txt1);

    const txt2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt2.setAttribute("x", "35");
    txt2.setAttribute("y", "655");
    txt2.setAttribute("fill", "#ff4444");
    txt2.setAttribute("font-size", "11");
    txt2.textContent = "🔥 Rouge = structures renforcées";
    legendGroup.appendChild(txt2);

    svg.appendChild(legendGroup);
  }

  // === Met à jour les systèmes avec les compteurs ===
  function updateSystemIndicators(svg) {
    const texts = svg.querySelectorAll("a text, text");

    texts.forEach(text => {
      const systemName = text.textContent.trim();
      if (!systemName) return;

      // Trouve les structures associées à ce système
      const systemStructures = structures.filter(s =>
        s["Nom du système"]?.toUpperCase() === systemName.toUpperCase()
      );

      if (systemStructures.length > 0) {
        const reinforcedCount = systemStructures.filter(s => s["Renforcé"]?.toLowerCase() === "oui").length;

        // Ajout du compteur sous le nom
        const countText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        countText.setAttribute("x", text.getAttribute("x"));
        countText.setAttribute("y", parseFloat(text.getAttribute("y")) + 10);
        countText.setAttribute("font-size", "8");
        countText.setAttribute("text-anchor", "middle");
        countText.setAttribute("fill", "#aaa");
        countText.textContent = `(${systemStructures.length}/${reinforcedCount})`;
        text.parentNode.appendChild(countText);

        // Coloration du fond du système
        const shape = text.closest("a")?.querySelector("ellipse, rect, polygon") || text.closest("ellipse, rect, polygon");
        if (shape) {
          if (reinforcedCount > 0) {
            shape.setAttribute("fill", "#ffb3b3"); // rouge clair
          } else {
            shape.setAttribute("fill", "#d9d9d9"); // gris clair
          }
        }
      }
    });
  }

  // === Carte principale ===
  let svgDoc = await loadSVG("/data/maps/New_Eden.svg");
  if (!svgDoc) return;

  function attachUniverseHandlers() {
    const regions = svgDoc.querySelectorAll("text");
    regions.forEach(text => {
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
        if (svgDoc) {
          updateSystemIndicators(svgDoc);
          addCustomLegend(svgDoc);
        }
      });
    });
  }

  backButton.addEventListener("click", async () => {
    regionTitle.textContent = "🪐 New Eden";
    backButton.style.display = "none";
    timersList.innerHTML = "";
    svgDoc = await loadSVG("/data/maps/New_Eden.svg");
    if (svgDoc) attachUniverseHandlers();
  });

  attachUniverseHandlers();
}
