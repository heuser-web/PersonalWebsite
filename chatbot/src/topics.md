# Excel Helper knowledge base

Source for all three bots. Edit here, then run `npm run chatbot`.
Each topic is `## Title`, three routing lines, then the answer. Optional
`### Example`, `### Fix` and `### Mac` sections answer follow-up questions.

## VLOOKUP
id: vlookup
keys: vlookup; hlookup; vertical lookup; lookup; lookup function
ask: how do i look up a value; find a price in a table; return a matching value; get data from a table based on an id; why is my vlookup not working
next: xlookup, index-match, na-error, absolute-reference

**VLOOKUP** finds a value in the first column of a range and returns something from a column to its right.

```excel
=VLOOKUP(A2, $D$2:$F$50, 3, FALSE)
```

1. `A2` is what you are looking for.
2. `$D$2:$F$50` is the table. Its **first** column must hold the thing you are matching.
3. `3` means return the third column of that table.
4. `FALSE` means exact match. Leave it off and Excel can return a wrong answer with no error.

Watch out: VLOOKUP only looks to the right. If your answer is left of the match column, use XLOOKUP or INDEX/MATCH.

### Example
Product IDs are in D2:D50, names in E, prices in F. To get the price for the ID typed in A2:

```excel
=VLOOKUP(A2, $D$2:$F$50, 3, FALSE)
```

To show a friendly message when the ID is missing:

```excel
=IFNA(VLOOKUP(A2, $D$2:$F$50, 3, FALSE), "Not found")
```

### Fix
Work down this list. It covers nearly every broken VLOOKUP:

1. **#N/A:** stray spaces. Try `=VLOOKUP(TRIM(A2), $D$2:$F$50, 3, FALSE)`.
2. **#N/A on numbers:** one side is stored as text. Select the column, then Data → Text to Columns → Finish.
3. **Wrong answer, no error:** the fourth argument is missing. Add `FALSE`.
4. **Right on row 1, broken lower down:** the table slid. Lock it with `$` (F4).
5. **#REF!:** the column number is bigger than the table is wide.

## XLOOKUP
id: xlookup
keys: xlookup; x lookup; modern lookup; lookup left
ask: what replaced vlookup; look to the left; vlookup vs xlookup; should i use xlookup or vlookup
next: vlookup, lookup-two-criteria, index-match

**XLOOKUP** is the modern replacement for VLOOKUP. It looks in any direction, and exact match is the default.

```excel
=XLOOKUP(A2, $D$2:$D$50, $F$2:$F$50, "Not found")
```

1. What to find.
2. The column to search.
3. The column to return. It can be left or right of the search column.
4. What to show when there is no match.

Inserting a column will not break it. The two ranges must be the same length. Needs Microsoft 365 or Excel 2021 and later.

### Example
Return the **last** matching row instead of the first:

```excel
=XLOOKUP(A2, $D$2:$D$50, $F$2:$F$50, "Not found", 0, -1)
```

### Fix
1. **#NAME?:** your version of Excel does not have XLOOKUP. Use INDEX/MATCH.
2. **#VALUE!:** the search and return ranges are different lengths.
3. **Not found, but it is there:** spaces or numbers stored as text. Try `TRIM(A2)`.

## INDEX and MATCH
id: index-match
keys: index match; index/match; index and match; match function; index function
ask: lookup that works in every version; find the row number of a value
next: xlookup, vlookup, lookup-two-criteria

**INDEX + MATCH** is the flexible lookup that works in every version of Excel.

```excel
=INDEX($F$2:$F$50, MATCH(A2, $D$2:$D$50, 0))
```

Read it inside out: **MATCH** finds which row the value is on, and **INDEX** returns what is in that row. The `0` means exact match, so never leave it off. It can return a column to the left, and inserting a column does not break it.

### Example
Two-way lookup, where a row label is in A2 and a column label is in B1:

```excel
=INDEX($C$5:$H$20, MATCH($A2, $B$5:$B$20, 0), MATCH(B$1, $C$4:$H$4, 0))
```

### Fix
1. The INDEX range and the MATCH range must start on the same row and be the same height.
2. `#N/A` means MATCH found nothing. Check for spaces and for numbers stored as text.

## Look up with two criteria
id: lookup-two-criteria
keys: two criteria; multiple criteria; two conditions lookup; lookup with two values; match two columns
ask: how do i lookup with two criteria; vlookup with two conditions; match on first and last name; find a value using two columns
next: xlookup, sumifs, index-match

Join the criteria together with `&` and match on the joined result:

```excel
=XLOOKUP(A2&B2, $D$2:$D$50&$E$2:$E$50, $F$2:$F$50, "Not found")
```

If the answer is a **number** and each pair appears once, SUMIFS is simpler and works in every version:

```excel
=SUMIFS($F$2:$F$50, $D$2:$D$50, A2, $E$2:$E$50, B2)
```

SUMIFS returns 0 rather than an error when nothing matches, so check that 0 makes sense for your data.

## Refer to another sheet
id: other-sheet
keys: another sheet; other sheet; different sheet; cross sheet; another worksheet; another workbook; different tab; another tab; sheet reference
ask: how do i pull data from another sheet; reference a cell on a different tab; find a price from another sheet; link two sheets; sum across sheets
next: vlookup, xlookup, named-range

Put the sheet name and an exclamation mark in front of the reference:

```excel
=Prices!B2
```

If the sheet name has a space, wrap it in single quotes:

```excel
='Q1 Sales'!B2
```

Easiest way: type `=`, click the other tab, click the cell, press Enter. Excel writes it for you. Lookups work the same way:

```excel
=XLOOKUP(A2, Prices!$A:$A, Prices!$C:$C, "Not found")
```

### Example
Add the same cell across sheets named Jan through Dec:

```excel
=SUM(Jan:Dec!B2)
```

### Fix
`#REF!` means the sheet or the cell was deleted. Undo right away, or use Data → Edit Links if it points at another workbook.

## PivotTables
id: pivot
keys: pivot; pivottable; pivot table; pivots; summarize data; cross tab; crosstab
ask: how do i make a pivot table; summarize sales by region; total by category; group my data; group dates by month in a pivot table
next: pivot-refresh, slicer, pivot-calculated, excel-table

A **PivotTable** turns thousands of rows into a small summary you rearrange by dragging.

1. Click any cell in your data. Every column needs a header and there should be no blank rows.
2. **Insert → PivotTable → OK**.
3. Drag a text field (Region) to **Rows**.
4. Drag a number field (Sales) to **Values**.
5. Optional: drag another field to **Columns** or **Filters**.

Tip: press **Ctrl+T** on your data first, so new rows are included when you refresh.

### Example
Average sale by region and month: Region in **Rows**, Date in **Columns** (right-click → Group → Months), Sales in **Values**, then click the Values field → **Value Field Settings → Average**.

### Fix
1. **Numbers show as Count, not Sum:** the column contains text or blanks. Fix the data, then Value Field Settings → Sum.
2. **New rows missing:** right-click → Refresh, or check Change Data Source.
3. **"Field name is not valid":** a header cell is blank.

### Mac
Same steps: Insert → PivotTable. Refresh is right-click → Refresh.

## Refresh a PivotTable
id: pivot-refresh
keys: refresh pivot; update pivot; pivot not updating; change data source
ask: why is my pivot table not updating; new rows do not show in my pivot table; my pivot table is out of date
next: pivot, excel-table

PivotTables do not update on their own. Right-click the pivot → **Refresh**, or press **Alt+F5**. **Ctrl+Alt+F5** refreshes everything in the workbook.

If new **rows** are missing even after a refresh, the source range is fixed. Go to **PivotTable Analyze → Change Data Source**. To stop it happening again, turn the source into a Table with **Ctrl+T**.

## PivotTable calculations and percentages
id: pivot-calculated
keys: calculated field; pivot percent; show values as; percent of total in pivot; pivot percentage
ask: how do i show percentages in a pivot table; add a calculation to a pivot table
next: pivot, percent-total

To show a percentage: right-click a value → **Show Values As → % of Grand Total** (or % of Column Total, Running Total, Difference From).

To add your own formula: **PivotTable Analyze → Fields, Items & Sets → Calculated Field**. For margin, the formula would be:

