"use strict";

// Single player: changes the game's text as it loads, for every language, without touching the language files
// (so updates from the original game still merge cleanly).
// - the Wizard no longer says he made the game or gives the original email address
// - the loading screen's "email us" help line is removed

const WIZARD_KEY = "interface.interaction.well_hello_there_i_m_wizard_i_made_this_game";
const WIZARD = {
	en: "Well, hello there! I'm Wizard. I don't know who made this land, but it's fantastic! Hope you enjoy it.",
	ar: "حسنًا، مرحبًا! أنا Wizard. لا أعرف من صنع هذه الأرض، لكنها رائعة! أتمنى أن تستمتع بها.",
	bg: "Е, здравей! Аз съм Wizard. Не знам кой е създал тази земя, но е фантастична! Надявам се да ти хареса.",
	cs: "No ahoj! Jsem Wizard. Nevím, kdo stvořil tuhle zemi, ale je fantastická! Doufám, že se ti tu bude líbit.",
	da: "Nå, hej med dig! Jeg er Wizard. Jeg ved ikke, hvem der skabte dette land, men det er fantastisk! Jeg håber, du nyder det.",
	de: "Na, hallo! Ich bin Wizard. Ich weiß nicht, wer dieses Land erschaffen hat, aber es ist fantastisch! Viel Spaß hier.",
	el: "Λοιπόν, γεια σου! Είμαι ο Wizard. Δεν ξέρω ποιος έφτιαξε αυτή τη χώρα, αλλά είναι φανταστική! Ελπίζω να την απολαύσεις.",
	es: "¡Vaya, hola! Soy Wizard. No sé quién creó esta tierra, ¡pero es fantástica! Espero que la disfrutes.",
	"es-419": "¡Vaya, hola! Soy Wizard. No sé quién creó esta tierra, ¡pero es fantástica! Espero que la disfrutes.",
	fi: "No hei sinä! Olen Wizard. En tiedä, kuka tämän maan teki, mutta se on fantastinen! Toivottavasti viihdyt.",
	fil: "Aba, kumusta! Ako si Wizard. Hindi ko alam kung sino ang gumawa ng lupaing ito, pero kamangha-mangha ito! Sana ay mag-enjoy ka.",
	fr: "Eh bien, bonjour ! Je suis Wizard. Je ne sais pas qui a créé cette terre, mais elle est fantastique ! J'espère qu'elle te plaira.",
	hu: "Nahát, szia! Wizard vagyok. Nem tudom, ki teremtette ezt a földet, de fantasztikus! Remélem, jól fogod érezni magad.",
	id: "Wah, halo! Aku Wizard. Aku tidak tahu siapa yang membuat negeri ini, tapi negeri ini luar biasa! Semoga kamu menikmatinya.",
	it: "Beh, ciao! Sono Wizard. Non so chi abbia creato questa terra, ma è fantastica! Spero che ti piaccia.",
	ja: "やあ、こんにちは！私はWizard。この地を誰が作ったのかは知らないけれど、素晴らしい場所だよ！楽しんでくれるといいな。",
	ko: "오, 안녕하세요! 저는 Wizard예요. 누가 이 땅을 만들었는지는 모르지만, 정말 환상적이에요! 즐거운 시간 보내세요.",
	ms: "Wah, helo! Saya Wizard. Saya tidak tahu siapa yang mencipta tanah ini, tetapi ia sungguh hebat! Semoga anda menikmatinya.",
	nl: "Nou, hallo daar! Ik ben Wizard. Ik weet niet wie dit land heeft gemaakt, maar het is fantastisch! Veel plezier.",
	no: "Vel, hei der! Jeg er Wizard. Jeg vet ikke hvem som skapte dette landet, men det er fantastisk! Håper du koser deg.",
	pl: "No cześć! Jestem Wizard. Nie wiem, kto stworzył tę krainę, ale jest fantastyczna! Mam nadzieję, że ci się spodoba.",
	"pt-BR": "Ora, olá! Eu sou o Wizard. Não sei quem criou esta terra, mas ela é fantástica! Espero que você aproveite.",
	"pt-PT": "Ora, olá! Sou o Wizard. Não sei quem criou esta terra, mas é fantástica! Espero que gostes.",
	ro: "Ei, salut! Sunt Wizard. Nu știu cine a creat acest tărâm, dar e fantastic! Sper să te bucuri de el.",
	ru: "Ну, привет! Я Wizard. Не знаю, кто создал эту землю, но она фантастическая! Надеюсь, тебе понравится.",
	sv: "Nämen hej där! Jag är Wizard. Jag vet inte vem som skapade det här landet, men det är fantastiskt! Hoppas du trivs.",
	th: "อ้าว สวัสดี! ฉันคือ Wizard ฉันไม่รู้ว่าใครสร้างดินแดนนี้ แต่มันยอดเยี่ยมมาก! หวังว่าคุณจะสนุกนะ",
	tr: "Vay, merhaba! Ben Wizard. Bu diyarı kimin yarattığını bilmiyorum ama harika! Umarım keyfini çıkarırsın.",
	uk: "Ну, привіт! Я Wizard. Не знаю, хто створив цю землю, але вона фантастична! Сподіваюся, тобі сподобається.",
	vi: "Ồ, xin chào! Tôi là Wizard. Tôi không biết ai đã tạo ra vùng đất này, nhưng nó thật tuyệt vời! Mong bạn sẽ thích nó.",
	"zh-Hans": "哎呀，你好！我是 Wizard。我不知道是谁创造了这片土地，但它真是太棒了！希望你玩得开心。",
	"zh-Hant": "哎呀，你好！我是 Wizard。我不知道是誰創造了這片土地，但它真是太棒了！希望你玩得開心。",
};

// Loading screen lines: the part that says to email the original developers is dropped
const LOADING_KEYS = ["game.loading.resources", "game.loading.ready"];
const LINE_BREAK = /<br\s*\/?>\s*<br\s*\/?>/i;

function apply(language, entries) {
	for (const id of Object.keys(entries)) {
		let text = entries[id];
		if (id == WIZARD_KEY) text = WIZARD[language] || WIZARD.en;
		else if (LOADING_KEYS.includes(id))
			text = text
				.split(LINE_BREAK)
				.filter((part) => !part.includes("@adventure.land"))
				.join("<br /><br />");
		entries[id] = text;
	}
	return entries;
}

module.exports = { WIZARD, apply };
