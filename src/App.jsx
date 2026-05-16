import { useState, useEffect, useCallback, useRef } from "react";

/* ═══ EMAILJS ═══ */
const EMAILJS_SERVICE = "service_1cj2pn9";
const EMAILJS_TEMPLATE = "template_0hgy11b";
const EMAILJS_KEY = "tkN9qv5mHbpQXX5jF";
const EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send";

function buildEmailHTML(entry, lang) {
  const m = MENU_BY_DIET[entry.menu?.type] || MENU_BY_DIET.standard;
  const isY = entry.attendance === "yes";

  // Palette (cohérente avec le site)
  const C = {
    green: "#0d9a5f", darkGreen: "#087a4a", gold: "#c8a92e", goldLight: "#f5e9b8",
    text: "#1a2a18", muted: "#6a8a60", bg: "#f5f7f3", card: "#ffffff",
    border: "#d4e4d0", attendBg: "#e8f4ec", declineBg: "#fbeaea"
  };

  // Échappement minimal des entrées utilisateur (sécurité + propreté visuelle)
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const dietLabels = (d, ot) => {
    if (!d?.length) return "Aucune restriction";
    const labels = (Array.isArray(d) ? d : [d])
      .filter(x => x !== "standard")
      .map(x => ({
        "vegetarien": "Végétarien", "pescetarien": "Pescétarien", "vegan": "Vegan",
        "sansgluten": "Sans gluten", "halal": "Halal", "autre": "Autre",
        "lactose": "Intolérant lactose", "noix": "Intolérant noix"
      })[x] || x);
    if (!labels.length) return "Aucune restriction";
    let result = labels.join(", ");
    if (ot) result += ` <span style="color:${C.muted};font-style:italic;">(${esc(ot)})</span>`;
    return result;
  };

  const alcLabels = (a) => {
    if (!a?.length) return "–";
    if (a.includes("none")) return "Ne boit pas d'alcool";
    return a.map(x => ({ "vin": "Vin", "champagne": "Champagne", "biere": "Bière", "fort": "Alcool fort" })[x] || x).join(", ");
  };

  const fmtAddr = (a) => {
    if (!a?.street) return "–";
    return `${esc(a.street)}<br/>${esc(a.zip)} ${esc(a.city)}<br/>${esc(a.country)}`;
  };

  // Helpers de rendu
  const section = (icon, title) =>
    `<div style="margin:28px 0 10px;">
      <div style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${C.green};font-weight:bold;font-family:Arial,Helvetica,sans-serif;">${icon} &nbsp;${title}</div>
      <div style="height:2px;background:linear-gradient(90deg,${C.green},transparent);margin-top:6px;"></div>
    </div>`;

  const row = (label, value) =>
    `<tr>
      <td style="padding:11px 14px;color:${C.muted};width:140px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid ${C.border};vertical-align:top;">${label}</td>
      <td style="padding:11px 14px;color:${C.text};font-size:14px;border-bottom:1px solid ${C.border};">${value}</td>
    </tr>`;

  const menuItem = (label, item) =>
    `<tr>
      <td style="padding:13px 14px;color:${C.muted};width:120px;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid ${C.border};vertical-align:top;">${label}</td>
      <td style="padding:13px 14px;color:${C.text};font-size:14px;border-bottom:1px solid ${C.border};line-height:1.5;">
        <span style="font-size:18px;margin-right:6px;">${item?.emoji || ""}</span>${item?.fr || "–"}
      </td>
    </tr>`;

  const card = (content) =>
    `<table style="width:100%;border-collapse:collapse;background:${C.card};border-radius:12px;overflow:hidden;border:1px solid ${C.border};margin-bottom:6px;">${content}</table>`;

  // Données menu invité principal
  const choices = entry.menu?.choices || { entree: "A", plat: "A" };
  const isStd = (entry.menu?.type || "standard") === "standard";
  const entreeItem = isStd ? (choices.entree === "B" ? m.entreeB : m.entreeA) : m.entree;
  const platItem = isStd ? (choices.plat === "B" ? m.platB : m.platA) : m.plat;

  // ===== CONSTRUCTION =====
  let html = `<div style="font-family:Georgia,'Times New Roman',serif;max-width:640px;margin:0 auto;background:${C.bg};color:${C.text};">`;

  // En-tête principal
  html += `
    <div style="background:linear-gradient(135deg,${C.darkGreen},${C.green});padding:42px 24px;text-align:center;color:#fff;">
      <div style="font-size:10px;letter-spacing:5px;text-transform:uppercase;opacity:0.85;margin-bottom:16px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;">Nouvelle réponse RSVP</div>
      <div style="font-size:40px;font-style:italic;letter-spacing:2px;line-height:1.1;">Manon <span style="color:${C.goldLight};font-style:normal;font-weight:500;">&</span> Sebastian</div>
      <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;margin-top:20px;opacity:0.9;font-family:Arial,Helvetica,sans-serif;">12 Septembre 2026 · Moulin de Pommeuse</div>
    </div>
  `;

  // Bandeau invité avec statut
  const statusColor = isY ? C.darkGreen : "#a05050";
  const statusBg = isY ? C.attendBg : C.declineBg;
  const statusBorder = isY ? C.gold : "#d4a8a8";
  const statusText = isY ? "✓ Sera présent(e)" : "✗ Ne pourra pas venir";
  html += `
    <div style="background:${statusBg};padding:28px;border-bottom:3px solid ${statusBorder};text-align:center;">
      <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${C.muted};margin-bottom:8px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;">De la part de</div>
      <div style="font-size:30px;font-style:italic;color:${C.text};font-family:Georgia,serif;line-height:1.2;">${esc(entry.firstName)} ${esc(entry.lastName)}</div>
      <div style="display:inline-block;font-size:13px;font-weight:bold;color:${statusColor};margin-top:14px;padding:7px 20px;background:#fff;border-radius:22px;font-family:Arial,Helvetica,sans-serif;letter-spacing:1px;">${statusText}</div>
    </div>
  `;

  // Corps
  html += `<div style="padding:8px 24px 28px;">`;

  // Coordonnées
  html += section("👤", "Coordonnées");
  html += card(
    row("Email", `<a href="mailto:${esc(entry.email)}" style="color:${C.green};text-decoration:none;">${esc(entry.email)}</a>`) +
    row("Téléphone", esc(entry.phone) || "–") +
    row("Adresse", fmtAddr(entry.address))
  );

  if (isY) {
    // Régime
    html += section("🥗", "Régime alimentaire");
    html += card(
      row("Régime", dietLabels(entry.diet, entry.dietOt)) +
      row("Menu attribué", `<span style="font-weight:bold;color:${C.gold};letter-spacing:1px;font-family:Arial,Helvetica,sans-serif;">${(entry.menu?.type || "standard").toUpperCase()}</span>`)
    );

    // Menu
    html += section("🍽", "Menu");
    let menuContent = menuItem("Entrée", entreeItem) + menuItem("Plat", platItem);
    if (m.garniture) menuContent += menuItem("Garniture", m.garniture);
    if (m.dessert) menuContent += menuItem("Dessert", m.dessert);
    menuContent += row("Alcool", alcLabels(entry.alcohol));
    html += card(menuContent);

    // Accompagnant
    if (entry.companion) {
      const cm = MENU_BY_DIET[entry.companion.menu?.type] || MENU_BY_DIET.standard;
      const coCh = entry.companion.menu?.choices || { entree: "A", plat: "A" };
      const coIsStd = (entry.companion.menu?.type || "standard") === "standard";
      const coEntree = coIsStd ? (coCh.entree === "B" ? cm.entreeB : cm.entreeA) : cm.entree;
      const coPlat = coIsStd ? (coCh.plat === "B" ? cm.platB : cm.platA) : cm.plat;

      html += section("♡", `Accompagnant — ${esc(entry.companion.firstName)} ${esc(entry.companion.lastName)}`);
      let coContent =
        row("Régime", dietLabels(entry.companion.diet, entry.companion.dietOt)) +
        row("Menu", `<span style="font-weight:bold;color:${C.gold};letter-spacing:1px;font-family:Arial,Helvetica,sans-serif;">${(entry.companion.menu?.type || "standard").toUpperCase()}</span>`) +
        menuItem("Entrée", coEntree) +
        menuItem("Plat", coPlat);
      if (cm.garniture) coContent += menuItem("Garniture", cm.garniture);
      if (cm.dessert) coContent += menuItem("Dessert", cm.dessert);
      coContent += row("Alcool", alcLabels(entry.companion.alcohol));
      html += card(coContent);
    }

    // Enfants
    if (entry.children?.length) {
      html += section("★", `Enfants (${entry.children.length})`);
      let kidsContent = "";
      entry.children.forEach((c, i) => {
        const isLast = i === entry.children.length - 1;
        kidsContent += `
          <tr>
            <td style="padding:16px 14px;border-bottom:${isLast ? 'none' : `1px solid ${C.border}`};">
              <div style="font-size:16px;font-weight:bold;color:${C.text};margin-bottom:6px;font-family:Georgia,serif;">${esc(c.name)} <span style="color:${C.muted};font-weight:normal;font-size:13px;font-style:italic;">— ${esc(c.age)} ans</span></div>
              <div style="font-size:13px;color:${C.muted};font-family:Arial,Helvetica,sans-serif;">Régime : ${dietLabels(c.diet, c.dietOt)}</div>
              ${c.allergy ? `<div style="font-size:13px;color:#a05050;font-family:Arial,Helvetica,sans-serif;margin-top:4px;font-weight:bold;">⚠ Allergies : ${esc(c.allergy)}</div>` : ""}
            </td>
          </tr>
        `;
      });
      html += card(kidsContent);
    }

    // Hébergement
    html += section("🏡", "Hébergement");
    if (entry.accom !== "none") {
      html += card(
        row("Nuits", entry.accom === "fri-sun" ? "Vendredi → Dimanche (2 nuits)" : "Samedi → Dimanche (1 nuit)") +
        row("Type de chambre", entry.roomSize === "3" ? "3 personnes et plus" : "1–2 personnes") +
        row("Prix chambre", `<span style="font-weight:bold;color:${C.green};font-size:16px;">${entry.accomPrice} €</span>`)
      );
    } else {
      html += card(row("Statut", `<span style="color:${C.muted};font-style:italic;">Pas d'hébergement sur place</span>`));
    }

    // Petit-déjeuner
    if (entry.bfSat > 0 || entry.bfSun > 0) {
      html += section("🥐", "Petit-déjeuner");
      let bfContent = "";
      if (entry.bfSat > 0) bfContent += row("Samedi matin", `${entry.bfSat} pers.`);
      if (entry.bfSun > 0) bfContent += row("Dimanche matin", `${entry.bfSun} pers.`);
      bfContent += row("Prix petit-déj", `<span style="font-weight:bold;color:${C.gold};font-size:16px;">${entry.bfPrice} €</span>`);
      html += card(bfContent);
    }

    // BBQ
    html += section("🔥", "Barbecue dimanche");
    html += card(
      row("Présence au BBQ", entry.bbq === "yes"
        ? `<span style="font-weight:bold;color:${C.darkGreen};">✓ Reste pour le BBQ</span>`
        : `<span style="color:${C.muted};">Non</span>`)
    );

    // Total
    const total = (entry.accomPrice || 0) + (entry.bfPrice || 0);
    if (total > 0) {
      html += `
        <div style="background:linear-gradient(135deg,${C.darkGreen},${C.green});color:#fff;padding:28px 24px;border-radius:14px;text-align:center;margin:24px 0 16px;">
          <div style="font-size:10px;letter-spacing:4px;text-transform:uppercase;opacity:0.85;font-family:Arial,Helvetica,sans-serif;font-weight:bold;margin-bottom:10px;">Total à récupérer</div>
          <div style="font-size:46px;font-weight:bold;font-family:Georgia,serif;line-height:1;">${total} €</div>
          <div style="font-size:12px;opacity:0.85;margin-top:12px;font-family:Arial,Helvetica,sans-serif;">
            Chambre : ${entry.accomPrice} € &nbsp;·&nbsp; Petit-déj : ${entry.bfPrice} €
          </div>
        </div>
      `;
    }
  }

  // Message (présent ou absent)
  if (entry.message) {
    html += `
      <div style="background:${C.card};padding:24px;border-radius:14px;margin-top:16px;border:1px solid ${C.border};border-left:5px solid ${C.gold};">
        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${C.gold};font-weight:bold;font-family:Arial,Helvetica,sans-serif;margin-bottom:10px;">💌 Mot de l'invité</div>
        <div style="font-size:17px;color:${C.text};font-style:italic;font-family:Georgia,serif;line-height:1.6;">« ${esc(entry.message)} »</div>
      </div>
    `;
  }

  html += `</div>`; // fin corps

  // Pied de page
  html += `
    <div style="background:${C.darkGreen};color:#fff;padding:26px 24px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:20px;font-style:italic;letter-spacing:2px;margin-bottom:6px;">Manon <span style="color:${C.goldLight};">&</span> Sebastian</div>
      <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;opacity:0.85;font-family:Arial,Helvetica,sans-serif;">12 Septembre 2026 · Moulin de Pommeuse</div>
      <div style="font-size:11px;opacity:0.65;margin-top:14px;font-family:Arial,Helvetica,sans-serif;">Récapitulatif RSVP automatique · Reçu le ${entry.date}</div>
    </div>
  `;

  html += `</div>`; // fin wrapper
  return html;
}