```excel
=Profit/Sales
```

A calculated field works on the **sums**, so it gives total profit over total sales, not the average of each row's margin.

## Slicers
id: slicer
keys: slicer; slicers; timeline; filter buttons; interactive filter
ask: add filter buttons; make an interactive dashboard
next: pivot, dashboard, sort-filter

A **slicer** is a set of clickable filter buttons for a Table or PivotTable.

1. Click inside the Table or PivotTable.
2. **Insert → Slicer** and tick the fields you want.
3. Click a button to filter. Ctrl+click picks several.

One slicer can drive several PivotTables that share the same source: right-click it → **Report Connections**. For dates, use **Insert → Timeline** (PivotTables only).

## IF and IFS
id: if
keys: if; ifs; if statement; if function; if formula; nested if; if then; if else; conditional formula
ask: how do i write an if statement; pass or fail formula; letter grade formula; if a cell is greater than; if vs ifs; if cell is blank
next: and-or, iferror, sumifs

**IF** returns one thing when a test is true and another when it is false.

```excel
=IF(B2>=70, "Pass", "Fail")
```

For several outcomes, use **IFS** instead of nesting:

```excel
=IFS(B2>=90,"A", B2>=80,"B", B2>=70,"C", B2>=60,"D", TRUE,"F")
```

Order matters. IFS stops at the first true test, so go from strictest to loosest. The final `TRUE` catches everything left over. Text must be in quotes; numbers must not.

### Example
Leave a cell blank when there is nothing to calculate yet:

```excel
=IF(B2="", "", B2*C2)
```

### Fix
1. **#NAME?:** text without quotes. Write `"Pass"`, not `Pass`.
2. **Always the same answer:** the number is stored as text, or you compared to `"70"` instead of `70`.
3. **Shows FALSE:** you left out the third part.
4. **Wrong letter grade:** the tests are in loosest-first order.

## AND, OR and NOT
id: and-or
keys: and or; and function; or function; not function; multiple conditions; two conditions; both conditions; if and; if or
ask: if two things are true; if either is true; check more than one condition; what about two conditions; between two numbers
next: if, sumifs, countifs

Put **AND** or **OR** inside an IF to test more than one thing.

```excel
=IF(AND(B2>=70, C2="Yes"), "Eligible", "No")
```

```excel
=IF(OR(B2="West", B2="South"), "Region 1", "Region 2")
```

`AND` needs every test true, and `OR` needs at least one. For a number between two values, write both tests:

```excel
=AND(A2>=70, A2<90)
```

`70<=A2<90` looks right, but Excel does not evaluate it that way.

## SUMIF and SUMIFS
id: sumifs
keys: sumif; sumifs; sum if; sum ifs; conditional sum; sum based on; sum only; sum where; add up if; total for; total by
ask: add up sales for only the west region; sum one category; total for one person; sum if greater than; add only certain rows; how do i total by month; sum with multiple conditions
next: countifs, averageif, pivot, absolute-reference

**SUMIF** adds what meets one condition. **SUMIFS** handles several.

```excel
=SUMIF($A$2:$A$100, "West", $C$2:$C$100)
```

```excel
=SUMIFS($C$2:$C$100, $A$2:$A$100, "West", $B$2:$B$100, ">1000")
```

Watch the order, because it flips: SUMIF puts the numbers to add **last**, SUMIFS puts them **first**. Put an operator in quotes: `">1000"`. To compare with a cell, join it: `">"&E1`.

### Example
Total for one month, with dates in column B:

```excel
=SUMIFS($C$2:$C$100, $B$2:$B$100, ">="&DATE(2026,11,1), $B$2:$B$100, "<"&DATE(2026,12,1))
```

### Fix
1. **0:** the criteria does not match. Look for spaces, or numbers stored as text.
2. **#VALUE!:** the ranges are different sizes.
3. **Wrong total:** you used SUMIF order inside SUMIFS.

## COUNTIF and COUNTIFS
id: countifs
keys: countif; countifs; count if; count how many; count cells; count times; count a word; tally
ask: count the number of times a name appears; how many cells say yes; count cells greater than; how many of each; count text
next: sumifs, unique-count, duplicates

**COUNTIF** counts cells meeting one condition. **COUNTIFS** handles several.

```excel
=COUNTIF($A$2:$A$100, "West")
```

```excel
=COUNTIFS($A$2:$A$100, "West", $B$2:$B$100, ">1000")
```

- `=COUNTA(A2:A100)` counts cells that are not empty
- `=COUNT(A2:A100)` counts numbers only
- `=COUNTBLANK(A2:A100)` counts empty cells
- `=COUNTIF(A2:A100, "*west*")` counts anything containing "west"

### Example
Flag every row that is a repeat:

```excel
=IF(COUNTIF($A$2:$A$100, A2)>1, "Duplicate", "")
```

## AVERAGEIF
id: averageif
keys: averageif; averageifs; average if; conditional average; average only
ask: average only the west region; average excluding zeros; average ignoring zeros; average without blanks
next: sumifs, average, weighted-average

**AVERAGEIF** averages only the rows that match.

```excel
=AVERAGEIF($A$2:$A$100, "West", $C$2:$C$100)
```

Average while ignoring zeros:

```excel
=AVERAGEIF(C2:C100, "<>0")
```

Several conditions, with the numbers first:

```excel
=AVERAGEIFS($C$2:$C$100, $A$2:$A$100, "West", $B$2:$B$100, ">=2025")
```

`#DIV/0!` here means no row matched.

## MAXIFS and MINIFS
id: maxifs
keys: maxifs; minifs; max if; min if; highest where; largest for; lowest for
ask: highest sale in the west region; largest value for one category; latest date for a customer
next: sumifs, large-small, averageif

```excel
=MAXIFS($C$2:$C$100, $A$2:$A$100, "West")
```

```excel
=MINIFS($C$2:$C$100, $A$2:$A$100, "West")
```

The numbers come first, then pairs of range and condition. It works on dates too, so MAXIFS on a date column gives the latest date. Needs Excel 2019 or later.

## Sum, average and the basics
id: average
keys: sum; average; mean; median; mode; autosum; add up; add a column; total; basic formula; basic formulas; write a formula; make a formula; statistics; max; min
ask: whats the average of a column; how do i add a column of numbers; total a column; how do i write a formula; find the highest number; how do i subtract; multiply two cells
next: sumifs, large-small, weighted-average, percent-change

```excel
=SUM(A2:A100)
```

- `=AVERAGE(A2:A100)` mean
- `=MEDIAN(A2:A100)` middle value
- `=MIN(A2:A100)` and `=MAX(A2:A100)`
- `=COUNT(A2:A100)` how many numbers
- `=A2-B2`, `=A2*B2`, `=A2/B2` for subtract, multiply, divide

**Alt+=** writes the SUM for you. Use MEDIAN when a few extreme values would distort the mean, such as home prices. AVERAGE skips blanks and text but counts zeros.

### Mac
AutoSum is **Cmd+Shift+T**.

## Largest, smallest and rank
id: large-small
keys: second largest; second highest; largest; smallest; top 3; top 5; top 10; large; small; rank; ranking; nth
ask: how to find the second largest; how do i use rank; rank students by score; top five values; bottom three
next: average, sort-filter, maxifs

```excel
=LARGE($A$2:$A$100, 2)
```

That is the second largest. `SMALL` works the same from the bottom. To rank each row, with 1 as the highest:

```excel
=RANK.EQ(A2, $A$2:$A$100)
```

Lock the range with `$` before filling down, or every row ranks against a different list. Ties get the same rank. For a live top 5 list in Microsoft 365:

```excel
=TAKE(SORT(A2:A100, 1, -1), 5)
```

## Weighted average and GPA
id: weighted-average
keys: weighted average; weighted mean; gpa; grade point average; sumproduct; weighted grade; course grade
ask: how do i calculate my gpa; calculate my final grade; average with weights; assignments worth different percentages
next: average, sumproduct, if

Multiply each value by its weight, add those up, then divide by the total weight.

```excel
=SUMPRODUCT(B2:B10, C2:C10) / SUM(C2:C10)
```

