import { useState, useEffect, useCallback, useRef } from "react";

/* ═══ SUPABASE ═══ */
const SUPABASE_URL = "https://xhivzavhvufqohoywrnh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaXZ6YXZodnVmcW9ob3l3dG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3ODU1MjYsImV4cCI6MjA5NDM2MTUyNn0.LovjKXAyXpv6Sf8ObCpvXFr8AvGbcnzSDYe-_n8hcrc";
const sbHeaders = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" };
const sbFetch = async (table, method, body, query) => {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query || ""}`;
  const opts = { method, headers: { ...sbHeaders, ...(method === "GET" ? {} : { "Prefer": "return=minimal" }) } };
  if (body) opts.body = JSON.stringify(body);
  try { const r = await fetch(url, opts); if (method === "GET") return await r.json(); return r.ok; } catch (e) { console.error("Supabase error:", e); return method === "GET" ? [] : false; }
};
const loadRsvps = async () => { const rows = await sbFetch("rsvps", "GET", null, "?order=id.asc"); return rows.map(r => r.données || r.data); };
const saveRsvp = async (entry) => { await sbFetch("rsvps", "POST", { id: entry.id, "données": entry }); };
const deleteRsvpDb = async (id) => { await sbFetch("rsvps", "DELETE", null, `?id=eq.${id}`); };
const loadPayments = async () => { const rows = await sbFetch("payment_tracking", "GET", null, "?id=eq.main"); return rows[0] || { paid_rooms: {}, paid_bf: {} }; };
const savePayments = async (paidRooms, paidBf) => { await sbFetch("payment_tracking", "PATCH", { paid_rooms: paidRooms, paid_bf: paidBf }, "?id=eq.main"); };

/* ═══ CONFIG ═══ */
const CAGNOTTE_URL = "";
const MOULIN_IMG = "";
const RSVP_DEADLINE = "2026-06-15";

/* ═══ MENUS — automatiques selon régime ═══ */
const MENU_BY_DIET = {
  standard: {
    entree: { fr: "Raviole au foie gras, artichaut, crème de truffes", en: "Foie gras ravioli, artichoke, truffle cream", emoji: "🥟" },
    plat: { fr: "Magret de canard, sauce framboise et framboises fraîches", en: "Duck breast, raspberry sauce, fresh raspberries", emoji: "🦆" },
    garniture: { fr: "Écrasé de pommes de terre à la truffe", en: "Truffle mashed potatoes", emoji: "🥔" },
    dessert: { fr: "Pièce montée & gâteau", en: "Wedding cake", emoji: "🎂" },
  },
  sansgluten: {
    entree: { fr: "Tomate cœur de bœuf confite au four, huile d'olive, burrata sur lit de roquette", en: "Oven-roasted beef heart tomato, olive oil, burrata on rocket", emoji: "🍅" },
    plat: { fr: "Magret de canard, sauce framboise et framboises fraîches", en: "Duck breast, raspberry sauce, fresh raspberries", emoji: "🦆" },
    garniture: { fr: "Écrasé de pommes de terre à la truffe", en: "Truffle mashed potatoes", emoji: "🥔" },
    dessert: { fr: "Brochettes de fruits frais", en: "Fresh fruit skewers", emoji: "🍡" },
  },
  pescetarien: {
    entree: { fr: "Tomate cœur de bœuf confite au four, huile d'olive, burrata sur lit de roquette", en: "Oven-roasted beef heart tomato, olive oil, burrata on rocket", emoji: "🍅" },
    plat: { fr: "Filet de bar sur sa feuille de bananier et son beurre blanc", en: "Sea bass fillet on banana leaf with white butter sauce", emoji: "🐟" },
    garniture: { fr: "Risotto parmesan", en: "Parmesan risotto", emoji: "🍚" },
    dessert: { fr: "Pièce montée & gâteau", en: "Wedding cake", emoji: "🎂" },
  },
  vegetarien: {
    entree: { fr: "Tomate cœur de bœuf confite au four, huile d'olive, burrata sur lit de roquette", en: "Oven-roasted beef heart tomato, olive oil, burrata on rocket", emoji: "🍅" },
    plat: { fr: "Dahl de lentilles corail au lait de coco, coriandre fraîche, noix de cajou", en: "Coral lentil dahl with coconut milk, fresh coriander, cashew nuts", emoji: "🥘" },
    garniture: { fr: "Risotto parmesan", en: "Parmesan risotto", emoji: "🍚" },
    dessert: { fr: "Pièce montée & gâteau", en: "Wedding cake", emoji: "🎂" },
  },
  vegan: {
    entree: { fr: "Tomate cœur de bœuf confite au four, huile d'olive, sur lit de roquette (sans burrata)", en: "Oven-roasted beef heart tomato, olive oil, on rocket (no burrata)", emoji: "🍅" },
    plat: { fr: "Dahl de lentilles corail au lait de coco, coriandre fraîche, noix de cajou", en: "Coral lentil dahl with coconut milk, fresh coriander, cashew nuts", emoji: "🥘" },
    garniture: { fr: "Risotto (sans parmesan)", en: "Risotto (no parmesan)", emoji: "🍚" },
    dessert: { fr: "Brochettes de fruits frais", en: "Fresh fruit skewers", emoji: "🍡" },
  },
  halal: {
    entree: { fr: "Tomate cœur de bœuf confite au four, huile d'olive, burrata sur lit de roquette", en: "Oven-roasted beef heart tomato, olive oil, burrata on rocket", emoji: "🍅" },
    plat: { fr: "Filet de bar sur sa feuille de bananier et son beurre blanc", en: "Sea bass fillet on banana leaf with white butter sauce", emoji: "🐟" },
    garniture: { fr: "Écrasé de pommes de terre à la truffe", en: "Truffle mashed potatoes", emoji: "🥔" },
    dessert: { fr: "Pièce montée & gâteau", en: "Wedding cake", emoji: "🎂" },
  },
  lactose: {
    entree: { fr: "Tomate cœur de bœuf confite au four, huile d'olive, sur lit de roquette (sans burrata)", en: "Oven-roasted beef heart tomato, olive oil, on rocket (no burrata)", emoji: "🍅" },
    plat: { fr: "Magret de canard, sauce framboise et framboises fraîches et petits légumes", en: "Duck breast, raspberry sauce, fresh raspberries and vegetables", emoji: "🦆" },
    garniture: { fr: "Petits légumes de saison", en: "Seasonal vegetables", emoji: "🥕" },
    dessert: { fr: "Brochettes de fruits frais", en: "Fresh fruit skewers", emoji: "🍡" },
  },
  noix: {
    entree: { fr: "Raviole au foie gras, artichaut, crème de truffes", en: "Foie gras ravioli, artichoke, truffle cream", emoji: "🥟" },
    plat: { fr: "Magret de canard, sauce framboise et framboises fraîches", en: "Duck breast, raspberry sauce, fresh raspberries", emoji: "🦆" },
    garniture: { fr: "Écrasé de pommes de terre à la truffe", en: "Truffle mashed potatoes", emoji: "🥔" },
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
    fn: "Prénom", ln: "Nom", email: "E-mail", phone: "Téléphone", diet: "Régime alimentaire", dietOther: "Précisez", dietOtherPh: "Allergies, intolérances...", dietHint: "Plusieurs choix possibles",
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
    deadlineMsg: "Merci de confirmer avant le 15 juin 2026",
    faqT: "Questions fréquentes",
    exportBtn: "📥 Exporter CSV", mealCountT: "Compteur plats",
    loveT: "Notre histoire", loveSoon: "À venir...",
    tableT: "Plan de table", tableSoon: "Sera communiqué prochainement.",
    emailSentTo: "Un récapitulatif a été envoyé à",
  },
  en: {
    sub: "Please confirm your attendance", intro: "We would be honoured by your presence.",
    att: "Attendance", yes: "I'll be there ✓", no: "I can't make it",
    fn: "First name", ln: "Last name", email: "Email", phone: "Phone", diet: "Dietary requirements", dietOther: "Specify", dietOtherPh: "Allergies, intolerances...", dietHint: "Multiple choices allowed",
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
    deadlineMsg: "Please confirm before June 15, 2026",
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
function MenuDisplay({ lang, diets, dietOt, personName, t }) {
  const menu = getMenuForDiet(diets, dietOt); const mt = getMenuType(diets, dietOt); const adapted = mt !== "standard";
  const Item = ({ label, item }) => <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "rgba(13,154,95,.05)", border: "1.5px solid rgba(13,154,95,.1)", borderRadius: "14px", marginBottom: "8px" }}>
    <span style={{ fontSize: "22px", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(13,154,95,.08)", flexShrink: 0 }}>{item.emoji}</span>
    <div><div style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "#6a8a60", fontWeight: 600, marginBottom: "2px" }}>{label}</div><div style={{ fontSize: "14px", color: "#1a2a18", fontWeight: 500, lineHeight: 1.4 }}>{item[lang]}</div></div>
  </div>;
  return <div style={{ ...st.card, borderLeft: "3px solid #c8a92e", marginBottom: "16px" }}>
    <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "18px", fontStyle: "italic", color: "#1a2a18", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>🍽 {t.mFor} {personName}</div>
    {adapted && <div style={{ background: "rgba(200,169,46,.1)", border: "1px solid rgba(200,169,46,.25)", borderRadius: "10px", padding: "8px 14px", marginBottom: "14px", fontSize: "12px", fontWeight: 600, color: "#8a7a20" }}>✨ {t.menuAdapt}</div>}
    <Item label={t.entL} item={menu.entree} />
    <Item label={t.platL} item={menu.plat} />
    <Item label={t.garL} item={menu.garniture} />
    {menu.dessert && <Item label={t.detDessert || "Dessert"} item={menu.dessert} />}
  </div>;
}
function BfCounter({ label, count, setCount }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}><span style={{ fontSize: "14px" }}>{label}</span><div style={{ display: "flex", alignItems: "center", gap: "12px" }}><button onClick={() => setCount(Math.max(0, count - 1))} style={st.cBtn}>−</button><span style={{ fontSize: "20px", fontWeight: 700, minWidth: "28px", textAlign: "center", fontFamily: "'Cormorant Garamond'" }}>{count}</span><button onClick={() => setCount(count + 1)} style={st.cBtn}>+</button></div></div>; }
function Countdown({ lang }) { const [now, setNow] = useState(Date.now()); useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []); const ct = TR[lang].countdown; const diff = Math.max(0, new Date("2026-09-12T14:00:00").getTime() - now); const d = Math.floor(diff / 864e5), h = Math.floor((diff % 864e5) / 36e5), m = Math.floor((diff % 36e5) / 6e4), s = Math.floor((diff % 6e4) / 1e3); return <div style={{ display: "flex", justifyContent: "center", gap: "20px", margin: "14px 0" }}>{[[d, ct.d], [h, ct.h], [m, ct.m], [s, ct.s]].map(([n, l], i) => <div key={i} style={{ textAlign: "center" }}><div style={{ fontSize: "28px", fontWeight: 700, color: "#0d9a5f", fontFamily: "'Cormorant Garamond'" }}>{n}</div><div style={{ fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: "#6a8a60", fontWeight: 600 }}>{l}</div></div>)}</div>; }
function ProgressBar({ step, total }) { return <div style={{ display: "flex", gap: "4px", margin: "0 auto 24px", maxWidth: "300px" }}>{Array.from({ length: total }).map((_, i) => <div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i <= step ? "linear-gradient(90deg, #0d9a5f, #0dba6f)" : "rgba(0,0,0,.06)", transition: "background .4s" }} />)}</div>; }

function DetailModal({ r, lang, t, onClose, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const dl = (d) => { if (!d?.length) return "–"; return (Array.isArray(d) ? d : [d]).filter(x => x !== "standard").map(x => t.diets[x] || x).join(", ") || "–"; };
  const isY = r.attendance === "yes";
  const Row = ({ icon, label, val }) => val ? <div style={{ display: "flex", gap: "10px", padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,.04)" }}><span style={{ fontSize: "16px", width: "24px" }}>{icon}</span><div><div style={{ fontSize: "11px", color: "#6a8a60", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.5px" }}>{label}</div><div style={{ fontSize: "14px", color: "#1a2a18", marginTop: "2px" }}>{val}</div></div></div> : null;
  return <div className="modal-overlay" onClick={onClose}><div className="modal-box" onClick={e => e.stopPropagation()}>
    <button onClick={onClose} style={{ position: "absolute", top: "12px", right: "16px", background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#888" }}>✕</button>
    <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "24px", fontStyle: "italic", marginBottom: "4px" }}>{r.firstName} {r.lastName}</div>
    <div style={{ fontSize: "12px", color: "#6a8a60", marginBottom: "16px" }}>{r.email} · {r.phone || ""} · {r.date}</div>
    <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: isY ? "rgba(13,154,95,.1)" : "rgba(0,0,0,.04)", color: isY ? "#087a4a" : "#888", marginBottom: "16px" }}>{isY ? t.pres : t.abs}</span>
    {isY && <><Row icon="🥗" label={t.detDiet} val={dl(r.diet)} />{r.menu && (() => { const m = MENU_BY_DIET[r.menu.type] || MENU_BY_DIET.standard; return <><Row icon="🍽" label={t.detEntree} val={m.entree[lang]} /><Row icon="🍽" label={t.detPlat} val={m.plat[lang]} /><Row icon="🥗" label={t.detGar} val={m.garniture[lang]} />{m.dessert && <Row icon="🍡" label={t.detDessert} val={m.dessert[lang]} />}</>; })()}<Row icon="🍷" label={t.detAlc} val={r.alcohol?.length ? (r.alcohol.includes("none") ? t.alcNon : r.alcohol.map(a => t.alc[a] || a).join(", ")) : "–"} />
      <Row icon="🏡" label={t.detAc} val={r.accom === "fri-sun" ? `${t.acFS} (${r.accomPrice}€)` : r.accom === "sat-sun" ? `${t.acSS} (${r.accomPrice}€)` : t.acN} />
      <Row icon="🥐" label={t.detBf} val={r.bfTotal > 0 ? `${r.bfSat > 0 ? (lang === "fr" ? "Sam" : "Sat") + ": " + r.bfSat + " pers." : ""}${r.bfSat > 0 && r.bfSun > 0 ? " · " : ""}${r.bfSun > 0 ? (lang === "fr" ? "Dim" : "Sun") + ": " + r.bfSun + " pers." : ""} (${r.bfPrice}€)` : "–"} />
      <Row icon="🔥" label={t.detBbq} val={r.bbq === "yes" ? "✓" : r.bbq === "no" ? "✗" : "–"} />
      {r.message && <Row icon="💌" label={t.detMsg} val={r.message} />}

      {r.companion && <><div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "18px", fontStyle: "italic", marginTop: "16px", marginBottom: "10px", paddingTop: "14px", paddingBottom: "8px", borderTop: "2px dashed rgba(13,154,95,.1)" }}>♡ {r.companion.firstName} {r.companion.lastName}</div>
        <Row icon="🥗" label={t.detDiet} val={dl(r.companion.diet)} />
        {r.companion.menu && (() => { const cm = MENU_BY_DIET[r.companion.menu.type] || MENU_BY_DIET.standard; return <><Row icon="🍽" label={t.detEntree} val={cm.entree[lang]} /><Row icon="🍽" label={t.detPlat} val={cm.plat[lang]} /><Row icon="🥗" label={t.detGar} val={cm.garniture[lang]} />{cm.dessert && <Row icon="🍡" label={t.detDessert} val={cm.dessert[lang]} />}</>; })()}
        <Row icon="🍷" label={t.detAlc} val={r.companion.alcohol?.length ? (r.companion.alcohol.includes("none") ? t.alcNon : r.companion.alcohol.map(a => t.alc[a] || a).join(", ")) : "–"} />
      </>}

      {r.children?.length > 0 && <><div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "18px", fontStyle: "italic", marginTop: "16px", marginBottom: "10px", paddingTop: "14px", paddingBottom: "8px", borderTop: "2px dashed rgba(13,154,95,.1)" }}>★ {r.children.length} {r.children.length > 1 ? t.chs : t.ch}</div>
        {r.children.map((c, ci) => <div key={ci} style={{ padding: "8px 0", borderBottom: ci < r.children.length - 1 ? "1px solid rgba(0,0,0,.04)" : "none" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a2a18", marginBottom: "4px" }}>{c.name} — {c.age} {t.yrs}</div>
          <div style={{ fontSize: "12px", color: "#6a8a60" }}>🥗 {dl(c.diet)}</div>
          {c.allergy && <div style={{ fontSize: "12px", color: "#c08030", marginTop: "2px" }}>⚠️ {c.allergy}</div>}
        </div>)}
      </>}
    </>}
    {!confirmDel ? <button onClick={() => setConfirmDel(true)} style={{ marginTop: "20px", width: "100%", padding: "12px", background: "rgba(200,50,50,.08)", border: "1.5px solid rgba(200,50,50,.2)", borderRadius: "12px", color: "#a03030", fontFamily: "'DM Sans'", fontSize: "12px", fontWeight: 600, cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>🗑 {t.deleteBtn}</button>
    : <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setConfirmDel(false)}><div onClick={e => e.stopPropagation()} style={{ background: "#f0f4ed", borderRadius: "20px", padding: "28px 24px", maxWidth: "340px", width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
      <div style={{ fontSize: "16px", fontWeight: 600, color: "#1a2a18", marginBottom: "6px" }}>{t.deleteConfirm}</div>
      <div style={{ fontSize: "14px", color: "#6a4040", marginBottom: "20px" }}>{r.firstName} {r.lastName}</div>
      <div style={{ display: "flex", gap: "10px" }}><button onClick={() => setConfirmDel(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1.5px solid rgba(0,0,0,.1)", background: "rgba(255,255,255,.8)", fontFamily: "'DM Sans'", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#555" }}>{t.close}</button><button onClick={() => onDelete(r.id)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #c03030, #d04040)", fontFamily: "'DM Sans'", fontSize: "13px", fontWeight: 700, cursor: "pointer", color: "#fff" }}>🗑 {t.deleteBtn}</button></div>
    </div></div>}
  </div></div>;
}

/* ═══ ADMIN: Export CSV ═══ */
function exportCSV(rsvps, lang) {
  const t = TR[lang];
  const headers = ["Nom", "Email", "Téléphone", "Présent", "Régime", "Entrée", "Plat", "Garnitures", "Alcool", "+1 Nom", "+1 Régime", "Enfants", "Hébergement", "Prix chambre", "Petit-déj", "Prix pdéj", "BBQ", "Message"];
  const rows = rsvps.map(r => {
    const isY = r.attendance === "yes";
    return [
      `${r.firstName} ${r.lastName}`, r.email, r.phone || "", isY ? "Oui" : "Non",
      isY ? (r.diet || []).join("+") : "", isY ? (r.menu?.type || "standard") : "", "",
      "",
      isY ? (r.alcohol || []).join("+") : "",
      r.companion ? `${r.companion.firstName} ${r.companion.lastName}` : "", r.companion ? (r.companion.diet || []).join("+") : "",
      (r.children || []).map(c => `${c.name}(${c.age})`).join("+"),
      r.accom === "fri-sun" ? "Ven-Dim" : r.accom === "sat-sun" ? "Sam-Dim" : "Non",
      r.accomPrice || 0, r.bfTotal || 0, r.bfPrice || 0, r.bbq || "", r.message || "",
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "rsvp_mariage.csv"; a.click();
  URL.revokeObjectURL(url);
}

/* ═══ ADMIN: Meal Counter ═══ */
function MealCounter({ rsvps, lang, t }) {
  const counts = {};
  const count = (name) => { counts[name] = (counts[name] || 0) + 1; };
  rsvps.filter(r => r.attendance === "yes").forEach(r => {
    if (r.menu?.type) { const m = MENU_BY_DIET[r.menu.type] || MENU_BY_DIET.standard; count(m.entree.emoji + " " + m.entree[lang]); count(m.plat.emoji + " " + m.plat[lang]); count(m.garniture.emoji + " " + m.garniture[lang]); if (m.dessert) count(m.dessert.emoji + " " + m.dessert[lang]); }
    if (r.companion?.menu?.type) { const m = MENU_BY_DIET[r.companion.menu.type] || MENU_BY_DIET.standard; count(m.entree.emoji + " " + m.entree[lang]); count(m.plat.emoji + " " + m.plat[lang]); count(m.garniture.emoji + " " + m.garniture[lang]); if (m.dessert) count(m.dessert.emoji + " " + m.dessert[lang]); }
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return null;
  return <div style={st.card}>
    <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "18px", fontStyle: "italic", marginBottom: "12px" }}>🍽 {t.mealCountT}</div>
    {sorted.map(([name, n]) => <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,.03)" }}>
      <span style={{ fontSize: "13px", color: "#1a2a18" }}>{name}</span>
      <span style={{ fontSize: "16px", fontWeight: 700, color: "#0d9a5f", fontFamily: "'Cormorant Garamond'" }}>{n}</span>
    </div>)}
  </div>;
}

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

async function sendEmails(entry, lang) {
  const lines = [`Nom: ${entry.firstName} ${entry.lastName}`, `Email: ${entry.email}`, `Tél: ${entry.phone}`, `Présence: ${entry.attendance === "yes" ? "✓ OUI" : "✗ NON"}`];
  if (entry.attendance === "yes") {
    lines.push(`\n--- RÉGIME ---\n${(entry.diet || []).join(", ")}${entry.dietOt ? ` (${entry.dietOt})` : ""}`);
    lines.push(`Alcool: ${(entry.alcohol || []).join(", ")}`);
    if (entry.companion) lines.push(`\n--- ACCOMPAGNANT ---\n${entry.companion.firstName} ${entry.companion.lastName}\nRégime: ${(entry.companion.diet || []).join(",")}`);
    if (entry.children?.length) lines.push(`\n--- ENFANTS ---\n${entry.children.map(c => `${c.name} (${c.age}ans)`).join(", ")}`);
    lines.push(`\n--- SOUS-TOTAL CHAMBRE ---\n${entry.accom !== "none" ? `${entry.accom === "fri-sun" ? "Ven→Dim" : "Sam→Dim"} : ${entry.accomPrice} €` : "Pas d'hébergement"}`);
    lines.push(`--- SOUS-TOTAL PETIT-DÉJEUNER ---\n${entry.bfSat > 0 ? "Samedi matin: " + entry.bfSat + " pers.\n" : ""}${entry.bfSun > 0 ? "Dimanche matin: " + entry.bfSun + " pers.\n" : ""}Montant: ${entry.bfPrice} €`);
    lines.push(`--- BARBECUE ---\n${entry.bbq === "yes" ? "OUI" : "NON"}`);
    lines.push(`\n=== TOTAL: ${entry.accomPrice + entry.bfPrice} € ===`);
    if (entry.message) lines.push(`\n💌 ${entry.message}`);
  }
  const body = lines.join("\n");
  // Email to Manon & Sebastian
  try { await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 200, messages: [{ role: "user", content: `Envoie un email à oleary.sebastian77@gmail.com avec le sujet "Confirmation de présence - ${entry.firstName} ${entry.lastName}" contenant:\n\n${body}\n\nRéponds juste OK.` }] }) }); } catch (e) {}
  // Email recap to guest
  try { await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 200, messages: [{ role: "user", content: `Envoie un email à ${entry.email} avec le sujet "Mariage Manon & Sebastian - Votre confirmation" contenant:\n\nBonjour ${entry.firstName},\n\nMerci pour votre réponse ! Voici le récapitulatif :\n\n${body}\n\nÀ très bientôt !\nManon & Sebastian\n\nRéponds juste OK.` }] }) }); } catch (e) {}
}

/* ═══ APP ═══ */
export default function App() {
  const [lang, setLang] = useState("fr"); const [view, setView] = useState("form"); const [step, setStep] = useState(0);
  const [att, setAtt] = useState("yes");
  const [fn, setFn] = useState(""); const [ln, setLn] = useState(""); const [em, setEm] = useState(""); const [phone, setPhone] = useState(""); const [phoneCode, setPhoneCode] = useState("+33");
  const [di, setDi] = useState(["standard"]); const [diOt, setDiOt] = useState("");
  const [alc, setAlc] = useState([]); const [msg, setMsg] = useState("");
  const [myE, setMyE] = useState(""); const [myP, setMyP] = useState(""); const [myG, setMyG] = useState([]);
  const [hasCo, setHasCo] = useState(false);
  const [coFn, setCoFn] = useState(""); const [coLn, setCoLn] = useState("");
  const [coDi, setCoDi] = useState(["standard"]); const [coDiOt, setCoDiOt] = useState("");
  const [coAlc, setCoAlc] = useState([]); const [coE, setCoE] = useState(""); const [coP, setCoP] = useState(""); const [coG, setCoG] = useState([]);
  const [hasCh, setHasCh] = useState(false); const [kids, setKids] = useState([mkKid()]);
  const [accom, setAccom] = useState("none"); const [roomSize, setRoomSize] = useState("12");
  const [bfSat, setBfSat] = useState(0); const [bfSun, setBfSun] = useState(0); const [bbq, setBbq] = useState("");
  const [errs, setErrs] = useState({}); const [rsvps, setRsvps] = useState([]);
  const [aiMsg, setAiMsg] = useState(""); const [aiLoad, setAiLoad] = useState(false); const [last, setLast] = useState(null); const [submitting, setSubmitting] = useState(false);
  const [detailR, setDetailR] = useState(null);
  const [adminPanel, setAdminPanel] = useState(null);
  const [paidRooms, setPaidRooms] = useState({});
  const [paidBf, setPaidBf] = useState({});
  const togglePaidRoom = (id) => { const next = { ...paidRooms, [id]: !paidRooms[id] }; setPaidRooms(next); savePayments(next, paidBf); };
  const togglePaidBf = (id) => { const next = { ...paidBf, [id]: !paidBf[id] }; setPaidBf(next); savePayments(paidRooms, next); };
  const topRef = useRef(null);
  const t = TR[lang];

  // Deadline check
  const isExpired = new Date() > new Date(RSVP_DEADLINE + "T23:59:59");

  useEffect(() => { loadRsvps().then(setRsvps); loadPayments().then(p => { setPaidRooms(p.paid_rooms || {}); setPaidBf(p.paid_bf || {}); }); }, []);
  const save = async (l, newEntry) => { setRsvps(l); if (newEntry) await saveRsvp(newEntry); };
  useEffect(() => { setMyE(""); setMyP(""); }, [di]);
  useEffect(() => { setCoE(""); setCoP(""); }, [coDi]);
  useEffect(() => { topRef.current?.scrollIntoView({ behavior: "smooth" }); }, [step, view]);

  const deleteRsvp = async (id) => { const updated = rsvps.filter(r => r.id !== id); setRsvps(updated); setDetailR(null); await deleteRsvpDb(id); };
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
    const entry = { id: Date.now(), firstName: fn.trim(), lastName: ln.trim(), email: em.trim(), phone: phoneCode + phone.trim(), attendance: att,
      diet: att === "yes" ? di : [], dietOt: di.includes("autre") ? diOt.trim() : "", alcohol: att === "yes" ? alc : [],
      message: att === "yes" ? msg.trim() : "",
      menu: att === "yes" ? { type: getMenuType(di, diOt) } : null,
      companion: att === "yes" && hasCo ? { firstName: coFn.trim(), lastName: coLn.trim(), diet: coDi, dietOt: coDi.includes("autre") ? coDiOt.trim() : "", alcohol: coAlc, menu: { type: getMenuType(coDi, coDiOt) } } : null,
      children: att === "yes" && hasCh ? kids.map(c => ({ name: c.name.trim(), age: parseInt(c.age), diet: Array.isArray(c.diet) ? c.diet : [c.diet], dietOt: (c.dietOt || "").trim(), allergy: (c.allergy || "").trim() })) : [],
      accom: att === "yes" ? accom : "none", roomSize: att === "yes" && accom !== "none" ? roomSize : null,
      accomPrice: att === "yes" && accom !== "none" ? (roomSize === "3" ? 180 : 150) : 0,
      bfSat: accom === "fri-sun" ? bfSat : 0, bfSun: accom !== "none" ? bfSun : 0, bfTotal: totalBf, bfPrice: totalBf * 8,
      bbq: att === "yes" ? bbq : "", date: new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB") };
    save([...rsvps, entry], entry); setLast(entry); setView("success");
    await Promise.all([sendEmails(entry, lang), genAi(entry)]); setSubmitting(false);
  };

  const reset = () => { setFn(""); setLn(""); setEm(""); setPhone(""); setPhoneCode("+33"); setDi(["standard"]); setDiOt(""); setAlc([]); setMsg(""); setMyE(""); setMyP(""); setMyG([]); setHasCo(false); setCoFn(""); setCoLn(""); setCoDi(["standard"]); setCoDiOt(""); setCoAlc([]); setCoE(""); setCoP(""); setCoG([]); setHasCh(false); setKids([mkKid()]); setAccom("none"); setRoomSize("12"); setBfSat(0); setBfSun(0); setBbq(""); setAtt("yes"); setStep(0); setErrs({}); setAiMsg(""); setView("form"); setSubmitting(false); };
  const updateKid = useCallback((i, f, v) => { setKids(prev => { const c = [...prev]; c[i] = { ...c[i], [f]: v }; return c; }); }, []);
  const removeKid = useCallback(i => setKids(prev => prev.length > 1 ? prev.filter((_, j) => j !== i) : prev), []);
  const addKid = useCallback(() => setKids(prev => [...prev, mkKid()]), []);

  const yR = rsvps.filter(r => r.attendance === "yes");
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
    <button onClick={() => setView("admin")} style={{ position: "fixed", bottom: "12px", right: "12px", background: "none", border: "none", fontSize: "14px", cursor: "pointer", opacity: 0.15, zIndex: 50 }}>🐻</button>
  </div>;

  /* ═══ FORM ═══ */
  if (view === "form") return (
    <div style={st.root}><style>{CSS}</style><div ref={topRef} />
      <div style={st.langBar}><button style={st.langBtn(lang === "fr")} onClick={() => setLang("fr")}>FR</button><span style={{ color: "rgba(13,154,95,.2)" }}>|</span><button style={st.langBtn(lang === "en")} onClick={() => setLang("en")}>EN</button></div>
      <div style={st.hero}><div style={st.heroBg} /><div style={{ position: "relative", zIndex: 1 }}>
        {/* Photo placeholder */}
        <div style={{ width: "100%", maxWidth: "520px", height: "120px", borderRadius: "18px", margin: "0 auto 16px", background: "linear-gradient(135deg, rgba(13,154,95,.1), rgba(200,169,46,.1))", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,.5)" }}><span style={{ fontSize: "14px", color: "#6a8a60", fontStyle: "italic" }}>🏡 Moulin de Pommeuse</span></div>
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
              <div style={{ marginTop: "14px" }}><label style={st.lbl}>{t.phone}</label><div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}><select value={phoneCode} onChange={e => setPhoneCode(e.target.value)} style={{ border: "none", borderBottom: "2px solid rgba(13,154,95,.15)", background: "transparent", padding: "10px 0", fontFamily: "'DM Sans'", fontSize: "14px", color: "#1a2a18", outline: "none", borderRadius: 0, width: "90px", cursor: "pointer" }}>{PHONE_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}</select><input style={{ ...st.inp, flex: 1 }} type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ""))} placeholder="6 12 34 56 78" /></div></div>{att === "yes" && <div style={{ marginTop: "16px" }}><label style={st.lbl}>{t.diet}</label><DietMultiSelect value={di} onChange={setDi} otVal={diOt} onOtChange={setDiOt} errOt={errs.diOt} t={t} /></div>}</div>
            {att === "yes" && <><div style={{ marginBottom: "16px" }}><label style={st.lbl}>{t.compQ}</label><div style={st.togWrap}><button style={st.tog(hasCo, "yes")} onClick={() => setHasCo(true)}>{t.oui}</button><button style={st.tog(!hasCo, "no")} onClick={() => setHasCo(false)}>{t.non}</button></div></div>{hasCo && <div style={st.card}><div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "16px", fontStyle: "italic", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>♡ {t.compT}</div><div style={st.row2}><div><label style={st.lbl}>{t.fn}</label><input style={st.inp} value={coFn} onChange={e => setCoFn(e.target.value)} /><Err show={errs.coFn} text={t.req} /></div><div><label style={st.lbl}>{t.ln}</label><input style={st.inp} value={coLn} onChange={e => setCoLn(e.target.value)} /><Err show={errs.coLn} text={t.req} /></div></div><div style={{ marginTop: "14px" }}><label style={st.lbl}>{t.diet}</label><DietMultiSelect value={coDi} onChange={setCoDi} otVal={coDiOt} onOtChange={setCoDiOt} t={t} /></div></div>}<div style={{ marginBottom: "16px" }}><label style={st.lbl}>{t.childQ}</label><div style={st.togWrap}><button style={st.tog(hasCh, "yes")} onClick={() => setHasCh(true)}>{t.oui}</button><button style={st.tog(!hasCh, "no")} onClick={() => setHasCh(false)}>{t.non}</button></div></div>{hasCh && <>{kids.map((kid, i) => <div key={kid.id} style={st.card}><div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "16px", fontStyle: "italic", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>★ {t.childT} {i + 1}</div><div style={st.row2}><div><label style={st.lbl}>{t.childN}</label><input style={st.inp} value={kid.name} onChange={e => updateKid(i, "name", e.target.value)} /><Err show={errs["cn" + i]} text={t.req} /></div><div><label style={st.lbl}>{t.childA}</label><input style={st.inp} type="number" min="0" max="17" value={kid.age} onChange={e => updateKid(i, "age", e.target.value)} /><Err show={errs["ca" + i]} text={t.req} /></div></div><div style={{ marginTop: "12px" }}><label style={st.lbl}>{t.diet}</label><DietMultiSelect value={Array.isArray(kid.diet) ? kid.diet : [kid.diet || "standard"]} onChange={v => updateKid(i, "diet", v)} otVal={kid.dietOt || ""} onOtChange={v => updateKid(i, "dietOt", v)} t={t} /></div>{kids.length > 1 && <div style={{ textAlign: "right", marginTop: "8px" }}><button style={st.rmBtn} onClick={() => removeKid(i)}>{t.rmChild} ✗</button></div>}</div>)}<button style={st.addBtn} onClick={addKid}>{t.addChild}</button><div style={{ background: "rgba(200,169,46,.08)", borderRadius: "12px", padding: "10px 14px", fontSize: "12px", color: "#6a5a20", lineHeight: 1.6, marginBottom: "16px" }}>👶 {t.childMenuNote}</div></>}</>}
            {att === "no" && <div style={{ marginTop: "16px" }}><label style={st.lbl}>{t.msgL}</label><textarea style={st.ta} value={msg} onChange={e => setMsg(e.target.value)} placeholder={t.msgPh} /></div>}
            <NavBtns showSend={att === "no" && step === totalSteps - 1} />
          </>}
          {step === 1 && att === "yes" && <><MenuDisplay lang={lang} diets={di} dietOt={diOt} personName={fn || t.fn} t={t} />{hasCo && <MenuDisplay lang={lang} diets={coDi} dietOt={coDiOt} personName={coFn || t.compT} t={t} />}{hasCh && kids.map((kid, i) => <div key={kid.id} style={{ ...st.card, borderLeft: "3px solid #c8a92e", marginBottom: "16px" }}><div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "18px", fontStyle: "italic", marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>🍽 {t.mFor} {kid.name || `${t.childT} ${i + 1}`}</div><div style={{ background: "rgba(200,169,46,.08)", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#6a5a20", lineHeight: 1.6 }}>👶 {t.childMenuSoon}</div></div>)}<div style={{ marginTop: "8px" }}><label style={st.lbl}>{t.alcQ}</label><div style={{ fontSize: "12px", color: "#6a8a60", fontStyle: "italic", marginBottom: "4px" }}>{t.alcH}</div><AlcoholSelect value={alc} onChange={setAlc} t={t} /></div>{hasCo && <div style={{ marginTop: "14px" }}><label style={st.lbl}>{t.alcQ} ({coFn || t.compT})</label><AlcoholSelect value={coAlc} onChange={setCoAlc} t={t} /></div>}<NavBtns /></>}
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
  if (view === "success") return (
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

  /* ═══ ADMIN ═══ */
  const totA = yR.reduce((s, r) => s + 1 + (r.companion ? 1 : 0), 0);
  const totK = yR.reduce((s, r) => s + (r.children?.length || 0), 0);
  const totRm = rsvps.filter(r => r.accom && r.accom !== "none").length;
  const totRev = rsvps.filter(r => r.accom && r.accom !== "none").reduce((s, r) => s + (r.accomPrice || 0), 0);
  const totBf = rsvps.reduce((s, r) => s + (r.bfTotal || 0), 0);
  const totBbq = rsvps.filter(r => r.bbq === "yes").length;

  return (
    <div style={st.root}><style>{CSS}</style><div ref={topRef} />
      {detailR && <DetailModal r={detailR} lang={lang} t={t} onClose={() => setDetailR(null)} onDelete={deleteRsvp} />}
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1.5px solid rgba(13,154,95,.1)" }}>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "22px", fontStyle: "italic" }}>{t.admT}</div>
          <button onClick={() => setView("form")} style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#0d9a5f", cursor: "pointer", border: "none", background: "none", fontWeight: 600 }}>← {t.back}</button>
        </div>
        {/* Stats — Dashboard with clickable lists */}
        <div style={{ ...st.card, marginBottom: "16px" }}>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "18px", fontStyle: "italic", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>📊 {lang === "fr" ? "Résumé des réponses" : "Response summary"}</div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,.04)" }}>
            <span style={{ fontSize: "14px", color: "#3a5a38" }}>{lang === "fr" ? "Total des réponses" : "Total responses"}</span>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#1a2a18", fontFamily: "'Cormorant Garamond'" }}>{rsvps.length}</span>
          </div>
          {/* Présents — cliquable */}
          <div onClick={() => setAdminPanel(adminPanel === "yes" ? null : "yes")} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,.04)", cursor: "pointer" }}>
            <span style={{ fontSize: "14px", color: "#087a4a" }}>✓ {lang === "fr" ? "Présents confirmés" : "Confirmed attending"} <span style={{ fontSize: "14px", transition: "transform .2s", display: "inline-block", transform: adminPanel === "yes" ? "rotate(90deg)" : "none" }}>›</span></span>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#087a4a", fontFamily: "'Cormorant Garamond'" }}>{yR.length}</span>
          </div>
          {adminPanel === "yes" && <div style={{ padding: "8px 0 4px" }}>
            {yR.length === 0 ? <div style={{ fontSize: "13px", color: "#8a9a80", fontStyle: "italic", padding: "8px 0" }}>–</div> : yR.map(r => {
              const nbPers = 1 + (r.companion ? 1 : 0) + (r.children?.length || 0);
              return <div key={r.id} onClick={(e) => { e.stopPropagation(); setDetailR(r); }} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", marginBottom: "4px", background: "rgba(13,154,95,.04)", borderRadius: "10px", cursor: "pointer" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, background: "rgba(13,154,95,.1)", color: "#087a4a", flexShrink: 0 }}>{(r.firstName[0] + (r.lastName?.[0] || "")).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a2a18" }}>{r.firstName} {r.lastName}</div>
                  <div style={{ fontSize: "10px", color: "#6a8a60", marginTop: "1px" }}>
                    {nbPers} {lang === "fr" ? "pers." : "ppl"}{r.companion ? ` · ♡ ${r.companion.firstName}` : ""}{r.children?.length > 0 ? ` · ★ ${r.children.length} ${r.children.length > 1 ? t.chs : t.ch}` : ""}
                  </div>
                </div>
                <span style={{ fontSize: "14px", color: "#c8a92e" }}>›</span>
              </div>;
            })}
          </div>}
          {/* Absents — cliquable */}
          <div onClick={() => setAdminPanel(adminPanel === "no" ? null : "no")} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", cursor: "pointer" }}>
            <span style={{ fontSize: "14px", color: "#a05050" }}>✗ {lang === "fr" ? "Ne viendront pas" : "Cannot attend"} <span style={{ fontSize: "14px", transition: "transform .2s", display: "inline-block", transform: adminPanel === "no" ? "rotate(90deg)" : "none" }}>›</span></span>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#a05050", fontFamily: "'Cormorant Garamond'" }}>{rsvps.length - yR.length}</span>
          </div>
          {adminPanel === "no" && <div style={{ padding: "8px 0 4px" }}>
            {(() => { const nR = rsvps.filter(r => r.attendance !== "yes"); return nR.length === 0 ? <div style={{ fontSize: "13px", color: "#8a9a80", fontStyle: "italic", padding: "8px 0" }}>–</div> : nR.map(r => (
              <div key={r.id} onClick={(e) => { e.stopPropagation(); setDetailR(r); }} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", marginBottom: "4px", background: "rgba(0,0,0,.03)", borderRadius: "10px", cursor: "pointer" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, background: "rgba(0,0,0,.04)", color: "#8a9a80", flexShrink: 0 }}>{(r.firstName[0] + (r.lastName?.[0] || "")).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a2a18" }}>{r.firstName} {r.lastName}</div>
                  <div style={{ fontSize: "10px", color: "#8a9a80" }}>{r.date}</div>
                </div>
                <span style={{ fontSize: "14px", color: "#c8a92e" }}>›</span>
              </div>
            )); })()}
          </div>}
        </div>

        <div style={{ ...st.card, marginBottom: "16px" }}>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "18px", fontStyle: "italic", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>👥 {lang === "fr" ? "Invités présents" : "Guests attending"}</div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,.04)" }}>
            <span style={{ fontSize: "14px", color: "#3a5a38" }}>👤 {lang === "fr" ? "Adultes" : "Adults"}</span>
            <span style={{ fontSize: "18px", fontWeight: 700, fontFamily: "'Cormorant Garamond'" }}>{totA}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
            <span style={{ fontSize: "14px", color: "#3a5a38" }}>👶 {lang === "fr" ? "Enfants" : "Children"}</span>
            <span style={{ fontSize: "18px", fontWeight: 700, fontFamily: "'Cormorant Garamond'" }}>{totK}</span>
          </div>
          {(() => { const allKids = []; yR.forEach(r => { (r.children || []).forEach(c => { allKids.push({ ...c, parent: r.firstName + " " + r.lastName }); }); }); if (!allKids.length) return null; return <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(13,154,95,.08)" }}>
            <div style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#6a8a60", fontWeight: 600, marginBottom: "8px" }}>{lang === "fr" ? "Détail des enfants" : "Children details"}</div>
            {allKids.map((k, i) => { const kDiet = (Array.isArray(k.diet) ? k.diet : [k.diet || "standard"]).filter(x => x !== "standard").map(x => t.diets[x] || x).join(", "); return <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", marginBottom: "6px", background: "rgba(255,255,255,.5)", borderRadius: "10px", border: "1px solid rgba(13,154,95,.06)" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a2a18" }}>★ {k.name}</div>
                <div style={{ fontSize: "11px", color: "#6a8a60", marginTop: "2px" }}>{k.age} {t.yrs} · {lang === "fr" ? "Invité de" : "Guest of"} {k.parent}</div>
                {k.allergy && <div style={{ fontSize: "11px", color: "#c08030", marginTop: "2px" }}>⚠️ {k.allergy}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                {kDiet ? <span style={{ fontSize: "11px", background: "rgba(200,169,46,.1)", color: "#8a7a20", padding: "3px 10px", borderRadius: "20px", fontWeight: 600 }}>{kDiet}</span> : <span style={{ fontSize: "11px", color: "#8a9a80" }}>{t.diets.standard}</span>}
              </div>
            </div>; })}
          </div>; })()}
        </div>

        <div style={{ ...st.card, marginBottom: "16px" }}>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "18px", fontStyle: "italic", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>🏡 {lang === "fr" ? "Hébergement & extras" : "Accommodation & extras"}</div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,.04)" }}>
            <span style={{ fontSize: "14px", color: "#3a5a38" }}>🛏 {lang === "fr" ? "Chambres réservées" : "Rooms booked"}</span>
            <span style={{ fontSize: "18px", fontWeight: 700, fontFamily: "'Cormorant Garamond'" }}>{totRm}</span>
          </div>
          {/* Détail qui dort quand */}
          {(() => { const friSun = yR.filter(r => r.accom === "fri-sun"); const satSun = yR.filter(r => r.accom === "sat-sun"); return <><div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 8px 20px", borderBottom: "1px solid rgba(0,0,0,.03)" }}>
            <span style={{ fontSize: "13px", color: "#6a8a60" }}>{lang === "fr" ? "↳ Vendredi → Dimanche" : "↳ Friday → Sunday"}</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#3a5a38" }}>{friSun.length}</span>
          </div><div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 8px 20px", borderBottom: "1px solid rgba(0,0,0,.04)" }}>
            <span style={{ fontSize: "13px", color: "#6a8a60" }}>{lang === "fr" ? "↳ Samedi → Dimanche" : "↳ Saturday → Sunday"}</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#3a5a38" }}>{satSun.length}</span>
          </div></>; })()}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,.04)" }}>
            <span style={{ fontSize: "14px", color: "#3a5a38" }}>🥐 {lang === "fr" ? "Petits-déjeuners" : "Breakfasts"}</span>
            <span style={{ fontSize: "18px", fontWeight: 700, fontFamily: "'Cormorant Garamond'" }}>{totBf}</span>
          </div>
          {/* Détail pdéj par matin */}
          {(() => { const bfSatT = yR.reduce((s, r) => s + (r.bfSat || 0), 0); const bfSunT = yR.reduce((s, r) => s + (r.bfSun || 0), 0); return <><div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 8px 20px", borderBottom: "1px solid rgba(0,0,0,.03)" }}>
            <span style={{ fontSize: "13px", color: "#6a8a60" }}>{lang === "fr" ? "↳ Samedi matin" : "↳ Saturday morning"}</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#3a5a38" }}>{bfSatT}</span>
          </div><div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 8px 20px", borderBottom: "1px solid rgba(0,0,0,.04)" }}>
            <span style={{ fontSize: "13px", color: "#6a8a60" }}>{lang === "fr" ? "↳ Dimanche matin" : "↳ Sunday morning"}</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#3a5a38" }}>{bfSunT}</span>
          </div></>; })()}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
            <span style={{ fontSize: "14px", color: "#3a5a38" }}>🔥 {lang === "fr" ? "Barbecue dimanche" : "Sunday BBQ"}</span>
            <span style={{ fontSize: "18px", fontWeight: 700, fontFamily: "'Cormorant Garamond'" }}>{totBbq}</span>
          </div>
        </div>

        {/* Régimes alimentaires */}
        <div style={{ ...st.card, marginBottom: "16px" }}>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "18px", fontStyle: "italic", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>🥗 {lang === "fr" ? "Régimes alimentaires" : "Dietary requirements"}</div>
          {(() => { const dietCounts = {}; yR.forEach(r => { (r.diet || []).filter(d => d !== "standard").forEach(d => { dietCounts[d] = (dietCounts[d] || 0) + 1; }); if (r.companion) (r.companion.diet || []).filter(d => d !== "standard").forEach(d => { dietCounts[d] = (dietCounts[d] || 0) + 1; }); (r.children || []).forEach(c => { (Array.isArray(c.diet) ? c.diet : [c.diet]).filter(d => d !== "standard").forEach(d => { dietCounts[d] = (dietCounts[d] || 0) + 1; }); }); }); const stdCount = totA + totK - Object.values(dietCounts).reduce((a, b) => a + b, 0); return <>{[["standard", stdCount], ...Object.entries(dietCounts).sort((a, b) => b[1] - a[1])].map(([d, n]) => n > 0 ? <div key={d} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,.03)" }}>
            <span style={{ fontSize: "14px", color: "#3a5a38" }}>{t.diets[d] || d}</span>
            <span style={{ fontSize: "16px", fontWeight: 700, fontFamily: "'Cormorant Garamond'", color: d === "standard" ? "#1a2a18" : "#c8a92e" }}>{n}</span>
          </div> : null)}</>; })()}
        </div>

        {/* Alcool */}
        <div style={{ ...st.card, marginBottom: "16px" }}>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "18px", fontStyle: "italic", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>🍷 {lang === "fr" ? "Boissons alcoolisées" : "Alcoholic drinks"}</div>
          {(() => { const alcCounts = {}; let noDrink = 0; yR.forEach(r => { if (r.alcohol?.includes("none")) noDrink++; else (r.alcohol || []).forEach(a => { alcCounts[a] = (alcCounts[a] || 0) + 1; }); if (r.companion) { if (r.companion.alcohol?.includes("none")) noDrink++; else (r.companion.alcohol || []).forEach(a => { alcCounts[a] = (alcCounts[a] || 0) + 1; }); } }); return <>{Object.entries(alcCounts).sort((a, b) => b[1] - a[1]).map(([a, n]) => <div key={a} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,.03)" }}>
            <span style={{ fontSize: "14px", color: "#3a5a38" }}>{t.alc[a] || a}</span>
            <span style={{ fontSize: "16px", fontWeight: 700, fontFamily: "'Cormorant Garamond'" }}>{n}</span>
          </div>)}<div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
            <span style={{ fontSize: "14px", color: "#8a9a80" }}>{t.alcNon}</span>
            <span style={{ fontSize: "16px", fontWeight: 700, fontFamily: "'Cormorant Garamond'", color: "#8a9a80" }}>{noDrink}</span>
          </div></>; })()}
        </div>

        {/* Sous-totaux financiers */}
        <div style={{ ...st.card, marginBottom: "16px" }}>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "18px", fontStyle: "italic", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>💰 {lang === "fr" ? "Récapitulatif financier" : "Financial summary"}</div>
          
          {/* Bloc 1 : Hébergement — remboursement pour Manon & Sebastian */}
          <div style={{ background: "rgba(13,154,95,.04)", borderRadius: "12px", padding: "14px", marginBottom: "12px", border: "1px solid rgba(13,154,95,.08)" }}>
            <div style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#087a4a", fontWeight: 700, marginBottom: "10px" }}>🛏 {lang === "fr" ? "Hébergement — remboursement invités" : "Accommodation — guest reimbursement"}</div>
            <div style={{ fontSize: "12px", color: "#5a7a50", marginBottom: "10px", fontStyle: "italic" }}>{lang === "fr" ? "À récupérer auprès des invités (nous avons avancé les frais)" : "To recover from guests (we paid upfront)"}</div>
            {(() => { const roomDetails = yR.filter(r => r.accom && r.accom !== "none"); return roomDetails.length ? roomDetails.map((r, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,.03)", fontSize: "13px" }}>
              <div onClick={() => togglePaidRoom(r.id)} style={{ width: "20px", height: "20px", borderRadius: "6px", border: paidRooms[r.id] ? "none" : "2px solid #b0c0a8", background: paidRooms[r.id] ? "#0d9a5f" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>{paidRooms[r.id] && <span style={{ color: "#fff", fontSize: "12px", fontWeight: 700 }}>✓</span>}</div>
              <span style={{ flex: 1, color: paidRooms[r.id] ? "#8a9a80" : "#3a5a38", textDecoration: paidRooms[r.id] ? "line-through" : "none" }}>{r.firstName} {r.lastName} — {r.accom === "fri-sun" ? (lang === "fr" ? "Ven→Dim" : "Fri→Sun") : (lang === "fr" ? "Sam→Dim" : "Sat→Sun")}</span>
              <span style={{ fontWeight: 700, color: paidRooms[r.id] ? "#8a9a80" : "#087a4a" }}>{r.accomPrice} €</span>
            </div>) : <div style={{ fontSize: "13px", color: "#8a9a80", fontStyle: "italic" }}>–</div>; })()}
            {(() => { const roomDetails = yR.filter(r => r.accom && r.accom !== "none"); const paidCount = roomDetails.filter(r => paidRooms[r.id]).length; return roomDetails.length > 0 && <div style={{ fontSize: "11px", color: "#6a8a60", marginTop: "6px", textAlign: "right" }}>{paidCount}/{roomDetails.length} {lang === "fr" ? "remboursés" : "reimbursed"}</div>; })()}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", marginTop: "8px", borderTop: "2px solid rgba(13,154,95,.15)" }}>
              <span style={{ fontSize: "14px", fontWeight: 700 }}>{lang === "fr" ? "Total hébergement" : "Total accommodation"}</span>
              <span style={{ fontSize: "20px", fontWeight: 700, color: "#0d9a5f", fontFamily: "'Cormorant Garamond'" }}>{totRev} €</span>
            </div>
          </div>

          {/* Bloc 2 : Petits-déjeuners — payé directement au Moulin */}
          <div style={{ background: "rgba(200,169,46,.06)", borderRadius: "12px", padding: "14px", border: "1px solid rgba(200,169,46,.15)" }}>
            <div style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#8a7a20", fontWeight: 700, marginBottom: "10px" }}>🥐 {lang === "fr" ? "Petits-déjeuners — remboursement invités" : "Breakfasts — guest reimbursement"}</div>
            <div style={{ fontSize: "12px", color: "#6a5a20", marginBottom: "10px", fontStyle: "italic" }}>{lang === "fr" ? "À récupérer auprès des invités" : "To recover from guests"}</div>
            {(() => { const bfGuests = yR.filter(r => (r.bfSat || 0) > 0 || (r.bfSun || 0) > 0); return bfGuests.length ? bfGuests.map((r, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,.03)", fontSize: "13px" }}>
              <div onClick={() => togglePaidBf(r.id)} style={{ width: "20px", height: "20px", borderRadius: "6px", border: paidBf[r.id] ? "none" : "2px solid #c0b080", background: paidBf[r.id] ? "#c8a92e" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>{paidBf[r.id] && <span style={{ color: "#fff", fontSize: "12px", fontWeight: 700 }}>✓</span>}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: paidBf[r.id] ? "#8a9a80" : "#3a5a38", textDecoration: paidBf[r.id] ? "line-through" : "none", marginBottom: "2px" }}>{r.firstName} {r.lastName}</div>
                <div style={{ color: paidBf[r.id] ? "#aaa" : "#6a8a60" }}>{r.bfSat > 0 ? `${lang === "fr" ? "Sam" : "Sat"}: ${r.bfSat} pers.` : ""}{r.bfSat > 0 && r.bfSun > 0 ? " · " : ""}{r.bfSun > 0 ? `${lang === "fr" ? "Dim" : "Sun"}: ${r.bfSun} pers.` : ""}</div>
              </div>
              <span style={{ fontWeight: 700, color: paidBf[r.id] ? "#aaa" : "#8a7a20" }}>{r.bfPrice} €</span>
            </div>) : <div style={{ fontSize: "13px", color: "#8a9a80", fontStyle: "italic" }}>–</div>; })()}
            {(() => { const bfGuests = yR.filter(r => (r.bfSat || 0) > 0 || (r.bfSun || 0) > 0); const paidCount = bfGuests.filter(r => paidBf[r.id]).length; return bfGuests.length > 0 && <div style={{ fontSize: "11px", color: "#6a8a60", marginTop: "6px", textAlign: "right" }}>{paidCount}/{bfGuests.length} {lang === "fr" ? "remboursés" : "reimbursed"}</div>; })()}
            {(() => { const totalBfPrice = yR.reduce((s, r) => s + (r.bfPrice || 0), 0); return <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", marginTop: "8px", borderTop: "2px solid rgba(200,169,46,.2)" }}>
              <span style={{ fontSize: "14px", fontWeight: 700 }}>{lang === "fr" ? "Total petits-déjeuners" : "Total breakfasts"}</span>
              <span style={{ fontSize: "20px", fontWeight: 700, color: "#c8a92e", fontFamily: "'Cormorant Garamond'" }}>{totalBfPrice} €</span>
            </div>; })()}
          </div>
        </div>

        {/* Dernière réponse + Emails */}
        <div style={{ ...st.card, marginBottom: "16px" }}>
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: "18px", fontStyle: "italic", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid rgba(13,154,95,.06)" }}>📬 {lang === "fr" ? "Suivi" : "Tracking"}</div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,.04)" }}>
            <span style={{ fontSize: "14px", color: "#3a5a38" }}>📅 {lang === "fr" ? "Dernière réponse" : "Last response"}</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#1a2a18" }}>{rsvps.length ? rsvps[rsvps.length - 1].date : "–"}</span>
          </div>
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "12px", color: "#6a8a60", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" }}>📧 {lang === "fr" ? "Emails des invités présents" : "Attending guests emails"}</div>
            <div onClick={() => { const emails = yR.map(r => r.email).join("\n"); navigator.clipboard?.writeText(emails); }} style={{ background: "rgba(255,255,255,.5)", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#3a5a38", cursor: "pointer", border: "1px solid rgba(13,154,95,.08)" }}>
              {yR.length ? yR.map((r, i) => <div key={i} style={{ padding: "4px 0", borderBottom: i < yR.length - 1 ? "1px solid rgba(0,0,0,.03)" : "none" }}>{r.email}</div>) : "–"}
              <div style={{ fontSize: "10px", color: "#0d9a5f", marginTop: "8px", fontWeight: 600 }}>📋 {lang === "fr" ? "Cliquer pour tout copier" : "Click to copy all"}</div>
            </div>
          </div>
        </div>
        {/* Export + Meal counter */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <button onClick={() => exportCSV(rsvps, lang)} style={{ ...st.btnSec, flex: 1, fontSize: "11px" }}>{t.exportBtn}</button>
        </div>
        <MealCounter rsvps={rsvps} lang={lang} t={t} />
        {/* Plan de table placeholder */}
        <div style={{ ...st.card, textAlign: "center", marginTop: "12px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>🪑 {t.tableT}</div>
          <div style={{ fontSize: "13px", color: "#8a9a80", fontStyle: "italic" }}>{t.tableSoon}</div>
        </div>
      </div>
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
  badge: { fontSize: "9px", letterSpacing: "1.5px", textTransform: "uppercase", color: "#0d9a5f", background: "rgba(13,154,95,.1)", padding: "3px 10px", borderRadius: "20px", fontWeight: 700 },
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