async function sendEmailJS(entry, lang) {
  const html = buildEmailHTML(entry, lang);
  try {
    await fetch(EMAILJS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE,
        template_id: EMAILJS_TEMPLATE,
        user_id: EMAILJS_KEY,
        template_params: {
          from_name: entry.firstName + " " + entry.lastName,
          message_html: html,
        }
      })
    });
  } catch (e) { console.error("EmailJS error:", e); }
}


/* ═══ CONFIG ═══ */
const CAGNOTTE_URL = "";
const RSVP_DEADLINE = "2026-06-20";
// Image bannière : déposer le fichier dans le dossier `public/` de ton projet
// (par exemple `public/moulin.jpg`), puis garder le chemin tel quel ci-dessous.
const MOULIN_IMG = "/moulin.jpg";

/* ═══ MENUS — automatiques selon régime ═══ */
const GARNITURE = { fr: "Écrasé de pommes de terre", en: "Mashed potatoes", emoji: "🥔" };

const MENU_BY_DIET = {
  standard: {
    entreeA: { fr: "Raviole au foie gras, artichaut, crème de truffes", en: "Foie gras ravioli, artichoke, truffle cream", emoji: "🥟" },
    entreeB: { fr: "Tomate cœur de bœuf confite au four, huile d'olive, burrata sur lit de roquette", en: "Oven-roasted beef heart tomato, olive oil, burrata on rocket", emoji: "🍅" },
    platA: { fr: "Magret de canard, sauce framboise et framboises fraîches", en: "Duck breast, raspberry sauce, fresh raspberries", emoji: "🦆" },
    platB: { fr: "Filet de bar sur sa feuille de bananier et son beurre blanc", en: "Sea bass fillet on banana leaf with white butter sauce", emoji: "🐟" },
    garniture: GARNITURE,
    dessert: { fr: "Pièce montée & gâteau", en: "Wedding cake", emoji: "🎂" },
  },
  sansgluten: {
    entree: { fr: "Tomate cœur de bœuf confite au four, huile d'olive, burrata sur lit de roquette", en: "Oven-roasted beef heart tomato, olive oil, burrata on rocket", emoji: "🍅" },
    plat: { fr: "Magret de canard, sauce framboise et framboises fraîches", en: "Duck breast, raspberry sauce, fresh raspberries", emoji: "🦆" },
    garniture: GARNITURE,
    dessert: { fr: "Brochettes de fruits frais", en: "Fresh fruit skewers", emoji: "🍡" },
  },
  pescetarien: {
    entree: { fr: "Tomate cœur de bœuf confite au four, huile d'olive, burrata sur lit de roquette", en: "Oven-roasted beef heart tomato, olive oil, burrata on rocket", emoji: "🍅" },
    plat: { fr: "Filet de bar sur sa feuille de bananier et son beurre blanc", en: "Sea bass fillet on banana leaf with white butter sauce", emoji: "🐟" },
    garniture: GARNITURE,
    dessert: { fr: "Pièce montée & gâteau", en: "Wedding cake", emoji: "🎂" },
  },
  vegetarien: {
    entree: { fr: "Tomate cœur de bœuf confite au four, huile d'olive, burrata sur lit de roquette", en: "Oven-roasted beef heart tomato, olive oil, burrata on rocket", emoji: "🍅" },
    plat: { fr: "Dahl de lentilles corail au lait de coco, coriandre fraîche, noix de cajou", en: "Coral lentil dahl with coconut milk, fresh coriander, cashew nuts", emoji: "🥘" },
    garniture: GARNITURE,
    dessert: { fr: "Pièce montée & gâteau", en: "Wedding cake", emoji: "🎂" },
  },
  vegan: {
    entree: { fr: "Tomate cœur de bœuf confite au four, huile d'olive, sur lit de roquette (sans burrata)", en: "Oven-roasted beef heart tomato, olive oil, on rocket (no burrata)", emoji: "🍅" },
    plat: { fr: "Dahl de lentilles corail au lait de coco, coriandre fraîche, noix de cajou", en: "Coral lentil dahl with coconut milk, fresh coriander, cashew nuts", emoji: "🥘" },
    garniture: GARNITURE,
    dessert: { fr: "Brochettes de fruits frais", en: "Fresh fruit skewers", emoji: "🍡" },
  },
  halal: {
    entree: { fr: "Tomate cœur de bœuf confite au four, huile d'olive, burrata sur lit de roquette", en: "Oven-roasted beef heart tomato, olive oil, burrata on rocket", emoji: "🍅" },
    plat: { fr: "Filet de bar sur sa feuille de bananier et son beurre blanc", en: "Sea bass fillet on banana leaf with white butter sauce", emoji: "🐟" },
    garniture: GARNITURE,
    dessert: { fr: "Pièce montée & gâteau", en: "Wedding cake", emoji: "🎂" },
  },
  lactose: {
    entree: { fr: "Tomate cœur de bœuf confite au four, huile d'olive, sur lit de roquette (sans burrata)", en: "Oven-roasted beef heart tomato, olive oil, on rocket (no burrata)", emoji: "🍅" },
    plat: { fr: "Magret de canard, sauce framboise et framboises fraîches", en: "Duck breast, raspberry sauce, fresh raspberries", emoji: "🦆" },
    garniture: GARNITURE,
    dessert: { fr: "Brochettes de fruits frais", en: "Fresh fruit skewers", emoji: "🍡" },
  },
  noix: {
    entree: { fr: "Raviole au foie gras, artichaut, crème de truffes", en: "Foie gras ravioli, artichoke, truffle cream", emoji: "🥟" },
    plat: { fr: "Magret de canard, sauce framboise et framboises fraîches", en: "Duck breast, raspberry sauce, fresh raspberries", emoji: "🦆" },
    garniture: GARNITURE,
    dessert: { fr: "Pièce montée & gâteau", en: "Wedding cake", emoji: "🎂" },
  },
};
const LACTOSE_KEYWORDS = ["lactose", "lait", "lactase", "dairy", "milk", "fromage", "cheese", "beurre", "butter", "crème", "cream"];
const NOIX_KEYWORDS = ["noix", "nut", "nuts", "cajou", "cashew", "amande", "almond", "noisette", "hazelnut", "arachide", "peanut", "pistache", "pistachio", "fruits à coque"];
const detectAllergyType = (dietArr, dietOt) => {
  const otLower = (dietOt || "").toLowerCase();
  if (LACTOSE_KEYWORDS.some(k => otLower.includes(k))) return "lactose";
  if (NOIX_KEYWORDS.some(k => otLower.includes(k))) return "noix";
  return null;
};
const getMenuType = (d, dietOt) => {
  if (!d?.length) return "standard";
  if (d.includes("autre")) { const allergy = detectAllergyType(d, dietOt); if (allergy) return allergy; }
  if (d.includes("vegan")) return "vegan";
  if (d.includes("vegetarien")) return "vegetarien";
  if (d.includes("pescetarien")) return "pescetarien";
  if (d.includes("halal")) return "halal";
  if (d.includes("sansgluten")) return "sansgluten";
  return "standard";
};
const getMenuForDiet = (diets, dietOt) => MENU_BY_DIET[getMenuType(diets, dietOt)] || MENU_BY_DIET.standard;