**For GPA:** column B is the grade points (A = 4, B = 3), column C is the credits.
**For a course grade:** column B is the score, column C is the weight. If the weights already add to 100%, the division does not change anything, but it protects you when only some grades are in.

A plain AVERAGE is wrong here, because it treats a 1-credit class like a 4-credit class.

## SUMPRODUCT
id: sumproduct
keys: sumproduct; sum product; multiply and add; multiply two columns and sum
ask: multiply two columns and add the results; total revenue from price and quantity
next: weighted-average, sumifs

**SUMPRODUCT** multiplies columns row by row and adds the results.

```excel
=SUMPRODUCT(B2:B100, C2:C100)
```

If B is price and C is quantity, that is total revenue without a helper column. Both ranges must be the same size, or you get `#VALUE!`. It can also apply conditions:

```excel
=SUMPRODUCT((A2:A100="West")*(B2:B100)*(C2:C100))
```

## Percent change
id: percent-change
keys: percent change; percentage change; percent increase; percentage increase; percent decrease; growth rate; percent difference; growth; yoy; year over year
ask: how to calculate percent change; how do i calculate percent increase; how much did sales grow
next: percent-total, percent-of, div0-error

New minus old, divided by **old**:

```excel
=(B2-A2)/A2
```

Then format as a percentage (**Ctrl+Shift+%**). Do not multiply by 100 as well, or 12% becomes 1200%.

Two traps: dividing by the new value instead of the old one, and an old value of zero, which gives `#DIV/0!`:

```excel
=IF(A2=0, "n/a", (B2-A2)/A2)
```

### Example
Sales went from 400 to 500. `=(500-400)/400` is 0.25, which shows as 25% once formatted. Going back down from 500 to 400 is -20%, not -25%, because the starting point changed.

## Percent of total
id: percent-total
keys: percent of total; percentage of total; share of total; proportion; percent of whole
ask: what percent of the total is each row; each items share; show each as a percentage
next: percent-change, absolute-reference, pivot-calculated

```excel
=B2/SUM($B$2:$B$10)
```

The `$` signs keep the total fixed while B2 moves as you fill down. Format as a percentage with **Ctrl+Shift+%**. The results should add to 100%, which is a quick way to check it.

## Percentages, discounts and tax
id: percent-of
keys: percentage; percent; discount; sales tax; tax; markup; tip; percent off; add a percentage; subtract a percentage
ask: how do i calculate a percentage; take 20 percent off; add sales tax; increase a price by ten percent; how do i do percentages
next: percent-change, percent-total, absolute-reference

- **Part of a whole:** `=B2/C2`, formatted as a percentage
- **20% of a number:** `=B2*20%`
- **Take 20% off:** `=B2*(1-20%)`
- **Add 8.265% tax:** `=B2*(1+8.265%)`

Better: keep the rate in its own cell and lock it, so you can change it once.

```excel
=B2*(1+$E$1)
```

## Absolute references and the $ sign
id: absolute-reference
keys: absolute reference; absolute; dollar sign; f4; relative reference; mixed reference; lock a cell; anchor; lock cell reference; cell reference
ask: how do i stop a cell from changing when i drag; formula changes when i copy it; keep a cell fixed in a formula; what does the dollar sign mean; what is the difference between relative and absolute
next: fill-handle, percent-total, named-range

The `$` locks part of a reference so it does not move when you copy the formula. Click the reference in the formula and press **F4** to cycle through these:

- `A1` both parts move
- `$A$1` nothing moves
- `A$1` row locked
- `$A1` column locked

Classic use, with a tax rate in E1:

```excel
=B2*$E$1
```

Without the `$`, row 3 multiplies by E2, which is empty, and you get zero.

### Example
A multiplication table, with numbers down column A and across row 1. Type this in B2, then fill right and down:

```excel
=$A2*B$1
```

### Mac
Press **Cmd+T** (or **Fn+F4**) while the cursor is in the reference.

## Fill handle and copying formulas
id: fill-handle
keys: fill handle; fill down; autofill; drag formula; copy formula down; fill series; copy a formula
ask: how do i apply a formula to the whole column; copy a formula to all rows; fill numbers 1 to 100; drag a formula down
next: absolute-reference, flash-fill, excel-table

Drag the small square at the bottom-right of the cell, or **double-click it** to fill to the end of the data beside it. **Ctrl+D** fills down a selection and **Ctrl+R** fills right.

For a pattern (1, 2, 3 or Jan, Feb), type the first two, select both, then drag. For a list of 100 numbers in Microsoft 365:

```excel
=SEQUENCE(100)
```

### Fix
**Every row shows the same number:** calculation is set to manual. Formulas → Calculation Options → **Automatic**.
**Results drift:** lock the fixed cells with `$`.

## IFERROR and hiding errors
id: iferror
keys: iferror; ifna; hide errors; replace error; suppress error; error handling
ask: how do i hide errors; show blank instead of error; replace n/a with text
next: na-error, div0-error, errors

**IFERROR** replaces any error with something readable.

```excel
=IFERROR(A2/B2, "n/a")
```

For lookups, prefer **IFNA**. It only catches "not found" and lets real mistakes such as `#REF!` show:

```excel
=IFNA(VLOOKUP(A2, $D$2:$F$50, 3, FALSE), "Not found")
```

Wrap a formula only after you know **why** it errors. IFERROR hides the cause as well as the symptom.

## Excel error messages
id: errors
keys: error; errors; error message; error messages; excel error; error codes; what does this error mean
ask: what do the errors mean; my formula has an error; list of excel errors
next: na-error, value-error, ref-error, name-error

- `#N/A` a lookup found nothing
- `#VALUE!` wrong type, usually text where a number belongs
- `#REF!` the formula points at something deleted
- `#NAME?` misspelled function, or text missing its quotes
- `#DIV/0!` dividing by zero or an empty cell
- `#NUM!` a number that is impossible or too large
- `#SPILL!` something is in the way of a result that needs several cells
- `#CALC!` an array came back empty, often from FILTER
- `#####` not an error; the column is too narrow

Paste your formula here and I will check it for you.

## #N/A
id: na-error
keys: #n/a; n/a error; na error; not available; lookup returns na
ask: why do i get #n/a; vlookup says n/a; value not found but it is there
next: vlookup, numbers-as-text, iferror

`#N/A` means a lookup could not find your value. In order of likelihood:

1. **Stray spaces.** Wrap the value: `TRIM(A2)`.
2. **Numbers stored as text** on one side. Text sits on the left of the cell, real numbers on the right.
3. **Missing exact match.** End VLOOKUP with `FALSE`, and MATCH with `0`.
4. **The table slid** because it was not locked with `$`.
5. **It really is not there.** Show a message instead:

```excel
=IFNA(VLOOKUP(A2, $D$2:$F$50, 3, FALSE), "Not found")
```

To test two cells that look identical, try `=A2=D2` and `=LEN(A2)=LEN(D2)`.

## #VALUE!
id: value-error
keys: #value!; #value; value error
ask: what does value error mean; why do i get #value
next: numbers-as-text, errors, date

`#VALUE!` means the formula got the wrong kind of thing, usually text where a number belongs.

1. Look for a cell that **looks** like a number but is text, such as `12 lbs` or a number with a space.
2. `=A1+B1` fails on text. `=SUM(A1:B1)` skips it.
3. In SUMIFS, COUNTIFS and SUMPRODUCT, it means the ranges are different sizes.
4. Date math fails when the date is really text. Convert it with Data → Text to Columns → Date.

## #REF!
id: ref-error
keys: #ref!; #ref; ref error; reference error; deleted cell
ask: what does #ref mean; why do i get a ref error
next: errors, vlookup, other-sheet

`#REF!` means the formula points at something that no longer exists.

1. You deleted a row, column or sheet it used. Press **Ctrl+Z** right away, since the original address cannot be recovered later.
2. A VLOOKUP column number is larger than the table is wide.
3. You copied a formula somewhere its relative references fall off the sheet.

To find them all: **Ctrl+F**, search for `#REF!`, with Look in set to **Formulas**.

## #NAME?
id: name-error
keys: #name?; #name; name error; invalid name
ask: what does name error mean; why does it say #name
next: errors, if, named-range

