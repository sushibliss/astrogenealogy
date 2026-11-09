import type { AspectKey, BodyKey, ElementKey, ModalityKey, SignKey } from "./chart";

/**
 * Editable reading templates (EN / ES).
 *
 * The texts describe the placement rather than the person ("A Taurus Sun…"),
 * so they read naturally for the living and the long dead alike, and stay
 * gender-neutral in Spanish. Edit freely — nothing else depends on the wording.
 */

type Lang = "en" | "es";
type Bi = Record<Lang, string>;

export const SIGN_NAMES: Record<SignKey, Bi> = {
  aries: { en: "Aries", es: "Aries" },
  taurus: { en: "Taurus", es: "Tauro" },
  gemini: { en: "Gemini", es: "Géminis" },
  cancer: { en: "Cancer", es: "Cáncer" },
  leo: { en: "Leo", es: "Leo" },
  virgo: { en: "Virgo", es: "Virgo" },
  libra: { en: "Libra", es: "Libra" },
  scorpio: { en: "Scorpio", es: "Escorpio" },
  sagittarius: { en: "Sagittarius", es: "Sagitario" },
  capricorn: { en: "Capricorn", es: "Capricornio" },
  aquarius: { en: "Aquarius", es: "Acuario" },
  pisces: { en: "Pisces", es: "Piscis" },
};

export const BODY_NAMES: Record<BodyKey, Bi> = {
  sun: { en: "Sun", es: "Sol" },
  moon: { en: "Moon", es: "Luna" },
  mercury: { en: "Mercury", es: "Mercurio" },
  venus: { en: "Venus", es: "Venus" },
  mars: { en: "Mars", es: "Marte" },
  jupiter: { en: "Jupiter", es: "Júpiter" },
  saturn: { en: "Saturn", es: "Saturno" },
  uranus: { en: "Uranus", es: "Urano" },
  neptune: { en: "Neptune", es: "Neptuno" },
  pluto: { en: "Pluto", es: "Plutón" },
};

export const ELEMENT_NAMES: Record<ElementKey, Bi> = {
  fire: { en: "Fire", es: "Fuego" },
  earth: { en: "Earth", es: "Tierra" },
  air: { en: "Air", es: "Aire" },
  water: { en: "Water", es: "Agua" },
};

export const MODALITY_NAMES: Record<ModalityKey, Bi> = {
  cardinal: { en: "Cardinal", es: "Cardinal" },
  fixed: { en: "Fixed", es: "Fijo" },
  mutable: { en: "Mutable", es: "Mutable" },
};

export const ASPECT_NAMES: Record<AspectKey, Bi> = {
  conjunction: { en: "Conjunction", es: "Conjunción" },
  opposition: { en: "Opposition", es: "Oposición" },
  trine: { en: "Trine", es: "Trígono" },
  square: { en: "Square", es: "Cuadratura" },
  sextile: { en: "Sextile", es: "Sextil" },
};

