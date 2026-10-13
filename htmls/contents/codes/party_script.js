// ADVENTURE LAND / FANTASY LAND - PARTY AIO (Default Party Script)
//
// SET-UP: type your character names into LEADER, FOLLOWERS and ROLES
// below, then press Save. Your names are kept in your own "Party AIO"
// slot. Start this script on every character in the party (use
// load_code("Party AIO") or pick the slot in the CODE window).
// With LEADER left empty every character just hunts on its own.
// "Reset to latest" in the code menu loads the newest version of this
// script into the editor (copy your names across, then Save).
//
// One script for the whole party. Run this same script on every
// character (leader, followers and priest). Fill in the PARTY and
// ROLES sections below and each character works out what to do.
//
// HOW IT WORKS
//
// - The LEADER picks the monster (manual rotation or Daisy
//   assignments) and hunts exactly like the old hunter script.
// - FOLLOWERS join the leader's party, follow the leader around the
//   world and attack the same monster the leader is attacking.
// - Each character fights by its ROLE:
//      Mage, Ranger, Priest       - ranged, with smart kiting
//      Warrior, Paladin, Rogue    - melee, no kiting
// - The PRIEST follows the leader and heals the party first, then
//   helps attack when nobody needs healing. The priest has its own
//   potion restock amounts.
// - The MERCHANT runs no code. Its name is just where everybody sends
//   loot and gold.
//
// KEPT FROM THE HUNTER SCRIPT (every character does these for itself)
//
// - HP/MP potion use and potion restocking (town teleport)
// - Auto-loot
// - Inventory cleanup: loot + gold to the merchant, then the bank
// - Banks configured items and individual item IDs (the Bank Items List)
// - Protects tokens / collectibles
// - Runs the compounder when the bank is full
// - Auto-respawn
// - Stuck pathing / stuck combat detection and the 1 minute watchdog
// - Timed event monsters (leader decides, followers come along)
//
// TAKEN FROM THE CONDITIONAL BEHAVIOR MODEL REPO
//
// - Party setup: the leader invites the followers every few seconds,
//   followers accept the leader's invite (and ask to join if they are
//   not in a party), the leader accepts requests from followers
// - Following: close by = walk a third of the way to the leader each
//   tick, far away = smart_move to the leader (works across maps)
// - Priest heals: heal the party member whose HP % is lowest when it
//   drops under the heal %, and Party Heal when several are low


// CONFIGURATION
//

// ================================================================
// PARTY
// ================================================================
//
// LEADER     - the character everyone follows. It chooses the monster.
// FOLLOWERS  - everyone else in the party (not the merchant).
//
// Names must match the character names (capital letters are ignored).

var LEADER = "";

var FOLLOWERS = [
    // "Name1",
    // "Name2",
];


// ================================================================
// ROLES
// ================================================================
//
// Put each character's name under its role. This sets how it fights:
//
//   WARRIOR, PALADIN, ROGUE  - melee: walks up and hits, no kiting
//   MAGE, RANGER             - ranged: keeps its distance and kites
//   PRIEST                   - ranged + heals the party first
//   MERCHANT                 - no code; loot and gold are sent here
//
// A character missing from ROLES uses its class from the game (a
// mage plays as MAGE and so on).
//
// A character listed here that runs this script also follows the
// leader, even if you forget to add it to FOLLOWERS. The leader only
// sends invites to the names in FOLLOWERS, so commenting a name out of
// FOLLOWERS stops it being invited.

var ROLES = {
    WARRIOR:  [],
    PALADIN:  [],
    ROGUE:    [],
    MAGE:     [],
    RANGER:   [],
    PRIEST:   [],
    MERCHANT: []
};


// ================================================================
// FOLLOW SETTINGS
// ================================================================
//
// FOLLOW_DISTANCE      - followers walk towards the leader when further
//                        away than this (repo used 75)
// FOLLOW_FAR_DISTANCE  - further than this (or on another map) they
//                        smart_move to the leader instead of walking
// ASSIST_RANGE         - followers only attack monsters within this
//                        distance of the leader
// LEASH_DISTANCE       - while fighting, a follower that has kited
//                        further than this from the leader goes back
// FOLLOWERS_DEFEND     - true = followers also fight anything hitting
//                        them or the party when the leader has no target
// PARTY_INVITE_SECONDS - how often party invites / requests are re-sent
// PARTY_STATE_SECONDS  - how often the leader tells the followers which
//                        monster it is hunting

var FOLLOW_DISTANCE = 75;
var FOLLOW_FAR_DISTANCE = 300;
var ASSIST_RANGE = 350;
var LEASH_DISTANCE = 250;
var FOLLOWERS_DEFEND = true;
var PARTY_INVITE_SECONDS = 5;
var PARTY_STATE_SECONDS = 1;

// FOLLOW_REPATH_DISTANCE  - a follower smart_moving to the leader's old
//                           spot starts a new path when the leader has
//                           moved further than this from it
// LEADER_WAITS_FOR_PARTY  - true = the leader holds back from starting a
//                           fight until every follower has caught up
//                           (it still fights anything attacking it)
// PARTY_GATHER_DISTANCE   - followers closer than this count as caught up
// PARTY_WAIT_MAX_SECONDS  - the longest the leader waits (a follower that
//                           is restocking in town won't hold it up forever)

// MATCH_PARTY_SPEED  - true = while travelling the leader slows down to
//                      just under the slowest follower's speed so nobody
//                      falls behind (repo: action.goto + cruise)
// FOLLOWERS_PULL     - false = followers only attack what the leader is
//                      attacking (or what is attacking the party), so the
//                      fight starts when the leader starts it.
//                      true = followers may also start on the leader's
//                      monster type near the leader by themselves

var MATCH_PARTY_SPEED = true;
var FOLLOWERS_PULL = false;

var FOLLOW_REPATH_DISTANCE = 250;
var LEADER_WAITS_FOR_PARTY = true;
var PARTY_GATHER_DISTANCE = 300;
var PARTY_WAIT_MAX_SECONDS = 120;

// MEETING SPOT
//
// The leader picks ONE spot for the monster it is going to hunt and tells
// the party "I'm going here, meet you there". Followers path straight to
// that spot (not to the leader), and the leader holds off starting a
// fight until everyone who is on their way has arrived. Followers that
// are busy in town (potions / banking) are not waited for - they come to
// the spot when they are done.
//
// MEET_RADIUS  - a follower within this distance of the spot has arrived

var MEET_RADIUS = 150;


// ================================================================
// PRIEST SETTINGS
// ================================================================
//
// PRIEST_HEAL_PERCENT        - heal a party member at or below this HP %
// PRIEST_PARTY_HEAL_PERCENT  - members at or below this HP % count as
//                              "low" for Party Heal
// PRIEST_PARTY_HEAL_COUNT    - use Party Heal when this many are low
// PRIEST_ATTACKS             - true = attack the leader's target when
//                              nobody needs healing
//
// The priest's own potion restock amounts (it carries more):

var PRIEST_HEAL_PERCENT = 75;
var PRIEST_PARTY_HEAL_PERCENT = 60;
var PRIEST_PARTY_HEAL_COUNT = 2;
var PRIEST_ATTACKS = true;

var PRIEST_MIN_HP_POTIONS = 100;
var PRIEST_MIN_MP_POTIONS = 200;
var PRIEST_TARGET_HP_POTIONS = 10000;
var PRIEST_TARGET_MP_POTIONS = 20000;


// ================================================================
// SKILL SETTINGS
// ================================================================
//
// Every character checks which of its class skills it can use right now
// (level, MP, cooldown, the right weapon, any item the skill uses up)
// and uses them when they make sense. Set a skill to false to never use
// it. Skills from other classes are ignored automatically.
//
// USE_SKILLS               - false = plain attacks only (heals still work)
// SKILL_MP_RESERVE_PERCENT - damage skills are not used below this MP %,
//                            so there is always MP left for taunts / heals

var USE_SKILLS = true;
var SKILL_MP_RESERVE_PERCENT = 30;

var SKILLS = {

    // WARRIOR
    taunt: true,        // pull a monster off a party member onto the warrior
    agitate: true,      // taunt everything nearby (only if nothing idle is in range)
    hardshell: true,    // below 40% HP while being hit
    warcry: true,       // party buff when a fight starts
    charge: true,       // speed boost while travelling
    stomp: true,        // stun 2+ monsters on the party (needs a basher)
    cleave: true,       // 3+ monsters on the party close by (needs an axe / scythe)

    // MAGE
    energize: true,     // give MP to a party member who is low
    reflection: true,   // shield the member the monsters are hitting
    burst: false,       // spends ALL mana - only to finish a big monster

    // RANGER
    huntersmark: true,  // mark the target for extra damage
    supershot: true,    // big hit from long range
    "3shot": true,      // 3+ monsters on the party
    "5shot": true,      // 5+ monsters on the party

    // ROGUE
    quickstab: true,    // extra stab (needs a dagger)
    quickpunch: true,   // extra punch (needs a fist weapon)
    mentalburst: true,  // magic hit
    rspeed: true,       // speed buff on party members

    // PRIEST (heal and Party Heal are always on)
    curse: true,        // target takes more / deals less damage
    darkblessing: true, // party damage buff when a fight starts

    // PALADIN
    selfheal: true,     // below 50% HP
    smash: true,        // extra hit (needs a mace)
    purify: true        // 2000 pure damage on a big monster
};


// HUNT SETTINGS
//
// Only the LEADER uses these. Followers hunt whatever the leader hunts.
//
// GET_ASSIGNMENT  - true  = the leader does Daisy monster hunts
//                   false = the leader uses the manual list below

var GET_ASSIGNMENT = false;


// MANUAL MONSTER ROTATION
//
// Each entry is:
// { type: "monster_name", kills: number }
//
// The party will kill the configured number of each monster,
// then move to the next one. After the final monster it loops
// back to the first. Kills by followers count too.
//
// Example:
// Squig 100 -> Goo 100 -> Bee 100 -> Squig 100 -> ...
//
// Remember a comma after each entry when more than one line is active.

var MANUAL_MONSTER_LIST = [
	
		 { type: "armadillo", kills: 500 },
		// { type: "arcticbee", kills: 100 }
		// { type: "bat", kills: 100 }
		// { type: "bbpompom", kills: 100 }
		 { type: "bee", kills: 1000 },
		// { type: "bigbird", kills: 100 }
		// { type: "bgoo", kills: 100 }
		// { type: "bluefairy", kills: 100 }
		// { type: "boar", kills: 100 }
		// { type: "booboo", kills: 100 }
		// { type: "bscorpion", kills: 100 }
		// { type: "chestm", kills: 100 }
		// { type: "crab", kills: 100 }
		// { type: "crabx", kills: 100 }
		// { type: "crabxx", kills: 100 }
		// { type: "cgoo", kills: 100 }
		// { type: "croc", kills: 100 }
		// { type: "cutebee", kills: 100 }
		// { type: "dknight2", kills: 100 }
		// { type: "dryad", kills: 100 }
		// { type: "eelemental", kills: 100 }
		// { type: "ent", kills: 100 }
		// { type: "felemental", kills: 100 }
		// { type: "fireroamer", kills: 100 }
		// { type: "fvampire", kills: 100 }
		// { type: "ghost", kills: 100 }
		// { type: "goo", kills: 100 }
		// { type: "goldenbat", kills: 100 }
		// { type: "greenfairy", kills: 100 }
		// { type: "greenjr", kills: 100 }
		// { type: "grinch", kills: 100 }
		// { type: "gscorpion", kills: 100 }
		// { type: "harpy", kills: 100 }
		// { type: "hen", kills: 100 }
		// { type: "iceroamer", kills: 100 }
		// { type: "icegolem", kills: 100 }
		// { type: "jrat", kills: 100 }
		// { type: "jr", kills: 100 }
		// { type: "ligerx", kills: 100 }
		// { type: "minimush", kills: 100 }
		// { type: "mole", kills: 100 }
		// { type: "mrgreen", kills: 100 },
		// { type: "mrpumpkin", kills: 100 },
		// { type: "mvampire", kills: 100 }
		// { type: "mummy", kills: 100 }
		// { type: "nelemental", kills: 100 }
		// { type: "nerfedbat", kills: 100 }
		// { type: "nerfedmummy", kills: 100 }
		// { type: "odino", kills: 100 },
		// { type: "oneeye", kills: 100 },
		// { type: "osnake", kills: 100 },
		// { type: "phoenix", kills: 100 },
		// { type: "pinkgoblin", kills: 100 },
		// { type: "plantoid", kills: 100 },
		// { type: "poisio", kills: 100 },
		// { type: "porcupine", kills: 100 },
		// { type: "pppompom", kills: 100 }
		// { type: "prat", kills: 100 }
		 { type: "rat", kills: 1000 },
		// { type: "redfairy", kills: 100 }
		// { type: "rgoo", kills: 100 }
		// { type: "rharpy", kills: 100 }
		// { type: "rooster", kills: 100 }
		// { type: "scorpion", kills: 100 }
		// { type: "skeletor", kills: 100 }
		// { type: "slenderman", kills: 100 }
		 { type: "spider", kills: 100 },
		// { type: "spiderbl", kills: 100 }
		// { type: "spiderbr", kills: 100 }
		// { type: "spiderr", kills: 100 }
		 { type: "squig", kills: 1000 },
		// { type: "squigtoad", kills: 100 }
		// { type: "sparkbot", kills: 100 }
		// { type: "stompy", kills: 100 }
		// { type: "stoneworm", kills: 100 }
		// { type: "targetron", kills: 100 }
		 { type: "tortoise", kills: 100 }
		// { type: "welemental", kills: 100 }
		// { type: "wolf", kills: 100 }
		// { type: "wolfie", kills: 100 }
		// { type: "xscorpion", kills: 100 }
];

var MANUAL_MONSTER_INDEX = 0;
var MANUAL_MONSTER_KILLS = 0;
var MANUAL_MONSTER_LAST_KILL = 0;


// TIMED EVENT MONSTERS (ALWAYS WATCHED)
//
// These monsters only appear during game events (Mr Pumpkin and Mr Green
// at Halloween, for example). In Fantasy Land each one can be switched on
// all year in the Holiday Events menu. Anything listed here is watched ALL
// the time, whether the leader is on a Daisy assignment or the manual
// rotation above.
//
// The moment one of them is alive, the leader drops what it is doing and
// goes to kill it, and the followers come along. When it is dead the party
// carries on exactly where it left off (the assignment / manual kill count
// is untouched).
//
// If two are alive at once the leader finishes the one it started with
// (or the first one in this list) before starting the second.
//
// Remove or comment out a line to stop chasing that monster.

var EVENT_MONSTERS_ENABLED = true;

var EVENT_MONSTERS = [
    { type: "mrpumpkin" },   // Halloween
    { type: "mrgreen" },   // Halloween
   // { type: "grinch" },   // Holiday season
   // { type: "snowman" },   // Holiday season
   // { type: "dragold" },   // Lunar New Year
   // { type: "pinkgoo" },   // Valentine's
   // { type: "wabbit" },   // Egg hunt
   // { type: "crabxx" },   // Giga Crab event
   // { type: "franky" },   // Franky event
   // { type: "icegolem" }    // Ice Golem event
];

// The event monster currently being hunted (kept until it dies)
var current_event_type = null;

// LOOTING AFTER AN EVENT MONSTER DIES
//
// When an event monster is killed the character stays and collects the
// chest(s) before going back to normal hunting.
//
//   EVENT_LOOT_SECONDS      - the longest it will spend looting
//   EVENT_LOOT_MIN_SECONDS  - it always waits at least this long for the
//                             chest to appear
//   EVENT_LOOT_REACH        - walks towards a chest that is further away
//                             than this

var EVENT_LOOT_SECONDS = 25;
var EVENT_LOOT_MIN_SECONDS = 4;
var EVENT_LOOT_REACH = 120;

var event_loot_until = 0;
var event_loot_started = 0;
var event_loot_spot = null;
var event_loot_cleanup_done = false;
 

// POTION SETTINGS 
 
// Drink a potion when HP / MP drops below this % of the maximum.
// (A percentage works for every class, whatever its max HP / MP.)
var HP_USE_PERCENT = 65;
var MP_USE_PERCENT = 40;

// Restock when below MIN, buy back up to TARGET. The priest uses the
// PRIEST_ amounts in PRIEST SETTINGS above instead.
 
var MIN_HP_POTIONS = 30; 
var MIN_MP_POTIONS = 30; 
 
var TARGET_HP_POTIONS = 5000; 
var TARGET_MP_POTIONS = 5000; 
 

// INVENTORY DESTINATION SETTINGS 
 
var BANK_POTIONS = false; 
var BANK_TOKENS_COLLECTABLES = true; 
var BANK_STACKABLES = true; 
var BANK_UPGRADABLES = false; 
var BANK_COMPOUNDABLES = true; 
var BANK_OTHER_NON_STACKABLES = false; 
 

// INDIVIDUAL ITEMS TO BANK 
 
// The list lives in the "Bank Items List" code slot (the default
// Bank Items List in the CODE menu) so every character shares one copy.
// Edit it there (it is just a list of BANK_ITEM_IDS.push("itemid");
// lines). It is read when this script starts, so restart the script
// after changing the list. If the list is empty, nothing extra is banked.
var BANK_LIST_CODE = "Bank Items List";

var BANK_ITEM_IDS = [];

try {
    load_code(BANK_LIST_CODE);
} catch (e) {
    game_log("BANK LIST: could not load " + BANK_LIST_CODE + " (" + e + ")");
}

game_log("BANK LIST: " + BANK_ITEM_IDS.length + " item id(s) from " + BANK_LIST_CODE + ".");


// PENNYWORTH SETTINGS 
 