`#NAME?` means Excel does not recognize a word in the formula.

1. A misspelled function: `VLOKUP`, `SUMIFF`.
2. Text without quotes: `=IF(A2=Yes, ...)` should be `=IF(A2="Yes", ...)`.
3. A named range that does not exist.
4. A function your version does not have, such as XLOOKUP in Excel 2016.
5. Curly quotes pasted from Word or a website. Retype them as straight quotes.

## #DIV/0!
id: div0-error
keys: #div/0!; #div/0; div0; divide by zero; division by zero
ask: why do i get div 0; how do i stop divide by zero errors
next: iferror, percent-change, average

`#DIV/0!` means the bottom of a division is zero or empty. Test for it:

```excel
=IF(B2=0, "", A2/B2)
```

AVERAGE, AVERAGEIF and similar functions show it when there is nothing to average.

## #SPILL!
id: spill-error
keys: #spill!; #spill; spill error; spill; spilled; dynamic array; dynamic arrays; array formula; array formulas
ask: why do i get a spill error; what is an array formula; what is spilling; what does control shift enter do
next: filter-function, unique-list, errors

In Microsoft 365, one formula can return many cells. That is called **spilling**. `#SPILL!` means something is in the way.

1. Click the cell. The dashed outline shows where the result needs to go.
2. Clear anything inside that outline, including a stray space.
3. Unmerge any merged cells there.
4. Spilling does not work inside a Table. Move the formula outside it.

Refer to a whole spilled result with `#`, as in `=SUM(E2#)`. In Excel 2019 and earlier, array formulas need **Ctrl+Shift+Enter**.

## #NUM! and #CALC!
id: num-error
keys: #num!; #num; num error; #calc!; #calc; calc error; #null!
ask: what does num error mean; what does calc error mean
next: errors, filter-function, loan

**`#NUM!`** means the math is impossible: a square root of a negative, an IRR that cannot settle, or DATEDIF with the dates reversed.

**`#CALC!`** usually means FILTER found nothing. Give it a fallback:

```excel
=FILTER(A2:C100, B2:B100="West", "None found")
```

**`#NULL!`** means a space where a comma or colon belongs, such as `SUM(A1 A5)`.

## Column shows #####
id: hash-width
keys: #####; ####; hashes; pound signs; hashtags; number signs; column too narrow; column width; autofit
ask: why does my cell show hashtags; why does it show pound signs; make the column fit the text; how do i widen a column
next: number-format, date, wrap-text

`#####` is not an error. The column is too narrow for the number or date. **Double-click** the border on the right of the column letter to AutoFit.

If it stays after widening, the cell holds a negative date or time, usually from subtracting a later date from an earlier one.

To AutoFit every column: **Ctrl+A**, then double-click any column border.

## Formula shows as text
id: formula-as-text
keys: formula showing as text; formula not calculating; formula not working; shows formula instead of result; show formulas; formula shows text; formula wont calculate
ask: why is my formula showing as text instead of the result; formula does not calculate; i see the formula not the answer; my formula is not updating; how do i show all formulas
next: numbers-as-text, errors, fill-handle

1. **The cell is formatted as Text.** Set Home → Number Format → **General**, then press **F2** and **Enter**.
2. **Show Formulas is on.** Press **Ctrl+`** (the key left of 1) to switch it off.
3. **There is a space or an apostrophe before the `=`.** Delete it.
4. **It shows an old result:** Formulas → Calculation Options → **Automatic**.

### Mac
Edit a cell with **Control+U**, and toggle Show Formulas with **Control+`**.

## Numbers stored as text
id: numbers-as-text
keys: numbers stored as text; number stored as text; text to number; convert text to number; green triangle; numbers wont sum; sum is zero
ask: my sum returns zero; numbers will not add up; convert text to numbers; green triangle in the corner of a cell; my numbers will not sort
next: value-error, na-error, text-cleanup

The sign: the number hugs the **left** of the cell, or there is a green triangle in the corner.

- **Fast:** select the cells → click the warning icon → **Convert to Number**.
- **Whole column:** Data → Text to Columns → **Finish**.
- **By formula:**

```excel
=VALUE(TRIM(A2))
```

If it still fails, the data has non-breaking spaces from a website:

```excel
=VALUE(SUBSTITUTE(A2, CHAR(160), ""))
```

## Leading zeros
id: leading-zeros
keys: leading zero; leading zeros; zip code; zip codes; phone number format; keep zeros
ask: excel deletes my zeros; zip codes lose the zero; how do i keep the zero in front; how to format phone numbers
next: number-format, numbers-as-text

Excel drops leading zeros because it treats the entry as a number.

- **Before typing:** format the cells as **Text**, or start with an apostrophe: `'08901`.
- **Already lost, ZIP codes:** Ctrl+1 → Special → **Zip Code**.
- **By formula, five digits:**

```excel
=TEXT(A2, "00000")
```

When importing a CSV, use Data → From Text/CSV → Transform Data and set the column type to **Text**.

## Conditional formatting
id: conditional-formatting
keys: conditional formatting; conditional format; highlight cells; highlight a row; color cells; color scale; data bar; data bars; icon sets; change color based on value
ask: change the color of a cell based on its value; highlight overdue dates; turn cell red if negative; color code my spreadsheet; highlight the entire row
next: duplicates, if, absolute-reference

**Home → Conditional Formatting**:

- **Highlight Cells Rules:** greater than, text contains, duplicates
- **Top/Bottom Rules:** top 10, above average
- **Data Bars / Color Scales:** quick visual comparison

To color a **whole row**, select the rows from row 2, then New Rule → **Use a formula**:

```excel
=$C2<TODAY()
```

Write the formula for the first row only. `$C` locks the column and the plain `2` lets the row move.

### Example
Highlight the whole row when status in column D is Late:

```excel
=$D2="Late"
```

### Fix
**The wrong rows light up:** the formula's row number does not match the first row you selected, or the `$` is missing. Check it in Conditional Formatting → Manage Rules.

## Charts
id: chart
keys: chart; charts; graph; graphs; bar chart; line chart; pie chart; column chart; visualize; plot; combo chart; scatter plot
ask: how do i make a chart; make a graph; which chart should i use; add a chart to my sheet; show data over time
next: trendline, chart-cleanup, histogram, sparklines

Select the data **with its headers** → **Insert** → pick a chart. **Alt+F1** makes one instantly.

- **Column / Bar:** comparing categories (bar when labels are long)
- **Line:** change over time
- **Scatter:** relationship between two numbers
- **Pie:** parts of one whole, with five slices or fewer
- **Combo:** two different scales, such as revenue with a margin line

Title it with the finding. "Sales fell 12% in Q3" beats "Q3 Sales".

### Fix
1. **Years became a data line:** right-click → Select Data, remove that series, and set it as the axis labels.
2. **Rows and columns swapped:** Chart Design → **Switch Row/Column**.

## Chart titles, axes and labels
id: chart-cleanup
keys: chart title; axis title; axis titles; axis label; data labels; legend; gridlines; secondary axis; change axis; axis scale
ask: how do i add axis titles; label my chart; change the axis scale; add a second axis; rename the chart title
next: chart, trendline

Click the chart, then the **+** button beside it: tick Axis Titles, Data Labels, Legend or Trendline.

- **Change the scale:** double-click the axis → set Minimum and Maximum. Start bars at zero.
- **Second axis:** right-click a series → Format Data Series → **Secondary Axis**.
- **Title linked to a cell:** click the title, type `=`, click the cell, press Enter.

### Mac
There is no + button. Use **Chart Design → Add Chart Element**.

## Trendline and regression
id: trendline
keys: trendline; trend line; regression; line of best fit; slope; r squared; linear regression; forecast; prediction; predict
ask: how do i add a trendline; line of best fit; how to run a regression; show the equation on a chart; forecast next month
next: correlation, chart, analysis-toolpak

On a scatter or line chart: click a data point → right-click → **Add Trendline**. Tick **Display Equation** and **Display R-squared**.

Without a chart:

```excel
=SLOPE(known_ys, known_xs)
```

- `=INTERCEPT(known_ys, known_xs)`
- `=RSQ(known_ys, known_xs)` how well the line fits, from 0 to 1
- `=FORECAST.LINEAR(next_x, known_ys, known_xs)` predicts a value