export const SUN: Record<SignKey, Bi> = {
  aries: {
    en: "An Aries Sun meets life head-on. It would rather start badly than wait well, and its courage is most visible when someone has to go first.",
    es: "Un Sol en Aries va de frente. Prefiere empezar mal a esperar bien, y su valentía se nota sobre todo cuando alguien tiene que dar el primer paso.",
  },
  taurus: {
    en: "A Taurus Sun builds slowly and keeps what it builds. Loyalty, appetite and a stubborn sense of what is worth having sit at its centre.",
    es: "Un Sol en Tauro construye despacio y conserva lo que construye. En su centro hay lealtad, apetito y una idea tozuda de lo que merece la pena.",
  },
  gemini: {
    en: "A Gemini Sun lives by curiosity. It collects stories, trades news and changes its mind without embarrassment, because the next question is always more interesting.",
    es: "Un Sol en Géminis vive de la curiosidad. Colecciona historias, intercambia noticias y cambia de opinión sin apuro, porque la siguiente pregunta siempre interesa más.",
  },
  cancer: {
    en: "A Cancer Sun is organised around belonging. It remembers everything, protects fiercely and measures a good life by who is fed and safe at the table.",
    es: "Un Sol en Cáncer se organiza en torno a la pertenencia. Lo recuerda todo, protege con fiereza y mide una buena vida por quién está a salvo y bien alimentado en su mesa.",
  },
  leo: {
    en: "A Leo Sun needs to give something of itself and see it received. Warmth, pride and a taste for occasion make it hard to overlook.",
    es: "Un Sol en Leo necesita dar algo de sí y ver que se recibe. Su calidez, su orgullo y su gusto por las grandes ocasiones hacen difícil no verlo.",
  },
  virgo: {
    en: "A Virgo Sun finds dignity in doing things properly. It notices what others miss, mends what is broken and distrusts praise it has not earned.",
    es: "Un Sol en Virgo encuentra dignidad en hacer las cosas bien. Ve lo que a otros se les escapa, arregla lo roto y desconfía del elogio que no se ha ganado.",
  },
  libra: {
    en: "A Libra Sun thinks in pairs. Fairness, good manners and the right word at the right moment are its tools, and open conflict its least favourite weather.",
    es: "Un Sol en Libra piensa de dos en dos. La justicia, las buenas formas y la palabra oportuna son sus herramientas, y el conflicto abierto, el clima que menos le gusta.",
  },
  scorpio: {
    en: "A Scorpio Sun does nothing by halves. It keeps its own counsel, reads what is left unsaid and stays loyal long after it would have been easier to leave.",
    es: "Un Sol en Escorpio no hace nada a medias. Guarda silencio sobre lo suyo, lee lo que no se dice y sigue siendo leal mucho después de que irse hubiera sido más fácil.",
  },
  sagittarius: {
    en: "A Sagittarius Sun looks to the horizon. It wants a bigger map, a blunt truth and a reason to be hopeful, and usually finds all three.",
    es: "Un Sol en Sagitario mira al horizonte. Quiere un mapa más grande, una verdad sin adornos y un motivo para la esperanza, y suele encontrar los tres.",
  },
  capricorn: {
    en: "A Capricorn Sun plays the long game. Duty comes before comfort, reputation is earned in decades, and humour arrives dry and late.",
    es: "Un Sol en Capricornio juega a largo plazo. El deber va antes que la comodidad, la reputación se gana en décadas y el humor llega seco y tarde.",
  },
  aquarius: {
    en: "An Aquarius Sun stands slightly apart to see the whole. It is loyal to ideas and to friends, and unmoved by the argument that things have always been done this way.",
    es: "Un Sol en Acuario se aparta un poco para ver el conjunto. Es leal a las ideas y a las amistades, y no le conmueve el argumento de que siempre se ha hecho así.",
  },
  pisces: {
    en: "A Pisces Sun has thin walls. It absorbs the mood of a room, forgives easily and keeps an inner life far larger than the one on show.",
    es: "Un Sol en Piscis tiene paredes finas. Absorbe el ánimo de una habitación, perdona con facilidad y guarda una vida interior mucho mayor que la que enseña.",
  },
};