var MERCHANT_POTIONS = false; 
var MERCHANT_TOKENS_COLLECTABLES = false; 
var MERCHANT_STACKABLES = false; 
// Non-stackable items are split into three groups:
//   UPGRADABLES            - weapons / armor etc (items with an upgrade path)
//   COMPOUNDABLES          - rings / amulets / belts / orbs etc (3 combine into 1)
//   OTHER_NON_STACKABLES   - everything else that doesn't stack (materials etc)
var MERCHANT_UPGRADABLES = true; 
var MERCHANT_COMPOUNDABLES = false; 
var MERCHANT_OTHER_NON_STACKABLES = true; 

// Also send gold to PennyWorth whenever items are sent to him.
// GOLD_TO_KEEP stays on this character (potion restocking is paid
// from this, so leave some if the hunter buys its own potions).
// Only the gold above this amount is sent; below it, nothing is sent.
var SEND_GOLD_TO_MERCHANT = true;
var GOLD_TO_KEEP = 1000000;
 

// MANUAL MODE 
 
var MANUAL_MODE_IF_NOTHING_CONFIGURED = true; 
 
var MIN_EMPTY_SLOTS = 1; 
 

// RANGED / SMART KITING SETTINGS 
 
var RANGED_MAGIC_ATTACKS = false; 
 
var RANGE_BUFFER = 10; 
var MIN_SAFE_DISTANCE = 15; 
var KITE_STEP = 80; 
var RANGE_TOLERANCE = 15; 
 
var COMBAT_INTERVAL = 250; 
 
var STRAFE_SWITCH_TIME = 2500; 
 

// STUCK / PATHING SETTINGS 
 
var PATH_RETRY_DELAY = 8000; 
 
var PATH_STUCK_TIME = 6000; 
 
var PATH_PROGRESS_DISTANCE = 25; 
 
var PATH_RELOCATE_DISTANCE = 200; 
 
var COMBAT_STUCK_TIME = 4000; 
 
var COMBAT_PROGRESS_DISTANCE = 15; 
 
var COMBAT_RELOCATE_DISTANCE = 150; 


// STUCK WATCHDOG (TOWN TELEPORT)
//
// Only watches while the character is walking to a monster (smart_move)
// or fighting one. If the x/y position has not changed for
// STUCK_TELEPORT_SECONDS, it stops the movement, town-teleports, and the
// normal hunt loop then paths to the monster again.
//
// While fighting, landing hits on the monster counts as progress, so a
// ranged character standing still and killing things is NOT "stuck".
//
// It never runs during potion restocking, inventory cleanup, banking,
// PennyWorth, Daisy or respawning.

var STUCK_TELEPORT_ENABLED = true;
var STUCK_TELEPORT_SECONDS = 60;
var STUCK_POSITION_DISTANCE = 5;
var STUCK_CHECK_INTERVAL = 2000;


// COMPOUNDER (RUNS WHEN THE BANK IS FULL)
//
// While banking, if an item cannot be stored because the bank is full,
// the compounder runs: it compounds anything it can (inventory + bank),
// which turns 3 items into 1 and frees bank space. Banking then carries
// on where it left off, and the hunter returns to normal afterwards.
//
// It only ever runs from inside inventory cleanup / banking, never while
// hunting, so it cannot interrupt anything else.

var COMPOUND_WHEN_BANK_FULL = true;

// Max compounder runs during one banking trip (stops endless loops)
var COMPOUND_MAX_RUNS_PER_BANKING = 10;

var ENABLE_COMPOUND = true;

var MAX_LEVEL = 3;

var USE_BETTER_SCROLLS = true;

var GET_ITEMS_FROM_BANK = true;
var GET_SCROLLS_FROM_BANK = true;
var BUY_MISSING_SCROLLS = true;

var BANK_DESTINATION = "bank";

// Cue / Lucas compound area.
var CUE_DESTINATION = "compound";

// Location used when a scroll is missing.
var SCROLL_BUY_DESTINATION = "compound";

var SCROLL_BUY_QUANTITY = 1;

var RESERVED_EMPTY_SLOTS = 2;

var ACTION_DELAY = 1000;

var ENABLE_LOGS = true;




// ================================================================
// WORK OUT THIS CHARACTER'S PARTY PLACE AND ROLE
// ================================================================
//
// Runs once at start-up, after all the normal settings above.

var RANGED_ROLES = ["MAGE", "RANGER", "PRIEST"];

function same_name(a, b) {
    return String(a || "").toLowerCase() === String(b || "").toLowerCase();
}

function find_role(name) {

    for (var role in ROLES) {

        var names = ROLES[role];

        if (!Array.isArray(names)) {
            names = [names];
        }

        for (var n = 0; n < names.length; n++) {

            if (same_name(names[n], name)) {
                return role.toUpperCase();
            }
        }
    }

    // Not listed - use the character's class
    if (same_name(name, character.name) && character.ctype) {
        return String(character.ctype).toUpperCase();
    }

    return null;
}

function is_follower_name(name) {

    for (var f = 0; f < FOLLOWERS.length; f++) {

        if (same_name(FOLLOWERS[f], name)) {
            return true;
        }
    }

    return false;
}

// Listed under any role except MERCHANT?
function in_party_roles(name) {

    for (var role in ROLES) {

        if (role.toUpperCase() === "MERCHANT") continue;

        var names = ROLES[role];

        if (!Array.isArray(names)) {
            names = [names];
        }

        for (var n = 0; n < names.length; n++) {

            if (same_name(names[n], name)) {
                return true;
            }
        }
    }

    return false;
}

// Everyone the leader should invite: FOLLOWERS plus everyone in a
// fighting role (not the leader, not the merchant)
function all_follower_names() {

    var names = FOLLOWERS.slice();

    for (var role in ROLES) {

        if (role.toUpperCase() === "MERCHANT") continue;

        var list = ROLES[role];

        if (!Array.isArray(list)) {
            list = [list];
        }

        for (var n = 0; n < list.length; n++) {

            var name = list[n];

            if (
                name &&
                !same_name(name, LEADER) &&
                !names.some(function(x) { return same_name(x, name); })
            ) {
                names.push(name);
            }
        }
    }

    return names;
}

var MY_ROLE = find_role(character.name);
var IS_MERCHANT = MY_ROLE === "MERCHANT";
var IS_PRIEST = MY_ROLE === "PRIEST";
var IS_LEADER = !IS_MERCHANT && same_name(character.name, LEADER);
// Anyone listed in FOLLOWERS, or given a fighting role in ROLES, follows
// the leader (so a priest only listed under PRIEST still follows).
var IS_FOLLOWER =
    !IS_MERCHANT &&
    !IS_LEADER &&
    !!LEADER &&
    (is_follower_name(character.name) || in_party_roles(character.name));

// The merchant is whoever is in the MERCHANT role
var MERCHANT_NAME = "";

(function apply_role() {

    var merchants = ROLES.MERCHANT;

    if (!Array.isArray(merchants)) {
        merchants = [merchants];
    }

    MERCHANT_NAME = merchants[0] || "";

    // Fighting style comes from the role
    RANGED_MAGIC_ATTACKS = RANGED_ROLES.indexOf(MY_ROLE) !== -1;

    // Only the leader chooses monsters
    if (IS_FOLLOWER) {
        GET_ASSIGNMENT = false;
    }

    // The priest carries its own amount of potions
    if (IS_PRIEST) {
        MIN_HP_POTIONS = PRIEST_MIN_HP_POTIONS;
        MIN_MP_POTIONS = PRIEST_MIN_MP_POTIONS;
        TARGET_HP_POTIONS = PRIEST_TARGET_HP_POTIONS;
        TARGET_MP_POTIONS = PRIEST_TARGET_MP_POTIONS;
    }

    // No merchant to send to - just bank
    if (!MERCHANT_NAME) {
        SEND_GOLD_TO_MERCHANT = false;
    }

    game_log(
        "PARTY: " + character.name + " is " +
        (IS_MERCHANT ? "the MERCHANT (no code runs)" :
         IS_LEADER ? "the LEADER" :
         IS_FOLLOWER ? "a FOLLOWER of " + LEADER :
         "not in the party list - hunting solo") +
        (IS_MERCHANT ? "" :
         ", role " + (MY_ROLE || "unknown") + " (" +
         (RANGED_MAGIC_ATTACKS ? "ranged / kiting" : "melee") + ")")
    );

    if (!IS_MERCHANT) {

        game_log(
            "SETTINGS: HP potion below " + HP_USE_PERCENT +
            "%, MP potion below " + MP_USE_PERCENT +
            "%, restock under " + MIN_HP_POTIONS + " HP / " +
            MIN_MP_POTIONS + " MP potions."
        );
    }
})();


// ================================================================
// MANUAL MONSTER KILL HANDLER
// ================================================================
//
// The leader counts its own kills, plus kills the followers report
// for the monster in the current rotation slot.

function count_manual_kill() {

    if (
        GET_ASSIGNMENT ||
        current_event_type ||
        !MANUAL_MONSTER_LIST ||
        MANUAL_MONSTER_LIST.length === 0
    ) {
        return;
    }

    var current_manual_monster =
        MANUAL_MONSTER_LIST[
            MANUAL_MONSTER_INDEX
        ];

    if (!current_manual_monster) {
        return;
    }

    MANUAL_MONSTER_KILLS++;

    MANUAL_MONSTER_LAST_KILL =
        Date.now();

    if (
        MANUAL_MONSTER_KILLS >=
        current_manual_monster.kills
    ) {

        game_log(
            "HUNT: Completed " +
            current_manual_monster.kills +
            "x " +
            current_manual_monster.type +
            ". Moving to next monster."
        );

        MANUAL_MONSTER_KILLS = 0;

        MANUAL_MONSTER_INDEX++;

        if (
            MANUAL_MONSTER_INDEX >=
            MANUAL_MONSTER_LIST.length
        ) {

            MANUAL_MONSTER_INDEX = 0;

            game_log(
                "HUNT: Manual monster list complete - restarting from " +
                MANUAL_MONSTER_LIST[0].type +
                "."
            );

        }

        reset_path_state();
        reset_combat_stuck_state();

    }
}

function manual_monster_kill_handler(
    data,
    event
) {

    if (!data) {
        return;
    }

    if (
        data.actor != character.id
    ) {

        return;

    }

    if (
        data.kill !== true
    ) {
        return;
    }

    // FOLLOWER - tell the leader what was killed
    if (IS_FOLLOWER) {

        var killed = parent.entities[data.target];

        var killed_type =
            (killed && killed.mtype) ||
            (leader_state && leader_state.monster) ||
            null;

        if (killed_type) {

            send_cm(
                LEADER,
                { party_kill: killed_type }
            ).catch(function() { });
        }

        return;
    }

    // An event monster just died - stay and loot it
    if (current_event_type) {
        start_event_loot("kill");
    }

    count_manual_kill();
}


// REGISTER MANUAL MONSTER KILL HANDLER

game.on(
    "hit",
    manual_monster_kill_handler
);


// ================================================================
// STATE
// ================================================================

var working = false; 
var respawning = false; 
 
var strafe_direction = 1; 
var last_strafe_time = 0; 
var last_move_time = 0;
var MOVE_COOLDOWN = 150; 
 

// PATHING STATE 
 
var last_path_target = null; 
var last_path_attempt_time = 0; 
var last_path_x = null; 
var last_path_y = null; 
 

// COMBAT STUCK STATE 
 
var last_combat_target = null; 
var last_combat_x = null; 
var last_combat_y = null; 
var combat_no_progress_since = 0; 


// STUCK WATCHDOG STATE
//
// hunt_phase is "path" while a smart_move towards a monster is running,
// "combat" while a target is being fought, otherwise null.

var hunt_phase = null;
var unstick_busy = false;
var unstick_phase = null;
var unstick_map = null;
var unstick_x = 0;
var unstick_y = 0;
var unstick_since = 0;
var last_own_hit_time = 0;
 

// COUNT ITEMS IN INVENTORY 
 
function potion_count(item_name) { 
 
    var total = 0; 
 
    for (var i = 0; i < character.items.length; i++) { 
 
        var item = character.items[i]; 
 
        if (item && item.name === item_name) { 
            total += item.q || 1; 
        } 
    } 
 
    return total; 
} 
 

// CHECK IF ITEM IS EQUIPMENT 
 
function is_equipment(item) { 
 
    if (!item) return false; 
 
    var def = G.items[item.name]; 
    if (!def) return false; 
 
    if (def.slot) return true; 
 
    return false; 
} 
 

// CHECK IF ITEM IS POTION 
 
function is_potion(item) { 
 
    if (!item) return false; 
 
    return ( 
        item.name === "hpot1" || 
        item.name === "mpot1" 
    ); 
} 
 

// CHECK IF ITEM IS COLLECTIBLE / TOKEN 
 
function is_collectible(item) { 
 
    if (!item) return false; 
 
    if (G.tokens && G.tokens[item.name]) { 
        return true; 
    } 
 
    var def = G.items[item.name]; 
 
    if (!def) return false; 
 
    if (def.type === "misc") { 
 
        if ( 
            def.name && 
            ( 
                def.name.toLowerCase().indexOf("collect") !== -1 || 
                def.name.toLowerCase().indexOf("token") !== -1 
            ) 
        ) { 
            return true; 
        } 
    } 
 
    return false; 
} 
 

// CHECK IF ITEM IS STACKABLE 
 
function is_stackable(item) { 
 
    if (!item) return false; 
 
    var def = G.items[item.name]; 
 
    if (!def) return false; 
 
    if (def.s && def.s > 1) { 
        return true; 
    } 
 
    return false; 
} 
 

// CHECK IF ITEM CAN BE UPGRADED (weapons / armor - uses scrolls) 
 
function is_upgradable(item) { 
 
    if (!item) return false; 
 
    var def = G.items[item.name]; 
 
    return !!(def && def.upgrade); 
} 
 
 
// CHECK IF ITEM CAN BE COMPOUNDED (rings / amulets / belts etc - 3 into 1) 
 
function is_compoundable(item) { 
 
    if (!item) return false; 
 
    var def = G.items[item.name]; 
 
    return !!(def && def.compound); 
} 
 

// CHECK IF ITEM SHOULD STAY ON HUNTER 
 
function keep_on_hunter(item) { 
 
    if (!item) return true; 
 
    if (is_potion(item)) { 
 
        if ( 
            !BANK_POTIONS && 
            !MERCHANT_POTIONS 
        ) { 
            return true; 
        } 
    } 
 
    return false; 
} 
 

// GET ITEM CATEGORY 
 
function get_item_category(item) { 
 
    if (!item) return "none"; 
 
    if (is_potion(item)) { 
        return "potion"; 
    } 
 
    if (is_collectible(item)) { 
        return "collectible"; 
    } 
 
    if (is_stackable(item)) { 
        return "stackable"; 
    } 
 
    if (is_upgradable(item)) { 
        return "upgradable"; 
    } 
 
    if (is_compoundable(item)) { 
        return "compoundable"; 
    } 
 
    return "other"; 
} 
 

// CHECK IF ITEM IS IN INDIVIDUAL BANK LIST 
 
function is_individual_bank_item(item) { 
 
    if (!item) return false; 
 
    if (!BANK_ITEM_IDS || BANK_ITEM_IDS.length === 0) { 
        return false; 
    } 
 
    var item_name = 
        String(item.name || "").trim().toLowerCase(); 
 
    for ( 
        var i = 0; 
        i < BANK_ITEM_IDS.length; 
        i++ 
    ) { 
 
        var bank_name = 
            String(BANK_ITEM_IDS[i] || "").trim().toLowerCase(); 
 
        if ( 
            bank_name && 
            item_name === bank_name 
        ) { 
            return true; 
        } 
    } 
 
    return false; 
} 
 

// SHOULD BANK ITEM? 
 
function should_bank(item) { 
 
    if (!item) return false; 
 
    if (item.l) return true; 
 
    if (is_individual_bank_item(item)) { 
        return true; 
    } 
 
    var category = get_item_category(item); 
 
    if (category === "potion") { 
        return BANK_POTIONS; 
    } 
 
    if (category === "collectible") { 
        return BANK_TOKENS_COLLECTABLES; 
    } 
 
    if (category === "stackable") { 
        return BANK_STACKABLES; 
    } 
 
    if (category === "upgradable") { 
        return BANK_UPGRADABLES; 
    } 
 
    if (category === "compoundable") { 
        return BANK_COMPOUNDABLES; 
    } 
 
    if (category === "other") { 
        return BANK_OTHER_NON_STACKABLES; 
    } 
 
    return false; 
} 
 

// SHOULD SEND TO PENNYWORTH? 
 
function should_send_to_merchant(item) { 
 
    if (!item) return false; 
 
    if (item.l) return false; 
 
    if (is_individual_bank_item(item)) { 
        return false; 
    } 
 
    var category = get_item_category(item); 
 
    if (category === "potion") { 
        return MERCHANT_POTIONS; 
    } 
 
    if (category === "collectible") { 
        return MERCHANT_TOKENS_COLLECTABLES; 
    } 
 
    if (category === "stackable") { 
        return MERCHANT_STACKABLES; 
    } 
 
    if (category === "upgradable") { 
        return MERCHANT_UPGRADABLES; 
    } 
 
    if (category === "compoundable") { 
        return MERCHANT_COMPOUNDABLES; 
    } 
 
    if (category === "other") { 
        return MERCHANT_OTHER_NON_STACKABLES; 
    } 
 
    return false; 
} 
 

// CHECK WHETHER AUTOMATIC INVENTORY ACTIONS ARE ENABLED 
 
function automatic_inventory_actions_enabled() { 
 
    return ( 
        BANK_POTIONS || 
        BANK_TOKENS_COLLECTABLES || 
        BANK_STACKABLES || 
        BANK_UPGRADABLES || 
        BANK_COMPOUNDABLES || 
        BANK_OTHER_NON_STACKABLES || 
 
        BANK_ITEM_IDS.length > 0 || 
 
        MERCHANT_POTIONS || 
        MERCHANT_TOKENS_COLLECTABLES || 
        MERCHANT_STACKABLES || 
        MERCHANT_UPGRADABLES || 
        MERCHANT_COMPOUNDABLES || 
        MERCHANT_OTHER_NON_STACKABLES 
    ); 
} 
 