The y values come first. A good fit does not mean one thing causes the other.

## Correlation
id: correlation
keys: correlation; correl; correlate; relationship between two variables
ask: are two columns related; how do i calculate correlation
next: trendline, chart, analysis-toolpak

```excel
=CORREL(A2:A100, B2:B100)
```

The result runs from -1 to 1. Near 1 means they rise together, near -1 means one falls as the other rises, near 0 means no straight-line link. Always look at a scatter chart too, because one outlier can create or hide a correlation. Correlation does not show cause.

## Histogram
id: histogram
keys: histogram; frequency distribution; frequency; bins; bell curve; distribution
ask: how do i make a histogram; group numbers into ranges; frequency table
next: chart, stdev, analysis-toolpak

Select the numbers → **Insert → Statistic Chart → Histogram**. To set the groups, double-click the horizontal axis and change **Bin width**.

For a frequency table, list the upper limit of each group in D2:D6, then:

```excel
=FREQUENCY(A2:A100, D2:D6)
```

In Microsoft 365 it fills down by itself and adds one extra row for everything above the last group.

## Standard deviation
id: stdev
keys: standard deviation; stdev; stdev.s; stdev.p; variance; var; spread; std dev
ask: how do i calculate standard deviation; sample or population standard deviation; measure the spread
next: average, histogram, correlation

```excel
=STDEV.S(A2:A100)
```

Use **STDEV.S** for a sample, which is nearly always what you have. Use **STDEV.P** only when the data is the entire population. Variance works the same way with `VAR.S` and `VAR.P`.

## Analysis ToolPak
id: analysis-toolpak
keys: analysis toolpak; data analysis; toolpak; t-test; anova; descriptive statistics; add-in; add in; add-ins
ask: where is the data analysis button; turn on the toolpak; run descriptive statistics; how do i do a t test
next: trendline, histogram, stdev

**Windows:** File → Options → Add-ins → Manage: Excel Add-ins → **Go** → tick **Analysis ToolPak**.
**Mac:** Tools → Excel Add-ins → tick **Analysis ToolPak**.

Then use **Data → Data Analysis** for descriptive statistics, histograms, regression, t-tests and ANOVA. Its results do not update when the data changes, so run it again.

## Goal Seek
id: goal-seek
keys: goal seek; goalseek; break even; breakeven; work backwards; solve for
ask: what number do i need to get a result; what grade do i need on the final; find the break even point; how do i use goal seek
next: what-if, solver, loan

**Goal Seek** works backwards: you name the answer, Excel finds the input.

1. Set up a formula that depends on one input cell.
2. **Data → What-If Analysis → Goal Seek**.
3. **Set cell:** the formula. **To value:** your target. **By changing cell:** the input.

### Example
Your course average is in B5 and depends on the final exam score in B4. Set cell `B5`, to value `90`, by changing cell `B4`. Excel tells you the score you need.

It changes one input only. For several inputs or limits, use Solver.

## What-if analysis and data tables
id: what-if
keys: what if; what-if; what if analysis; scenario; scenarios; scenario manager; data table; sensitivity; sensitivity analysis; two variable
ask: compare several scenarios; best case worst case; how does the result change if; make a sensitivity table
next: goal-seek, loan, solver

**Data → What-If Analysis** has three tools:

- **Goal Seek:** one target, one input
- **Scenario Manager:** saved sets of inputs such as Best, Expected and Worst
- **Data Table:** a grid of results for one or two changing inputs

For a two-input Data Table: put your formula in the **top-left corner** of the grid, one set of inputs across the top, the other down the side. Select the whole grid → Data Table → choose the row and column input cells. Those input cells must be on the same sheet.

## Solver
id: solver
keys: solver; optimization; optimize; maximize; minimize; constraints; linear programming
ask: maximize profit with limits; find the best mix; optimize with constraints
next: goal-seek, what-if

**Solver** finds the best value of a formula by changing several cells within limits you set.

Turn it on: File → Options → Add-ins → Go → **Solver Add-in** (Mac: Tools → Excel Add-ins). Then Data → **Solver**:

1. **Objective:** the formula cell. Choose Max, Min or a value.
2. **By changing:** the decision cells.
3. **Constraints:** limits, such as `B2:B5 <= D2:D5` or whole numbers only (`int`).
4. Choose **Simplex LP** if everything is linear, otherwise GRG Nonlinear.

## Loan payments and time value of money
id: loan
keys: loan; loan payment; mortgage; pmt; car payment; interest; compound interest; future value; present value; fv; pv; npv; irr; amortization; investment; savings; annuity
ask: monthly loan payment; how much is my car payment; calculate mortgage; how do i calculate compound interest; how much will my savings grow; net present value
next: goal-seek, what-if, percent-of

Monthly payment on $20,000 at 6% for 5 years:

```excel
=PMT(6%/12, 5*12, -20000)
```

- `=FV(6%/12, 10*12, -200)` value of saving $200 a month for 10 years
- `=NPV(8%, B3:B7)+B2` with the cost in B2 as a **negative** number
- `=IRR(B2:B7)` with the cost first, as a negative

Two traps: match the rate to the period (divide a yearly rate by 12 and multiply the years by 12), and leave the time-zero cost **outside** NPV, because NPV discounts its first value by a full period.

## Tables
id: excel-table
keys: excel table; format as table; ctrl+t; structured reference; structured references; banded rows; total row; convert to table; create a table
ask: how do i make a table; turn my data into a table; why should i use tables; auto expand range
next: sort-filter, pivot, slicer, data-validation

Press **Ctrl+T** to turn a range into a **Table**. You get:

- formulas that fill themselves into new rows
- charts and PivotTables whose source grows with the data
- filter buttons and banded rows
- readable formulas:

```excel
=SUM(Sales[Revenue])
```

Name it under **Table Design → Table Name**. Toggle a total row with **Ctrl+Shift+T**.

### Mac
**Cmd+T** or **Control+T**.

## Sort and filter
id: sort-filter
keys: sort; filter; autofilter; sort by; alphabetical; alphabetize; filter data; sort by multiple columns; sort by date; sort a to z
ask: how do i sort alphabetically; show only certain rows; sort by two columns; sort largest to smallest; filter by color
next: filter-function, excel-table, remove-blanks

Click **one cell** inside the data, then **Ctrl+Shift+L** for filter buttons. To sort by several columns: **Data → Sort → Add Level**, most important first.

Never select a single column and sort it alone. The rest of the row does not follow, and the data is scrambled. If Excel asks, choose **Expand the selection**. Turning the range into a Table (Ctrl+T) removes the risk.

### Fix
1. **Dates sort wrong:** they are text. Data → Text to Columns → Date.
2. **Header got sorted:** tick **My data has headers**.
3. **Stops at a blank row:** Excel treats it as the end. Delete blank rows first.

### Mac
**Cmd+Shift+F** toggles filters.

## FILTER, SORT and other live lists
id: filter-function
keys: filter function; filter formula; sort function; sortby; live filter; extract rows; return multiple matches; return all matches
ask: return all rows that match; pull every row for one person; vlookup that returns multiple results; list that updates by itself
next: unique-list, spill-error, sort-filter

Microsoft 365 and Excel 2021 can return every matching row with one formula:

```excel
=FILTER(A2:D100, B2:B100="West", "None found")
```

Two conditions, both required (use `+` instead of `*` for either):

```excel
=FILTER(A2:D100, (B2:B100="West")*(C2:C100>1000), "None found")
```

Sort the result, largest first by column 3:

```excel
=SORT(FILTER(A2:D100, B2:B100="West"), 3, -1)
```

## Unique lists
id: unique-list
keys: unique; unique list; unique values; distinct; distinct values; list without duplicates
ask: get a list of unique values; list each name once; remove repeats with a formula
next: unique-count, duplicates, data-validation

```excel
=UNIQUE(A2:A100)
```

Sorted, with blanks left out:

```excel
=SORT(UNIQUE(FILTER(A2:A100, A2:A100<>"")))
```

Needs Microsoft 365 or Excel 2021. In older versions: Data → Advanced → **Unique records only**.