export const MOON: Record<SignKey, Bi> = {
  aries: {
    en: "Feelings arrive fast and leave fast. Comfort means freedom to act; being made to wait is the real hardship.",
    es: "Las emociones llegan rápido y se van rápido. El consuelo es poder actuar; lo verdaderamente duro es que le hagan esperar.",
  },
  taurus: {
    en: "Security is physical: a full larder, a familiar chair, the same faces. Slow to upset and slow to forget.",
    es: "La seguridad es física: la despensa llena, la silla de siempre, las mismas caras. Tarda en alterarse y tarda en olvidar.",
  },
  gemini: {
    en: "Feelings are talked through rather than sat in. Restlessness is soothed by news, company and something new to learn.",
    es: "Las emociones se hablan antes que sentarse en ellas. La inquietud se calma con noticias, compañía y algo nuevo que aprender.",
  },
  cancer: {
    en: "The Moon is at home here. Deep attachment to family and place, a long memory, and moods that move like tides.",
    es: "La Luna está aquí en su casa. Apego profundo a la familia y al lugar, una memoria larga y estados de ánimo que se mueven como mareas.",
  },
  leo: {
    en: "The heart wants to be seen and to be generous. Affection is given with ceremony and hurt pride takes time to heal.",
    es: "El corazón quiere ser visto y ser generoso. El afecto se da con ceremonia y el orgullo herido tarda en curar.",
  },
  virgo: {
    en: "Care is shown by being useful. Worry is the price of noticing everything, and order is what calms it.",
    es: "El cariño se demuestra siendo útil. La preocupación es el precio de fijarse en todo, y el orden es lo que la calma.",
  },
  libra: {
    en: "Peace at home matters more than winning. Feelings are weighed, softened and offered politely.",
    es: "La paz en casa importa más que tener razón. Las emociones se pesan, se suavizan y se ofrecen con educación.",
  },
  scorpio: {
    en: "Feelings run deep and are rarely shown. Trust is given slowly and completely; betrayal is not forgotten.",
    es: "Las emociones van hondas y rara vez se enseñan. La confianza se da despacio y por completo; la traición no se olvida.",
  },
  sagittarius: {
    en: "Emotional health needs room to roam. Optimism returns quickly, and heavy moods are answered with a journey or a joke.",
    es: "La salud emocional necesita espacio para moverse. El optimismo vuelve pronto, y a los ánimos pesados se responde con un viaje o una broma.",
  },
  capricorn: {
    en: "Feelings are kept in good order and seldom indulged. Love is shown through reliability more than words.",
    es: "Las emociones se mantienen en orden y pocas veces se consienten. El amor se demuestra con fiabilidad más que con palabras.",
  },
  aquarius: {
    en: "A cool, observant heart that needs space. Friendship is the native form of affection.",
    es: "Un corazón fresco y observador que necesita espacio. La amistad es su forma natural de querer.",
  },
  pisces: {
    en: "A porous, compassionate heart. It feels what others feel and needs solitude, music or prayer to wring itself out.",
    es: "Un corazón poroso y compasivo. Siente lo que sienten los demás y necesita soledad, música u oración para escurrirse.",
  },
};

export const RISING: Record<SignKey, Bi> = {
  aries: { en: "First impression: direct, quick, ready to move.", es: "Primera impresión: directa, rápida, lista para moverse." },
  taurus: { en: "First impression: calm, solid, unhurried.", es: "Primera impresión: serena, sólida, sin prisa." },
  gemini: { en: "First impression: talkative, alert, hard to pin down.", es: "Primera impresión: habladora, despierta, difícil de encasillar." },
  cancer: { en: "First impression: gentle, guarded, quietly attentive.", es: "Primera impresión: suave, reservada, atenta en silencio." },
  leo: { en: "First impression: warm, proud, impossible to miss.", es: "Primera impresión: cálida, orgullosa, imposible de pasar por alto." },
  virgo: { en: "First impression: neat, modest, observant.", es: "Primera impresión: pulcra, modesta, observadora." },
  libra: { en: "First impression: gracious, agreeable, well turned out.", es: "Primera impresión: amable, conciliadora, bien presentada." },
  scorpio: { en: "First impression: intense, private, watchful.", es: "Primera impresión: intensa, reservada, vigilante." },
  sagittarius: { en: "First impression: open, cheerful, restless.", es: "Primera impresión: abierta, alegre, inquieta." },
  capricorn: { en: "First impression: serious, composed, older than their years.", es: "Primera impresión: seria, contenida, mayor de lo que marcan sus años." },
  aquarius: { en: "First impression: friendly, detached, a little unusual.", es: "Primera impresión: cordial, distante, algo fuera de lo común." },
  pisces: { en: "First impression: soft, dreamy, hard to read.", es: "Primera impresión: suave, soñadora, difícil de leer." },
};

/** What each remaining planet speaks about. */
export const DOMAIN: Record<Exclude<BodyKey, "sun" | "moon">, Bi> = {
  mercury: { en: "How the mind works and speaks", es: "Cómo piensa y cómo habla" },
  venus: { en: "What is loved, and how", es: "Qué se quiere, y cómo" },
  mars: { en: "How anger and effort are spent", es: "Cómo se gastan el enfado y el esfuerzo" },
  jupiter: { en: "Where luck and growth are sought", es: "Dónde se buscan la suerte y el crecimiento" },
  saturn: { en: "Where duty weighs and discipline is learned", es: "Dónde pesa el deber y se aprende la disciplina" },
  uranus: { en: "Where their generation broke with custom", es: "Dónde su generación rompió con la costumbre" },
  neptune: { en: "What their generation dreamed of", es: "Con qué soñó su generación" },
  pluto: { en: "What their generation had to transform", es: "Qué tuvo que transformar su generación" },
};