// COUNT EMPTY INVENTORY SLOTS 
 
function empty_inventory_slots() { 
 
    var empty = 0; 
 
    for (var i = 0; i < character.items.length; i++) { 
 
        if (!character.items[i]) { 
            empty++; 
        } 
    } 
 
    return empty; 
} 


// COUNT OCCUPIED INVENTORY SLOTS

function inventory_item_slots() {

    var occupied = 0;

    for (
        var i = 0;
        i < character.items.length;
        i++
    ) {

        if (character.items[i]) {
            occupied++;
        }

    }

    return occupied;
}


// CHECK WHETHER INVENTORY NEEDS CLEANUP 
 
function inventory_needs_cleanup() { 
 
    return ( 
        empty_inventory_slots() <= 
        MIN_EMPTY_SLOTS 
    ); 
} 
 

// CHECK WHETHER INVENTORY HAS ITEMS FOR BANK 
 
function inventory_has_bank_items() { 
 
    for (var i = 0; i < character.items.length; i++) { 
 
        var item = character.items[i]; 
 
        if (!item) { 
            continue; 
        } 
 
        if (should_bank(item)) { 
            return true; 
        } 
    } 
 
    return false; 
} 
 

// CHECK WHETHER INVENTORY HAS ITEMS FOR PENNYWORTH 
 
function inventory_has_merchant_items() { 
 
    for (var i = 0; i < character.items.length; i++) { 
 
        var item = character.items[i]; 
 
        if (!item) { 
            continue; 
        } 
 
        if (should_send_to_merchant(item)) { 
            return true; 
        } 
    } 
 
    return false; 
} 
 

// TELEPORT TO TOWN 
 
async function teleport_to_town() { 
 
    game_log( 
        "TRAVEL: Using town teleport." 
    ); 
 
    set_message( 
        "Teleporting to town..." 
    ); 
 
    try { 
 
        await use_skill("use_town"); 
 
        await sleep(2000); 
 
        game_log( 
            "TRAVEL: Town teleport complete." 
        ); 
 
        // The town teleport only goes to the spawn point of the map
        // you are on. Off the mainland that is next to an exit, not the
        // market, so carry on to the mainland town.
        return await travel_to_mainland_town(); 
 
    } 
 
    catch (error) { 
 
        game_log( 
            "TOWN TELEPORT ERROR: " + 
            (error.reason || error) 
        ); 
 
        return false; 
 
    } 
} 
 

// GET FROM ANY MAP TO THE MAINLAND TOWN MARKET AREA
//
// Called right after the town teleport. On the mainland the teleport
// already lands in the market. On any other map it lands at that map's
// spawn / exit, so smart_move is used to finish the trip. smart_move
// knows every door, ladder, cave entrance and transporter between maps.

var MAINLAND_MAP = "main";
var MAINLAND_TOWN_ATTEMPTS = 3;

function mainland_town_spot() {

    var spawn =
        G.maps &&
        G.maps[MAINLAND_MAP] &&
        G.maps[MAINLAND_MAP].spawns &&
        G.maps[MAINLAND_MAP].spawns[0];

    if (!spawn) {
        return { map: MAINLAND_MAP, x: 0, y: 0 };
    }

    return { map: MAINLAND_MAP, x: spawn[0], y: spawn[1] };
}


async function travel_to_mainland_town() {

    var spot = mainland_town_spot();

    for (
        var attempt = 1;
        attempt <= MAINLAND_TOWN_ATTEMPTS;
        attempt++
    ) {

        if (
            character.map === MAINLAND_MAP &&
            distance(character, spot) < 150
        ) {
            return true;
        }

        game_log(
            "TRAVEL: On " + character.map +
            " - travelling to mainland town (attempt " +
            attempt + ")."
        );

        set_message("Travelling to mainland town...");

        try {

            await smart_move(spot);

        }

        catch (error) {

            game_log(
                "TRAVEL ERROR to mainland town: " +
                (error.reason || error)
            );

            await sleep(1500);
        }

        await sleep(500);
    }

    if (character.map === MAINLAND_MAP) {
        return true;
    }

    game_log(
        "TRAVEL: Could not reach the mainland town from " +
        character.map + "."
    );

    return false;
}


// TOWN THEN MOVE 
 
async function town_then_move(destination) { 
 
    var teleported = 
        await teleport_to_town(); 
 
    if (!teleported) { 
 
        game_log( 
            "TRAVEL: Town teleport failed - NOT moving to " + 
            destination 
        ); 
 
        return false; 
    } 
 
    await sleep(500); 
 
    try { 
 
        await smart_move(destination); 
 
        return true; 
 
    } 
 
    catch (error) { 
 
        game_log( 
            "TRAVEL ERROR moving to " + 
            destination + 
            ": " + 
            (error.reason || error) 
        ); 
 
        return false; 
 
    } 
} 
 

// COUNT AN ITEM IN INVENTORY

function inventory_count_item(item_name) {
    var total = 0;
    for (var i = 0; i < character.items.length; i++) {
        var item = character.items[i];
        if (!item) continue;
        if (item.name !== item_name) continue;
        total += item.q || 1;
    }
    return total;
}


// BANK FULL STATE

var bank_full_detected = false;
var bank_full_runs = 0;


// BANK IS FULL - RUN THE COMPOUNDER TO MAKE ROOM
//
// Returns true when at least one compound was completed, meaning there
// may be space now and the item that failed should be tried again.

async function make_bank_room() {

    if (
        !COMPOUND_WHEN_BANK_FULL ||
        !ENABLE_COMPOUND
    ) {
        return false;
    }

    if (bank_full_runs >= COMPOUND_MAX_RUNS_PER_BANKING) {

        game_log(
            "BANK: Bank is full and the compounder has already run " +
            bank_full_runs + " time(s) this trip - giving up."
        );

        return false;
    }

    bank_full_runs++;
    bank_full_detected = false;

    game_log(
        "BANK: Bank is full - running the compounder to free space."
    );

    set_message("Bank full - compounding...");

    var before = compounds_completed;

    try {
        await run_compounder();
    }
    catch (error) {
        game_log(
            "BANK: Compounder error - " +
            (error.reason || error)
        );
    }

    // The compounder can finish at Cue / the scroll vendor, so return
    // to the bank before banking continues.
    try {
        await smart_move(BANK_DESTINATION);
    }
    catch (error) {
        game_log(
            "BANK: Could not return to the bank after compounding - " +
            (error.reason || error)
        );
        return false;
    }

    await sleep(500);

    set_message("Banking items...");

    if (compounds_completed <= before) {

        game_log(
            "BANK: Nothing could be compounded - bank is still full."
        );

        return false;
    }

    game_log(
        "BANK: Compounding finished (" +
        (compounds_completed - before) +
        " compound(s)) - resuming banking."
    );

    return true;
}


// BANK ONE ITEM

async function bank_item(slot) {
    var item = character.items[slot];
    if (!item) return false;

    var item_name = item.name;
    var quantity = item.q || 1;
    var before = inventory_count_item(item_name);

    try {
        game_log("BANK: " + quantity + "x " + item_name);

        var result = await bank_store(slot);
        await sleep(400);

        var after = inventory_count_item(item_name);

        if (after >= before) {
            game_log(
                "BANK FAILED: " + item_name +
                " is still in inventory. Result: " +
                JSON.stringify(result)
            );
            return false;
        }

        game_log(
            "BANK OK: " + item_name +
            " - " + before + " -> " + after +
            " in inventory."
        );

        return true;
    }
    catch (error) {
        game_log(
            "BANK ERROR: " + item_name + " - " +
            (error.reason || error)
        );

        if (error && error.reason === "bank_full") {
            bank_full_detected = true;
        }

        return false;
    }
}


// BANK CONFIGURED ITEMS
//
// NOTE: The caller (cleanup_inventory) is responsible for teleporting
// to town first. This function only travels from town to the bank.

async function bank_configured_items() {
    set_message("Banking items...");

    bank_full_detected = false;
    bank_full_runs = 0;

    await sleep(500);

    try {
        await smart_move("bank");
    }
    catch (error) {
        game_log("BANK TRAVEL ERROR: " + (error.reason || error));
        return false;
    }

    await sleep(500);

    var banked = 0;
    var failed = 0;

    // ============================================================
    // FIRST: PROCESS EACH INDIVIDUALLY CONFIGURED ITEM
    // ============================================================

    for (var b = 0; b < BANK_ITEM_IDS.length; b++) {

        var wanted_name =
            String(BANK_ITEM_IDS[b] || "").trim().toLowerCase();

        if (!wanted_name) {
            continue;
        }

        while (true) {

            var slot_to_bank = -1;

            for (var i = 0; i < character.items.length; i++) {

                var item = character.items[i];

                if (!item) {
                    continue;
                }

                var item_name =
                    String(item.name || "").trim().toLowerCase();

                if (item_name === wanted_name) {
                    slot_to_bank = i;
                    break;
                }
            }

            if (slot_to_bank === -1) {
                break;
            }

            var success = await bank_item(slot_to_bank);

            if (success) {
                banked++;
                await sleep(250);
            }
            else {

                // Bank full -> compound to free space, then retry
                if (
                    bank_full_detected &&
                    await make_bank_room()
                ) {
                    continue;
                }

                failed++;

                game_log(
                    "BANK: Failed to bank " +
                    wanted_name +
                    " from slot " +
                    slot_to_bank
                );

                break;
            }
        }

        if (failed > 0) {
            break;
        }
    }

    // ============================================================
    // SECOND: PROCESS CATEGORY-BASED BANKING
    // ============================================================
    //
    // Individually configured items are deliberately skipped here.
    // They have already been handled above and must never be allowed
    // to fall through to another inventory destination.

    if (failed === 0) {

        while (true) {

            var category_slot = -1;

            for (
                var j = character.items.length - 1;
                j >= 0;
                j--
            ) {

                var category_item =
                    character.items[j];

                if (!category_item) {
                    continue;
                }

                if (is_individual_bank_item(category_item)) {
                    continue;
                }

                if (!should_bank(category_item)) {
                    continue;
                }

                category_slot = j;
                break;
            }

            if (category_slot === -1) {
                break;
            }

            var category_success =
                await bank_item(category_slot);

            if (category_success) {
                banked++;
                await sleep(250);
            }
            else {

                // Bank full -> compound to free space, then retry
                if (
                    bank_full_detected &&
                    await make_bank_room()
                ) {
                    continue;
                }

                failed++;
                break;
            }
        }
    }

    await sleep(500);

    if (failed > 0) {
        game_log(
            "BANK: " + banked +
            " item(s) secured, but banking stopped after a failure."
        );
        return false;
    }

    game_log(
        "BANK: " + banked +
        " item(s) secured."
    );

    return true;
}


// ================================================================
// COMPOUNDER (used when the bank is full)
// ================================================================

// ================================================================
// TRACKING
// ================================================================
//
// Bank slots already withdrawn during this complete run.
//
// Also keeps track of item names that the script actually processed,
// so unrelated inventory items are not accidentally banked at the end.
//

var running = false;

var compounds_completed = 0;

var used_bank_slots = {};

var processed_item_names = {};


// ================================================================
// INCOMPATIBLE COMPOUND TRACKING
// ================================================================
//
// If an item + level is confirmed to be incompatible with the
// compound operation, it is skipped for the remainder of this run.
//
// This prevents the same bad group from being selected repeatedly.
//

var incompatible_compound_groups = {};


// ================================================================
// BASIC HELPERS
// ================================================================

function c_log(message) {

    if (ENABLE_LOGS) {
        game_log("[Compounder] " + message);
    }
}


function delay(ms) {

    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}


function count_empty_inventory_slots() {

    var count = 0;

    for (var i = 0; i < character.items.length; i++) {

        if (!character.items[i]) {
            count++;
        }
    }

    return count;
}


function count_inventory_item(name, level) {

    var count = 0;

    for (var i = 0; i < character.items.length; i++) {

        var item = character.items[i];

        if (
            item &&
            item.name == name &&
            item.level == level
        ) {
            count++;
        }
    }

    return count;
}


function count_inventory_item_all_levels(name) {

    var count = 0;

    for (var i = 0; i < character.items.length; i++) {

        var item = character.items[i];

        if (
            item &&
            item.name == name &&
            item.level < MAX_LEVEL
        ) {
            count++;
        }
    }

    return count;
}


// ================================================================
// INCOMPATIBLE GROUP HELPERS
// ================================================================

function get_compound_group_key(name, level) {

    return (
        String(name) +
        "|" +
        String(level)
    );
}


function is_incompatible_compound_group(
    name,
    level
) {

    var key =
        get_compound_group_key(
            name,
            level
        );

    return !!incompatible_compound_groups[key];
}


function mark_compound_group_incompatible(
    name,
    level,
    reason
) {

    var key =
        get_compound_group_key(
            name,
            level
        );


    incompatible_compound_groups[key] = true;


    c_log(
        "Skipping " +
        name +
        " +" +
        level +
        " for the rest of this run because the compound was incompatible." +
        (
            reason
                ? " Reason: " + reason
                : ""
        )
    );
}


// ================================================================
// FIND ANY COMPLETE COMPOUND IN INVENTORY
// ================================================================

function find_any_item_group() {

    for (var level = 0; level < MAX_LEVEL; level++) {

        for (var i = 0; i < character.items.length; i++) {

            var item = character.items[i];

            if (
                !item ||
                item.level != level
            ) {
                continue;
            }


            // ----------------------------------------------------
            // IMPORTANT:
            //
            // Skip an item + level already confirmed incompatible.
            // ----------------------------------------------------

            if (
                is_incompatible_compound_group(
                    item.name,
                    level
                )
            ) {

                continue;
            }


            var indexes = [
                i
            ];


            for (
                var j = i + 1;
                j < character.items.length;
                j++
            ) {

                var other =
                    character.items[j];


                if (
                    other &&
                    other.name == item.name &&
                    other.level == level
                ) {

                    indexes.push(j);


                    if (indexes.length >= 3) {

                        return {
                            name: item.name,
                            level: level,
                            indexes: [
                                indexes[0],
                                indexes[1],
                                indexes[2]
                            ]
                        };
                    }
                }
            }
        }
    }


    return null;
}


// ================================================================
// FIND COMPOUND GROUP FOR SPECIFIC ITEM
// ================================================================

function find_item_group(name) {

    for (var level = 0; level < MAX_LEVEL; level++) {

        var indexes = [];

        for (var i = 0; i < character.items.length; i++) {

            var item = character.items[i];

            if (
                item &&
                item.name == name &&
                item.level == level
            ) {
                indexes.push(i);
            }
        }

        if (indexes.length >= 3) {

            return {
                name: name,
                level: level,
                indexes: [
                    indexes[0],
                    indexes[1],
                    indexes[2]
                ]
            };
        }
    }


    return null;
}


// ================================================================
// SCROLL HELPERS
// ================================================================

function find_inventory_scroll(scroll_name) {

    for (var i = 0; i < character.items.length; i++) {

        var item = character.items[i];

        if (
            item &&
            item.name == scroll_name
        ) {
            return i;
        }
    }

    return -1;
}


function get_scroll_name(level) {

    if (
        USE_BETTER_SCROLLS &&
        level >= 2
    ) {
        return "cscroll1";
    }

    return "cscroll0";
}


// ================================================================
// BANK HELPERS
// ================================================================

function get_bank_item_slots(
    name,
    level
) {

    var result = [];

    if (!character.bank) {
        return result;
    }


    for (var pack in character.bank) {

        var slots =
            character.bank[pack];


        if (!slots) {
            continue;
        }


        for (
            var slot = 0;
            slot < slots.length;
            slot++
        ) {

            var item =
                slots[slot];


            if (
                item &&
                item.name == name &&
                item.level == level
            ) {

                var key =
                    String(pack) +
                    ":" +
                    String(slot);


                if (!used_bank_slots[key]) {

                    result.push({
                        pack: pack,
                        slot: slot,
                        level: level
                    });
                }
            }
        }
    }


    return result;
}


function find_bank_scroll(scroll_name) {

    if (!character.bank) {
        return null;
    }


    for (var pack in character.bank) {

        var slots =
            character.bank[pack];


        if (!slots) {
            continue;
        }


        for (
            var i = 0;
            i < slots.length;
            i++
        ) {

            var item =
                slots[i];


            if (
                item &&
                item.name == scroll_name
            ) {

                return {
                    pack: pack,
                    slot: i
                };
            }
        }
    }


    return null;
}


// ================================================================
// MOVEMENT
// ================================================================

async function go_to_bank() {

    c_log("Going to bank...");

    await smart_move(
        BANK_DESTINATION
    );

    await delay(
        ACTION_DELAY
    );

    c_log("Arrived at bank.");
}


async function go_to_cue() {

    c_log("Going to Cue...");

    await smart_move(
        CUE_DESTINATION
    );

    await delay(
        ACTION_DELAY
    );

    c_log("Arrived at Cue.");
}


async function go_to_scroll_buy_location() {

    c_log(
        "Leaving bank and going to scroll-buying location..."
    );


    await smart_move(
        SCROLL_BUY_DESTINATION
    );


    await delay(
        ACTION_DELAY
    );


    c_log(
        "Arrived at scroll-buying location."
    );
}


// ================================================================
// FIND ANY BANK COMPOUND PLAN
// ================================================================
//
// Searches the entire bank.
//
// A valid plan exists when:
//
//     inventory items + bank items >= 3
//
// for one exact item name + one exact level.
//
// Only the number actually needed is retrieved.
//