## Count unique values
id: unique-count
keys: count unique; unique count; distinct count; how many unique; count distinct
ask: how many unique values; how many different customers; count each value once
next: unique-list, countifs, pivot

```excel
=COUNTA(UNIQUE(A2:A100))
```

Works in every version, as long as the range has no blanks:

```excel
=SUMPRODUCT(1/COUNTIF(A2:A100, A2:A100))
```

In a PivotTable: tick **Add this data to the Data Model** when you create it, then Value Field Settings → **Distinct Count**.

## Duplicates
id: duplicates
keys: duplicate; duplicates; remove duplicates; duplicate rows; dedupe; find duplicates; repeated values
ask: how do i remove duplicates; highlight duplicate values; find repeats; delete repeated rows
next: unique-list, countifs, conditional-formatting

- **Delete them:** Data → **Remove Duplicates** → tick the columns that define a duplicate. This removes rows, so copy the sheet first.
- **Only highlight them:** Home → Conditional Formatting → Highlight Cells Rules → **Duplicate Values**.
- **Flag them:**

```excel
=IF(COUNTIF($A$2:$A$100, A2)>1, "Duplicate", "")
```

If obvious duplicates are missed, the values differ by a space. Clean them with TRIM first.

## Remove blank rows
id: remove-blanks
keys: blank rows; delete blank rows; empty rows; remove blanks; blank cells; empty cells; fill blanks
ask: how do i delete blank rows; get rid of empty rows; fill in blank cells with the value above
next: sort-filter, text-cleanup, power-query

Safest: turn on filters (**Ctrl+Shift+L**), filter one column to **(Blanks)**, check that those rows are really empty, then delete them.

Faster but riskier: **Home → Find & Select → Go To Special → Blanks**, then Delete Sheet Rows. This deletes **any** row with one blank in the selection, so select a column that is never blank in real rows.

## Freeze panes
id: freeze
keys: freeze; freeze panes; freeze row; freeze column; lock row; lock top row; header row stays; split panes; keep header visible; unfreeze
ask: how do i lock a row when scrolling; keep the top row visible; keep headers on screen; freeze the header row
next: excel-table, print, other-view

**View → Freeze Panes**

- **Freeze Top Row** keeps row 1
- **Freeze First Column** keeps column A
- **Freeze Panes** keeps everything **above and left** of the selected cell

To keep row 1 and column A, click **B2** first. To keep two rows, click **A3**. To undo, use Unfreeze Panes in the same menu.

## Drop-down lists and data validation
id: data-validation
keys: data validation; dropdown; dropdown list; drop down; drop down list; validation; restrict input; pick list; limit entries
ask: how do i make a drop down list; only allow certain values; make a list to choose from; stop people typing the wrong thing; dependent drop down
next: excel-table, conditional-formatting, protect

1. Select the cells → **Data → Data Validation**.
2. Allow: **List**.
3. Source: type `Yes,No,Pending`, or point at a range:

```excel
=$H$2:$H$10
```

Other rules: whole number between 1 and 100, date after today, text length. The **Error Alert** tab sets the message people see.

### Example
A drop-down that grows by itself, from a spilled list that starts in H2:

```excel
=$H$2#
```

### Fix
Validation does not check values **pasted** in. Data → Data Validation → **Circle Invalid Data** finds them.

## Combine text
id: combine-text
keys: combine text; concatenate; concat; textjoin; join text; merge text; make a full name; combine first and last name; combine cells; ampersand; combine columns
ask: how do i combine first and last name; join two cells; put two columns together; merge two columns into one
next: split-text, text-cleanup, merge-cells

```excel
=A2&" "&B2
```

The `" "` adds a space. For a list with a separator that skips blanks:

```excel
=TEXTJOIN(", ", TRUE, A2:A10)
```

Joining a number or date loses its format, so set it:

```excel
="Due "&TEXT(B2, "mmm d, yyyy")
```

## Split text
id: split-text
keys: split text; text to columns; split a name; split names; separate names; first name; last name; textsplit; textbefore; textafter; left; right; mid; extract text; comma separated; delimiter; parse
ask: comma separated text to columns; split first and last name; separate a column into two; get text before a comma; pull out part of a cell; extract the area code
next: combine-text, flash-fill, text-cleanup

**One time:** select the column → **Data → Text to Columns → Delimited** → choose comma or space. It overwrites the columns to the right, so insert blank ones first.

**Live formula, Microsoft 365:**

```excel
=TEXTSPLIT(A2, ",")
```

- `=TEXTBEFORE(A2, " ")` first name
- `=TEXTAFTER(A2, " ", -1)` last name

**Any version:**

```excel
=LEFT(A2, FIND(" ", A2)-1)
```

`LEFT`, `RIGHT` and `MID` pull a fixed number of characters: `=MID(A2, 3, 4)` takes 4 starting at the third.

## Clean up text
id: text-cleanup
keys: trim; clean; proper; upper; lower; substitute; remove spaces; extra spaces; capitalize; uppercase; lowercase; change case; clean data; clean up data
ask: how do i remove extra spaces; capitalize names; change to uppercase; remove a character; clean messy data
next: split-text, find-replace, flash-fill, power-query

- `=TRIM(A2)` removes extra spaces
- `=PROPER(A2)`, `=UPPER(A2)`, `=LOWER(A2)` change case
- `=SUBSTITUTE(A2, "-", "")` removes a character
- `=CLEAN(A2)` removes line breaks and hidden characters

For data pasted from a website:

```excel
=TRIM(SUBSTITUTE(A2, CHAR(160), " "))
```

Then copy the results and **Paste Special → Values** over the originals.

## Flash Fill
id: flash-fill
keys: flash fill; flashfill; ctrl+e; autofill pattern; fill pattern
ask: fill in a pattern automatically; excel guesses the rest; split names without a formula
next: split-text, combine-text, fill-handle

Type the result you want for the first row, start the second, and Excel shows the rest in grey. Press **Enter** to accept, or **Ctrl+E** at any time.

It handles names, area codes, dates and initials. Two cautions: it makes fixed text that will **not** update, and it guesses, so give it two examples if the first try is wrong.

### Mac
Use **Data → Flash Fill**.

## Find and replace
id: find-replace
keys: find and replace; find replace; find; replace; ctrl+f; ctrl+h; search for; wildcard; wildcards
ask: how do i find something; replace a word everywhere; search my spreadsheet
next: text-cleanup, countifs, sort-filter

**Ctrl+F** finds, **Ctrl+H** replaces. Click **Options** to search the whole workbook, match case, or match the entire cell.

Wildcards: `*` is any text and `?` is one character. To find a real asterisk, type `~*`. Select a range first to limit where it replaces.

### Mac
**Cmd+F** to find, **Control+H** to replace.

## Dates
id: date
keys: date; dates; today; now; datedif; networkdays; workday; age; calculate age; days between; days until; add months; weekday; month name; due date; edate; eomonth
ask: days until a date; how many days between two dates; calculate age from birthday; add months to a date; business days between dates; get the month from a date; insert todays date
next: time, number-format, text-to-date

Excel stores dates as numbers, so date math works directly.

- `=TODAY()` today, updating daily. **Ctrl+;** types a fixed date
- `=B2-A2` days between
- `=B2-TODAY()` days until
- `=EDATE(A2, 3)` three months later
- `=EOMONTH(A2, 0)` last day of that month
- `=NETWORKDAYS(A2, B2)` weekdays, counting both ends
- `=TEXT(A2, "mmmm")` month name

Age in whole years:

```excel
=DATEDIF(A2, TODAY(), "Y")
```

If the answer shows as a date, set the cell format to **General**.

## Text that should be a date
id: text-to-date
keys: text to date; convert to date; date as text; date not recognized; datevalue; date format; date shows as number; five digit number
ask: my dates will not sort; date shows as a number; convert text into a date; change the date format; excel changes my number to a date
next: date, numbers-as-text, number-format

- **A date shows as 46000-something:** the cell is General. Press **Ctrl+Shift+#**.
- **Dates will not sort:** they are text. Data → Text to Columns → Next → Next → **Date** → pick the order (MDY) → Finish.
- **By formula:** `=DATEVALUE(A2)`
- **Excel turns 1/2 into a date:** format the cell as **Text** first, or type `'1/2`.

