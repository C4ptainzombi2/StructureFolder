// === script.js ===

// === Sélecteurs de base ===
const mapContainer = document.getElementById("strategicMapContainer");
const returnButton = document.getElementById("returnButton");
const regionTitle = document.getElementById("regionTitle");

// === Variables globales ===
let currentRegion = null;
let structuresData = [];

// === Chargement des données JSON des structures ===
async function loadStructures() {
  try {
    const res = await fetch("/data/structures.json");
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
    structuresData = await res.json();
    console.log(`✅ ${structuresData.length} structures chargées.`);
  } catch (err) {
    console.error("❌ Erreur de chargement des structures :", err);
  }
}

// === Chargement de la carte principale Dotlan (New Eden) ===
async function loadMainMap() {
  currentRegion = null;
  regionTitle.textContent = "🗺️ Carte stratégique";
  returnButton.style.display = "none";
  mapContainer.innerHTML = "";

  const mainMapURL = "https://evemaps.dotlan.net/svg/New_Eden.svg";
  const svg = await loadSVG(mainMapURL);

  if (svg) {
    // Rendre chaque région cliquable
    svg.querySelectorAll("a, g").forEach(el => {
      const label = el.textContent?.trim();
      if (label && /^[A-Za-z ]+$/.test(label)) {
        el.style.cursor = "pointer";
        el.addEventListener("click", () => loadRegionMap(label));
      }
    });
  }

  console.log("✅ Carte principale initialisée");
}

// === Chargement d'une région spécifique ===
async function loadRegionMap(regionName) {
  try {
    currentRegion = regionName;
    regionTitle.textContent = regionName;
    returnButton.style.display = "inline-block";
    mapContainer.innerHTML = "";

    const regionUrl = `https://evemaps.dotlan.net/svg/${regionName.replace(/\s+/g, "_")}.svg`;
    const svg = await loadSVG(regionUrl);

    if (svg) {
      applyStructureData(svg, regionName);
    }

  } catch (err) {
    console.error(`❌ Erreur lors du chargement de la région ${regionName}:`, err);
  }
}

// === Application des données JSON sur la carte ===
function applyStructureData(svg, regionName) {
  const regionStructures = structuresData.filter(s => s["Région"] === regionName);

  regionStructures.forEach(struct => {
    const systemName = struct["Nom du système"];
    const isReinforced = struct["Renforcé"] === "oui";

    const sys = [...svg.querySelectorAll("text")]
      .find(t => t.textContent.trim() === systemName);

    if (sys) {
      // Récupération du conteneur parent (le cercle du système)
      const parent = sys.parentNode;
      const ellipse = parent.querySelector("ellipse, rect");
      if (ellipse) {
        ellipse.setAttribute("stroke", isReinforced ? "#ff5555" : "#888");
        ellipse.setAttribute("stroke-width", "2");
      }
    }
  });

  console.log(`✅ Données appliquées à ${regionName} (${regionStructures.length} systèmes).`);
}

// === Fonction de chargement et d'injection du SVG ===
async function loadSVG(svgPath) {
  try {
    if (svgPath.startsWith("https://evemaps.dotlan.net/")) {
      svgPath = `/api/proxy_svg.php?url=${encodeURIComponent(svgPath)}`;
    }

    const res = await fetch(svgPath);
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
    const svgText = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const newSvg = doc.querySelector("svg");
    if (!newSvg) throw new Error("Aucun <svg> trouvé dans le fichier.");

    // 🧩 Normalisation
    newSvg.removeAttribute("width");
    newSvg.removeAttribute("height");
    newSvg.setAttribute("width", "100%");
    newSvg.setAttribute("height", "100%");
    newSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    if (!newSvg.hasAttribute("viewBox")) {
      newSvg.setAttribute("viewBox", "0 0 1800 1200");
    }

    // 🧹 Nettoyage + insertion
    mapContainer.innerHTML = "";
    mapContainer.appendChild(newSvg);

    sanitizeSVG(newSvg);
    addCustomLegend(newSvg);

    console.log("✅ SVG chargé et inséré correctement :", svgPath);
    return newSvg;

  } catch (err) {
    console.error("❌ Erreur lors du chargement du SVG :", err);
    mapContainer.innerHTML = `<div style="color:red;padding:10px;">Erreur de chargement du SVG : ${err.message}</div>`;
    return null;
  }
}

// === Suppression des liens cliquables Dotlan ===
function sanitizeSVG(svg) {
  svg.querySelectorAll("a").forEach(a => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    while (a.firstChild) g.appendChild(a.firstChild);
    a.replaceWith(g);
  });
}

// === Nettoyage des souverainetés et ajout de la légende ===
function addCustomLegend(svg) {
  // Supprimer les textes du type "S.R (3)" etc.
  const sovereigntyPattern = /\b([A-Z]\.[A-Z])\s*\(\d+\)/g;
  svg.querySelectorAll("text").forEach(t => {
    if (sovereigntyPattern.test(t.textContent)) {
      t.textContent = t.textContent.replace(sovereigntyPattern, "").trim();
    }
  });

  // Supprimer la légende Dotlan originale
  svg.querySelectorAll("g").forEach(g => {
    const texts = [...g.querySelectorAll("text")].map(t => t.textContent);
    if (texts.some(txt =>
      txt.includes("Refinery") ||
      txt.includes("Factory") ||
      txt.includes("Research") ||
      txt.includes("Outpost") ||
      txt.includes("by Wollari") ||
      txt.includes("System") ||
      txt.includes("Outer Passage") ||
      txt.includes("Contested")
    )) {
      g.remove();
    }
  });

  // Créer une légende personnalisée
  const vb = svg.viewBox.baseVal || { width: 1800, height: 1200 };
  const legendX = vb.width - 250;
  const legendY = vb.height - 70;

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("id", "custom-legend");

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("x", legendX);
  bg.setAttribute("y", legendY);
  bg.setAttribute("width", "230");
  bg.setAttribute("height", "50");
  bg.setAttribute("fill", "#111");
  bg.setAttribute("stroke", "#333");
  bg.setAttribute("rx", "6");
  bg.setAttribute("ry", "6");
  g.appendChild(bg);

  const t1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t1.setAttribute("x", legendX + 15);
  t1.setAttribute("y", legendY + 20);
  t1.setAttribute("fill", "#ccc");
  t1.setAttribute("font-size", "11");
  t1.textContent = "⚙️ Gris = structures présentes";
  g.appendChild(t1);

  const t2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t2.setAttribute("x", legendX + 15);
  t2.setAttribute("y", legendY + 38);
  t2.setAttribute("fill", "#ff5555");
  t2.setAttribute("font-size", "11");
  t2.textContent = "🔥 Rouge = structures renforcées";
  g.appendChild(t2);

  svg.appendChild(g);
  console.log("✅ Nettoyage + légende personnalisée appliqués");
}

// === Bouton retour ===
returnButton.addEventListener("click", loadMainMap);

// === Initialisation ===
(async () => {
  await loadStructures();
  await loadMainMap();
})();
// === Fin script.js ===