function find_any_bank_compound_plan() {

    if (!character.bank) {
        return null;
    }


    var candidates = {};


    // ------------------------------------------------------------
    // Build a list of every compoundable bank item.
    // ------------------------------------------------------------

    for (var pack in character.bank) {

        var slots =
            character.bank[pack];


        if (!slots) {
            continue;
        }


        for (
            var slot = 0;
            slot < slots.length;
            slot++
        ) {

            var item =
                slots[slot];


            if (
                !item ||
                item.level >= MAX_LEVEL
            ) {
                continue;
            }


            var key =
                item.name +
                "|" +
                String(item.level);


            if (!candidates[key]) {

                candidates[key] = {
                    name: item.name,
                    level: item.level
                };
            }
        }
    }


    // ------------------------------------------------------------
    // Check every candidate against inventory + bank.
    // ------------------------------------------------------------

    var candidate_list = [];


    for (var key in candidates) {

        var candidate =
            candidates[key];


        // --------------------------------------------------------
        // Skip anything already confirmed incompatible.
        // --------------------------------------------------------

        if (
            is_incompatible_compound_group(
                candidate.name,
                candidate.level
            )
        ) {

            continue;
        }


        var inventory_count =
            count_inventory_item(
                candidate.name,
                candidate.level
            );


        var bank_slots =
            get_bank_item_slots(
                candidate.name,
                candidate.level
            );


        var bank_count =
            bank_slots.length;


        var total_available =
            inventory_count +
            bank_count;


        if (
            total_available >= 3
        ) {

            candidate_list.push({
                name: candidate.name,
                level: candidate.level,
                inventory_count: inventory_count,
                bank_count: bank_count,
                needed: Math.max(
                    0,
                    3 - inventory_count
                ),
                bank_slots: bank_slots
            });
        }
    }


    if (
        candidate_list.length == 0
    ) {

        return null;
    }


    // ------------------------------------------------------------
    // Lowest item level first.
    //
    // This preserves predictable behaviour rather than relying
    // on object enumeration order.
    // ------------------------------------------------------------

    candidate_list.sort(function(a, b) {

        if (a.level != b.level) {
            return a.level - b.level;
        }


        if (a.name < b.name) {
            return -1;
        }


        if (a.name > b.name) {
            return 1;
        }


        return 0;
    });


    return candidate_list[0];
}


// ================================================================
// RETRIEVE ONE BANK ITEM
// ================================================================

async function retrieve_bank_slot(
    name,
    bank_slot
) {

    var key =
        String(bank_slot.pack) +
        ":" +
        String(bank_slot.slot);


    if (used_bank_slots[key]) {

        return false;
    }


    used_bank_slots[key] = true;


    var before =
        count_inventory_item(
            name,
            bank_slot.level
        );


    c_log(
        "Retrieving " +
        name +
        " +" +
        bank_slot.level +
        " from bank slot " +
        key +
        "."
    );


    var result =
        await bank_retrieve(
            bank_slot.pack,
            bank_slot.slot
        );


    await delay(
        ACTION_DELAY
    );


    if (
        result &&
        result.failed
    ) {

        c_log(
            "Bank withdrawal FAILED for " +
            name +
            " +" +
            bank_slot.level +
            " from " +
            key +
            ". Reason: " +
            (
                result.reason ||
                "unknown"
            )
        );


        return false;
    }


    var after =
        count_inventory_item(
            name,
            bank_slot.level
        );


    if (
        after > before
    ) {

        c_log(
            "Confirmed withdrawal of " +
            name +
            " +" +
            bank_slot.level +
            "."
        );


        return true;
    }


    c_log(
        "WARNING: withdrawal of " +
        name +
        " +" +
        bank_slot.level +
        " was not confirmed in inventory."
    );


    return false;
}


// ================================================================
// RETRIEVE EXACTLY WHAT IS NEEDED
// ================================================================

async function retrieve_items_for_plan(
    plan
) {

    if (!plan) {
        return 0;
    }


    if (plan.needed <= 0) {

        return 0;
    }


    // ------------------------------------------------------------
    // Check inventory reservation.
    // ------------------------------------------------------------

    var empty_slots =
        count_empty_inventory_slots();


    var usable_slots =
        empty_slots -
        RESERVED_EMPTY_SLOTS;


    if (
        usable_slots < plan.needed
    ) {

        c_log(
            "Cannot retrieve " +
            plan.needed +
            " " +
            plan.name +
            " +" +
            plan.level +
            " without breaking the " +
            RESERVED_EMPTY_SLOTS +
            "-slot scroll reservation."
        );


        return 0;
    }


    if (
        plan.bank_slots.length <
        plan.needed
    ) {

        c_log(
            "Bank does not contain enough " +
            plan.name +
            " +" +
            plan.level +
            " items to complete the group."
        );


        return 0;
    }


    c_log(
        "Compound plan for " +
        plan.name +
        " +" +
        plan.level +
        ": inventory=" +
        plan.inventory_count +
        ", bank=" +
        plan.bank_count +
        ", retrieving=" +
        plan.needed +
        "."
    );


    var retrieved = 0;


    for (
        var i = 0;
        i < plan.needed;
        i++
    ) {

        var success =
            await retrieve_bank_slot(
                plan.name,
                plan.bank_slots[i]
            );


        if (!success) {

            c_log(
                "Stopping retrieval because the bank transaction failed."
            );


            break;
        }


        retrieved++;
    }


    if (
        retrieved > 0
    ) {

        processed_item_names[
            plan.name
        ] = true;
    }


    c_log(
        "Retrieved " +
        retrieved +
        " " +
        plan.name +
        " item(s) for compound."
    );


    return retrieved;
}


// ================================================================
// BANK FINAL LEFTOVERS FOR ONE PROCESSED ITEM
// ================================================================

async function bank_final_leftovers(
    name
) {

    var banked = 0;


    while (true) {

        var slot_to_bank = -1;


        // --------------------------------------------------------
        // Re-find the item before every bank operation.
        // --------------------------------------------------------

        for (
            var i = 0;
            i < character.items.length;
            i++
        ) {

            var item =
                character.items[i];


            if (
                item &&
                item.name == name &&
                item.level < MAX_LEVEL
            ) {

                slot_to_bank = i;

                break;
            }
        }


        if (
            slot_to_bank == -1
        ) {

            break;
        }


        var item_to_bank =
            character.items[
                slot_to_bank
            ];


        c_log(
            "Banking final leftover " +
            name +
            " +" +
            item_to_bank.level +
            " from inventory slot " +
            slot_to_bank +
            "."
        );


        var result =
            await bank_store(
                slot_to_bank
            );


        await delay(
            ACTION_DELAY
        );


        if (
            result &&
            result.failed
        ) {

            c_log(
                "FAILED to bank " +
                name +
                " +" +
                item_to_bank.level +
                ". Reason: " +
                (
                    result.reason ||
                    "unknown"
                )
            );


            break;
        }


        banked++;
    }


    c_log(
        "Final leftovers banked: " +
        banked +
        " " +
        name +
        " item(s)."
    );


    return banked;
}


// ================================================================
// SCROLL MANAGEMENT
// ================================================================

async function make_sure_scroll(
    scroll_name
) {

    // ------------------------------------------------------------
    // Already have it.
    // ------------------------------------------------------------

    if (
        find_inventory_scroll(
            scroll_name
        ) != -1
    ) {

        c_log(
            "Already have " +
            scroll_name +
            " in inventory."
        );


        return true;
    }


    // ------------------------------------------------------------
    // Try bank first.
    // ------------------------------------------------------------

    if (
        GET_SCROLLS_FROM_BANK
    ) {

        var bank_scroll =
            find_bank_scroll(
                scroll_name
            );


        if (bank_scroll) {

            c_log(
                "Retrieving " +
                scroll_name +
                " from bank."
            );


            var result =
                await bank_retrieve(
                    bank_scroll.pack,
                    bank_scroll.slot
                );


            await delay(
                ACTION_DELAY
            );


            if (
                result &&
                result.failed
            ) {

                c_log(
                    "Failed to retrieve " +
                    scroll_name +
                    " from bank. Reason: " +
                    (
                        result.reason ||
                        "unknown"
                    )
                );

            } else if (
                find_inventory_scroll(
                    scroll_name
                ) != -1
            ) {

                c_log(
                    "Confirmed " +
                    scroll_name +
                    " withdrawal."
                );


                return true;
            }
        }
    }


    // ------------------------------------------------------------
    // Buy missing scroll.
    //
    // We must leave the bank first.
    // ------------------------------------------------------------

    if (
        BUY_MISSING_SCROLLS
    ) {

        c_log(
            "No " +
            scroll_name +
            " available in bank."
        );


        c_log(
            "Need to buy 1 " +
            scroll_name +
            " from Lucas."
        );


        await go_to_scroll_buy_location();


        c_log(
            "Buying exactly 1 " +
            scroll_name +
            " from Lucas."
        );


        var buy_result =
            await buy(
                scroll_name,
                SCROLL_BUY_QUANTITY
            );


        await delay(
            ACTION_DELAY
        );


        if (
            buy_result &&
            buy_result.failed
        ) {

            c_log(
                "Failed to buy " +
                scroll_name +
                ". Reason: " +
                (
                    buy_result.reason ||
                    "unknown"
                )
            );


            return false;
        }


        if (
            find_inventory_scroll(
                scroll_name
            ) != -1
        ) {

            c_log(
                "Confirmed purchase of " +
                scroll_name +
                "."
            );


            return true;
        }


        c_log(
            "WARNING: " +
            scroll_name +
            " purchase was not confirmed in inventory."
        );
    }


    return false;
}


// ================================================================
// COMPOUND ONE GROUP
// ================================================================

async function compound_group(
    name
) {

    var group =
        find_item_group(
            name
        );


    if (!group) {

        return false;
    }


    var level =
        group.level;


    var scroll_name =
        get_scroll_name(
            level
        );


    c_log(
        "Have 3 " +
        name +
        " +" +
        level +
        " ready."
    );


    // ------------------------------------------------------------
    // Make sure correct scroll exists.
    // ------------------------------------------------------------

    if (
        find_inventory_scroll(
            scroll_name
        ) == -1
    ) {

        c_log(
            "No " +
            scroll_name +
            " available."
        );


        var got_scroll =
            await make_sure_scroll(
                scroll_name
            );


        if (!got_scroll) {

            c_log(
                "Could not obtain " +
                scroll_name +
                "."
            );


            return false;
        }
    }


    // ------------------------------------------------------------
    // Go to Cue.
    // ------------------------------------------------------------

    await go_to_cue();


    // ------------------------------------------------------------
    // Re-find the group after movement.
    // ------------------------------------------------------------

    group =
        find_item_group(
            name
        );


    if (!group) {

        c_log(
            "Compound group disappeared after movement."
        );


        return false;
    }


    // ------------------------------------------------------------
    // Re-find scroll after movement.
    // ------------------------------------------------------------

    var scroll_index =
        find_inventory_scroll(
            scroll_name
        );


    if (
        scroll_index == -1
    ) {

        c_log(
            "Required scroll disappeared."
        );


        return false;
    }


    c_log(
        "Compounding " +
        name +
        " +" +
        group.level +
        "."
    );


    // ------------------------------------------------------------
    // Attempt the compound.
    //
    // ONLY a failed/invalid compound is marked incompatible.
    // Other failures above still use the original behaviour.
    // ------------------------------------------------------------

    var compound_result;


    try {

        compound_result =
            await compound(
                group.indexes[0],
                group.indexes[1],
                group.indexes[2],
                scroll_index
            );

    } catch (e) {

        var error_reason =
            e && e.reason
                ? e.reason
                : e;


        mark_compound_group_incompatible(
            name,
            level,
            error_reason
        );


        return false;
    }


    await delay(
        ACTION_DELAY
    );


    if (
        compound_result &&
        compound_result.failed
    ) {

        var failure_reason =
            compound_result.reason ||
            "unknown";


        mark_compound_group_incompatible(
            name,
            level,
            failure_reason
        );


        c_log(
            "COMPOUND FAILED for " +
            name +
            " +" +
            level +
            ". Reason: " +
            failure_reason
        );


        return false;
    }


    c_log(
        "Compound action completed for " +
        name +
        " +" +
        level +
        "."
    );


    processed_item_names[
        name
    ] = true;


    compounds_completed++;


    return true;
}


// ================================================================
// PROCESS EVERYTHING
// ================================================================

async function process_all_compounds() {

    // ============================================================
    // START AT BANK
    // ============================================================

    if (
        GET_ITEMS_FROM_BANK
    ) {

        await go_to_bank();
    }


    // ============================================================
    // MAIN LOOP
    // ============================================================

    while (true) {

        // --------------------------------------------------------
        // STEP 1
        //
        // If inventory already contains any complete group,
        // compound it immediately.
        // --------------------------------------------------------

        var inventory_group =
            find_any_item_group();


        if (inventory_group) {

            c_log(
                "Inventory has 3 " +
                inventory_group.name +
                " +" +
                inventory_group.level +
                "."
            );


            var inventory_compound_success =
                await compound_group(
                    inventory_group.name
                );


            if (
                inventory_compound_success
            ) {

                // Immediately check inventory again.

                continue;
            }


            // ----------------------------------------------------
            // IMPORTANT CHANGE:
            //
            // If this group was confirmed incompatible, SKIP IT
            // and continue searching.
            //
            // Otherwise preserve the old stop behaviour.
            // ----------------------------------------------------

            if (
                is_incompatible_compound_group(
                    inventory_group.name,
                    inventory_group.level
                )
            ) {

                c_log(
                    "Skipping incompatible " +
                    inventory_group.name +
                    " +" +
                    inventory_group.level +
                    " and continuing search."
                );


                continue;
            }


            c_log(
                "Unable to compound " +
                inventory_group.name +
                "."
            );


            break;
        }


        // --------------------------------------------------------
        // STEP 2
        //
        // Nothing complete in inventory.
        //
        // Find ANY item in bank which can form a complete group
        // using inventory + bank.
        // --------------------------------------------------------

        if (
            GET_ITEMS_FROM_BANK
        ) {

            await go_to_bank();


            var plan =
                find_any_bank_compound_plan();


            if (plan) {

                c_log(
                    "Found compoundable " +
                    plan.name +
                    " +" +
                    plan.level +
                    ": inventory=" +
                    plan.inventory_count +
                    ", bank=" +
                    plan.bank_count +
                    "."
                );


                var retrieved =
                    await retrieve_items_for_plan(
                        plan
                    );


                if (
                    retrieved > 0
                ) {

                    // ------------------------------------------------
                    // We now have the required items in inventory.
                    //
                    // Go immediately around the loop and let the
                    // inventory check find the compound.
                    // ------------------------------------------------

                    continue;
                }


                // ----------------------------------------------------
                // A plan existed but retrieval failed.
                // Do not repeatedly attempt the same thing.
                // ----------------------------------------------------

                c_log(
                    "Could not retrieve the required " +
                    plan.name +
                    " items."
                );


                break;
            }


            // --------------------------------------------------------
            // Nothing in bank can currently make a complete group.
            // --------------------------------------------------------

            c_log(
                "No complete compoundable item found in bank."
            );


            break;
        }


        // --------------------------------------------------------
        // No bank retrieval.
        // --------------------------------------------------------

        break;
    }
}


// ================================================================
// BANK FINAL LEFTOVERS
// ================================================================
//
// Only bank leftovers for item names which this script actually
// processed. Unrelated inventory items are left untouched.
//

async function bank_all_processed_leftovers() {

    var names = [];


    for (
        var name in processed_item_names
    ) {

        names.push(name);
    }


    if (
        names.length == 0
    ) {

        return;
    }


    c_log(
        "Preparing to bank final processed-item leftovers."
    );


    await go_to_bank();


    for (
        var i = 0;
        i < names.length;
        i++
    ) {

        await bank_final_leftovers(
            names[i]
        );
    }
}


// ================================================================
// MAIN RUNNER
// ================================================================

async function run_compounder() {

    if (!ENABLE_COMPOUND) {

        c_log(
            "Compounding disabled."
        );


        return;
    }


    if (running) {

        return;
    }


    running = true;


    // Fresh state for every run (this can now run many times)
    used_bank_slots = {};
    processed_item_names = {};
    incompatible_compound_groups = {};


    try {

        c_log(
            "================================================"
        );


        c_log(
            "COMPOUNDER STARTED"
        );


        c_log(
            "Searching bank for any compatible compoundable items."
        );


        c_log(
            "================================================"
        );


        await process_all_compounds();


        // --------------------------------------------------------
        // Bank final leftovers belonging to items we processed.
        // --------------------------------------------------------

        await bank_all_processed_leftovers();


        c_log(
            "================================================"
        );


        c_log(
            "ALL AVAILABLE COMPOUNDS FINISHED."
        );


        c_log(
            "COMPOUNDER STOPPING."
        );


        c_log(
            "================================================"
        );


    } catch (e) {

        game_log(
            "[Compounder ERROR] " +
            (
                e && e.reason
                    ? e.reason
                    : e
            )
        );

    } finally {

        running = false;
    }
}


// FIND PENNYWORTH 
//
// NOTE: The caller (cleanup_inventory) is responsible for teleporting
// to town first. This function only looks for the merchant.
 
async function find_merchant() { 
 
    set_message( 
        "Looking for " + 
        MERCHANT_NAME 
    ); 
 
    await sleep(1000); 
 
    for ( 
        var attempt = 1; 
        attempt <= 10; 
        attempt++ 
    ) { 
 
        var merchant = 
            get_player(MERCHANT_NAME); 
 
        if (merchant) { 
 
            game_log( 
                "MERCHANT: Found " + 
                MERCHANT_NAME + 
                " on attempt " + 
                attempt 
            ); 
 
            return merchant; 
 
        } 
 
        await sleep(500); 
 
    } 
 
    game_log( 
        "MERCHANT: Could not find " + 
        MERCHANT_NAME 
    ); 
 
    return null; 
} 
 

// SEND GOLD TO PENNYWORTH
//
// Called from transfer_loot_to_merchant, so PennyWorth has already
// been found and is within range.