## Time and hours worked
id: time
keys: time; hours; hours worked; timesheet; time sheet; minutes; overtime; time difference; add times; midnight
ask: calculate hours worked; add up hours; subtract times; timesheet over 24 hours; convert time to decimal hours
next: date, number-format, if

```excel
=(B2-A2)*24
```

That gives decimal hours, formatted as Number. If a shift passes midnight:

```excel
=MOD(B2-A2, 1)*24
```

Totals over 24 hours wrap around unless the cell uses the custom format `[h]:mm` (Ctrl+1 → Custom).

## Rounding
id: round
keys: round; rounding; roundup; rounddown; mround; ceiling; floor; decimal; decimals; decimal places; nearest; int; trunc
ask: how do i round to two decimals; round up; round to the nearest 5; remove decimals
next: number-format, average

- `=ROUND(A2, 2)` two decimals
- `=ROUNDUP(A2, 0)` and `=ROUNDDOWN(A2, 0)` force the direction
- `=MROUND(A2, 5)` nearest 5
- `=ROUND(A2, -2)` nearest hundred

Formatting only changes what you **see**. If a cell shows 2 decimals, the rest is still there, and totals can look off by a cent. Use ROUND when the value itself must be rounded.

## Number formats
id: number-format
keys: number format; format cells; currency; accounting; format number; thousands; comma style; custom format; scientific notation; percent format; dollar format
ask: how do i show dollars; add commas to numbers; show as currency; number turned into 1e+10; format as thousands; stop scientific notation
next: round, hash-width, leading-zeros

**Ctrl+1** opens Format Cells. Quick keys: **Ctrl+Shift+$** currency, **Ctrl+Shift+%** percent, **Ctrl+Shift+1** comma style.

Useful custom formats:

- `#,##0` commas, no decimals
- `$#,##0.0,,"M"` shows 2500000 as $2.5M
- `0.0%` one decimal percent

If a long ID shows as `1E+15`, format it as **Text** before entering it. Excel keeps only 15 digits of a number.

## Merge cells
id: merge-cells
keys: merge cells; merge; merge and center; unmerge; center across selection; merged cells
ask: how do i merge cells; center a title across columns; why can i not sort merged cells
next: combine-text, wrap-text

**Home → Merge & Center**. Only the top-left value is kept.

Better for titles, because merged cells break sorting, filtering and copying: select the cells → **Ctrl+1 → Alignment → Horizontal → Center Across Selection**. It looks the same and breaks nothing.

To join the **text** of cells, use `=A2&" "&B2` instead.

## Wrap text and line breaks
id: wrap-text
keys: wrap text; wrap; line break; new line in cell; multiple lines in a cell; text overflow; text cut off
ask: how to wrap text; put two lines in one cell; start a new line inside a cell; my text runs into the next cell
next: hash-width, merge-cells

**Home → Wrap Text** shows long text on several lines. For a break exactly where you want it, press **Alt+Enter** while typing. In a formula, use `CHAR(10)` with Wrap Text on:

```excel
=A2&CHAR(10)&B2
```

### Mac
**Control+Option+Return** starts a new line.

## Insert, delete and hide rows or columns
id: rows-columns
keys: insert row; insert column; delete row; delete column; hide column; hide row; unhide; hide columns; hide rows; add a row; add a column; hidden; move column; group rows
ask: how do i insert a row; hide a column; unhide rows; add a column in the middle; move a column; delete several rows
next: freeze, remove-blanks, transpose

- **Insert or delete:** right-click the row number or column letter → Insert / Delete. Keys: **Ctrl+Shift++** and **Ctrl+-**.
- **Hide:** right-click → Hide. Keys: **Ctrl+9** rows, **Ctrl+0** columns.
- **Unhide:** select the rows or columns on both sides → right-click → **Unhide**.
- **Move a column:** select it, hold **Shift**, drag its edge.

If column A is hidden, type `A1` in the Name Box, then Home → Format → Hide & Unhide → Unhide Columns.

## Transpose
id: transpose
keys: transpose; switch rows and columns; rows to columns; columns to rows; flip; rotate data
ask: turn rows into columns; flip my table sideways; switch rows and columns
next: paste-special, pivot, rows-columns

**One time:** copy → right-click the destination → **Paste Special → Transpose**.

**Live:**

```excel
=TRANSPOSE(A1:D10)
```

In Microsoft 365 that spills. In older versions, select the output range first and press Ctrl+Shift+Enter.

## Paste Special
id: paste-special
keys: paste special; paste values; values only; paste without formatting; paste as values; copy values; format painter; paste formatting
ask: copy the result not the formula; paste only the values; copy formatting to another cell
next: transpose, fill-handle

Copy, then **Ctrl+Alt+V**, and choose:

- **Values:** the result without the formula (**Ctrl+Shift+V** in Microsoft 365)
- **Formats:** looks only, same as the Format Painter brush
- **Transpose:** rows become columns
- **Multiply / Add:** apply one copied number to a whole range

### Mac
**Control+Cmd+V** opens Paste Special. **Cmd+Shift+V** pastes values.

## Named ranges
id: named-range
keys: named range; name a range; define name; name manager; named cell; name box
ask: give a cell a name; use a name instead of a cell reference; delete a named range
next: absolute-reference, excel-table, other-sheet

Select the cell or range, type a name in the **Name Box** (left of the formula bar), press Enter. Then:

```excel
=B2*TaxRate
```

Names cannot have spaces, start with a number, or look like a cell address. Manage them under **Formulas → Name Manager**. A named cell is already absolute, so it needs no `$`.

## Protect a sheet
id: protect
keys: protect; protect sheet; lock cells; password; password protect; unprotect; lock the sheet; read only; protect workbook
ask: how do i protect a sheet; stop people editing my formulas; lock certain cells; add a password to my workbook
next: data-validation, rows-columns

Every cell is locked by default, but it has no effect until the sheet is protected.

1. Select the cells people **may** edit → Ctrl+1 → Protection → untick **Locked**.
2. **Review → Protect Sheet**, with an optional password.

To require a password to **open** the file: File → Info → Protect Workbook → **Encrypt with Password**. Keep it safe, because Microsoft cannot recover it. Sheet protection prevents accidents. It is not real security.

## Printing
id: print
keys: print; printing; page setup; fit to one page; print titles; print area; page break; landscape; print gridlines; header and footer
ask: how do i print on one page; repeat the header on every page; print only part of the sheet; my columns print on separate pages
next: freeze, save-export

**Page Layout** tab:

- **Orientation → Landscape** for wide data
- **Width: 1 page**, with Height on Automatic
- **Print Titles → Rows to repeat:** `$1:$1`
- **Print Area → Set Print Area** for a selection
- **Sheet Options → Gridlines → Print**

Check **Ctrl+P** for the preview first. View → **Page Break Preview** lets you drag the page edges.

## Keyboard shortcuts
id: shortcuts
keys: shortcut; shortcuts; keyboard; hotkey; hotkeys; keyboard shortcuts; faster; speed up
ask: best excel shortcuts; what are the keyboard shortcuts; how do i work faster
next: fill-handle, paste-special, excel-table

- **Ctrl+Arrow** jump to the edge of the data; add **Shift** to select
- **Ctrl+T** make a Table
- **Alt+=** AutoSum
- **F4** cycle `$`, or repeat the last action
- **Ctrl+D** fill down
- **Ctrl+E** Flash Fill
- **Ctrl+Shift+L** filters on or off
- **Ctrl+Shift+V** paste values
- **Ctrl+1** format cells
- **Ctrl+;** today's date
- **Ctrl+PgUp / PgDn** switch sheets

### Mac
- **Cmd+Arrow** jump; add **Shift** to select
- **Cmd+T** Table, or cycle `$` while editing a formula
- **Cmd+Shift+T** AutoSum
- **Control+U** edit a cell
- **Cmd+Shift+F** filters
- **Cmd+Shift+V** paste values
- **Cmd+1** format cells
- **Control+;** today's date

## Power Query
id: power-query
keys: power query; get data; data from the web; get and transform; clean data repeatedly; unpivot; append queries; merge queries
ask: combine many files; import data and clean it; automate cleaning; get data from a website; combine two tables
next: text-cleanup, pivot, import-csv