const CAL_URL = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Mariage+Manon+%26+Sebastian&dates=20260912T100000/20260912T235900&location=Moulin+de+Pommeuse+77515";
const MAIRIE = { maps: "https://maps.google.com/?q=Mairie+de+Coulommiers+77120", waze: "https://waze.com/ul?q=Mairie+de+Coulommiers&navigate=yes" };
const MOULIN = { maps: "https://maps.google.com/?q=Moulin+de+Pommeuse+77515", waze: "https://waze.com/ul?q=Moulin+de+Pommeuse&navigate=yes" };

/* ═══ FAQ ═══ */
const FAQ = {
  fr: [
    { q: "Peut-on se garer sur place ?", a: "Oui, un parking gratuit est disponible au Moulin de Pommeuse." },
    { q: "Les enfants sont-ils les bienvenus ?", a: "Bien sûr ! Un menu enfant adapté sera préparé selon leurs besoins alimentaires." },
    { q: "Peut-on apporter un cadeau ?", a: "Votre présence est le plus beau des cadeaux ! Si vous le souhaitez, une cagnotte pour notre voyage de noces est disponible en bas de page." },
    { q: "À quelle heure se termine la soirée ?", a: "Aucune limite ! La fête continue jusqu'au bout de la nuit." },
    { q: "Y a-t-il un hébergement sur place ?", a: "Oui, le Moulin de Pommeuse propose des chambres du vendredi au dimanche. Vous pouvez les réserver directement via ce formulaire." },
    { q: "Que prévoir pour la piscine et le jacuzzi ?", a: "Pensez à apporter votre maillot de bain ! La piscine intérieure chauffée et le jacuzzi sont accessibles le vendredi soir et le dimanche matin." },
    { q: "Les animaux sont-ils acceptés ?", a: "Malheureusement non, le domaine ne peut pas accueillir les animaux de compagnie." },
    { q: "Comment s'y rendre ?", a: "Les liens GPS vers la Mairie de Coulommiers et le Moulin de Pommeuse sont disponibles en bas de page." },
  ],
  en: [
    { q: "Is there parking on site?", a: "Yes, free parking is available at Moulin de Pommeuse." },
    { q: "Are children welcome?", a: "Of course! A kids' menu adapted to their dietary needs will be prepared." },
    { q: "Can we bring a gift?", a: "Your presence is the best gift! If you wish, a honeymoon fund is available at the bottom of the page." },
    { q: "What time does the party end?", a: "No limit! The party goes on until the early hours." },
    { q: "Is there accommodation on site?", a: "Yes, Moulin de Pommeuse offers rooms from Friday to Sunday. You can book directly through this form." },
    { q: "What about the pool and jacuzzi?", a: "Bring your swimsuit! The heated indoor pool and jacuzzi are available Friday evening and Sunday morning." },
    { q: "Are pets allowed?", a: "Unfortunately no, the venue cannot accommodate pets." },
    { q: "How do I get there?", a: "GPS links to both venues are available at the bottom of the page." },
  ],
};