async function send_gold_to_merchant() {

    if (!SEND_GOLD_TO_MERCHANT) {
        return false;
    }

    var amount =
        Math.floor(character.gold) -
        Math.max(0, GOLD_TO_KEEP);

    if (amount <= 0) {
        return false;
    }

    var before = character.gold;

    try {

        game_log(
            "MERCHANT: Sending " +
            amount +
            " gold"
        );

        await send_gold(
            MERCHANT_NAME,
            amount
        );

        await sleep(400);

        if (character.gold >= before) {

            game_log(
                "MERCHANT: Gold transfer not confirmed."
            );

            return false;
        }

        game_log(
            "MERCHANT: Sent " +
            (before - character.gold) +
            " gold."
        );

        return true;
    }

    catch (error) {

        game_log(
            "MERCHANT GOLD ERROR: " +
            (error.reason || error)
        );

        return false;
    }
}


// TRANSFER LOOT TO PENNYWORTH 
 
async function transfer_loot_to_merchant() { 
 
    set_message( 
        "Going to " + 
        MERCHANT_NAME + 
        "..." 
    ); 
 
    var merchant = 
        await find_merchant(); 
 
    if (!merchant) { 
        return false; 
    } 
 
    merchant = 
        get_player(MERCHANT_NAME); 
 
    if (!merchant) { 
        return false; 
    } 
 
    if ( 
        distance(character, merchant) > 100 
    ) { 
 
        game_log( 
            "MERCHANT: PennyWorth is too far away." 
        ); 
 
        return false; 
    } 
 
    var transferred = 0; 
 
    for ( 
        var i = character.items.length - 1; 
        i >= 0; 
        i-- 
    ) { 
 
        var item = character.items[i]; 
 
        if (!item) { 
            continue; 
        } 
 
        if (!should_send_to_merchant(item)) { 
            continue; 
        } 
 
        try { 
 
            item = character.items[i]; 
 
            if (!item) { 
                continue; 
            } 
 
            if (!should_send_to_merchant(item)) { 
                continue; 
            } 
 
            var item_name = item.name; 
            var quantity = item.q || 1; 
 
            game_log( 
                "MERCHANT: Sending " + 
                quantity + 
                "x " + 
                item_name 
            ); 
 
            await send_item( 
                MERCHANT_NAME, 
                i, 
                quantity 
            ); 
 
            transferred++; 
 
            await sleep(150); 
        } 
 
        catch (error) { 
 
            game_log( 
                "MERCHANT ERROR: " + 
                item.name + 
                " - " + 
                (error.reason || error) 
            ); 
        } 
    } 
 
    await send_gold_to_merchant();

    game_log( 
        "MERCHANT: Transferred " + 
        transferred + 
        " loot stacks." 
    ); 
 
    await sleep(500); 
 
    return true; 
} 
 

// CLEANUP INVENTORY
//
// Order of operations:
//   1. Teleport to town (once)
//   2. If any items match the PennyWorth settings, try to transfer them.
//      If PennyWorth can't be found (or is too far away, or errors),
//      that step is skipped and cleanup carries on.
//   3. If any items match the bank settings, travel to the bank and
//      bank them.

async function cleanup_inventory() {

    if (!automatic_inventory_actions_enabled()) {
        return true;
    }

    var has_merchant_items =
        inventory_has_merchant_items();

    var has_bank_items =
        inventory_has_bank_items();

    // Nothing to do - don't waste a teleport
    if (
        !has_merchant_items &&
        !has_bank_items
    ) {
        return true;
    }

    // ============================================================
    // TELEPORT TO TOWN
    // ============================================================

    // Followers: tell the leader not to wait for us
    follower_status = "busy";

    var teleported =
        await teleport_to_town();

    if (!teleported) {

        game_log(
            "CLEANUP: Town teleport failed - NOT travelling."
        );

        return false;
    }

    await sleep(500);

    // ============================================================
    // PENNYWORTH (SKIPPED IF NOT FOUND)
    // ============================================================

    if (has_merchant_items) {

        var merchant_result = false;

        try {

            merchant_result =
                await transfer_loot_to_merchant();

        }

        catch (error) {

            game_log(
                "MERCHANT ERROR: " +
                (error.reason || error)
            );
        }

        if (!merchant_result) {

            game_log(
                "CLEANUP: " +
                MERCHANT_NAME +
                " unavailable - skipping merchant transfer, continuing to bank."
            );
        }
    }

    // ============================================================
    // BANK
    // ============================================================
    // Re-check, since the merchant transfer may have changed
    // what is left in the inventory.

    if (inventory_has_bank_items()) {

        var bank_result =
            await bank_configured_items();

        if (!bank_result) {
            return false;
        }
    }

    return true;
}
 

// POTION CHECK 
 
async function check_potions() { 
 
    var hp_potions = 
        potion_count("hpot1"); 
 
    var mp_potions = 
        potion_count("mpot1"); 
 
    if ( 
        hp_potions >= MIN_HP_POTIONS && 
        mp_potions >= MIN_MP_POTIONS 
    ) { 
        return true; 
    } 
 
    set_message("Restocking potions..."); 

    // Followers: tell the leader not to wait for us
    follower_status = "busy";

 
    game_log( 
        "POTIONS: Restocking. HP=" + 
        hp_potions + 
        " MP=" + 
        mp_potions 
    ); 
 
    var teleported = 
        await teleport_to_town(); 
 
    if (!teleported) { 
        return false; 
    } 
 
    await sleep(500); 
 
    try { 
 
        await smart_move("potions"); 
 
    } 
 
    catch (error) { 
 
        game_log( 
            "RESTOCK TRAVEL ERROR: " + 
            (error.reason || error) 
        ); 
 
        return false; 
    } 
 
    hp_potions = 
        potion_count("hpot1"); 
 
    mp_potions = 
        potion_count("mpot1"); 
 
    if ( 
        hp_potions < 
        TARGET_HP_POTIONS 
    ) { 
 
        var hp_to_buy = 
            TARGET_HP_POTIONS - 
            hp_potions; 
 
        await buy( 
            "hpot1", 
            hp_to_buy 
        ); 
    } 
 
    if ( 
        mp_potions < 
        TARGET_MP_POTIONS 
    ) { 
 
        var mp_to_buy = 
            TARGET_MP_POTIONS - 
            mp_potions; 
 
        await buy( 
            "mpot1", 
            mp_to_buy 
        ); 
    } 
 
    await sleep(1000); 
 
    return false; 
} 
 

// DRINK POTIONS 
 
function drink_potions_if_needed() { 
 
    if ( 
        character.hp < 
        character.max_hp * HP_USE_PERCENT / 100 
    ) { 
 
        use_hp_potion(); 
    } 
 
    if ( 
        character.mp < 
        character.max_mp * MP_USE_PERCENT / 100 
    ) { 
 
        use_mp_potion(); 
    } 
} 
 

// USE HP POTION 
 
function use_hp_potion() { 
 
    var slot = 
        locate_item("hpot1"); 
 
    if (slot >= 0) { 
        use(slot); 
    } 
} 
 

// USE MP POTION 
 
function use_mp_potion() { 
 
    var slot = 
        locate_item("mpot1"); 
 
    if (slot >= 0) { 
        use(slot); 
    } 
} 
 

// AUTO RESPAWN 
 
async function handle_respawn() { 
 
    if (!character.rip) { 
        return false; 
    } 
 
    if (respawning) { 
        return true; 
    } 
 
    respawning = true; 
 
    game_log( 
        "HUNTER: Character killed - respawning." 
    ); 
 
    set_message( 
        "Respawning..." 
    ); 
 
    try { 
 
        await respawn(); 
 
        await sleep(2000); 
 
        game_log( 
            "HUNTER: Respawn complete." 
        ); 
 
        set_message( 
            "Resuming hunt..." 
        ); 
 
    } 
 
    catch (error) { 
 
        game_log( 
            "RESPAWN ERROR: " + 
            (error.reason || error) 
        ); 
    } 
 
    respawning = false; 
 
    return true; 
} 
 

// ================================================================
// SMART KITING
// ================================================================

function get_preferred_range() { 
 
    var preferred = 
        character.range - 
        RANGE_BUFFER; 
 
    if ( 
        preferred < 
        MIN_SAFE_DISTANCE 
    ) { 
 
        preferred = 
            MIN_SAFE_DISTANCE; 
    } 
 
    return preferred; 
} 
 

// MOVE AWAY FROM TARGET 
 
function move_away_from_target(target) { 
 
    var now = Date.now(); 
 
    if ( 
        now - last_move_time < 
        MOVE_COOLDOWN 
    ) { 
        return; 
    } 
 
    var dx = 
        character.x - target.x; 
 
    var dy = 
        character.y - target.y; 
 
    var distance_to_target = 
        Math.sqrt( 
            dx * dx + 
            dy * dy 
        ); 
 
    if (distance_to_target <= 0) return; 
 
    var away_x = 
        dx / distance_to_target; 
 
    var away_y = 
        dy / distance_to_target; 
 
    move( 
        character.x + 
        away_x * KITE_STEP, 
 
        character.y + 
        away_y * KITE_STEP 
    ); 
 
    last_move_time = now; 
} 
 

// STRAFE / CIRCLE AROUND TARGET 
 
function strafe_around_target(target) { 
 
    var now = Date.now(); 
 
    if ( 
        now - last_move_time < 
        MOVE_COOLDOWN 
    ) { 
        return; 
    } 
 
    var dx = 
        character.x - target.x; 
 
    var dy = 
        character.y - target.y; 
 
    var distance_to_target = 
        Math.sqrt( 
            dx * dx + 
            dy * dy 
        ); 
 
    if (distance_to_target <= 0) return; 
 
    var away_x = 
        dx / distance_to_target; 
 
    var away_y = 
        dy / distance_to_target; 
 
    var side_x = 
        -away_y * 
        strafe_direction; 
 
    var side_y = 
        away_x * 
        strafe_direction; 
 
    var new_x = 
        character.x + 
        side_x * KITE_STEP; 
 
    var new_y = 
        character.y + 
        side_y * KITE_STEP; 
 
    move( 
        new_x, 
        new_y 
    ); 
 
    last_move_time = now; 
} 
 

// MAINTAIN ATTACK DISTANCE 
 
function maintain_attack_distance(target) { 
 
    var now = Date.now(); 
 
    var preferred_range = 
        get_preferred_range(); 
 
    var distance_to_target = 
        distance( 
            character, 
            target 
        ); 
 
    if ( 
        distance_to_target < 
        MIN_SAFE_DISTANCE 
    ) { 
 
        move_away_from_target(target); 
 
        return false; 
    } 
 
    if ( 
        distance_to_target > 
        preferred_range + 
        RANGE_TOLERANCE 
    ) { 
 
        if ( 
            now - last_move_time >= 
            MOVE_COOLDOWN 
        ) { 
 
            move( 
                character.x + 
                (target.x - character.x) / 2, 
 
                character.y + 
                (target.y - character.y) / 2 
            ); 
 
            last_move_time = now; 
        } 
 
        return false; 
    } 
 
    if ( 
        distance_to_target < 
        preferred_range - 
        RANGE_TOLERANCE 
    ) { 
 
        strafe_around_target(target); 
 
        return false; 
    } 
 
    if ( 
        now - 
        last_strafe_time >= 
        STRAFE_SWITCH_TIME 
    ) { 
 
        strafe_direction *= -1; 
        last_strafe_time = now; 
    } 
 
    return true; 
} 
 

// ================================================================
// PATHING
// ================================================================

// RESET PATH STATE

function reset_path_state() {

    last_path_target = null;
    last_path_attempt_time = 0;
    last_path_x = null;
    last_path_y = null;

}


// CHECK PATH PROGRESS

function pathing_is_stuck(monster_name) {

    if (last_path_target !== monster_name) {
        return false;
    }

    if (
        last_path_x === null ||
        last_path_y === null
    ) {
        return false;
    }

    var moved = distance(
        character,
        {
            x: last_path_x,
            y: last_path_y
        }
    );

    if (
        moved >= PATH_PROGRESS_DISTANCE
    ) {
        last_path_x = character.x;
        last_path_y = character.y;
        return false;
    }

    if (
        Date.now() - last_path_attempt_time >=
        PATH_STUCK_TIME
    ) {
        return true;
    }

    return false;
}


// RELOCATE AFTER STUCK PATH

async function relocate_and_retry_path(monster_name) {

    game_log(
        "PATH: Stuck travelling to " +
        monster_name +
        " - relocating."
    );

    set_message(
        "Relocating..."
    );

    var angle =
        Math.random() * Math.PI * 2;

    var new_x =
        character.x +
        Math.cos(angle) *
        PATH_RELOCATE_DISTANCE;

    var new_y =
        character.y +
        Math.sin(angle) *
        PATH_RELOCATE_DISTANCE;

    try {

        move(
            new_x,
            new_y
        );

        await sleep(500);

    }

    catch (error) {

        game_log(
            "PATH RELOCATE ERROR: " +
            (error.reason || error)
        );
    }

    last_path_x = character.x;
    last_path_y = character.y;
    last_path_attempt_time = Date.now();

    game_log(
        "PATH: Retrying route to " +
        monster_name
    );

    try {

        await hunt_smart_move(
            hunt_destination(monster_name)
        );

        last_path_attempt_time = Date.now();
        last_path_x = character.x;
        last_path_y = character.y;

        return true;

    }

    catch (error) {

        game_log(
            "PATH ERROR retrying " +
            monster_name +
            ": " +
            (error.reason || error)
        );

        return false;
    }
}


// PATH TO HUNTING AREA 
 
async function path_to_hunting_area(monster_name) { 
 
    var now = Date.now(); 
 
    if ( 
        last_path_target !== 
        monster_name 
    ) { 
 
        last_path_target = 
            monster_name; 
 
        last_path_attempt_time = 
            0; 
 
        last_path_x = 
            character.x; 
 
        last_path_y = 
            character.y; 
    } 
 
    if ( 
        now - 
        last_path_attempt_time < 
        PATH_RETRY_DELAY 
    ) { 
        return false; 
    } 
 
    if ( 
        pathing_is_stuck(monster_name) 
    ) { 
 
        return await relocate_and_retry_path( 
            monster_name 
        ); 
    } 
 
    game_log( 
        "HUNT: No " + 
        monster_name + 
        " nearby - moving to hunting area." 
    ); 
 
    set_message( 
        "Moving to " + 
        monster_name + 
        "..." 
    ); 
 
    last_path_attempt_time = now; 
    last_path_x = character.x; 
    last_path_y = character.y; 
 
    try { 
 
        await hunt_smart_move( 
            hunt_destination(monster_name) 
        ); 
 
        last_path_attempt_time = 
            Date.now(); 
 
        last_path_x = 
            character.x; 
 
        last_path_y = 
            character.y; 
 
        return true; 
 
    } 
 
    catch (error) { 
 
        game_log( 
            "PATH ERROR moving to " + 
            monster_name + 
            ": " + 
            (error.reason || error) 
        ); 
 
        return false; 
    } 
} 
 

// ================================================================
// COMBAT STUCK DETECTION
// ================================================================

function reset_combat_stuck_state() {

    last_combat_target = null;
    last_combat_x = null;
    last_combat_y = null;
    combat_no_progress_since = 0;

}


// CHECK WHETHER COMBAT MOVEMENT IS STUCK

function combat_movement_is_stuck(target) {

    if (!target) {
        return false;
    }

    if (
        last_combat_target !== target
    ) {

        last_combat_target = target;
        last_combat_x = character.x;
        last_combat_y = character.y;
        combat_no_progress_since = Date.now();

        return false;
    }

    if (
        last_combat_x === null ||
        last_combat_y === null
    ) {

        last_combat_x = character.x;
        last_combat_y = character.y;
        combat_no_progress_since = Date.now();

        return false;
    }

    var moved = distance(
        character,
        {
            x: last_combat_x,
            y: last_combat_y
        }
    );

    if (
        moved >= COMBAT_PROGRESS_DISTANCE
    ) {

        last_combat_x = character.x;
        last_combat_y = character.y;
        combat_no_progress_since = Date.now();

        return false;
    }

    if (
        Date.now() -
        combat_no_progress_since >=
        COMBAT_STUCK_TIME
    ) {

        return true;
    }

    return false;
}


// RECOVER FROM COMBAT STUCK

async function recover_from_combat_stuck(target) {

    if (!target) {
        return false;
    }

    game_log(
        "COMBAT: Movement stuck - relocating around target."
    );

    set_message(
        "Recovering combat..."
    );

    var angle =
        Math.atan2(
            character.y - target.y,
            character.x - target.x
        );

    angle +=
        (Math.random() > 0.5 ? 1 : -1) *
        (Math.PI / 2);

    var new_x =
        target.x +
        Math.cos(angle) *
        COMBAT_RELOCATE_DISTANCE;

    var new_y =
        target.y +
        Math.sin(angle) *
        COMBAT_RELOCATE_DISTANCE;

    try {

        move(
            new_x,
            new_y
        );

        await sleep(500);

    }

    catch (error) {

        game_log(
            "COMBAT RELOCATE ERROR: " +
            (error.reason || error)
        );
    }

    reset_combat_stuck_state();

    return true;
}


// GET CURRENT MONSTER NAME / ID
 
function get_hunt_monster_name() { 
 
    var target_id = null; 
 
    if (!GET_ASSIGNMENT) { 
 
        if ( 
            MANUAL_MONSTER_LIST && 
            MANUAL_MONSTER_LIST.length > 0 
        ) { 
 
            var current_manual_monster = 
                MANUAL_MONSTER_LIST[ 
                    MANUAL_MONSTER_INDEX 
                ]; 
 
            if ( 
                current_manual_monster && 
                current_manual_monster.type 
            ) { 
 
                target_id = 
                    current_manual_monster.type.toLowerCase(); 
            } 
        } 
 
    } 
 
    else { 
 
        var hunt = 
            character.s.monsterhunt; 
 
        if ( 
            hunt && 
            hunt.c > 0 
        ) { 
 
            target_id = 
                hunt.id; 
        } 
    } 
 
    if (!target_id) { 
        return null; 
    } 
 
    // Direct ID match in monster game database
    if (G.monsters[target_id]) {
        return target_id;
    }

    // Name-to-ID lookup mapping
    for (var id in G.monsters) {

        if (
            G.monsters[id].name &&
            G.monsters[id].name.toLowerCase() === target_id
        ) {

            return id;
        }
    }

    return target_id;
} 
 