**Power Query** imports and cleans data with steps Excel records and can replay.

1. **Data → Get Data → From File** → choose it → **Transform Data**.
2. Remove columns, split, change types, filter, replace.
3. **Close & Load**.

Next month, replace the file and press **Refresh**. **Merge** joins two tables by a shared column, like a lookup. **Append** stacks them. **From Folder** combines many files at once.

## Import a CSV
id: import-csv
keys: csv; import; import csv; open csv; text file; import data; export csv
ask: how do i open a csv; import data from a text file; csv is all in one column
next: power-query, split-text, leading-zeros

Use **Data → From Text/CSV** rather than double-clicking the file. You can check the separator and set column types before loading, which protects leading zeros and long IDs.

If everything landed in one column: Data → **Text to Columns → Delimited → Comma**.

A CSV saves **one sheet of values only**: no formulas, formatting or extra tabs. Keep an `.xlsx` copy.

## Save and export
id: save-export
keys: save as pdf; export pdf; pdf; save; file format; xlsx; xlsm; recover; autosave; unsaved; version history
ask: save as a pdf; recover an unsaved file; how do i get back an old version
next: print, import-csv, macro

- **PDF:** File → Save As → PDF. Set the print area first.
- **Recover an unsaved file:** File → Info → Manage Workbook → **Recover Unsaved Workbooks**.
- **Older version** (OneDrive or SharePoint): File → Info → **Version History**.
- **Formats:** `.xlsx` is normal, `.xlsm` keeps macros, `.csv` keeps values on one sheet.

## Macros and VBA
id: macro
keys: macro; macros; vba; record macro; automate; visual basic; script; developer tab; xlsm
ask: how do i write a macro; record a macro; automate a repeated task; turn on the developer tab
next: power-query, save-export

Start by recording one:

1. **View → Macros → Record Macro**, give it a name and a shortcut.
2. Do the steps once.
3. **Stop Recording**. Run it with the shortcut or **Alt+F8**.

See or edit the code with **Alt+F11**. A first macro by hand:

```vba
Sub BoldHeader()
    Rows(1).Font.Bold = True
End Sub
```

Save as `.xlsm` or the macro is lost. A macro cannot be undone, so work on a copy. Never enable macros in a file you did not expect.

## LET
id: let
keys: let; let function; name a value in a formula; simplify long formula
ask: make a long formula shorter; reuse a calculation inside a formula
next: lambda, if

**LET** names a value so you can reuse it in one formula.

```excel
=LET(total, SUM(B2:B10), IF(total>1000, total*0.9, total))
```

Pairs of name and value come first, and the last part is the result. It is easier to read and calculates the named part once. Needs Microsoft 365 or Excel 2021.

## LAMBDA
id: lambda
keys: lambda; custom function; make my own function; create a function
ask: how do i create my own function; write a custom function without vba
next: let, named-range, macro

**LAMBDA** makes your own function with no VBA. Test it in a cell by adding the inputs at the end:

```excel
=LAMBDA(price, rate, price*(1+rate))(100, 8%)
```

When it works, go to **Formulas → Name Manager → New**, name it `WITHTAX`, and paste the part without `(100, 8%)`. Then `=WITHTAX(B2, 8%)` works anywhere in that workbook. Needs Microsoft 365 or Excel 2024.

## Circular references
id: circular
keys: circular reference; circular; circular reference warning; iterative
ask: why do i get a circular reference; how do i fix a circular reference
next: errors, average

A circular reference means a formula includes **its own cell**, directly or through others. The usual cause is a total that includes itself: `=SUM(B2:B10)` typed in B10.

Find it: **Formulas → Error Checking arrow → Circular References**. The status bar shows one too. Shorten the range so it stops above the formula.

## SUBTOTAL and filtered totals
id: subtotal
keys: subtotal; aggregate; sum visible; visible cells only; sum filtered; ignore hidden rows; total of filtered rows
ask: sum only the visible rows; total after filtering; average of filtered data
next: sort-filter, excel-table, sumifs

SUM keeps counting filtered-out rows. **SUBTOTAL** skips them:

```excel
=SUBTOTAL(109, C2:C100)
```

`109` is sum, `101` average, `102` count, `104` max. The 100 versions also skip rows you hid by hand. To ignore errors as well:

```excel
=AGGREGATE(9, 7, C2:C100)
```

## Running total
id: running-total
keys: running total; cumulative; cumulative sum; running balance; checkbook; running sum; cumulative total
ask: how do i keep a running total; checkbook balance; add each row to the one above
next: absolute-reference, budget, sumifs

Lock the start of the range and let the end move:

```excel
=SUM($C$2:C2)
```

Fill down and each row adds everything above it. For a balance with money in (C) and money out (D):

```excel
=SUM($C$2:C2)-SUM($D$2:D2)
```

## Moving average
id: moving-average
keys: moving average; rolling average; smoothing; 7 day average; three month average
ask: how do i calculate a moving average; smooth out my data
next: trendline, average, chart

For a three-period average, start on the third row of data and fill down:

```excel
=AVERAGE(B2:B4)
```

Leave the range **without** `$` so the window slides. On a chart: right-click the line → Add Trendline → **Moving Average**.

## Budget
id: budget
keys: budget; personal budget; expense tracker; expenses; monthly budget; track spending; college budget
ask: how do i make a budget; track my spending; build an expense tracker
next: sumifs, running-total, data-validation, pivot

1. **Transactions sheet**, as a Table (Ctrl+T) named `Spend`: Date, Category, Amount. Add a drop-down for Category.
2. **Budget sheet:** Category in A, Planned in B, Actual in C:

```excel
=SUMIFS(Spend[Amount], Spend[Category], A2)
```

3. Left over in D: `=B2-C2`
4. Conditional Formatting: red when D is below 0.

Every new row you type updates the budget.

## Dashboard
id: dashboard
keys: dashboard; report; kpi; summary page
ask: how do i build a dashboard; make an interactive report
next: pivot, slicer, chart, sparklines

1. Put raw data in a **Table** on its own sheet.
2. Build one **PivotTable** per question on a second sheet.
3. Insert a **PivotChart** from each, and move the charts to a Dashboard sheet.
4. Add **slicers** and connect them to every pivot (right-click → Report Connections).
5. Turn off gridlines (View) and put the two or three numbers that matter at the top.

## Sparklines
id: sparklines
keys: sparkline; sparklines; mini chart; tiny chart; chart in a cell; in cell chart
ask: put a small chart in a cell; show a trend in each row
next: chart, conditional-formatting

**Insert → Sparklines → Line**, choose the data range and the cell for it. Drag the fill handle to copy it down. **Sparkline → High Point / Low Point** adds markers. To delete one, use Sparkline → **Clear**, because the Delete key will not.

## Comments and notes
id: comments
keys: comment; comments; note; notes; add a note; threaded comment; annotate
ask: how do i add a comment to a cell; leave a note in a cell
next: protect, data-validation

- **Comment** (a conversation people can reply to): Review → New Comment, or **Ctrl+Shift+F2**
- **Note** (a simple sticky note): right-click → New Note, or **Shift+F2**

## View and zoom
id: other-view
keys: split screen; new window; side by side; zoom; gridlines off; view two sheets; view
ask: see two sheets at once; turn off gridlines; compare two sheets
next: freeze, print

- **Two sheets side by side:** View → New Window, then View → **Arrange All**
- **Two parts of one sheet:** View → **Split**
- **Gridlines off:** View → untick Gridlines
- **Zoom:** Ctrl + scroll wheel

## Copilot and Python in Excel
id: copilot
keys: copilot; ai in excel; python in excel; =py; python; analyze data
ask: can excel use ai; how do i use copilot in excel; how do i use python in excel
next: pivot, power-query

- **Copilot:** Home → Copilot, with a Microsoft 365 plan that includes it. The file usually needs to be on OneDrive or SharePoint.
- **Analyze Data:** Home → Analyze Data suggests charts and answers plain questions.
- **Python in Excel:** type `=PY(` in a cell. Availability depends on your plan.

Check any AI formula on a few rows where you already know the answer.
