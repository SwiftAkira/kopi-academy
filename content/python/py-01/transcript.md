**Introduction**

Eh, quick one. You got a list with 5 bus stops: Harbour, Market, Library, Park, Zoo. You ask Python for stop number 5. Python crash, sia! IndexError. How come? Got 5 stops, but where got index 5? Today we settle list basics lah. How to take 1 item with an index. How to count from the BACK with a negative index. How to cut a slice. Then len, and in, and 4 methods that change the list: append, insert, pop, remove. Small topic, but the exam love it one. After this, you can trace a list question by hand, no need to anyhow guess.

**Index and slice**

So this list ah, we call it stops. Python start counting at 0, NOT at 1. Step 1: stops at index 0 is Harbour. Step 2: len of stops is 5, so the last index is 4, that one the Zoo. Index 5? Don't have, so crash lor. Step 3, the shortcut: stops at minus 1. Negative index count from the back, so minus 1 is ALWAYS the last item. Zoo already, no need len. Now the slice: stops, 1 colon 3. You get Market and Library only. Why ah? Because the slice start AT index 1 and stop BEFORE index 3. So 3 minus 1, that is 2 items. Leave out the start, stops colon 2, you get the first 2 stops. Leave out the end, stops 3 colon, you get Park and Zoo. And a slice very relaxed one: stops 3 colon 99 still give Park and Zoo, no crash. The trap: people count 1, 2, 3 and write 3 stops. Wrong leh! And a slice give you a NEW list, the old list never change.

**Check and change**

Next, the word in. Park in stops? True. But park with small p? False lah, must match EXACTLY. Now the 4 methods. All of them change the list itself. Start with 3 stops: Harbour, Market, Library. Append Zoo: Zoo go to the END, like joining the hawker queue. Insert 1, School: School take index 1, everybody behind shift 1 place. Pop 0: take out Harbour AND give it back to you. Remove Library: find that VALUE, take it out. Left with School, Market, Zoo. Why got 2 ways to take out ah? Because pop use the POSITION, remove use the value. And if the value not inside, remove give you ValueError, so check with in first. Then the trap, sibei common: stops equals stops dot append Airport. Alamak! Append return None, so now your whole list become None. Gone already. Just write stops dot append on its own line, can already.

**Takeaway**

Okay, the one-line takeaway: index start at 0, slice stop BEFORE the stop value, and append change the list but return None. Only pop hand something back: the item it took out. Remember these hor, then most list questions you can trace by hand already. Now go do the practice notebook. Got 6 exercises, all about bus routes: 2 to predict, 2 fix the bug, 2 write from scratch. Got a function there that keep asking for a stop that does not exist, you go catch it. Last thing: graded work must be your OWN, the course does not allow AI on it. So practise here until steady, then that one you do yourself. Jia you!