// GET CURRENT ASSIGNMENT COUNT 
 
function get_assignment_count() { 
 
    if (!GET_ASSIGNMENT) { 
        return null; 
    } 
 
    var hunt = 
        character.s.monsterhunt; 
 
    if (!hunt) { 
        return null; 
    } 
 
    return hunt.c || 0; 
} 
 

// GET NEW DAISY ASSIGNMENT 
 
async function get_new_assignment() { 
 
    if (!GET_ASSIGNMENT) { 
        return true; 
    } 
 
    game_log( 
        "HUNT: Going to Daisy." 
    ); 
 
    set_message( 
        "Getting new hunt..." 
    ); 
 
    var teleported = 
        await teleport_to_town(); 
 
    if (!teleported) { 
 
        game_log( 
            "HUNT: Town teleport failed - NOT travelling to Daisy." 
        ); 
 
        return false; 
    } 
 
    await sleep(500); 
 
    try { 
 
        await smart_move( 
            "monsterhunter" 
        ); 
 
    } 
 
    catch (error) { 
 
        game_log( 
            "HUNT: Daisy travel error - " + 
            (error.reason || error) 
        ); 
 
        return false; 
    } 
 
    await sleep(500); 
 
    var hunt = 
        character.s.monsterhunt; 
 
    if ( 
        !hunt || 
        hunt.c <= 0 
    ) { 
 
        await interact( 
            "monsterhunt" 
        ); 
    } 
 
    await sleep(500); 
 
    reset_path_state(); 
    reset_combat_stuck_state(); 
 
    return true; 
} 


// ================================================================
// TIMED EVENT MONSTERS
// ================================================================

// Is this event monster alive right now? (the server publishes it in S)

function event_monster_info(type) {

    var info = parent.S && parent.S[type];

    if (info && info.live) {
        return info;
    }

    return null;
}


// Which event monster should be hunted right now (or null)?
//
// Sticky: once one is chosen it stays chosen until it is dead, so two
// alive at once are killed one after the other, never swapped between.

function pick_event_monster() {

    if (
        !EVENT_MONSTERS_ENABLED ||
        !EVENT_MONSTERS ||
        EVENT_MONSTERS.length === 0
    ) {
        current_event_type = null;
        return null;
    }

    if (
        current_event_type &&
        !event_monster_info(current_event_type)
    ) {

        game_log(
            "EVENT: " + current_event_type +
            " is gone - back to normal hunting."
        );

        current_event_type = null;

        start_event_loot("event monster gone");

        reset_path_state();
        reset_combat_stuck_state();
    }

    if (!current_event_type) {

        for (var i = 0; i < EVENT_MONSTERS.length; i++) {

            var entry = EVENT_MONSTERS[i];

            if (entry && entry.type && event_monster_info(entry.type)) {

                current_event_type = entry.type;

                var info = event_monster_info(entry.type);

                game_log(
                    "EVENT: " + entry.type + " is alive on " +
                    info.map + " - going to kill it."
                );

                reset_path_state();
                reset_combat_stuck_state();

                break;
            }
        }
    }

    if (!current_event_type) {
        return null;
    }

    return {
        type: current_event_type,
        info: event_monster_info(current_event_type)
    };
}


// Starts (or extends) the loot window after an event monster dies

function start_event_loot(reason) {

    if (!EVENT_LOOT_SECONDS) {
        return;
    }

    var now = Date.now();

    if (now > event_loot_until) {

        event_loot_started = now;
        event_loot_cleanup_done = false;

        event_loot_spot = {
            map: character.map,
            x: character.x,
            y: character.y
        };

        game_log(
            "EVENT: Collecting loot (" + reason + ")."
        );
    }

    event_loot_until = now + EVENT_LOOT_SECONDS * 1000;
}


// One tick of event looting. Returns true while it is busy looting, so the
// normal hunt loop should do nothing else this tick.

async function event_loot_step() {

    if (
        !EVENT_LOOT_SECONDS ||
        Date.now() > event_loot_until
    ) {
        return false;
    }

    var chests = parent.chests || {};

    var nearest = null;
    var nearest_distance = Infinity;

    for (var id in chests) {

        var chest = chests[id];

        if (!chest) continue;

        var d = distance(character, chest);

        if (d < nearest_distance) {
            nearest = chest;
            nearest_distance = d;
        }
    }

    // No chest yet (or all looted)
    if (!nearest) {

        if (
            Date.now() - event_loot_started >=
            EVENT_LOOT_MIN_SECONDS * 1000
        ) {

            event_loot_until = 0;

            game_log("EVENT: Loot collected.");

            return false;
        }

        set_message("Waiting for event loot...");

        return true;
    }

    set_message("Looting event drops...");

    // Not enough room for this chest: clean the inventory out once,
    // walk back and try again
    if (nearest.items > character.esize) {

        if (event_loot_cleanup_done) {

            game_log(
                "EVENT: No room for the loot - giving up on it."
            );

            event_loot_until = 0;

            return false;
        }

        event_loot_cleanup_done = true;

        game_log(
            "EVENT: Inventory too full for the loot - cleaning up first."
        );

        await cleanup_inventory();

        if (event_loot_spot) {

            try {
                await smart_move(event_loot_spot);
            }
            catch (error) {
                game_log(
                    "EVENT: Could not return to the loot - " +
                    (error.reason || error)
                );
            }
        }

        event_loot_until =
            Date.now() + EVENT_LOOT_SECONDS * 1000;

        return true;
    }

    // Walk to it if it is a bit far
    if (nearest_distance > EVENT_LOOT_REACH) {

        var now = Date.now();

        if (now - last_move_time >= MOVE_COOLDOWN) {

            move(nearest.x, nearest.y);

            last_move_time = now;
        }
    }

    try {
        loot();
    }
    catch (error) {
        game_log(
            "EVENT LOOT ERROR: " +
            (error.reason || error)
        );
    }

    return true;
}


// Where to travel to reach a monster. For the active event monster this is
// its real position; for everything else it is just the monster name.

function hunt_destination(monster_name) {

    if (monster_name && monster_name === current_event_type) {

        var info = event_monster_info(monster_name);

        if (
            info &&
            info.map &&
            typeof info.x === "number" &&
            typeof info.y === "number"
        ) {
            current_meet = { map: info.map, x: info.x, y: info.y };
            meet_spot_for = monster_name;

            return current_meet;
        }
    }

    var spot = monster_spot(monster_name);

    if (!spot) return monster_name;

    current_meet = spot;

    return spot;
}

// ONE FIXED SPOT FOR A MONSTER
//
// smart_move("bee") picks a RANDOM bee spawn every time it is called, so
// two characters (or the same one retrying) can end up on different maps.
// This picks one spawn and keeps it until the monster changes: the closest
// one on the leader's map, otherwise the first one in the game's list.

function monster_spot(monster_name) {

    if (!monster_name || !G.monsters[monster_name]) return null;

    if (current_meet && meet_spot_for === monster_name) {
        return current_meet;
    }

    var spots = [];

    for (var map_name in G.maps) {

        var map = G.maps[map_name];

        if (!map || map.ignore || map.instance) continue;

        (map.monsters || []).forEach(function(pack) {

            if (pack.type !== monster_name) return;

            if (pack.boundary) {

                var b = pack.boundary;

                spots.push({
                    map: map_name,
                    x: (b[0] + b[2]) / 2,
                    y: (b[1] + b[3]) / 2
                });
            }

            else if (pack.boundaries) {

                pack.boundaries.forEach(function(bb) {

                    spots.push({
                        map: bb[0],
                        x: (bb[1] + bb[3]) / 2,
                        y: (bb[2] + bb[4]) / 2
                    });
                });
            }
        });
    }

    if (spots.length === 0) return null;

    var best = spots[0];
    var best_distance = Infinity;

    for (var i = 0; i < spots.length; i++) {

        if (spots[i].map !== character.map) continue;

        var d = Math.hypot(spots[i].x - character.x, spots[i].y - character.y);

        if (d < best_distance) {
            best = spots[i];
            best_distance = d;
        }
    }

    meet_spot_for = monster_name;

    game_log(
        "MEET: " + monster_name + " at " + best.map +
        " (" + Math.round(best.x) + ", " + Math.round(best.y) + ")"
    );

    return best;
}


// ================================================================
// STUCK WATCHDOG
// ================================================================

// smart_move towards a monster, flagged so the watchdog watches it

async function hunt_smart_move(destination) {

    hunt_phase = "path";

    // The leader tells the followers where it is going, so they can
    // path there at the same time instead of chasing its old spot
    if (IS_LEADER) {
        leader_dest = destination;
        send_party_state();
        match_party_speed();
    }

    try {

        return await smart_move(destination);

    }

    finally {

        if (hunt_phase === "path") {
            hunt_phase = null;
        }

        if (IS_LEADER) {
            leader_dest = null;
            send_party_state();
            restore_speed();
        }
    }
}


// Any hit we land counts as progress while fighting

game.on(
    "hit",
    function(data) {

        if (
            data &&
            data.actor == character.id
        ) {
            last_own_hit_time = Date.now();
        }
    }
);


function unstick_reset() {

    unstick_phase = null;
    unstick_since = 0;
}


async function unstick_teleport(phase) {

    // Everything up to the first await runs without interruption,
    // so the hunt loop cannot move on to something else in between.

    unstick_busy = true;

    game_log(
        "WATCHDOG: No progress for " +
        STUCK_TELEPORT_SECONDS +
        "s while " +
        (phase === "path" ? "pathing to monster" : "in combat") +
        " - teleporting to town to retry."
    );

    set_message(
        "Stuck - teleporting..."
    );

    // Abort any smart_move in flight (this makes it reject, which lets
    // the running hunt tick finish)
    try {
        stop();
    }
    catch (error) { }

    var teleported = false;

    try {

        // Let an in-flight hunt tick unwind
        var waited = 0;

        while (working && waited < 10000) {
            await sleep(250);
            waited += 250;
        }

        for (var attempt = 1; attempt <= 3; attempt++) {

            if (character.rip) {
                break;
            }

            try {

                await use_skill("use_town");

                await sleep(2000);

                teleported = true;

                break;
            }

            catch (error) {

                game_log(
                    "WATCHDOG: Town teleport error - " +
                    (error.reason || error)
                );

                await sleep(1500);
            }
        }
    }

    catch (error) {

        game_log(
            "WATCHDOG ERROR: " +
            (error.reason || error)
        );
    }

    reset_path_state();
    reset_combat_stuck_state();

    hunt_phase = null;

    unstick_reset();

    if (!teleported) {

        // Try again fairly soon instead of waiting a full minute
        unstick_phase = phase;
        unstick_map = character.map;
        unstick_x = character.x;
        unstick_y = character.y;
        unstick_since =
            Date.now() -
            Math.max(
                0,
                STUCK_TELEPORT_SECONDS * 1000 - 15000
            );
    }

    else {

        game_log(
            "WATCHDOG: Teleported - resuming hunt."
        );
    }

    unstick_busy = false;
}


async function stuck_watchdog() {

    if (!STUCK_TELEPORT_ENABLED) return;
    if (unstick_busy) return;

    // Only watch while pathing to a monster or fighting one
    if (
        !hunt_phase ||
        character.rip ||
        respawning
    ) {
        unstick_reset();
        return;
    }

    var now = Date.now();

    // Anything that counts as movement restarts the timer
    if (
        unstick_since === 0 ||
        unstick_phase !== hunt_phase ||
        unstick_map !== character.map ||
        distance(
            character,
            { x: unstick_x, y: unstick_y }
        ) >= STUCK_POSITION_DISTANCE
    ) {

        unstick_phase = hunt_phase;
        unstick_map = character.map;
        unstick_x = character.x;
        unstick_y = character.y;
        unstick_since = now;

        return;
    }

    var last_progress = unstick_since;

    if (
        hunt_phase === "combat" &&
        last_own_hit_time > last_progress
    ) {
        last_progress = last_own_hit_time;
    }

    if (
        now - last_progress <
        STUCK_TELEPORT_SECONDS * 1000
    ) {
        return;
    }

    await unstick_teleport(hunt_phase);
}


setInterval(
    stuck_watchdog,
    STUCK_CHECK_INTERVAL
);


// ================================================================
// PARTY
// ================================================================
//
// Party setup and following are based on the Conditional Behavior
// Model repo (PartyManager + Actions.follow). The leader tells the
// followers which monster it is hunting with a code message (cm).

// What the followers last heard from the leader
var leader_state = null;

// The monster the leader is hunting right now
var current_hunt_monster = null;

var last_follow_path_time = 0;
var partyheal_unavailable = false;

// Where the leader's current smart_move is heading (null = not pathing)
var leader_dest = null;

// What a follower's current smart_move is heading for
var follow_path_target = null;
var follow_path_kind = null;      // "dest" = leader's destination, "spot" = leader's position
var follow_interrupted = false;
var follow_detour_entity = null;   // who a "detour" path is going round to
var last_detour_time = 0;

// When the leader started waiting for the party (0 = not waiting)
var party_wait_started = 0;

// Followers' run speeds, reported to the leader
var follower_speeds = {};

// Meeting spot the leader has chosen (leader) / been told (followers)
var current_meet = null;
var meet_spot_for = null;

// What each follower is doing: "busy" (town trip), "heading" (on the way
// to the meeting spot), "here" (at the spot / with the leader)
var follower_status = "here";
var follower_states = {};
var leader_cruising = false;
var last_sent_target = null;


// Is this character's window open on this PC right now?

function character_is_online(name) {

    try {

        if (typeof is_character_local === "function") {
            return is_character_local(name);
        }

    }

    catch (error) { }

    return true;
}

function in_party_list(name) {

    var list = parent.party_list || [];

    for (var i = 0; i < list.length; i++) {

        if (same_name(list[i], name)) {
            return true;
        }
    }

    return false;
}


// PARTY INVITES (repo: autoparty)

function party_manager() {

    if (IS_MERCHANT || character.rip) return;

    try {

        if (IS_LEADER) {

            for (var f = 0; f < FOLLOWERS.length; f++) {

                var name = FOLLOWERS[f];

                if (
                    name &&
                    !in_party_list(name) &&
                    character_is_online(name)
                ) {
                    send_party_invite(name);
                }
            }
        }

        else if (IS_FOLLOWER) {

            // In someone else's party - leave so the leader can invite us
            if (
                character.party &&
                !same_name(character.party, LEADER) &&
                !in_party_list(LEADER)
            ) {

                game_log(
                    "PARTY: In " + character.party +
                    "'s party, not " + LEADER + "'s - leaving."
                );

                leave_party();
            }

            else if (
                !character.party &&
                character_is_online(LEADER)
            ) {
                send_party_request(LEADER);
            }
        }
    }

    catch (error) {

        game_log(
            "PARTY ERROR: " +
            (error.reason || error)
        );
    }
}

setInterval(
    party_manager,
    PARTY_INVITE_SECONDS * 1000
);


// Followers accept the leader's invite

function on_party_invite(name) {

    if (IS_FOLLOWER && same_name(name, LEADER)) {
        accept_party_invite(name);
    }
}


// The leader accepts requests from followers

function on_party_request(name) {

    if (
        IS_LEADER &&
        (is_follower_name(name) || in_party_roles(name))
    ) {
        accept_party_request(name);
    }
}


// LEADER -> FOLLOWERS: WHAT WE ARE HUNTING AND WHERE WE ARE GOING

function send_party_state() {

        if (!IS_LEADER) return;

        var to = [];
        var followers = all_follower_names();

        for (var f = 0; f < followers.length; f++) {

            if (in_party_list(followers[f])) {
                to.push(followers[f]);
            }
        }

        if (to.length === 0) return;

        send_cm(
            to,
            {
                party_state: {
                    monster: current_hunt_monster,
                    target: last_sent_target || character.target || null,
                    dest: leader_dest,
                    meet: current_meet,
                    map: character.map,
                    x: character.x,
                    y: character.y
                }
            }
        ).catch(function() { });
}

setInterval(
    send_party_state,
    PARTY_STATE_SECONDS * 1000
);


// CODE MESSAGES

character.on(
    "cm",
    function(m) {

        if (!m || !m.message) return;

        // Follower hears from the leader
        if (
            IS_FOLLOWER &&
            same_name(m.name, LEADER) &&
            m.message.party_state
        ) {

            leader_state = m.message.party_state;
            leader_state.time = Date.now();

            return;
        }

        // Leader hears a follower's speed
        if (
            IS_LEADER &&
            (is_follower_name(m.name) || in_party_roles(m.name)) &&
            m.message.member_speed
        ) {

            follower_speeds[String(m.name).toLowerCase()] =
                m.message.member_speed;

            follower_states[String(m.name).toLowerCase()] = {
                status: m.message.member_status,
                time: Date.now()
            };

            return;
        }

        // Leader hears a follower's kill
        if (
            IS_LEADER &&
            (is_follower_name(m.name) || in_party_roles(m.name)) &&
            m.message.party_kill
        ) {

            var manual_target =
                MANUAL_MONSTER_LIST[MANUAL_MONSTER_INDEX];

            if (
                manual_target &&
                manual_target.type &&
                manual_target.type.toLowerCase() ===
                    String(m.message.party_kill).toLowerCase()
            ) {
                count_manual_kill();
            }
        }
    }
);


// WHERE IS THE LEADER?
//
// Seen on this map -> exact spot. Otherwise the party list (it knows
// every member's map and position), then the leader's last message.

function find_party_entry(name) {

    var party = get_party() || {};

    for (var key in party) {

        if (same_name(key, name)) {
            return party[key];
        }
    }

    return null;
}

