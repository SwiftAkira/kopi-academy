**Introduction**

Eh, this one happen to everybody. You write a function, you run it, the screen show 120. Correct answer! But the test say FAIL, got None. Wah lau, how come? The answer is right there on the screen what. Today we settle functions lah. How def and calling work. Parameter versus argument. Return versus print, this one the exam love sia. Then the None trap, and local scope. After this, you know exactly why that test fail.

**Define, then call**

Step 1. def to_minutes, with hours inside the brackets. Then the body: return hours times 60. This def ah, only a RECIPE. Nothing cook yet. Step 2: you write to_minutes with no brackets. Only the name, nothing run. Step 3: to_minutes 2, WITH brackets. Now the body run, hours is 2, you get 120. Got 2 words you must know. hours, the name in the def line, is the PARAMETER. The 2 you pass in the call is the argument. Python match them by position: first to first, second to second. The trap: take a function describe, with name and age. You swap the 2 arguments, Python usually never complain. It just give you the wrong thing, quietly. Unless you NAME them in the call, like age equals 19. Then the order no longer matter.

**return versus print**

Now the big one: return versus print. Print SHOW the value on the screen, and then the call is worth None. Return HAND the value back to the caller, and the function stop at once. Try it: total equals to_minutes 2 plus to_minutes 1. With return, that is 120 plus 60, so 180. With print, the screen show 120 and 60, but both calls worth None. None plus None? TypeError! Why ah? Because print is for your EYES, return is for the program. Tests cannot see your screen. And the None trap. Function reach the end, never meet a return, Python give back None for you. Look at sign of n: if n is 0 or more, return plus. Negative n? Fall off the end, get None. So check EVERY path end with a return.

**Local scope**

Last idea, local scope. make_total 4, 5. Inside: result equals a plus b, then return result. Outside, you print result. Can or not? Cannot! NameError. Why ah? Because result is LOCAL. It is born when the call start, and gone when the call end. The 9 did come back, but nobody catch it. So catch it lah: total equals make_total 4, 5. What you need outside, you must return, then store.

**Takeaway**

The one-line takeaway: def only define, return HAND back, print only show. So that test at the start fail because the function print 120 but return nothing. And for from-scratch questions, same recipe every time: put your loop inside a def, the data become the parameter, the last print become a return, AFTER the loop. The practice notebook got 6 core exercises: 3 to predict, 2 fix the bug, and 1 where you turn a loop program into a function. Got extra practice also, if you want more. Last thing: graded work must be your OWN, the course does not allow AI on it. Practise here until steady, then that one you do yourself. Jia you!
