**Introduction**

Eh, try this. Your shop got a stock list: tea, rice. You scared later you spoil it, so you make a backup: backup equals stock. Then you append oats to the backup only. Now print stock. Walao eh, oats inside stock also! Your backup go and change the original. How come? Today 3 things lah. Aliasing versus copying. Functions that CHANGE your list versus functions that return a new one. And nested lists, list inside list. After this, this kind of question cannot bluff you already.

**Aliasing versus copying**

Step 1: stock equals tea, rice. Python make 1 list and stick the name stock on it. Step 2: backup equals stock. Got new list or not? Don't have! Python only stick a second NAME on the same list. Like 1 kopi cup with 2 name stickers. Step 3: backup dot append oats. The cup change, so both names see tea, rice, oats. This one we call aliasing. Why ah? Because a list is mutable, can change after you make it, and the equals sign NEVER copy a list. You want a real copy, write spare equals stock with a full slice, just a colon inside the square brackets. Or list of stock. Now got 2 cups. So the trap: backup equals stock is NOT a backup lah.

**Change it, or return a new one**

Now functions. You pass a list into a function, the function get a copy or not? No copy! The parameter is just 1 more name for YOUR list. Look at restock, with counts and amount. Inside: counts at i, plus equals amount. That one change the caller's list directly, and it return None. Then restocked, with a d. It start with result equals empty list, append count plus amount, return result. Your old list stay the same. How to know which is which ah? Read the ARROW. Arrow None: it change your list. Arrow list: it give you a new one, so you must store it. The trap: you call restocked but never store the answer. Then nothing happen, wasted lor.

**Nested lists**

Next, list inside list. shelves got 2 inner lists: 4, 0, 6 and 2, 5, 1. Each one is 1 shelf. Now shelves at 1, then at 0. Read from the left: FIRST pick shelf 1, then item 0. Answer is 2. len of shelves is 2, that is the shelves. len of shelves at 0 is 3, the items on that shelf. And the names game still on hor. Copy shelves with a full slice, you only copy the OUTER list. The inner shelves still shared. Change 1 inner item, both sides see it. Dun play play.

**Takeaway**

So the one-line takeaway: the equals sign give a new NAME, never a new list. Want a copy, slice it. Want to know if a function change your list, read the arrow. The practice notebook got 6 exercises in the same small shop. 3 to predict, 1 fix the bug, and 2 you write from scratch: fill up a shelf in place, and totals per shelf with 2 loops. Last thing: graded work must be your OWN, the course does not allow AI on it. Practise here until steady, then that one you do yourself. Jia you!