function leader_location() {

    var seen = get_player(LEADER);

    if (seen && seen.visible !== false) {

        return {
            entity: seen,
            map: character.map,
            x: seen.x,
            y: seen.y,
            rip: !!seen.rip
        };
    }

    var entry = find_party_entry(LEADER);

    if (
        entry &&
        entry.map &&
        typeof entry.x === "number"
    ) {

        return {
            entity: null,
            map: entry.map,
            x: entry.x,
            y: entry.y,
            rip: !!entry.rip
        };
    }

    if (
        leader_state &&
        leader_state.map &&
        Date.now() - leader_state.time < 10000
    ) {

        return {
            entity: null,
            map: leader_state.map,
            x: leader_state.x,
            y: leader_state.y,
            rip: false
        };
    }

    return null;
}


// MOVEMENT HELPERS

// Walk part of the way towards someone (repo: a third of the way)

function walk_toward(entity, fraction) {

    var now = Date.now();

    if (now - last_move_time < MOVE_COOLDOWN) return;

    fraction = fraction || 1 / 3;

    move(
        character.x + (entity.x - character.x) * fraction,
        character.y + (entity.y - character.y) * fraction
    );

    last_move_time = now;
}

// Is the straight line to this spot free of water / walls?

function clear_path_to(x, y) {

    try {
        return can_move_to(x, y);
    }

    catch (error) {
        return true;
    }
}

// Something is in the way (a river, a wall) - smart_move round it.
// The follow watcher stops this path as soon as the straight line is
// clear again, or the one we're going to has moved away.

async function detour_to(entity) {

    var now = Date.now();

    if (now - last_detour_time < 1000) return;

    last_detour_time = now;

    var spot = { map: character.map, x: entity.x, y: entity.y };

    follow_path_target = spot;
    follow_path_kind = "detour";
    follow_detour_entity = entity;
    follow_interrupted = false;

    hunt_phase = "path";

    set_message("Going round");

    try {

        await smart_move(spot);

    }

    catch (error) { }

    finally {

        if (hunt_phase === "path") {
            hunt_phase = null;
        }

        follow_path_target = null;
        follow_path_kind = null;
        follow_detour_entity = null;
    }
}

// Walk towards someone, going round anything in the way

async function step_toward(entity, fraction) {

    if (clear_path_to(entity.x, entity.y)) {

        walk_toward(entity, fraction);

        return;
    }

    await detour_to(entity);
}

// Long distance / other map: smart_move towards the leader.
//
// kind "dest" = the place the leader is pathing to (a monster name or a
// map spot), so the follower travels there alongside the leader.
// kind "spot" = the leader's current position.

async function follow_smart_move(target, kind) {

    var now = Date.now();

    if (now - last_follow_path_time < 1000) return;

    last_follow_path_time = now;

    reset_combat_stuck_state();

    follow_path_target = target;
    follow_path_kind = kind || "spot";
    follow_interrupted = false;

    try {

        await hunt_smart_move(target);

    }

    catch (error) {

        if (!follow_interrupted) {

            game_log(
                "FOLLOW: Path to " + LEADER + " failed - " +
                (error.reason || error)
            );

            last_follow_path_time = Date.now() + PATH_RETRY_DELAY;
        }
    }

    finally {

        follow_path_target = null;
        follow_path_kind = null;
    }
}

function fresh_leader_dest() {

    if (
        leader_state &&
        leader_state.dest &&
        Date.now() - leader_state.time < 5000
    ) {
        return leader_state.dest;
    }

    return null;
}

function fresh_meet() {

    if (
        leader_state &&
        leader_state.meet &&
        Date.now() - leader_state.time < 10000
    ) {
        return leader_state.meet;
    }

    return null;
}

function leader_distance_or_far(leader) {

    return leader ? distance(character, leader) : Infinity;
}

function same_dest(a, b) {

    return JSON.stringify(a) === JSON.stringify(b);
}

// FOLLOW WATCHER
//
// While a follower is smart_moving, keep checking it is still going the
// right way. Stop the path (so the next tick picks a new one) when:
//   - the leader is in sight and close - walk the rest
//   - the leader has changed where it is going
//   - the leader has moved well away from the spot we are heading to

function interrupt_follow(reason) {

    follow_interrupted = true;

    try {
        stop("smart");
    }
    catch (error) { }
}

setInterval(
    function() {

        if (!follow_path_target || unstick_busy) return;

        // Going round an obstacle
        if (follow_path_kind === "detour") {

            var who = follow_detour_entity;

            if (
                !who ||
                who.dead ||
                who.rip ||
                who.visible === false ||
                clear_path_to(who.x, who.y) ||
                Math.hypot(
                    who.x - follow_path_target.x,
                    who.y - follow_path_target.y
                ) > FOLLOW_REPATH_DISTANCE
            ) {
                interrupt_follow("detour done");
            }

            return;
        }

        if (!IS_FOLLOWER) return;

        var seen = get_player(LEADER);

        if (
            seen &&
            seen.visible !== false &&
            distance(character, seen) <= FOLLOW_FAR_DISTANCE
        ) {
            interrupt_follow("leader close");
            return;
        }

        if (follow_path_kind === "meet") {

            if (!same_dest(fresh_meet(), follow_path_target)) {
                interrupt_follow("meeting spot changed");
            }

            return;
        }

        var dest = fresh_leader_dest();

        if (follow_path_kind === "dest") {

            if (!same_dest(dest, follow_path_target)) {
                interrupt_follow("leader changed destination");
            }

            return;
        }

        // Heading for the leader's old spot
        if (dest) {
            interrupt_follow("leader is now pathing");
            return;
        }

        var where = leader_location();

        if (!where) return;

        if (
            where.map !== follow_path_target.map ||
            Math.hypot(
                where.x - follow_path_target.x,
                where.y - follow_path_target.y
            ) > FOLLOW_REPATH_DISTANCE
        ) {
            interrupt_follow("leader moved");
        }
    },
    500
);


// LEADER: HAS THE PARTY CAUGHT UP?

function followers_not_here() {

    var missing = [];
    var followers = all_follower_names();

    for (var f = 0; f < followers.length; f++) {

        var name = followers[f];

        // Only wait for followers that are online and in the party
        if (!in_party_list(name)) continue;

        // ... and not busy in town (they come to the spot afterwards)
        var state = follower_states[String(name).toLowerCase()];

        if (
            state &&
            state.status === "busy" &&
            Date.now() - state.time < 5000
        ) {
            continue;
        }

        var seen = get_player(name);

        if (seen && seen.visible !== false) {

            if (
                !seen.rip &&
                distance(character, seen) > PARTY_GATHER_DISTANCE
            ) {
                missing.push(name);
            }

            continue;
        }

        var entry = find_party_entry(name);

        if (!entry || entry.rip) continue;

        if (
            entry.map !== character.map ||
            Math.hypot(entry.x - character.x, entry.y - character.y) >
                PARTY_GATHER_DISTANCE
        ) {
            missing.push(name);
        }
    }

    return missing;
}

// true = go ahead and fight. Waits at most PARTY_WAIT_MAX_SECONDS, then
// carries on until the party has gathered again.

function party_ready_to_fight() {

    if (!LEADER_WAITS_FOR_PARTY || !IS_LEADER) return true;

    var missing = followers_not_here();

    if (missing.length === 0) {
        party_wait_started = 0;
        return true;
    }

    if (!party_wait_started) {

        party_wait_started = Date.now();

        game_log(
            "PARTY: Waiting for " + missing.join(", ") + " to catch up."
        );
    }

    if (Date.now() - party_wait_started > PARTY_WAIT_MAX_SECONDS * 1000) {
        return true;
    }

    set_message("Waiting for " + missing.join(", "));

    return false;
}


// LEADER TRAVEL SPEED (repo: action.goto - "just a little slower than
// the slowest member, to allow them to catch up")

function slowest_follower_speed() {

    var slowest = null;
    var followers = all_follower_names();

    for (var f = 0; f < followers.length; f++) {

        var name = followers[f];

        if (!in_party_list(name)) continue;

        var seen = get_player(name);
        var speed =
            (seen && seen.speed) ||
            follower_speeds[String(name).toLowerCase()];

        if (speed && (slowest === null || speed < slowest)) {
            slowest = speed;
        }
    }

    return slowest;
}

function match_party_speed() {

    if (!MATCH_PARTY_SPEED || !IS_LEADER) return;

    var slowest = slowest_follower_speed();

    if (!slowest) return;

    try {

        cruise(Math.max(10, slowest - 5)).catch(function() { });

        leader_cruising = true;

    }

    catch (error) { }
}

function restore_speed() {

    if (!leader_cruising) return;

    leader_cruising = false;

    try {

        // A very high cap = no cap
        cruise(100000).catch(function() { });

    }

    catch (error) { }
}

// Clear any speed cap left over from an earlier run as leader
try {
    if (!IS_MERCHANT) cruise(100000).catch(function() { });
}
catch (error) { }

// Followers tell the leader their speed every few seconds

setInterval(
    function() {

        if (!IS_FOLLOWER || !in_party_list(LEADER)) return;

        send_cm(
            LEADER,
            {
                member_speed: character.speed,
                member_status: follower_status
            }
        ).catch(function() { });
    },
    1000
);


// WHILE TRAVELLING
//
// A smart_move keeps the main loop busy until it arrives, so this keeps
// the important things going on the way: potions, priest heals, and
// followers hitting the leader's target when it is already in range.

setInterval(
    function() {

        if (IS_MERCHANT || character.rip) return;

        var smart_moving =
            typeof smart !== "undefined" && smart && smart.moving;

        if (hunt_phase !== "path" && !smart_moving) return;

        drink_potions_if_needed();

        // Priest: heal anyone in range without leaving the path
        if (IS_PRIEST && !is_on_cooldown("attack")) {

            var members = party_members_nearby();
            var worst = null;

            for (var i = 0; i < members.length; i++) {

                var pct = hp_percent(members[i]);

                if (
                    pct <= PRIEST_HEAL_PERCENT &&
                    is_in_range(members[i]) &&
                    (!worst || pct < hp_percent(worst))
                ) {
                    worst = members[i];
                }
            }

            if (worst) {

                heal(worst).catch(function() { });

                return;
            }
        }

        // Followers: hit the leader's target if it is already in range
        if (IS_FOLLOWER && !(IS_PRIEST && !PRIEST_ATTACKS)) {

            var leader = get_player(LEADER);
            var target = leader ? get_target_of(leader) : null;

            if (
                is_live_monster(target) &&
                distance(character, target) <= character.range &&
                can_attack(target)
            ) {
                attack(target).catch(function() { });
            }
        }
    },
    300
);


// WHICH MONSTER SHOULD A FOLLOWER ATTACK?

function is_live_monster(entity) {

    return !!(
        entity &&
        entity.type === "monster" &&
        !entity.dead &&
        entity.visible !== false
    );
}

function party_names() {

    var names = [LEADER, character.name].concat(all_follower_names());

    return names.concat(parent.party_list || []);
}

function follower_pick_target(leader) {

    // 1. Whatever the leader is attacking
    var leaders_target = get_target_of(leader);

    if (is_live_monster(leaders_target)) {
        return leaders_target;
    }

    // 2. The target the leader last told us about
    if (leader_state && leader_state.target) {

        var told = parent.entities[leader_state.target];

        if (is_live_monster(told)) {
            return told;
        }
    }

    // 3. Anything hitting us or the party
    if (FOLLOWERS_DEFEND) {

        var on_me = get_nearest_monster({ target: character });

        if (
            on_me &&
            distance(leader, on_me) <= ASSIST_RANGE
        ) {
            return on_me;
        }

        var names = party_names();

        for (var id in parent.entities) {

            var e = parent.entities[id];

            if (
                is_live_monster(e) &&
                e.target &&
                names.some(function(n) { return same_name(n, e.target); }) &&
                distance(leader, e) <= ASSIST_RANGE
            ) {
                return e;
            }
        }
    }

    // 4. The leader's hunt monster, near the leader (only if allowed to
    //    start fights without the leader)
    if (FOLLOWERS_PULL && leader_state && leader_state.monster) {

        var nearest = get_nearest_monster({
            type: leader_state.monster
        });

        if (
            nearest &&
            distance(leader, nearest) <= ASSIST_RANGE
        ) {
            return nearest;
        }
    }

    return null;
}


// ================================================================
// FIGHT ONE TARGET (role decides ranged kiting or melee)
// ================================================================

async function fight_target(target) {

    hunt_phase = "combat";

    reset_path_state();

    // LOOT
    loot();

    // TARGET THE MONSTER
    change_target(target);

    // Leader: tell the followers about a new target straight away
    if (IS_LEADER && target.id !== last_sent_target) {

        last_sent_target = target.id;

        send_party_state();
    }

    // ========================================================
    // RANGED MODE (Mage, Ranger, Priest)
    // ========================================================

    // Out of reach and something is in the way - go round it first
    if (
        distance(character, target) >
            (RANGED_MAGIC_ATTACKS
                ? get_preferred_range() + RANGE_TOLERANCE
                : character.range) &&
        !clear_path_to(target.x, target.y)
    ) {

        await detour_to(target);

        return;
    }

    if (RANGED_MAGIC_ATTACKS) {

        var at_attack_distance =
            maintain_attack_distance(
                target
            );

        // COMBAT STUCK DETECTION
        if (!at_attack_distance) {

            if (
                combat_movement_is_stuck(
                    target
                )
            ) {

                await recover_from_combat_stuck(
                    target
                );

                return;
            }

        }

        else {

            reset_combat_stuck_state();
        }

        // RANGED ATTACK - Check range explicitly so we hit even while repositioning
        if (
            distance(
                character,
                target
            ) <= character.range &&
            can_attack(target)
        ) {

            attack(target);
        }

    }

    // ========================================================
    // MELEE MODE (Warrior, Paladin, Rogue)
    // ========================================================

    else {

        if (!is_in_range(target)) {

            var now = Date.now();

            if (
                now -
                last_move_time >=
                MOVE_COOLDOWN
            ) {

                move(
                    character.x +
                    (target.x -
                    character.x) / 2,

                    character.y +
                    (target.y -
                    character.y) / 2
                );

                last_move_time =
                    now;
            }

        }

        else if (
            !is_moving(character) &&
            can_attack(target)
        ) {

            attack(target);
        }
    }

    // LOOT AGAIN
    loot();
}


// ================================================================
// FOLLOWER: FOLLOW THE LEADER, ATTACK ITS TARGET
// ================================================================

async function follower_step(no_attack) {

    var where = leader_location();

    if (!where) {

        hunt_phase = null;

        set_message("Waiting for " + LEADER);

        return;
    }

    var leader = where.entity;

    // Leader is on another map or out of sight - go to it, don't stop
    // to fight whatever is left behind
    // Meeting spot: go there, not to the leader
    var meet = fresh_meet();

    if (
        meet &&
        (!leader || leader_distance_or_far(leader) > FOLLOW_FAR_DISTANCE)
    ) {

        var at_spot =
            character.map === meet.map &&
            Math.hypot(character.x - meet.x, character.y - meet.y) <= MEET_RADIUS;

        if (!at_spot) {

            follower_status = "heading";

            set_message("Meeting " + LEADER + " at " + meet.map);

            await follow_smart_move(meet, "meet");

            return;
        }

        follower_status = "here";

        // Arrived - wait for the leader, defend ourselves meanwhile
        if (!leader) {

            var on_me_here =
                no_attack ? null : get_nearest_monster({ target: character });

            if (on_me_here) {

                await fight_target(on_me_here);

                return;
            }

            hunt_phase = null;

            loot();

            set_message("Waiting for " + LEADER + " at the spot");

            return;
        }
    }

    follower_status = "here";

    if (!leader) {

        set_message("Following " + LEADER);

        var dest = fresh_leader_dest();

        if (dest) {
            await follow_smart_move(dest, "dest");
        }

        else {
            await follow_smart_move(
                { map: where.map, x: where.x, y: where.y },
                "spot"
            );
        }

        return;
    }

    var leader_distance = distance(character, leader);

    var target = no_attack ? null : follower_pick_target(leader);

    if (target) {

        // Kited too far away from the leader - go back first
        if (leader_distance > LEASH_DISTANCE) {

            await step_toward(leader, 1 / 2);

            if (
                distance(character, target) <= character.range &&
                can_attack(target)
            ) {
                change_target(target);
                attack(target);
            }

            return;
        }

        set_message("Assisting " + LEADER + ": " + target.mtype);

        await fight_target(target);

        return;
    }

    // Nothing to fight - stay with the leader
    hunt_phase = null;

    reset_combat_stuck_state();

    loot();

    set_message("Following " + LEADER);

    if (leader_distance > FOLLOW_FAR_DISTANCE) {

        await follow_smart_move(
            { map: where.map, x: where.x, y: where.y },
            "spot"
        );
    }

    else if (leader_distance > FOLLOW_DISTANCE) {

        await step_toward(leader, 1 / 3);
    }
}


// ================================================================
// PRIEST: HEAL THE PARTY FIRST (repo: heal roll + health_below)
// ================================================================

function hp_percent(entity) {

    if (!entity || !entity.max_hp) return 100;

    return (entity.hp / entity.max_hp) * 100;
}

function party_members_nearby() {

    var names = party_names();
    var seen = {};
    var members = [];

    for (var i = 0; i < names.length; i++) {

        var key = String(names[i] || "").toLowerCase();

        if (!key || seen[key]) continue;

        seen[key] = true;

        var player =
            same_name(names[i], character.name)
                ? character
                : get_player(names[i]);

        if (
            player &&
            !player.rip &&
            player.visible !== false
        ) {
            members.push(player);
        }
    }

    return members;
}