/* ═══ TRANSLATIONS (compact) ═══ */
const TR = {
  fr: {
    sub: "Confirmez votre présence", intro: "Nous serions touchés de votre présence.",
    att: "Présence", yes: "Je serai là ✓", no: "Je ne pourrai pas",
    fn: "Prénom", ln: "Nom", email: "E-mail", phone: "Téléphone", addrL: "Adresse", cityL: "Ville", zipL: "Code postal", countryL: "Pays", diet: "Régime alimentaire", dietOther: "Précisez", dietOtherPh: "Allergies, intolérances...", dietHint: "Plusieurs choix possibles",
    diets: { standard: "Aucune restriction", vegetarien: "Végétarien", pescetarien: "Pescétarien", vegan: "Vegan", sansgluten: "Sans gluten", halal: "Halal", autre: "Autre" },
    compQ: "Accompagné(e) ?", compT: "Accompagnant(e)", oui: "Oui", non: "Non",
    childQ: "Avec des enfants ?", childT: "Enfant", childN: "Prénom", childA: "Âge",
    childMenuNote: "Les enfants bénéficieront d'un menu enfant adapté, préparé selon les allergies et intolérances de chacun.",
    childAllergyL: "Allergies / intolérances",
    childAllergyPh: "Ex : noix, lactose, œufs...",
    childMenuSoon: "Menu enfant à venir — adapté selon le régime de chaque enfant.",
    addChild: "+ Ajouter un enfant", rmChild: "Retirer",
    menuT: "Le repas", menuS: "Choisissez vos préférences pour le dîner.", menuAdapt: "Menu adapté à votre régime",
    entL: "Entrée", platL: "Plat principal", garL: "Garnitures", ch1: "1 choix", chAll: "Les deux incluses", chOnly: "Votre plat",
    alcQ: "Buvez-vous de l'alcool ?", alcH: "Pour prévoir les quantités",
    alc: { vin: "🍷 Vin", champagne: "🥂 Champagne", biere: "🍺 Bière", fort: "🥃 Alcool fort" }, alcNon: "Je ne bois pas",
    acT: "Hébergement", acD: "Le Moulin de Pommeuse vous accueille du vendredi au dimanche. Même tarif pour 1 ou 2 nuits.", acAvail: "Selon les places disponibles",
    acN: "Pas d'hébergement", acFS: "Vendredi → Dimanche", acSS: "Samedi → Dimanche",
    rm12: "1–2 pers.", rm3: "3 pers. et +", pr12: "150 €", pr3: "180 €", prR: "/ chambre",
    bfT: "Petit-déjeuner", bfP: "8 € / pers.", bfSat: "Samedi matin", bfSun: "Dimanche matin",
    poolT: "🏊 Piscine & Jacuzzi", poolD: "Disponibles vendredi soir et dimanche matin. Apportez votre maillot !",
    bbqT: "🔥 Barbecue du dimanche", bbqD: "Avant de se quitter, un barbecue est organisé pour tout le monde !",
    bbqY: "Je reste pour le BBQ !", bbqN: "Non merci",
    msgL: "Un mot pour les mariés", msgPh: "Un petit mot...",
    submit: "Envoyer", sending: "Envoi...",
    steps: ["Qui êtes-vous ?", "Le repas", "Hébergement", "Récapitulatif"], stepsNo: ["Qui êtes-vous ?", "Confirmation"],
    next: "Continuer", prev: "Retour", send: "Confirmer & Envoyer",
    recapD: "Vérifiez vos informations avant d'envoyer.",
    sucYT: "Nous sommes ravis !", sucYS: "Votre présence est confirmée.\nÀ très bientôt !",
    sucNT: "Merci !", sucNS: "Vous serez dans nos pensées.",
    cagnotteT: "🎁 Voyage de noces", cagnotteD: "En guise de cadeau, participez à notre voyage de noces.", cagnotteSoon: "Lien bientôt disponible", cagnotteBtn: "Participer",
    admT: "Espace Manon & Sebastian", back: "Retour",
    resp: "Rép.", atd: "Oui", dec: "Non", adul: "Adultes", kid: "Enfants", rms: "Ch.", rev: "€Héb", bfs: "Pdéj", bbqs: "BBQ",
    empty: "Aucune réponse…", pres: "Présent", abs: "Absent", notA: "Absent",
    req: "Requis", badE: "E-mail invalide", newR: "Nouvelle réponse",
    date: "12 Septembre 2026", saveD: "Sauvegarder la date",
    venue: "Moulin de Pommeuse", city: "Mairie de Coulommiers",
    countdown: { d: "jours", h: "heures", m: "min", s: "sec" },
    timelineT: "Le programme",
    tl: [
      { time: "Vendredi", label: "Arrivée", icon: "🏡" },
      { time: "Sam. 14h30", label: "Mairie", icon: "🏛" },
      { time: "16h30", label: "Cérémonie laïque", icon: "💍" },
      { time: "17h30", label: "Vin d'honneur", icon: "🥂" },
      { time: "20h", label: "Dîner & fête", icon: "🎶" },
      { time: "Dimanche", label: "BBQ & départ", icon: "🔥" },
    ],
    gpsT: "Comment venir", aiLbl: "Un mot de Manon & Sebastian",
    deleteConfirm: "Voulez-vous vraiment supprimer ce profil ?", deleteBtn: "Supprimer", close: "Annuler",
    nFS: "Ven→Dim", nSS: "Sam→Dim", noAc: "–", p1: "+1", yrs: "ans", ch: "enfant", chs: "enfants", mFor: "Menu de",
    detEntree: "Entrée", detPlat: "Plat", detGar: "Garnitures", detDessert: "Dessert", detAlc: "Alcool", detAc: "Hébergement", detBf: "Petit-déj", detBbq: "BBQ", detMsg: "Message", detComp: "Accompagnant", detChildren: "Enfants", detDiet: "Régime",
    deadlineMsg: "Merci de confirmer avant le 20 juin 2026",
    faqT: "Questions fréquentes",
    exportBtn: "📥 Exporter CSV", mealCountT: "Compteur plats",
    loveT: "Notre histoire", loveSoon: "À venir...",
    tableT: "Plan de table", tableSoon: "Sera communiqué prochainement.",
    emailSentTo: "Un récapitulatif a été envoyé à",
  },
  en: {
    sub: "Please confirm your attendance", intro: "We would be honoured by your presence.",
    att: "Attendance", yes: "I'll be there ✓", no: "I can't make it",
    fn: "First name", ln: "Last name", email: "Email", phone: "Phone", addrL: "Address", cityL: "City", zipL: "Postal code", countryL: "Country", diet: "Dietary requirements", dietOther: "Specify", dietOtherPh: "Allergies, intolerances...", dietHint: "Multiple choices allowed",
    diets: { standard: "No restrictions", vegetarien: "Vegetarian", pescetarien: "Pescatarian", vegan: "Vegan", sansgluten: "Gluten-free", halal: "Halal", autre: "Other" },
    compQ: "Bringing a +1?", compT: "Companion", oui: "Yes", non: "No",
    childQ: "Bringing children?", childT: "Child", childN: "First name", childA: "Age",
    childMenuNote: "Children will enjoy a kids' menu adapted to each child's allergies and intolerances.",
    childAllergyL: "Allergies / intolerances",
    childAllergyPh: "E.g. nuts, lactose, eggs...",
    childMenuSoon: "Kids' menu coming soon — adapted to each child's diet.",
    addChild: "+ Add a child", rmChild: "Remove",
    menuT: "The meal", menuS: "Choose your dinner preferences.", menuAdapt: "Menu adapted to your diet",
    entL: "Starter", platL: "Main course", garL: "Sides", ch1: "Pick 1", chAll: "Both included", chOnly: "Your dish",
    alcQ: "Do you drink alcohol?", alcH: "Help us plan quantities",
    alc: { vin: "🍷 Wine", champagne: "🥂 Champagne", biere: "🍺 Beer", fort: "🥃 Spirits" }, alcNon: "I don't drink",
    acT: "Accommodation", acD: "Moulin de Pommeuse welcomes you Friday to Sunday. Same rate for 1 or 2 nights.", acAvail: "Subject to availability",
    acN: "No accommodation", acFS: "Friday → Sunday", acSS: "Saturday → Sunday",
    rm12: "1–2 people", rm3: "3+ people", pr12: "€150", pr3: "€180", prR: "/ room",
    bfT: "Breakfast", bfP: "€8 / pers.", bfSat: "Saturday morning", bfSun: "Sunday morning",
    poolT: "🏊 Pool & Jacuzzi", poolD: "Available Friday evening & Sunday morning. Bring your swimsuit!",
    bbqT: "🔥 Sunday BBQ", bbqD: "Before we say goodbye, a BBQ is organised for everyone!",
    bbqY: "I'm staying for the BBQ!", bbqN: "No thanks",
    msgL: "A word for the couple", msgPh: "A sweet note...",
    submit: "Send", sending: "Sending...",
    steps: ["Who are you?", "The meal", "Accommodation", "Summary"], stepsNo: ["Who are you?", "Confirmation"],
    next: "Continue", prev: "Back", send: "Confirm & Send",
    recapD: "Review before sending.",
    sucYT: "We are delighted!", sucYS: "Your attendance is confirmed.\nSee you soon!",
    sucNT: "Thank you!", sucNS: "You will be in our thoughts.",
    cagnotteT: "🎁 Honeymoon", cagnotteD: "Instead of gifts, contribute to our honeymoon fund.", cagnotteSoon: "Link coming soon", cagnotteBtn: "Contribute",
    admT: "Manon & Sebastian's space", back: "Back",
    resp: "Resp.", atd: "Yes", dec: "No", adul: "Adults", kid: "Children", rms: "Rms", rev: "€Acc", bfs: "Bkfst", bbqs: "BBQ",
    empty: "No responses yet…", pres: "Attending", abs: "Declined", notA: "Absent",
    req: "Required", badE: "Invalid email", newR: "New response",
    date: "September 12, 2026", saveD: "Save the date",
    venue: "Moulin de Pommeuse", city: "Coulommiers Town Hall",
    countdown: { d: "days", h: "hours", m: "min", s: "sec" },
    timelineT: "The programme",
    tl: [
      { time: "Friday", label: "Arrival", icon: "🏡" },
      { time: "Sat 2:30pm", label: "Town Hall", icon: "🏛" },
      { time: "4:30pm", label: "Secular ceremony", icon: "💍" },
      { time: "5:30pm", label: "Cocktail hour", icon: "🥂" },
      { time: "8pm", label: "Dinner & party", icon: "🎶" },
      { time: "Sunday", label: "BBQ & farewell", icon: "🔥" },
    ],
    gpsT: "How to get there", aiLbl: "A word from Manon & Sebastian",
    deleteConfirm: "Are you sure you want to delete this profile?", deleteBtn: "Delete", close: "Cancel",
    nFS: "Fri→Sun", nSS: "Sat→Sun", noAc: "–", p1: "+1", yrs: "y/o", ch: "child", chs: "children", mFor: "Menu for",
    detEntree: "Starter", detPlat: "Main", detGar: "Sides", detDessert: "Dessert", detAlc: "Alcohol", detAc: "Accommodation", detBf: "Breakfast", detBbq: "BBQ", detMsg: "Message", detComp: "Companion", detChildren: "Children", detDiet: "Diet",
    deadlineMsg: "Please confirm before June 20, 2026",
    faqT: "Frequently asked questions",
    exportBtn: "📥 Export CSV", mealCountT: "Meal counter",
    loveT: "Our story", loveSoon: "Coming soon...",
    tableT: "Seating plan", tableSoon: "Will be shared soon.",
    emailSentTo: "A summary has been sent to",
  },
};
const mkKid = () => ({ id: Date.now() + Math.random(), name: "", age: "", diet: ["standard"], dietOt: "", allergy: "" });
const PHONE_CODES = [
  { code: "+33", flag: "🇫🇷", name: "France" }, { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+1", flag: "🇺🇸", name: "US/CA" }, { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+34", flag: "🇪🇸", name: "Spain" }, { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+32", flag: "🇧🇪", name: "Belgium" }, { code: "+41", flag: "🇨🇭", name: "Switzerland" },
  { code: "+351", flag: "🇵🇹", name: "Portugal" }, { code: "+31", flag: "🇳🇱", name: "Netherlands" },
  { code: "+353", flag: "🇮🇪", name: "Ireland" }, { code: "+352", flag: "🇱🇺", name: "Luxembourg" },
  { code: "+212", flag: "🇲🇦", name: "Morocco" }, { code: "+213", flag: "🇩🇿", name: "Algeria" },
  { code: "+216", flag: "🇹🇳", name: "Tunisia" }, { code: "+90", flag: "🇹🇷", name: "Turkey" },
  { code: "+48", flag: "🇵🇱", name: "Poland" }, { code: "+46", flag: "🇸🇪", name: "Sweden" },
  { code: "+47", flag: "🇳🇴", name: "Norway" }, { code: "+45", flag: "🇩🇰", name: "Denmark" },
];

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}input:focus,select:focus,textarea:focus{border-color:#0d9a5f!important;outline:none}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}.fu{animation:fadeUp .5s ease both}a{color:#0d9a5f;text-decoration:none;font-weight:600}a:hover{text-decoration:underline}.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}.modal-box{background:#f0f4ed;border-radius:20px;max-width:500px;width:100%;max-height:80vh;overflow-y:auto;padding:24px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.2)}`;

/* ═══ COMPONENTS ═══ */
function Err({ show, text }) { return show ? <div style={{ color: "#d44", fontSize: "11px", marginTop: "4px", fontWeight: 500 }}>{text}</div> : null; }

function DietMultiSelect({ value, onChange, otVal, onOtChange, errOt, t }) {
  const toggle = (k) => { if (k === "standard") { onChange(["standard"]); return; } let n = value.filter(v => v !== "standard"); if (n.includes(k)) n = n.filter(v => v !== k); else n = [...n, k]; if (!n.length) n = ["standard"]; onChange(n); };
  return <><div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px", justifyContent: "center" }}>{Object.entries(t.diets).map(([k, v]) => { const on = value.includes(k); return <button key={k} onClick={() => toggle(k)} style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontFamily: "'DM Sans'", border: on ? "2px solid #0d9a5f" : "1.5px solid rgba(0,0,0,.08)", background: on ? "rgba(13,154,95,.1)" : "rgba(255,255,255,.6)", color: on ? "#087a4a" : "#4a5a48", fontWeight: on ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap" }}>{v}</button>; })}</div>
  <div style={{ fontSize: "11px", color: "#6a8a60", marginTop: "5px", fontStyle: "italic", textAlign: "center" }}>{t.dietHint}</div>
  {value.includes("autre") && <div className="fu" style={{ marginTop: "8px", background: "rgba(13,154,95,.05)", border: "1px solid rgba(13,154,95,.15)", borderRadius: "12px", padding: "12px" }}><input style={{ ...st.inp, fontSize: "14px" }} placeholder={t.dietOtherPh} value={otVal} onChange={e => onOtChange(e.target.value)} /><Err show={errOt} text={t.req} /></div>}</>;
}
function AlcoholSelect({ value, onChange, t }) {
  const toggle = (k) => { if (k === "none") { onChange(["none"]); return; } let n = value.filter(v => v !== "none"); if (n.includes(k)) n = n.filter(v => v !== k); else n = [...n, k]; if (!n.length) n = ["none"]; onChange(n); };
  return <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px", justifyContent: "center" }}>
    {Object.entries(t.alc).map(([k, v]) => { const on = value.includes(k); return <button key={k} onClick={() => toggle(k)} style={{ padding: "10px 18px", borderRadius: "22px", fontSize: "13px", fontFamily: "'DM Sans'", border: on ? "2px solid #c8a92e" : "1.5px solid rgba(0,0,0,.06)", background: on ? "rgba(200,169,46,.1)" : "rgba(255,255,255,.6)", color: on ? "#8a7a10" : "#4a5a48", fontWeight: on ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap" }}>{v}</button>; })}
    <button onClick={() => toggle("none")} style={{ padding: "10px 18px", borderRadius: "22px", fontSize: "13px", fontFamily: "'DM Sans'", border: value.includes("none") ? "2px solid #888" : "1.5px solid rgba(0,0,0,.06)", background: value.includes("none") ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.6)", color: value.includes("none") ? "#444" : "#888", fontWeight: value.includes("none") ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap" }}>{t.alcNon}</button>
  </div>;
}
function MenuDisplay({ lang, diets, dietOt, personName, t, choices, onChoice }) {
  const menu = getMenuForDiet(diets, dietOt); const mt = getMenuType(diets, dietOt); const isStd = mt === "standard"; const adapted = !isStd;
  const Item = ({ label, item }) => <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "rgba(13,154,95,.05)", border: "1.5px solid rgba(13,154,95,.1)", borderRadius: "14px", marginBottom: "8px" }}>
    <span style={{ fontSize: "22px", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(13,154,95,.08)", flexShrink: 0 }}>{item.emoji}</span>
    <div><div style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "#6a8a60", fontWeight: 600, marginBottom: "2px" }}>{label}</div><div style={{ fontSize: "14px", color: "#1a2a18", fontWeight: 500, lineHeight: 1.4 }}>{item[lang]}</div></div>
  </div>;
  const ChoiceItem = ({ item, selected, onClick }) => <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: selected ? "rgba(13,154,95,.1)" : "rgba(255,255,255,.5)", border: selected ? "2px solid #0d9a5f" : "1.5px solid rgba(0,0,0,.06)", borderRadius: "14px", marginBottom: "8px", cursor: "pointer" }}>
    <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: selected ? "5px solid #0d9a5f" : "2px solid #b0c0a8", background: "#fff", flexShrink: 0 }} />
    <span style={{ fontSize: "22px", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: selected ? "rgba(13,154,95,.12)" : "rgba(13,154,95,.05)", flexShrink: 0 }}>{item.emoji}</span>
    <div style={{ fontSize: "14px", color: "#1a2a18", fontWeight: selected ? 600 : 400, lineHeight: 1.4 }}>{item[lang]}</div>
  </div>;
  const ChoiceLabel = ({ text }) => <div style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "#6a8a60", fontWeight: 600, marginBottom: "6px", marginTop: "4px" }}>{text} — {t.ch1}</div>;
  return <div style={{ ...st.card, borderLeft: "3px solid #c8a92e", marginBottom: "16px" }}>
    <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "18px", fontStyle: "italic", color: "#1a2a18", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>🍽 {t.mFor} {personName}</div>
    {adapted && <div style={{ background: "rgba(200,169,46,.1)", border: "1px solid rgba(200,169,46,.25)", borderRadius: "10px", padding: "8px 14px", marginBottom: "14px", fontSize: "12px", fontWeight: 600, color: "#8a7a20" }}>✨ {t.menuAdapt}</div>}
    {isStd ? <>
      <ChoiceLabel text={t.entL} />
      <ChoiceItem item={menu.entreeA} selected={choices.entree !== "B"} onClick={() => onChoice({ ...choices, entree: "A" })} />
      <ChoiceItem item={menu.entreeB} selected={choices.entree === "B"} onClick={() => onChoice({ ...choices, entree: "B" })} />
      <ChoiceLabel text={t.platL} />
      <ChoiceItem item={menu.platA} selected={choices.plat !== "B"} onClick={() => onChoice({ ...choices, plat: "A" })} />
      <ChoiceItem item={menu.platB} selected={choices.plat === "B"} onClick={() => onChoice({ ...choices, plat: "B" })} />
    </> : <>
      <Item label={t.entL} item={menu.entree} />
      <Item label={t.platL} item={menu.plat} />
    </>}
    {menu.garniture && <Item label={t.garL} item={menu.garniture} />}
    {menu.dessert && <Item label={t.detDessert || "Dessert"} item={menu.dessert} />}
  </div>;
}
function BfCounter({ label, count, setCount }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}><span style={{ fontSize: "14px" }}>{label}</span><div style={{ display: "flex", alignItems: "center", gap: "12px" }}><button onClick={() => setCount(Math.max(0, count - 1))} style={st.cBtn}>−</button><span style={{ fontSize: "20px", fontWeight: 700, minWidth: "28px", textAlign: "center", fontFamily: "'Cormorant Garamond'" }}>{count}</span><button onClick={() => setCount(count + 1)} style={st.cBtn}>+</button></div></div>; }
function Countdown({ lang }) { const [now, setNow] = useState(Date.now()); useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []); const ct = TR[lang].countdown; const diff = Math.max(0, new Date("2026-09-12T14:00:00").getTime() - now); const d = Math.floor(diff / 864e5), h = Math.floor((diff % 864e5) / 36e5), m = Math.floor((diff % 36e5) / 6e4), s = Math.floor((diff % 6e4) / 1e3); return <div style={{ display: "flex", justifyContent: "center", gap: "20px", margin: "14px 0" }}>{[[d, ct.d], [h, ct.h], [m, ct.m], [s, ct.s]].map(([n, l], i) => <div key={i} style={{ textAlign: "center" }}><div style={{ fontSize: "28px", fontWeight: 700, color: "#0d9a5f", fontFamily: "'Cormorant Garamond'" }}>{n}</div><div style={{ fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: "#6a8a60", fontWeight: 600 }}>{l}</div></div>)}</div>; }
function ProgressBar({ step, total }) { return <div style={{ display: "flex", gap: "4px", margin: "0 auto 24px", maxWidth: "300px" }}>{Array.from({ length: total }).map((_, i) => <div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i <= step ? "linear-gradient(90deg, #0d9a5f, #0dba6f)" : "rgba(0,0,0,.06)", transition: "background .4s" }} />)}</div>; }