/** The manner a sign lends to any planet. Completes "<domain>: …". */
export const MANNER: Record<SignKey, Bi> = {
  aries: { en: "directly, impatiently, by acting first", es: "de frente, con impaciencia, actuando primero" },
  taurus: { en: "slowly, concretely, with an eye for what lasts", es: "despacio, en concreto, con ojo para lo que dura" },
  gemini: { en: "quickly, playfully, through words and variety", es: "con rapidez y juego, a través de la palabra y la variedad" },
  cancer: { en: "protectively, by memory and by instinct", es: "protegiendo, desde la memoria y el instinto" },
  leo: { en: "wholeheartedly, with pride and a sense of occasion", es: "de todo corazón, con orgullo y sentido de la ocasión" },
  virgo: { en: "carefully, precisely, in service of something useful", es: "con cuidado y precisión, al servicio de algo útil" },
  libra: { en: "gracefully, fairly, with the other person in mind", es: "con gracia y equidad, pensando en la otra persona" },
  scorpio: { en: "intensely, privately, all or nothing", es: "con intensidad, en privado, a todo o nada" },
  sagittarius: { en: "broadly, frankly, in search of meaning", es: "a lo grande, con franqueza, en busca de sentido" },
  capricorn: { en: "patiently, strategically, with respect for hard work", es: "con paciencia y estrategia, respetando el trabajo duro" },
  aquarius: { en: "independently, on principle, a step ahead of the time", es: "con independencia, por principios, un paso por delante de su tiempo" },
  pisces: { en: "intuitively, gently, without firm edges", es: "con intuición y suavidad, sin bordes definidos" },
};

/** Approximate years a slow planet spends in one sign — shown as context. */
export const YEARS_PER_SIGN: Partial<Record<BodyKey, number>> = {
  jupiter: 1,
  saturn: 2.5,
  uranus: 7,
  neptune: 14,
  pluto: 20,
};

export const ELEMENT_TEXT: Record<ElementKey, Bi> = {
  fire: {
    en: "Fire leads: energy, conviction and appetite for risk come before caution.",
    es: "Manda el fuego: la energía, la convicción y el gusto por el riesgo van antes que la cautela.",
  },
  earth: {
    en: "Earth leads: practical sense, patience and attention to what can be touched and counted.",
    es: "Manda la tierra: sentido práctico, paciencia y atención a lo que se puede tocar y contar.",
  },
  air: {
    en: "Air leads: ideas, conversation and connection matter more than possession.",
    es: "Manda el aire: las ideas, la conversación y el vínculo importan más que la posesión.",
  },
  water: {
    en: "Water leads: feeling, memory and loyalty steer decisions more than argument does.",
    es: "Manda el agua: el sentimiento, la memoria y la lealtad guían las decisiones más que los argumentos.",
  },
};

export const MODALITY_TEXT: Record<ModalityKey, Bi> = {
  cardinal: {
    en: "Mostly cardinal signs: a chart that starts things.",
    es: "Predominan los signos cardinales: una carta que pone las cosas en marcha.",
  },
  fixed: {
    en: "Mostly fixed signs: a chart that holds its ground.",
    es: "Predominan los signos fijos: una carta que se mantiene en su sitio.",
  },
  mutable: {
    en: "Mostly mutable signs: a chart that adapts.",
    es: "Predominan los signos mutables: una carta que se adapta.",
  },
};