async function priest_heal_step() {

    if (!IS_PRIEST) return false;

    // A following priest that has lost the leader goes to it first
    // (its own HP is covered by potions on the way)
    if (IS_FOLLOWER) {

        var leader = get_player(LEADER);

        if (
            !leader ||
            leader.visible === false ||
            distance(character, leader) > FOLLOW_FAR_DISTANCE
        ) {
            return false;
        }
    }

    var members = party_members_nearby();

    // PARTY HEAL when several are low
    var low = members.filter(function(m) {
        return hp_percent(m) <= PRIEST_PARTY_HEAL_PERCENT;
    });

    var party_heal = G.skills.partyheal;

    if (
        !partyheal_unavailable &&
        party_heal &&
        low.length >= PRIEST_PARTY_HEAL_COUNT &&
        !is_on_cooldown("partyheal") &&
        character.mp >= (party_heal.mp || 0) &&
        character.level >= (party_heal.level || 0)
    ) {

        set_message("Party heal");

        try {

            await use_skill("partyheal");

        }

        catch (error) {

            game_log(
                "PRIEST: Party heal failed - " +
                (error.reason || error)
            );

            if (error && error.reason === "level") {
                partyheal_unavailable = true;
            }
        }

        return true;
    }

    // SINGLE HEAL on whoever is lowest
    var worst = null;

    for (var i = 0; i < members.length; i++) {

        var pct = hp_percent(members[i]);

        if (
            pct <= PRIEST_HEAL_PERCENT &&
            (!worst || pct < hp_percent(worst))
        ) {
            worst = members[i];
        }
    }

    if (!worst) return false;

    // Healing doesn't count as stuck
    hunt_phase = null;

    reset_combat_stuck_state();

    set_message("Healing " + worst.name);

    if (is_in_range(worst)) {

        if (!is_on_cooldown("attack")) {

            heal(worst).catch(function() { });
        }
    }

    else {

        await step_toward(worst, 1 / 2);
    }

    return true;
}


// ================================================================
// SMART SKILLS
// ================================================================
//
// Runs on its own timer, so it also works while travelling. Each skill
// is only used when the character has it (level, MP, cooldown, weapon,
// items) and the situation calls for it.

var skill_last_try = {};

function weapon_type() {

    var weapon = character.slots && character.slots.mainhand;

    if (!weapon || !G.items[weapon.name]) return null;

    return G.items[weapon.name].wtype || null;
}

function skill_ready(name) {

    var skill = G.skills[name];

    if (!skill || !USE_SKILLS || SKILLS[name] !== true) return false;

    if (
        skill.class &&
        skill.class.indexOf(character.ctype) === -1
    ) {
        return false;
    }

    if (character.level < (skill.level || 0)) return false;
    if (character.mp < (skill.mp || 0)) return false;
    if (is_on_cooldown(name)) return false;

    if (skill.wtype) {

        var types = Array.isArray(skill.wtype) ? skill.wtype : [skill.wtype];

        if (types.indexOf(weapon_type()) === -1) return false;
    }

    if (skill.consume && locate_item(skill.consume) < 0) return false;

    // Don't resend while the last try is still on its way
    if (
        skill_last_try[name] &&
        Date.now() - skill_last_try[name] < 400
    ) {
        return false;
    }

    return true;
}

function cast_skill(name, target) {

    skill_last_try[name] = Date.now();

    try {

        var result =
            target === undefined
                ? use_skill(name)
                : use_skill(name, target);

        if (result && result.catch) {
            result.catch(function() { });
        }
    }

    catch (error) { }

    return true;
}

function mp_percent(entity) {

    if (!entity || !entity.max_mp) return 100;

    return (entity.mp / entity.max_mp) * 100;
}

function skill_mp_ok() {

    return mp_percent(character) >= SKILL_MP_RESERVE_PERCENT;
}

function has_condition(entity, name) {

    return !!(entity && entity.s && entity.s[name]);
}

function monsters_near(radius) {

    var list = [];

    for (var id in parent.entities) {

        var e = parent.entities[id];

        if (
            is_live_monster(e) &&
            distance(character, e) <= radius
        ) {
            list.push(e);
        }
    }

    return list;
}

function targets_party(monster) {

    if (!monster || !monster.target) return false;

    var names = party_names();

    for (var i = 0; i < names.length; i++) {

        if (same_name(names[i], monster.target)) return true;
    }

    return false;
}

// Only use area skills when nothing idle is in range (no extra pulls)
function all_on_party(list) {

    for (var i = 0; i < list.length; i++) {

        if (!targets_party(list[i])) return false;
    }

    return true;
}

// Worth a skill? (not a monster that one more hit will finish)
function worth_it(target) {

    return !!target && target.hp > (character.attack || 0) * 3;
}

function run_skills() {

    if (
        !USE_SKILLS ||
        IS_MERCHANT ||
        character.rip ||
        respawning ||
        unstick_busy
    ) {
        return;
    }

    var target = get_targeted_monster();

    if (!is_live_monster(target)) target = null;

    var party_fighting = monsters_near(600).some(targets_party);

    var travelling =
        hunt_phase === "path" ||
        (typeof smart !== "undefined" && smart && smart.moving);

    var hit_on_me = monsters_near(600).some(function(m) {
        return same_name(m.target, character.name);
    });

    var ctype = character.ctype;

    // ------------------------------------------------------------
    // WARRIOR - the tank
    // ------------------------------------------------------------

    if (ctype === "warrior") {

        if (
            skill_ready("hardshell") &&
            hp_percent(character) < 40 &&
            hit_on_me &&
            !has_condition(character, "hardshell")
        ) {
            return cast_skill("hardshell");
        }

        // A monster hitting someone else - pull it onto the warrior
        var strays = monsters_near(320).filter(function(m) {
            return targets_party(m) && !same_name(m.target, character.name);
        });

        var near320 = monsters_near(320);

        if (
            skill_ready("agitate") &&
            strays.length >= 2 &&
            all_on_party(near320)
        ) {
            return cast_skill("agitate");
        }

        if (skill_ready("taunt")) {

            for (var t = 0; t < strays.length; t++) {

                if (distance(character, strays[t]) <= G.skills.taunt.range) {
                    return cast_skill("taunt", strays[t]);
                }
            }
        }

        if (
            skill_ready("warcry") &&
            party_fighting &&
            !has_condition(character, "warcry")
        ) {
            return cast_skill("warcry");
        }

        if (skill_mp_ok()) {

            var near400 = monsters_near(G.skills.stomp.range || 400);

            if (
                skill_ready("stomp") &&
                near400.length >= 2 &&
                all_on_party(near400)
            ) {
                return cast_skill("stomp");
            }

            var near160 = monsters_near(G.skills.cleave.range || 160);

            if (
                skill_ready("cleave") &&
                near160.length >= 3 &&
                all_on_party(near160)
            ) {
                return cast_skill("cleave");
            }
        }

        if (
            skill_ready("charge") &&
            travelling &&
            !has_condition(character, "charging")
        ) {
            return cast_skill("charge");
        }

        return;
    }

    // ------------------------------------------------------------
    // MAGE
    // ------------------------------------------------------------

    if (ctype === "mage") {

        if (skill_ready("energize") && mp_percent(character) > 70) {

            var members = party_members_nearby();

            for (var e = 0; e < members.length; e++) {

                var member = members[e];

                if (
                    member !== character &&
                    !same_name(member.name, character.name) &&
                    mp_percent(member) < 40 &&
                    distance(character, member) <= G.skills.energize.range
                ) {
                    return cast_skill("energize", member);
                }
            }
        }

        if (skill_ready("reflection") && skill_mp_ok()) {

            var hit_members = party_members_nearby().filter(function(m) {
                return (
                    !has_condition(m, "reflection") &&
                    distance(character, m) <= G.skills.reflection.range &&
                    monsters_near(600).some(function(x) {
                        return same_name(x.target, m.name);
                    })
                );
            });

            if (hit_members.length) {
                return cast_skill("reflection", hit_members[0]);
            }
        }

        if (
            skill_ready("burst") &&
            target &&
            is_in_range(target) &&
            mp_percent(character) > 90 &&
            target.hp <= character.mp * 0.5 &&
            target.max_hp > (character.attack || 0) * 5
        ) {
            return cast_skill("burst", target);
        }

        return;
    }

    // ------------------------------------------------------------
    // RANGER
    // ------------------------------------------------------------

    if (ctype === "ranger") {

        if (!target || !skill_mp_ok()) return;

        // Several monsters already on the party - hit them all
        var on_party = monsters_near(character.range).filter(targets_party);

        if (skill_ready("5shot") && on_party.length >= 5) {
            return cast_skill("5shot", on_party.slice(0, 5));
        }

        if (skill_ready("3shot") && on_party.length >= 3) {
            return cast_skill("3shot", on_party.slice(0, 3));
        }

        if (
            skill_ready("huntersmark") &&
            !has_condition(target, "marked") &&
            worth_it(target) &&
            is_in_range(target, "huntersmark")
        ) {
            return cast_skill("huntersmark", target);
        }

        if (
            skill_ready("supershot") &&
            worth_it(target) &&
            is_in_range(target, "supershot")
        ) {
            return cast_skill("supershot", target);
        }

        return;
    }

    // ------------------------------------------------------------
    // ROGUE
    // ------------------------------------------------------------

    if (ctype === "rogue") {

        if (skill_ready("rspeed")) {

            var speedy = party_members_nearby().filter(function(m) {
                return (
                    !has_condition(m, "rspeed") &&
                    distance(character, m) <= G.skills.rspeed.range
                );
            });

            if (speedy.length) {
                return cast_skill("rspeed", speedy[0]);
            }
        }

        if (!target || !skill_mp_ok()) return;

        if (
            skill_ready("mentalburst") &&
            is_in_range(target, "mentalburst")
        ) {
            return cast_skill("mentalburst", target);
        }

        if (skill_ready("quickstab") && is_in_range(target)) {
            return cast_skill("quickstab", target);
        }

        if (skill_ready("quickpunch") && is_in_range(target)) {
            return cast_skill("quickpunch", target);
        }

        return;
    }

    // ------------------------------------------------------------
    // PRIEST (healing comes first, in priest_heal_step)
    // ------------------------------------------------------------

    if (ctype === "priest") {

        var someone_hurt = party_members_nearby().some(function(m) {
            return hp_percent(m) <= PRIEST_HEAL_PERCENT;
        });

        if (someone_hurt || !skill_mp_ok()) return;

        if (
            skill_ready("darkblessing") &&
            party_fighting &&
            !has_condition(character, "darkblessing")
        ) {
            return cast_skill("darkblessing");
        }

        if (
            skill_ready("curse") &&
            target &&
            !has_condition(target, "cursed") &&
            worth_it(target) &&
            distance(character, target) <= G.skills.curse.range
        ) {
            return cast_skill("curse", target);
        }

        return;
    }

    // ------------------------------------------------------------
    // PALADIN
    // ------------------------------------------------------------

    if (ctype === "paladin") {

        if (skill_ready("selfheal") && hp_percent(character) < 50) {
            return cast_skill("selfheal");
        }

        if (!target || !skill_mp_ok()) return;

        if (
            skill_ready("purify") &&
            target.hp >= 4000 &&
            distance(character, target) <= G.skills.purify.range
        ) {
            return cast_skill("purify", target);
        }

        if (skill_ready("smash") && is_in_range(target)) {
            return cast_skill("smash", target);
        }
    }
}

setInterval(
    function() {

        try {
            run_skills();
        }

        catch (error) {

            game_log(
                "SKILLS ERROR: " +
                (error.reason || error.message || error)
            );
        }
    },
    250
);

// Show which skills this character can use right now
(function list_my_skills() {

    if (IS_MERCHANT || !USE_SKILLS) return;

    var mine = [];

    for (var name in SKILLS) {

        var skill = G.skills[name];

        if (
            SKILLS[name] === true &&
            skill &&
            (!skill.class || skill.class.indexOf(character.ctype) !== -1) &&
            character.level >= (skill.level || 0) &&
            (!skill.wtype ||
                (Array.isArray(skill.wtype) ? skill.wtype : [skill.wtype])
                    .indexOf(weapon_type()) !== -1)
        ) {
            mine.push(name);
        }
    }

    game_log(
        "SKILLS: " +
        (mine.length ? mine.join(", ") : "none for this class / level yet")
    );
})();


// ================================================================
// MAIN HUNT
// ================================================================

async function run_hunt() { 
 
    if (working) return; 
    if (respawning) return; 
    if (unstick_busy) return; 
 
    working = true; 

    // Not hunting yet - set again below once pathing / fighting
    hunt_phase = null;
 
    try { 
 
        // DEAD?
        if (character.rip) { 
 
            await handle_respawn(); 
 
            reset_path_state(); 
            reset_combat_stuck_state(); 
 
            return; 
        } 

        // DRINK POTIONS
        drink_potions_if_needed(); 

        // CHECK POTION SUPPLY
        var potions_ok =
            await check_potions();

        if (!potions_ok) {

            reset_path_state();
            reset_combat_stuck_state();

            return;
        }

        // COLLECT LOOT AFTER AN EVENT MONSTER DIES
        if (await event_loot_step()) {
            return;
        }

        // TIMED EVENT MONSTER ALIVE? (overrides assignment / rotation)
        var event_monster =
            IS_FOLLOWER ? null : pick_event_monster();

        // NEW DAISY ASSIGNMENT
        if (GET_ASSIGNMENT && !event_monster) {

            var assignment =
                character.s.monsterhunt;

            if (
                !assignment ||
                assignment.c <= 0
            ) {

                game_log(
                    "HUNT: New assignment needed - returning to town and Daisy."
                );

                await get_new_assignment();

                return;
            }
        }

        // INVENTORY CLEANUP
        if (inventory_needs_cleanup()) {

            game_log(
                "HUNTER: Inventory getting full."
            );

            await cleanup_inventory();

            reset_path_state();
            reset_combat_stuck_state();

            return;
        }


        // ========================================================
        // PRIEST - HEAL THE PARTY FIRST
        // ========================================================

        if (IS_PRIEST && await priest_heal_step()) {
            return;
        }

        // ========================================================
        // FOLLOWERS - FOLLOW THE LEADER, ATTACK ITS TARGET
        // ========================================================

        if (IS_FOLLOWER) {

            await follower_step(
                IS_PRIEST && !PRIEST_ATTACKS
            );

            return;
        }

        // ========================================================
        // TARGETING MODE (LEADER / SOLO)
        // ========================================================

        var target = null;
        var monster_name = null;


        // ========================================================
        // TARGETING
        // ========================================================
        //
        // Daisy assignment or manual monster rotation.
        //


        monster_name =
            event_monster
                ? event_monster.type
                : get_hunt_monster_name();

        // Followers are told this every PARTY_STATE_SECONDS
        current_hunt_monster = monster_name;

        // Pick the meeting spot straight away so followers can set off
        if (IS_LEADER && monster_name) {
            hunt_destination(monster_name);
        }

        // EVENT MONSTER MODE
        if (event_monster) {

            set_message(
                "EVENT: " +
                event_monster.type
            );
        }

        // ASSIGNMENT MODE
        else if (GET_ASSIGNMENT) {

            var hunt =
                character.s.monsterhunt;

            if (
                !hunt ||
                hunt.c <= 0
            ) {

                game_log(
                    "HUNT: Assignment complete."
                );

                await cleanup_inventory();
                await get_new_assignment();

                return;
            }

            set_message(
                monster_name +
                ": " +
                hunt.c
            );
        }

        // MANUAL MODE
        else {

            var manual_target =
                MANUAL_MONSTER_LIST[
                    MANUAL_MONSTER_INDEX
                ];

            if (manual_target) {

                set_message(
                    "Hunting: " +
                    monster_name +
                    " (" +
                    MANUAL_MONSTER_KILLS +
                    "/" +
                    manual_target.kills +
                    ")"
                );

            }

            else {

                set_message(
                    "Hunting: " +
                    monster_name
                );
            }
        }


        // ====================================================
        // FIND NEAREST TARGET
        // ====================================================

        target =
            get_nearest_monster({
                type: monster_name,
                target: character
            });

        // NOTHING TARGETING US -> Fall back to nearest
        if (!target) {

            target =
                get_nearest_monster({
                    type: monster_name
                });
        }

        // STILL NO TARGET -> Path to area
        if (!target) {

            reset_combat_stuck_state();

            await path_to_hunting_area(
                monster_name
            );

            return;
        }



        // ========================================================
        // TARGET FOUND
        // ========================================================

        // Wait for the followers before starting a fight, unless the
        // monster is already attacking us
        if (
            target.target !== character.name &&
            !party_ready_to_fight()
        ) {

            hunt_phase = null;

            reset_combat_stuck_state();

            return;
        }

        await fight_target(target);

    }

    catch (error) {

        game_log(
            "HUNT ERROR: " +
            (error.reason || error)
        );
    }

    finally {

        working = false;
    }
}


// ================================================================
// INDEPENDENT AUTO-RESPAWN MONITOR
// ================================================================

setInterval(
    async function() {

        if (!character.rip) return;
        if (respawning) return;

        await handle_respawn();

    },
    1000
);


// ================================================================
// STARTUP
// ================================================================

game_log(
    IS_MERCHANT ? "PARTY HUNTER: merchant - nothing to run." : "PARTY HUNTER STARTED"
);


if (IS_MERCHANT) {

    // The merchant role runs no code

}

else if (IS_FOLLOWER) {

    game_log(
        "HUNT MODE: Following " + LEADER
    );

}

else if (GET_ASSIGNMENT) {

    game_log(
        "HUNT MODE: Daisy assignments"
    );

}

else {

    game_log(
        "HUNT MODE: Manual"
    );

    if (
        MANUAL_MONSTER_LIST &&
        MANUAL_MONSTER_LIST.length > 0
    ) {

        game_log(
            "MANUAL MONSTER ROTATION:"
        );

        for (
            var i = 0;
            i < MANUAL_MONSTER_LIST.length;
            i++
        ) {

            game_log(
                "  " +
                MANUAL_MONSTER_LIST[i].type +
                " x " +
                MANUAL_MONSTER_LIST[i].kills
            );
        }
    }
}

game_log(
    "MERCHANT: " +
    MERCHANT_NAME
);


// ================================================================
// START HUNTER LOOP
// ================================================================

if (!IS_MERCHANT) setInterval(
    run_hunt,
    COMBAT_INTERVAL
);