/* ═══ FAQ Component ═══ */
function FAQSection({ lang, t }) {
  const [open, setOpen] = useState(null);
  return <div style={{ maxWidth: "520px", margin: "0 auto", padding: "0 20px 20px" }}>
    <div style={{ fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", color: "#0d9a5f", fontWeight: 700, textAlign: "center", marginBottom: "14px" }}>{t.faqT}</div>
    {FAQ[lang].map((item, i) => <div key={i} style={{ marginBottom: "8px" }}>
      <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: open === i ? "14px 14px 0 0" : "14px", border: "1.5px solid rgba(13,154,95,.08)", background: open === i ? "rgba(13,154,95,.06)" : "rgba(255,255,255,.55)", cursor: "pointer", fontFamily: "'DM Sans'", fontSize: "14px", fontWeight: 500, color: "#1a2a18", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{item.q}</span><span style={{ color: "#0d9a5f", fontSize: "18px", transition: "transform .2s", transform: open === i ? "rotate(45deg)" : "none" }}>+</span>
      </button>
      {open === i && <div style={{ padding: "12px 16px", background: "rgba(255,255,255,.55)", border: "1.5px solid rgba(13,154,95,.08)", borderTop: "none", borderRadius: "0 0 14px 14px", fontSize: "13px", color: "#3a5a38", lineHeight: 1.6 }}>{item.a}</div>}
    </div>)}
  </div>;
}

/* ═══ APP ═══ */
export default function App() {
  const [lang, setLang] = useState("fr"); const [view, setView] = useState("form"); const [step, setStep] = useState(0);
  const [att, setAtt] = useState("yes");
  const [fn, setFn] = useState(""); const [ln, setLn] = useState(""); const [em, setEm] = useState(""); const [phone, setPhone] = useState(""); const [phoneCode, setPhoneCode] = useState("+33");
  const [addr, setAddr] = useState(""); const [city, setCity] = useState(""); const [zip, setZip] = useState(""); const [country, setCountry] = useState("France");
  const [di, setDi] = useState(["standard"]); const [diOt, setDiOt] = useState("");
  const [alc, setAlc] = useState([]); const [msg, setMsg] = useState("");
  const [menuCh, setMenuCh] = useState({ entree: "A", plat: "A", garniture: "A" });
  const [coMenuCh, setCoMenuCh] = useState({ entree: "A", plat: "A", garniture: "A" });
  const [hasCo, setHasCo] = useState(false);
  const [coFn, setCoFn] = useState(""); const [coLn, setCoLn] = useState("");
  const [coDi, setCoDi] = useState(["standard"]); const [coDiOt, setCoDiOt] = useState("");
  const [coAlc, setCoAlc] = useState([]);
  const [hasCh, setHasCh] = useState(false); const [kids, setKids] = useState([mkKid()]);
  const [accom, setAccom] = useState("none"); const [roomSize, setRoomSize] = useState("12");
  const [bfSat, setBfSat] = useState(0); const [bfSun, setBfSun] = useState(0); const [bbq, setBbq] = useState("");
  const [errs, setErrs] = useState({}); const [rsvps, setRsvps] = useState([]);
  const [aiMsg, setAiMsg] = useState(""); const [aiLoad, setAiLoad] = useState(false); const [last, setLast] = useState(null); const [submitting, setSubmitting] = useState(false);
  const topRef = useRef(null);
  const t = TR[lang];

  // Deadline check
  const isExpired = new Date() > new Date(RSVP_DEADLINE + "T23:59:59");

  useEffect(() => { try { setRsvps(JSON.parse(localStorage.getItem("ms_rsvps_v30") || "[]")); } catch(e){} }, []);
  const save = (l) => { setRsvps(l); try { localStorage.setItem("ms_rsvps_v30", JSON.stringify(l)); } catch(e){} };
  useEffect(() => { topRef.current?.scrollIntoView({ behavior: "smooth" }); }, [step, view]);

  const totalSteps = att === "yes" ? 4 : 2;
  const stepNames = att === "yes" ? t.steps : t.stepsNo;

  const validateStep = (s) => { const e = {}; if (s === 0) { if (!fn.trim()) e.fn = 1; if (!ln.trim()) e.ln = 1; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim())) e.em = 1; if (att === "yes" && hasCo) { if (!coFn.trim()) e.coFn = 1; if (!coLn.trim()) e.coLn = 1; } if (att === "yes" && hasCh) kids.forEach((c, i) => { if (!c.name.trim()) e["cn" + i] = 1; if (!c.age.toString().trim()) e["ca" + i] = 1; }); } setErrs(e); return !Object.keys(e).length; };
  const goNext = () => { if (validateStep(step)) setStep(Math.min(step + 1, totalSteps - 1)); };
  const goPrev = () => setStep(Math.max(step - 1, 0));

  const genAi = useCallback(async (entry) => {
    setAiLoad(true); setAiMsg("");
    const names = [entry.firstName]; if (entry.companion) names.push(entry.companion.firstName);
    const isY = entry.attendance === "yes";
    const p = isY ? `Écris un court message (2-3 phrases) de la part de Manon et Sebastian qui sont heureux de compter ${names.join(" et ")} parmi leurs invités pour leur mariage du 12/09/2026. ${entry.message ? `L'invité a laissé ce mot: "${entry.message}". Fais-y référence.` : ""} Chaleureux et personnel. ${lang === "en" ? "En anglais." : "En français."} Sans guillemets.`
      : `Écris un court message (2 phrases) de la part de Manon et Sebastian qui sont touchés que ${entry.firstName} ait pris le temps de répondre même s'il/elle ne peut pas venir. Bienveillant. ${lang === "en" ? "En anglais." : "En français."} Sans guillemets.`;
    try { const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: p }] }) }); const d = await r.json(); setAiMsg(d.content?.map(c => c.text || "").join("") || "Merci !"); } catch (e) { setAiMsg("Merci !"); }
    setAiLoad(false);
  }, [lang]);

  const doSubmit = async () => {
    setSubmitting(true);
    const totalBf = (accom === "fri-sun" ? bfSat + bfSun : accom === "sat-sun" ? bfSun : 0);
    const entry = { id: Date.now(), firstName: fn.trim(), lastName: ln.trim(), email: em.trim(), phone: phoneCode + phone.trim(), address: { street: addr.trim(), city: city.trim(), zip: zip.trim(), country: country.trim() }, attendance: att,
      diet: att === "yes" ? di : [], dietOt: di.includes("autre") ? diOt.trim() : "", alcohol: att === "yes" ? alc : [],
      message: att === "yes" ? msg.trim() : "",
      menu: att === "yes" ? { type: getMenuType(di, diOt), choices: menuCh } : null,
      companion: att === "yes" && hasCo ? { firstName: coFn.trim(), lastName: coLn.trim(), diet: coDi, dietOt: coDi.includes("autre") ? coDiOt.trim() : "", alcohol: coAlc, menu: { type: getMenuType(coDi, coDiOt), choices: coMenuCh } } : null,
      children: att === "yes" && hasCh ? kids.map(c => ({ name: c.name.trim(), age: parseInt(c.age), diet: Array.isArray(c.diet) ? c.diet : [c.diet], dietOt: (c.dietOt || "").trim(), allergy: (c.allergy || "").trim() })) : [],
      accom: att === "yes" ? accom : "none", roomSize: att === "yes" && accom !== "none" ? roomSize : null,
      accomPrice: att === "yes" && accom !== "none" ? (roomSize === "3" ? 180 : 150) : 0,
      bfSat: accom === "fri-sun" ? bfSat : 0, bfSun: accom !== "none" ? bfSun : 0, bfTotal: totalBf, bfPrice: totalBf * 8,
      bbq: att === "yes" ? bbq : "", date: new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB") };
    save([...rsvps, entry]); setLast(entry); setView("success");
    await Promise.all([sendEmailJS(entry, lang), genAi(entry)]); setSubmitting(false);
  };

  const reset = () => { setFn(""); setLn(""); setEm(""); setPhone(""); setPhoneCode("+33"); setAddr(""); setCity(""); setZip(""); setCountry("France"); setDi(["standard"]); setDiOt(""); setAlc([]); setMsg(""); setMenuCh({ entree: "A", plat: "A", garniture: "A" }); setCoMenuCh({ entree: "A", plat: "A", garniture: "A" }); setHasCo(false); setCoFn(""); setCoLn(""); setCoDi(["standard"]); setCoDiOt(""); setCoAlc([]); setHasCh(false); setKids([mkKid()]); setAccom("none"); setRoomSize("12"); setBfSat(0); setBfSun(0); setBbq(""); setAtt("yes"); setStep(0); setErrs({}); setAiMsg(""); setView("form"); setSubmitting(false); };
  const updateKid = useCallback((i, f, v) => { setKids(prev => { const c = [...prev]; c[i] = { ...c[i], [f]: v }; return c; }); }, []);
  const removeKid = useCallback(i => setKids(prev => prev.length > 1 ? prev.filter((_, j) => j !== i) : prev), []);
  const addKid = useCallback(() => setKids(prev => [...prev, mkKid()]), []);

  const dl = (d) => { if (!d?.length) return ""; return (Array.isArray(d) ? d : [d]).filter(x => x !== "standard").map(x => t.diets[x] || x).join(", "); };

  const NavBtns = ({ showSend }) => <div style={{ display: "flex", gap: "10px", marginTop: "28px" }}>
    {step > 0 && <button onClick={goPrev} style={{ ...st.btnSec, flex: 1 }}>{t.prev}</button>}
    {!showSend && <button onClick={goNext} style={{ ...st.btnPri, flex: 2 }}>{t.next} →</button>}
    {showSend && <button onClick={doSubmit} disabled={submitting} style={{ ...st.btnPri, flex: 2, opacity: submitting ? .6 : 1 }}>{submitting ? t.sending : t.send}</button>}
  </div>;

  const Footer = () => <div style={{ maxWidth: "520px", margin: "0 auto", padding: "20px 20px 16px", textAlign: "center" }}>
    <div style={{ background: "rgba(200,169,46,.08)", borderRadius: "14px", padding: "16px 20px", marginBottom: "20px", border: "1px solid rgba(200,169,46,.15)" }}>
      <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>{t.cagnotteT}</div>
      <div style={{ fontSize: "13px", color: "#6a5a20", lineHeight: 1.5, marginBottom: "10px" }}>{t.cagnotteD}</div>
      {CAGNOTTE_URL ? <a href={CAGNOTTE_URL} target="_blank" style={{ display: "inline-block", padding: "10px 24px", background: "linear-gradient(135deg, #c8a92e, #daba40)", color: "#fff", borderRadius: "22px", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>{t.cagnotteBtn}</a> : <div style={{ fontSize: "12px", color: "#aaa", fontStyle: "italic" }}>{t.cagnotteSoon}</div>}
    </div>
    <div style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#0d9a5f", fontWeight: 700, marginBottom: "10px" }}>{t.gpsT}</div>
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center", marginBottom: "30px" }}>
      <span style={{ fontSize: "13px", color: "#2a5a30" }}>🏛 {t.city} — <a href={MAIRIE.maps} target="_blank">Maps</a> · <a href={MAIRIE.waze} target="_blank">Waze</a></span>
      <span style={{ fontSize: "13px", color: "#2a5a30" }}>🏡 {t.venue} — <a href={MOULIN.maps} target="_blank">Maps</a> · <a href={MOULIN.waze} target="_blank">Waze</a></span>
    </div>
  </div>;

  /* ═══ FORM ═══ */
  if (view === "form") return (
    <div style={st.root}><style>{CSS}</style><div ref={topRef} />
      <div style={st.langBar}><button style={st.langBtn(lang === "fr")} onClick={() => setLang("fr")}>FR</button><span style={{ color: "rgba(13,154,95,.2)" }}>|</span><button style={st.langBtn(lang === "en")} onClick={() => setLang("en")}>EN</button></div>
      <div style={st.hero}><div style={st.heroBg} /><div style={{ position: "relative", zIndex: 1 }}>
        {/* Photo bannière — image dans public/moulin.jpg */}
        <img src={MOULIN_IMG} alt="Moulin de Pommeuse" style={{ width: "100%", maxWidth: "520px", height: "180px", objectFit: "cover", borderRadius: "18px", margin: "0 auto 16px", display: "block", border: "2px solid rgba(255,255,255,.5)", boxShadow: "0 8px 24px rgba(0,0,0,.08)" }} onError={(e) => { e.target.style.display = "none"; }} />
        <div style={st.namesLine}>Manon <span style={st.ampI}>&</span> Sebastian</div>
        <Countdown lang={lang} />
        <a href={CAL_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", fontSize: "12px", color: "#2a5a30", background: "rgba(13,154,95,.08)", padding: "7px 18px", borderRadius: "22px", fontWeight: 500, textDecoration: "none" }}>📅 {t.date} — {t.saveD}</a>
        {/* Deadline */}
        <div style={{ marginTop: "12px", fontSize: "12px", color: isExpired ? "#d44" : "#c8a92e", fontWeight: 600, fontStyle: "italic" }}>⏰ {t.deadlineMsg}</div>
      </div></div>

      {/* Timeline */}
      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "20px 16px 8px" }}>
        <div style={{ fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase", color: "#0d9a5f", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}>{t.timelineT}</div>
        <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
          <div style={{ position: "absolute", top: "18px", left: "16px", right: "16px", height: "2px", background: "linear-gradient(90deg, #0d9a5f, #c8a92e)", opacity: .15 }} />
          {t.tl.map((item, i) => <div key={i} style={{ textAlign: "center", position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "24px", width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.8)", border: "1.5px solid rgba(13,154,95,.12)", margin: "0 auto 6px" }}>{item.icon}</div>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#0d9a5f" }}>{item.time}</div>
            <div style={{ fontSize: "10px", color: "#3a5a38", marginTop: "2px" }}>{item.label}</div>
          </div>)}
        </div>
      </div>

      {/* Wizard */}
      {!isExpired ? <div style={st.form}>
        <ProgressBar step={step} total={totalSteps} />
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#6a8a60", fontWeight: 600 }}>{lang === "fr" ? "Étape" : "Step"} {step + 1}/{totalSteps}</div>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "24px", fontStyle: "italic", color: "#1a2a18", marginTop: "4px" }}>{stepNames[step]}</div>
        </div>
        <div key={step} className="fu">
          {step === 0 && <>
            <div style={{ marginBottom: "20px" }}><label style={st.lbl}>{t.att}</label><div style={st.togWrap}><button style={st.tog(att === "yes", "yes")} onClick={() => setAtt("yes")}>{t.yes}</button><button style={st.tog(att === "no", "no")} onClick={() => setAtt("no")}>{t.no}</button></div></div>
            <div style={st.card}><div style={st.row2}><div><label style={st.lbl}>{t.fn}</label><input style={st.inp} value={fn} onChange={e => setFn(e.target.value)} /><Err show={errs.fn} text={t.req} /></div><div><label style={st.lbl}>{t.ln}</label><input style={st.inp} value={ln} onChange={e => setLn(e.target.value)} /><Err show={errs.ln} text={t.req} /></div></div><div style={{ marginTop: "14px" }}><label style={st.lbl}>{t.email}</label><input style={st.inp} type="email" value={em} onChange={e => setEm(e.target.value)} /><Err show={errs.em} text={t.badE} /></div>
              <div style={{ marginTop: "14px" }}><label style={st.lbl}>{t.phone}</label><div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}><select value={phoneCode} onChange={e => setPhoneCode(e.target.value)} style={{ border: "none", borderBottom: "2px solid rgba(13,154,95,.15)", background: "transparent", padding: "10px 0", fontFamily: "'DM Sans'", fontSize: "14px", color: "#1a2a18", outline: "none", borderRadius: 0, width: "90px", cursor: "pointer" }}>{PHONE_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}</select><input style={{ ...st.inp, flex: 1 }} type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ""))} placeholder="6 12 34 56 78" /></div></div>
              <div style={{ marginTop: "14px" }}><label style={st.lbl}>{t.addrL}</label><input style={st.inp} value={addr} onChange={e => setAddr(e.target.value)} placeholder="12 rue de la Paix" /></div>
              <div style={{ marginTop: "14px", display: "flex", gap: "12px" }}><div style={{ flex: 2 }}><label style={st.lbl}>{t.cityL}</label><input style={st.inp} value={city} onChange={e => setCity(e.target.value)} /></div><div style={{ flex: 1 }}><label style={st.lbl}>{t.zipL}</label><input style={st.inp} value={zip} onChange={e => setZip(e.target.value)} /></div></div>
              <div style={{ marginTop: "14px" }}><label style={st.lbl}>{t.countryL}</label><input style={st.inp} value={country} onChange={e => setCountry(e.target.value)} /></div>{att === "yes" && <div style={{ marginTop: "16px" }}><label style={st.lbl}>{t.diet}</label><DietMultiSelect value={di} onChange={setDi} otVal={diOt} onOtChange={setDiOt} errOt={errs.diOt} t={t} /></div>}</div>
            {att === "yes" && <><div style={{ marginBottom: "16px" }}><label style={st.lbl}>{t.compQ}</label><div style={st.togWrap}><button style={st.tog(hasCo, "yes")} onClick={() => setHasCo(true)}>{t.oui}</button><button style={st.tog(!hasCo, "no")} onClick={() => setHasCo(false)}>{t.non}</button></div></div>{hasCo && <div style={st.card}><div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "16px", fontStyle: "italic", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>♡ {t.compT}</div><div style={st.row2}><div><label style={st.lbl}>{t.fn}</label><input style={st.inp} value={coFn} onChange={e => setCoFn(e.target.value)} /><Err show={errs.coFn} text={t.req} /></div><div><label style={st.lbl}>{t.ln}</label><input style={st.inp} value={coLn} onChange={e => setCoLn(e.target.value)} /><Err show={errs.coLn} text={t.req} /></div></div><div style={{ marginTop: "14px" }}><label style={st.lbl}>{t.diet}</label><DietMultiSelect value={coDi} onChange={setCoDi} otVal={coDiOt} onOtChange={setCoDiOt} t={t} /></div></div>}<div style={{ marginBottom: "16px" }}><label style={st.lbl}>{t.childQ}</label><div style={st.togWrap}><button style={st.tog(hasCh, "yes")} onClick={() => setHasCh(true)}>{t.oui}</button><button style={st.tog(!hasCh, "no")} onClick={() => setHasCh(false)}>{t.non}</button></div></div>{hasCh && <>{kids.map((kid, i) => <div key={kid.id} style={st.card}><div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "16px", fontStyle: "italic", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>★ {t.childT} {i + 1}</div><div style={st.row2}><div><label style={st.lbl}>{t.childN}</label><input style={st.inp} value={kid.name} onChange={e => updateKid(i, "name", e.target.value)} /><Err show={errs["cn" + i]} text={t.req} /></div><div><label style={st.lbl}>{t.childA}</label><input style={st.inp} type="number" min="0" max="17" value={kid.age} onChange={e => updateKid(i, "age", e.target.value)} /><Err show={errs["ca" + i]} text={t.req} /></div></div><div style={{ marginTop: "12px" }}><label style={st.lbl}>{t.diet}</label><DietMultiSelect value={Array.isArray(kid.diet) ? kid.diet : [kid.diet || "standard"]} onChange={v => updateKid(i, "diet", v)} otVal={kid.dietOt || ""} onOtChange={v => updateKid(i, "dietOt", v)} t={t} /></div>{kids.length > 1 && <div style={{ textAlign: "right", marginTop: "8px" }}><button style={st.rmBtn} onClick={() => removeKid(i)}>{t.rmChild} ✗</button></div>}</div>)}<button style={st.addBtn} onClick={addKid}>{t.addChild}</button><div style={{ background: "rgba(200,169,46,.08)", borderRadius: "12px", padding: "10px 14px", fontSize: "12px", color: "#6a5a20", lineHeight: 1.6, marginBottom: "16px" }}>👶 {t.childMenuNote}</div></>}</>}
            {att === "no" && <div style={{ marginTop: "16px" }}><label style={st.lbl}>{t.msgL}</label><textarea style={st.ta} value={msg} onChange={e => setMsg(e.target.value)} placeholder={t.msgPh} /></div>}
            <NavBtns showSend={att === "no" && step === totalSteps - 1} />
          </>}
          {step === 1 && att === "yes" && <><MenuDisplay lang={lang} diets={di} dietOt={diOt} personName={fn || t.fn} t={t} choices={menuCh} onChoice={setMenuCh} />{hasCo && <MenuDisplay lang={lang} diets={coDi} dietOt={coDiOt} personName={coFn || t.compT} t={t} choices={coMenuCh} onChoice={setCoMenuCh} />}{hasCh && kids.map((kid, i) => <div key={kid.id} style={{ ...st.card, borderLeft: "3px solid #c8a92e", marginBottom: "16px" }}><div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "18px", fontStyle: "italic", marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>🍽 {t.mFor} {kid.name || `${t.childT} ${i + 1}`}</div><div style={{ background: "rgba(200,169,46,.08)", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#6a5a20", lineHeight: 1.6 }}>👶 {t.childMenuSoon}</div></div>)}<div style={{ marginTop: "8px" }}><label style={st.lbl}>{t.alcQ}</label><div style={{ fontSize: "12px", color: "#6a8a60", fontStyle: "italic", marginBottom: "4px" }}>{t.alcH}</div><AlcoholSelect value={alc} onChange={setAlc} t={t} /></div>{hasCo && <div style={{ marginTop: "14px" }}><label style={st.lbl}>{t.alcQ} ({coFn || t.compT})</label><AlcoholSelect value={coAlc} onChange={setCoAlc} t={t} /></div>}<NavBtns /></>}
          {step === 2 && att === "yes" && <><div style={st.card}><div style={{ fontSize: "13px", color: "#3a5a38", marginBottom: "10px", lineHeight: 1.6 }}>{t.acD}</div><div style={{ fontSize: "11px", color: "#8a7a20", fontStyle: "italic", marginBottom: "12px", background: "rgba(200,169,46,.08)", padding: "6px 12px", borderRadius: "8px", textAlign: "center" }}>⚠️ {t.acAvail}</div>{[{ v: "none", l: t.acN, ic: "🚗" }, { v: "fri-sun", l: t.acFS, ic: "🌙🌙" }, { v: "sat-sun", l: t.acSS, ic: "🌙" }].map(o => <label key={o.v} style={st.radio(accom === o.v)} onClick={() => setAccom(o.v)}><div style={st.rCirc(accom === o.v)} /><span style={{ flex: 1 }}>{o.l}</span><span>{o.ic}</span></label>)}{accom !== "none" && <div className="fu" style={{ marginTop: "18px" }}><div style={{ display: "flex", gap: "10px" }}>{[["12", "👤", t.rm12, t.pr12], ["3", "👥", t.rm3, t.pr3]].map(([v, ic, lab, pr]) => <button key={v} onClick={() => setRoomSize(v)} style={{ flex: 1, padding: "14px 8px", borderRadius: "14px", cursor: "pointer", textAlign: "center", border: roomSize === v ? "2px solid #0d9a5f" : "1.5px solid rgba(0,0,0,.06)", background: roomSize === v ? "rgba(13,154,95,.07)" : "rgba(255,255,255,.5)", fontFamily: "'DM Sans'" }}><div style={{ fontSize: "24px" }}>{ic}</div><div style={{ fontSize: "12px", fontWeight: roomSize === v ? 600 : 400 }}>{lab}</div><div style={{ fontSize: "16px", fontWeight: 700, color: "#0d9a5f", marginTop: "4px" }}>{pr}</div><div style={{ fontSize: "10px", color: "#6a7a60" }}>{t.prR}</div></button>)}</div><div style={{ marginTop: "16px", background: "rgba(255,255,255,.6)", borderRadius: "14px", padding: "14px 16px", border: "1px solid rgba(13,154,95,.1)" }}><div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span>🥐</span><span style={{ fontWeight: 600 }}>{t.bfT}</span><span style={{ fontSize: "12px", color: "#0d9a5f", fontWeight: 600, marginLeft: "auto" }}>{t.bfP}</span></div>{accom === "fri-sun" && <BfCounter label={t.bfSat} count={bfSat} setCount={setBfSat} />}<BfCounter label={t.bfSun} count={bfSun} setCount={setBfSun} />{(bfSat + bfSun) > 0 && <div style={{ textAlign: "right", fontSize: "14px", color: "#0d9a5f", fontWeight: 700, paddingTop: "6px", borderTop: "1px solid rgba(13,154,95,.08)" }}>Total : {(bfSat + bfSun) * 8} €</div>}</div><div style={{ marginTop: "12px", background: "linear-gradient(135deg, rgba(13,154,95,.05), rgba(46,140,180,.05))", borderRadius: "14px", padding: "14px 16px" }}><div style={{ fontWeight: 600 }}>{t.poolT}</div><div style={{ fontSize: "13px", color: "#2a6a40", marginTop: "4px", lineHeight: 1.6 }}>{t.poolD}</div></div></div>}</div>
          {/* BBQ for everyone */}
          <div style={{ marginTop: "16px", background: "rgba(200,100,30,.05)", borderRadius: "14px", padding: "14px 16px", border: "1px solid rgba(200,100,30,.1)" }}><div style={{ fontWeight: 600, marginBottom: "4px" }}>{t.bbqT}</div><div style={{ fontSize: "13px", color: "#6a4a30", lineHeight: 1.6, marginBottom: "10px" }}>{t.bbqD}</div><div style={st.togWrap}><button style={st.tog(bbq === "yes", "yes")} onClick={() => setBbq("yes")}>{t.bbqY}</button><button style={st.tog(bbq === "no", "no")} onClick={() => setBbq("no")}>{t.bbqN}</button></div></div>
          <div style={{ marginTop: "12px" }}><label style={st.lbl}>{t.msgL}</label><textarea style={st.ta} value={msg} onChange={e => setMsg(e.target.value)} placeholder={t.msgPh} /></div><NavBtns /></>}
          {step === 3 && att === "yes" && <><div style={{ fontSize: "13px", color: "#5a6a50", textAlign: "center", marginBottom: "20px" }}>{t.recapD}</div><div style={st.card}>{[["👤", `${fn} ${ln}`, dl(di)], hasCo && ["♡", `${coFn} ${coLn}`, dl(coDi)], ...(hasCh ? kids.map(k => ["★", `${k.name} (${k.age} ${t.yrs})`, dl(Array.isArray(k.diet) ? k.diet : [k.diet])]) : []), ["🍷", t.alcQ, (alc.length && !alc.includes("none")) ? alc.map(a => t.alc[a] || a).join(", ") : t.alcNon], ["🏡", t.acT, accom === "none" ? t.acN : (accom === "fri-sun" ? t.acFS : t.acSS) + ` (${roomSize === "3" ? t.pr3 : t.pr12})`], (bfSat + bfSun) > 0 && ["🥐", t.bfT, `${bfSat > 0 ? (lang === "fr" ? "Sam" : "Sat") + ": " + bfSat + " pers." : ""}${bfSat > 0 && bfSun > 0 ? " · " : ""}${bfSun > 0 ? (lang === "fr" ? "Dim" : "Sun") + ": " + bfSun + " pers." : ""} = ${(bfSat + bfSun) * 8} €`], bbq === "yes" && ["🔥", "BBQ", "✓"], msg && ["💌", t.msgL, msg]].filter(Boolean).map(([ic, label, detail], i) => <div key={i} style={{ display: "flex", gap: "12px", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,.04)", alignItems: "flex-start" }}><span style={{ fontSize: "18px", width: "28px", textAlign: "center", flexShrink: 0 }}>{ic}</span><div><div style={{ fontSize: "14px", fontWeight: 600 }}>{label}</div>{detail && <div style={{ fontSize: "12px", color: "#5a6a50", marginTop: "2px" }}>{detail}</div>}</div></div>)}</div><NavBtns showSend /></>}
          {step === 1 && att === "no" && <><div style={{ textAlign: "center", padding: "20px 0" }}><div style={{ fontSize: "40px", marginBottom: "12px" }}>💌</div><div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "20px", fontStyle: "italic", marginBottom: "16px" }}>{fn}, {lang === "fr" ? "confirmez-vous ne pas pouvoir venir ?" : "do you confirm you can't make it?"}</div>{msg && <div style={{ background: "rgba(0,0,0,.03)", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", fontStyle: "italic", color: "#4a5a48" }}>« {msg} »</div>}</div><NavBtns showSend /></>}
        </div>
      </div> : <div style={{ textAlign: "center", padding: "40px 20px" }}><div style={{ fontSize: "32px", marginBottom: "12px" }}>⏰</div><div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "22px", fontStyle: "italic", color: "#d44" }}>{t.deadlineMsg}</div></div>}
      <Footer />
      <FAQSection lang={lang} t={t} />
    </div>
  );

  /* ═══ SUCCESS ═══ */
  return (
    <div style={st.root}><style>{CSS}</style><div ref={topRef} />
      <div style={st.hero}><div style={st.heroBg} /><div style={{ position: "relative", zIndex: 1 }}><div style={st.namesLine}>Manon <span style={st.ampI}>&</span> Sebastian</div></div></div>
      <div className="fu" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
        <div style={{ fontSize: "48px", marginBottom: "1rem", animation: "pulse 2s ease infinite" }}>{last?.attendance === "yes" ? "💚" : "💌"}</div>
        <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "30px", fontStyle: "italic", marginBottom: "12px" }}>{last?.attendance === "yes" ? t.sucYT : t.sucNT}</div>
        <p style={{ color: "#3a5a38", fontSize: "15px", lineHeight: 1.8, whiteSpace: "pre-line" }}>{last?.attendance === "yes" ? t.sucYS : t.sucNS}</p>
        <div style={{ fontSize: "12px", color: "#6a8a60", marginTop: "12px" }}>📧 {t.emailSentTo} {last?.email}</div>
        <div style={{ margin: "2rem auto", maxWidth: "440px", background: "rgba(255,255,255,.6)", borderRadius: "18px", padding: "20px 24px", border: "1.5px solid rgba(200,169,46,.2)" }}>
          <div style={{ fontSize: "10px", letterSpacing: "2.5px", textTransform: "uppercase", color: "#c8a92e", marginBottom: "8px", fontWeight: 700 }}>{t.aiLbl}</div>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "17px", fontStyle: "italic", color: "#1a3a18", lineHeight: 1.8 }}>{aiLoad ? "✨" : aiMsg}</div>
        </div>
        <button style={{ ...st.btnPri, maxWidth: "280px", margin: "0 auto" }} onClick={reset}>{t.newR}</button>
      </div>
      <Footer />
    </div>
  );
}

/* ═══ STYLES ═══ */
const st = {
  root: { fontFamily: "'DM Sans',sans-serif", fontWeight: 400, color: "#1a2a18", minHeight: "100vh", background: "#f0f4ed" },
  langBar: { display: "flex", justifyContent: "flex-end", padding: "14px 20px 0", gap: "6px", alignItems: "center" },
  langBtn: a => ({ background: "none", border: "none", fontFamily: "'DM Sans'", fontSize: "12px", letterSpacing: "2px", color: a ? "#1a2a18" : "#8a9a80", cursor: "pointer", fontWeight: a ? 700 : 400 }),
  hero: { textAlign: "center", padding: "2rem 2rem 1.5rem", position: "relative", overflow: "hidden" },
  heroBg: { position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 30%, rgba(13,154,95,.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(200,169,46,.08) 0%, transparent 50%)", pointerEvents: "none" },
  namesLine: { fontFamily: "'Cormorant Garamond'", fontSize: "44px", fontWeight: 400, fontStyle: "italic", color: "#1a2a18", lineHeight: 1.2, letterSpacing: "2px" },
  ampI: { color: "#c8a92e", fontStyle: "normal", fontWeight: 500, margin: "0 6px", fontSize: "36px" },
  form: { maxWidth: "520px", margin: "0 auto", padding: "0 1.5rem 2rem" },
  lbl: { display: "block", fontSize: "10px", letterSpacing: "2.5px", textTransform: "uppercase", color: "#4a6a40", marginBottom: "5px", fontWeight: 600 },
  inp: { width: "100%", border: "none", borderBottom: "2px solid rgba(13,154,95,.15)", background: "transparent", padding: "10px 0", fontFamily: "'DM Sans'", fontSize: "15px", fontWeight: 400, color: "#1a2a18", outline: "none", borderRadius: 0 },
  ta: { width: "100%", border: "2px solid rgba(13,154,95,.1)", background: "rgba(255,255,255,.5)", padding: "12px 14px", fontFamily: "'DM Sans'", fontSize: "15px", fontWeight: 400, color: "#1a2a18", outline: "none", borderRadius: "14px", resize: "none", height: "80px" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  togWrap: { display: "flex", border: "2px solid rgba(13,154,95,.12)", borderRadius: "14px", overflow: "hidden", marginTop: "6px", background: "rgba(255,255,255,.4)" },
  tog: (a, type) => ({ flex: 1, padding: "13px 10px", border: "none", borderRight: type === "yes" ? "1px solid rgba(13,154,95,.08)" : "none", background: a ? (type === "yes" ? "rgba(13,154,95,.1)" : "rgba(0,0,0,.03)") : "transparent", fontFamily: "'DM Sans'", fontSize: "13px", color: a ? (type === "yes" ? "#087a4a" : "#4a5a48") : "#8a9a80", cursor: "pointer", fontWeight: a ? 700 : 300 }),
  card: { marginBottom: "16px", border: "1.5px solid rgba(13,154,95,.08)", borderRadius: "18px", padding: "20px", background: "rgba(255,255,255,.55)" },
  addBtn: { width: "100%", padding: "12px", background: "transparent", border: "2px dashed rgba(13,154,95,.18)", borderRadius: "14px", color: "#0d9a5f", fontFamily: "'DM Sans'", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginBottom: "16px" },
  rmBtn: { background: "none", border: "none", color: "#8a9a80", fontSize: "11px", cursor: "pointer", fontFamily: "'DM Sans'", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 500 },
  radio: c => ({ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", background: c ? "rgba(13,154,95,.06)" : "transparent", border: c ? "2px solid #0d9a5f" : "1.5px solid rgba(0,0,0,.04)", borderRadius: "14px", cursor: "pointer", fontSize: "14px", color: "#1a2a18", fontWeight: c ? 500 : 300, marginBottom: "6px" }),
  rCirc: c => ({ width: "16px", height: "16px", borderRadius: "50%", border: c ? "5px solid #0d9a5f" : "2px solid #a0b098", background: "#fff", flexShrink: 0 }),
  cBtn: { width: "36px", height: "36px", borderRadius: "50%", border: "2px solid rgba(13,154,95,.18)", background: "rgba(255,255,255,.7)", color: "#0d9a5f", fontSize: "18px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans'" },
  btnPri: { padding: "14px 20px", background: "linear-gradient(135deg, #087a4a, #0d9a5f)", color: "#fff", border: "none", fontFamily: "'DM Sans'", fontSize: "12px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer", borderRadius: "14px", boxShadow: "0 4px 20px rgba(13,154,95,.25)" },
  btnSec: { padding: "14px 20px", background: "rgba(255,255,255,.6)", color: "#4a6a40", border: "1.5px solid rgba(13,154,95,.15)", fontFamily: "'DM Sans'", fontSize: "12px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", borderRadius: "14px" },
};
