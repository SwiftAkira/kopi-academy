**Introduction**

Eh, imagine this. Got a sensor in the river, every hour it save 1 water level. After 5 hours you got 5 numbers: minus 4, 12, 7, minus 9, 15. Then people ask you 3 things. What is the total? How many above 10? Which one the highest? Sounds like 3 different problems, right? Where got! Actually all the SAME pattern. Today we do 2 things lah. First, the 3 ways to walk through a list. Second, the accumulator pattern: sum, count, max, and filter into a new list. Learn this pattern properly, a lot of loop questions in the exam settle already.

**3 ways to walk a list**

The list we call levels. Way 1: for level in levels. Each round, level is the ITEM itself: minus 4, then 12, then 7. Use this when you only need the values. Way 2: for i in range len levels. Now i is the POSITION: 0, 1, 2, 3, 4. Stop value 5 not included, so exactly the valid indexes. The item is levels at i. Use this when you must know WHERE, or when you want to change the list. Way 3: for i, level in enumerate levels. This one give you both together, position first, then item. Shiok. Why need the position ah? Because level equals 0 only change the name level, the list never change. Must write levels at i equals 0. The trap: dun mix the styles. In way 1, level is already the item. You write levels at level, now Python use minus 4 as an INDEX. Nonsense already!

**The accumulator pattern**

Now the pattern. Always 3 steps. Step 1, BEFORE the loop: give a start value. Step 2, INSIDE the loop: update. Step 3, AFTER the loop: use the answer. Sum: total equals 0, then total plus equals level. End with 21. Count: count equals 0, and if level more than 10, count plus equals 1. End with 2. Filter: start with an EMPTY list, and if level more than 10, append it. You get 12 and 15. Same 3 steps, see? Then max, the highest so far. What is the start value? Many people write 0. Aiyo. Take the levels minus 4, minus 9, minus 2. Nobody beat 0, so the answer is 0, but the sensor NEVER measure 0! So start with the first item: highest equals levels at 0. Why ah? Because the first item confirm inside the list. Another trap: start value INSIDE the loop will reset every round, so keep it before the loop. And return inside the loop? The function stop at the first item. The answer come AFTER.

**Takeaway**

The one-line takeaway: start BEFORE, update inside, answer after. Sum and count start at 0, max start at the first item, filter start with an empty list. The practice notebook got 6 exercises with the same river sensor. 2 to predict, 2 fix the bug, then 2 you write from scratch: keep only the calm levels, and find the first hour the river flood. And hor, graded work must be your OWN, the course does not allow AI on it. Practise here until steady, then that one you do yourself. Can one lah. Jia you!
