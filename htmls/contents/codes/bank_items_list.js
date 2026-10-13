// BANK ITEMS LIST (Default Bank Items List)
//
// WHAT THIS IS FOR
// The Party AIO script reads this list when it starts. Any item whose id
// is on the list is always sent to the bank when the character banks, even
// if the BANK settings in the Party AIO (stackables, upgradables and so
// on) would have kept it in the inventory. Use it for the odd items you
// want safely stored, such as rings, amulets, trinkets and spell books.
// Every character running the Party AIO shares this one list.
//
// HOW TO USE IT
// - Add one line per item: BANK_ITEM_IDS.push("itemid");
// - Remove a line (or put // in front of it) to stop banking that item.
// - Item ids are the names the game uses for items, for example "vitring"
//   is the Vitality Ring. The Item Help and Recipes windows show the ids.
// - Press Save when you're done. The script reads the list when it
//   starts, so restart the script on your characters after changing it.
// - Reset in the code menu puts back this original list. Your saved copy
//   is only replaced when you press Save.
//
// THE LIST
// These four items are here as examples. Change them to what you want.

var BANK_ITEM_IDS = [];

BANK_ITEM_IDS.push("vitring");
BANK_ITEM_IDS.push("skullamulet");
BANK_ITEM_IDS.push("ftrinket");
BANK_ITEM_IDS.push("wbook0");