/** Noun for each body, used to build aspect sentences. */
export const THEME: Record<BodyKey, Bi> = {
  sun: { en: "sense of self", es: "sentido de identidad" },
  moon: { en: "emotional needs", es: "necesidades emocionales" },
  mercury: { en: "way of thinking", es: "manera de pensar" },
  venus: { en: "affections", es: "afectos" },
  mars: { en: "drive", es: "empuje" },
  jupiter: { en: "optimism", es: "optimismo" },
  saturn: { en: "sense of duty", es: "sentido del deber" },
  uranus: { en: "need for freedom", es: "necesidad de libertad" },
  neptune: { en: "imagination", es: "imaginación" },
  pluto: { en: "intensity", es: "intensidad" },
};

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** One-line reading of a natal aspect. */
export function aspectText(a: BodyKey, b: BodyKey, type: AspectKey, lang: Lang) {
  const A = THEME[a][lang];
  const B = THEME[b][lang];
  const en: Record<AspectKey, string> = {
    conjunction: `${cap(A)} and ${B} are fused: one rarely acts without the other.`,
    trine: `${cap(A)} and ${B} flow together without effort.`,
    sextile: `${cap(A)} and ${B} help each other when given the chance.`,
    square: `${cap(A)} and ${B} grind against each other, and the friction produces results.`,
    opposition: `${cap(A)} and ${B} pull in opposite directions and have to be balanced.`,
  };
  const es: Record<AspectKey, string> = {
    conjunction: `${cap(A)} y ${B} van fundidos: rara vez actúa uno sin el otro.`,
    trine: `${cap(A)} y ${B} fluyen juntos sin esfuerzo.`,
    sextile: `${cap(A)} y ${B} se ayudan cuando se les da ocasión.`,
    square: `${cap(A)} y ${B} rozan entre sí, y de esa fricción salen resultados.`,
    opposition: `${cap(A)} y ${B} tiran en direcciones opuestas y hay que equilibrarlos.`,
  };
  return (lang === "es" ? es : en)[type];
}

/** One-line reading of an aspect between two people's charts. */
export function synastryText(nameA: string, a: BodyKey, nameB: string, b: BodyKey, type: AspectKey, lang: Lang) {
  const A = THEME[a][lang];
  const B = THEME[b][lang];
  if (lang === "es") {
    const left = `${cap(A)} de ${nameA}`;
    const right = `${B} de ${nameB}`;
    const es: Record<AspectKey, string> = {
      conjunction: `${left} y ${right} caen en el mismo punto: se reconocen de inmediato.`,
      trine: `${left} y ${right} se entienden sin esfuerzo.`,
      sextile: `${left} y ${right} se apoyan con naturalidad.`,
      square: `${left} y ${right} chocan: un vínculo que exige y que marca.`,
      opposition: `${left} y ${right} se miran de frente: atracción y pulso a la vez.`,
    };
    return es[type];
  }
  const left = `${nameA}’s ${A}`;
  const right = `${nameB}’s ${B}`;
  const en: Record<AspectKey, string> = {
    conjunction: `${left} and ${right} land on the same point: instant recognition.`,
    trine: `${left} and ${right} understand each other without effort.`,
    sextile: `${left} and ${right} support each other naturally.`,
    square: `${left} and ${right} clash: a bond that demands something and leaves a mark.`,
    opposition: `${left} and ${right} face each other: attraction and tug-of-war at once.`,
  };
  return en[type];
}

export const SYNASTRY_TONE: Record<"easy" | "mixed" | "charged" | "quiet", Bi> = {
  easy: {
    en: "Mostly easy contacts. These two charts speak a similar language; the bond would have felt natural, sometimes to the point of being taken for granted.",
    es: "Predominan los contactos fáciles. Estas dos cartas hablan un idioma parecido; el vínculo se habría sentido natural, a veces hasta darse por sentado.",
  },
  mixed: {
    en: "A mixed picture. There is real common ground and real friction here: the kind of relationship that is remembered for both.",
    es: "Un panorama mixto. Hay terreno común de verdad y fricción de verdad: el tipo de relación que se recuerda por ambas cosas.",
  },
  charged: {
    en: "Mostly demanding contacts. These charts push on each other; such bonds are rarely comfortable and rarely forgettable.",
    es: "Predominan los contactos exigentes. Estas cartas se empujan mutuamente; vínculos así rara vez son cómodos y rara vez se olvidan.",
  },
  quiet: {
    en: "Few close contacts between these two charts. Whatever joined these two people, the planets say little about it.",
    es: "Pocos contactos estrechos entre estas dos cartas. Fuera lo que fuera lo que unió a estas dos personas, los planetas dicen poco de ello.",
  },
};
