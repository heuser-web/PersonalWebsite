# Excel reference

Verified answers for Excel Helper. Prefer these over memory when they cover the question.

## VLOOKUP

People ask: how do i look up a value; find a price in a table; return a matching value; get data from a table based on an id; why is my vlookup not working.

**VLOOKUP** finds a value in the first column of a range and returns something from a column to its right.

```excel
=VLOOKUP(A2, $D$2:$F$50, 3, FALSE)
```

1. `A2` is what you are looking for.
2. `$D$2:$F$50` is the table. Its **first** column must hold the thing you are matching.
3. `3` means return the third column of that table.
4. `FALSE` means exact match. Leave it off and Excel can return a wrong answer with no error.

Watch out: VLOOKUP only looks to the right. If your answer is left of the match column, use XLOOKUP or INDEX/MATCH.

### VLOOKUP: Example

Product IDs are in D2:D50, names in E, prices in F. To get the price for the ID typed in A2:

```excel
=VLOOKUP(A2, $D$2:$F$50, 3, FALSE)
```

To show a friendly message when the ID is missing:

```excel
=IFNA(VLOOKUP(A2, $D$2:$F$50, 3, FALSE), "Not found")
```

### VLOOKUP: If it is not working

Work down this list. It covers nearly every broken VLOOKUP:

1. **#N/A:** stray spaces. Try `=VLOOKUP(TRIM(A2), $D$2:$F$50, 3, FALSE)`.
2. **#N/A on numbers:** one side is stored as text. Select the column, then Data → Text to Columns → Finish.
3. **Wrong answer, no error:** the fourth argument is missing. Add `FALSE`.
4. **Right on row 1, broken lower down:** the table slid. Lock it with `$` (F4).
5. **#REF!:** the column number is bigger than the table is wide.

## XLOOKUP

People ask: what replaced vlookup; look to the left; vlookup vs xlookup; should i use xlookup or vlookup.

**XLOOKUP** is the modern replacement for VLOOKUP. It looks in any direction, and exact match is the default.

```excel
=XLOOKUP(A2, $D$2:$D$50, $F$2:$F$50, "Not found")
```

1. What to find.
2. The column to search.
3. The column to return. It can be left or right of the search column.
4. What to show when there is no match.

Inserting a column will not break it. The two ranges must be the same length. Needs Microsoft 365 or Excel 2021 and later.

### XLOOKUP: Example

Return the **last** matching row instead of the first:

```excel
=XLOOKUP(A2, $D$2:$D$50, $F$2:$F$50, "Not found", 0, -1)
```

### XLOOKUP: If it is not working

1. **#NAME?:** your version of Excel does not have XLOOKUP. Use INDEX/MATCH.
2. **#VALUE!:** the search and return ranges are different lengths.
3. **Not found, but it is there:** spaces or numbers stored as text. Try `TRIM(A2)`.

## INDEX and MATCH

People ask: lookup that works in every version; find the row number of a value.

**INDEX + MATCH** is the flexible lookup that works in every version of Excel.

```excel
=INDEX($F$2:$F$50, MATCH(A2, $D$2:$D$50, 0))
```

Read it inside out: **MATCH** finds which row the value is on, and **INDEX** returns what is in that row. The `0` means exact match, so never leave it off. It can return a column to the left, and inserting a column does not break it.

### INDEX and MATCH: Example

Two-way lookup, where a row label is in A2 and a column label is in B1:

```excel
=INDEX($C$5:$H$20, MATCH($A2, $B$5:$B$20, 0), MATCH(B$1, $C$4:$H$4, 0))
```

### INDEX and MATCH: If it is not working

1. The INDEX range and the MATCH range must start on the same row and be the same height.
2. `#N/A` means MATCH found nothing. Check for spaces and for numbers stored as text.

## Look up with two criteria

People ask: how do i lookup with two criteria; vlookup with two conditions; match on first and last name; find a value using two columns.

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

People ask: how do i pull data from another sheet; reference a cell on a different tab; find a price from another sheet; link two sheets; sum across sheets.

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

### Refer to another sheet: Example

Add the same cell across sheets named Jan through Dec:

```excel
=SUM(Jan:Dec!B2)
```

### Refer to another sheet: If it is not working

`#REF!` means the sheet or the cell was deleted. Undo right away, or use Data → Edit Links if it points at another workbook.

## PivotTables

People ask: how do i make a pivot table; summarize sales by region; total by category; group my data; group dates by month in a pivot table.

A **PivotTable** turns thousands of rows into a small summary you rearrange by dragging.

1. Click any cell in your data. Every column needs a header and there should be no blank rows.
2. **Insert → PivotTable → OK**.
3. Drag a text field (Region) to **Rows**.
4. Drag a number field (Sales) to **Values**.
5. Optional: drag another field to **Columns** or **Filters**.

Tip: press **Ctrl+T** on your data first, so new rows are included when you refresh.

### PivotTables: Example

Average sale by region and month: Region in **Rows**, Date in **Columns** (right-click → Group → Months), Sales in **Values**, then click the Values field → **Value Field Settings → Average**.

### PivotTables: If it is not working

1. **Numbers show as Count, not Sum:** the column contains text or blanks. Fix the data, then Value Field Settings → Sum.
2. **New rows missing:** right-click → Refresh, or check Change Data Source.
3. **"Field name is not valid":** a header cell is blank.

### PivotTables: On a Mac

Same steps: Insert → PivotTable. Refresh is right-click → Refresh.

## Refresh a PivotTable

People ask: why is my pivot table not updating; new rows do not show in my pivot table; my pivot table is out of date.

PivotTables do not update on their own. Right-click the pivot → **Refresh**, or press **Alt+F5**. **Ctrl+Alt+F5** refreshes everything in the workbook.

If new **rows** are missing even after a refresh, the source range is fixed. Go to **PivotTable Analyze → Change Data Source**. To stop it happening again, turn the source into a Table with **Ctrl+T**.

## PivotTable calculations and percentages

People ask: how do i show percentages in a pivot table; add a calculation to a pivot table.

To show a percentage: right-click a value → **Show Values As → % of Grand Total** (or % of Column Total, Running Total, Difference From).

To add your own formula: **PivotTable Analyze → Fields, Items & Sets → Calculated Field**. For margin, the formula would be:

```excel
=Profit/Sales
```

A calculated field works on the **sums**, so it gives total profit over total sales, not the average of each row's margin.

## Slicers

People ask: add filter buttons; make an interactive dashboard.

A **slicer** is a set of clickable filter buttons for a Table or PivotTable.

1. Click inside the Table or PivotTable.
2. **Insert → Slicer** and tick the fields you want.
3. Click a button to filter. Ctrl+click picks several.

One slicer can drive several PivotTables that share the same source: right-click it → **Report Connections**. For dates, use **Insert → Timeline** (PivotTables only).

## IF and IFS

People ask: how do i write an if statement; pass or fail formula; letter grade formula; if a cell is greater than; if vs ifs; if cell is blank.

**IF** returns one thing when a test is true and another when it is false.

```excel
=IF(B2>=70, "Pass", "Fail")
```

For several outcomes, use **IFS** instead of nesting:

```excel
=IFS(B2>=90,"A", B2>=80,"B", B2>=70,"C", B2>=60,"D", TRUE,"F")
```

Order matters. IFS stops at the first true test, so go from strictest to loosest. The final `TRUE` catches everything left over. Text must be in quotes; numbers must not.

### IF and IFS: Example

Leave a cell blank when there is nothing to calculate yet:

```excel
=IF(B2="", "", B2*C2)
```

### IF and IFS: If it is not working

1. **#NAME?:** text without quotes. Write `"Pass"`, not `Pass`.
2. **Always the same answer:** the number is stored as text, or you compared to `"70"` instead of `70`.
3. **Shows FALSE:** you left out the third part.
4. **Wrong letter grade:** the tests are in loosest-first order.

## AND, OR and NOT

People ask: if two things are true; if either is true; check more than one condition; what about two conditions; between two numbers.

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

People ask: add up sales for only the west region; sum one category; total for one person; sum if greater than; add only certain rows; how do i total by month; sum with multiple conditions.

**SUMIF** adds what meets one condition. **SUMIFS** handles several.

```excel
=SUMIF($A$2:$A$100, "West", $C$2:$C$100)
```

```excel
=SUMIFS($C$2:$C$100, $A$2:$A$100, "West", $B$2:$B$100, ">1000")
```

Watch the order, because it flips: SUMIF puts the numbers to add **last**, SUMIFS puts them **first**. Put an operator in quotes: `">1000"`. To compare with a cell, join it: `">"&E1`.

### SUMIF and SUMIFS: Example

Total for one month, with dates in column B:

```excel
=SUMIFS($C$2:$C$100, $B$2:$B$100, ">="&DATE(2026,11,1), $B$2:$B$100, "<"&DATE(2026,12,1))
```

### SUMIF and SUMIFS: If it is not working

1. **0:** the criteria does not match. Look for spaces, or numbers stored as text.
2. **#VALUE!:** the ranges are different sizes.
3. **Wrong total:** you used SUMIF order inside SUMIFS.

## COUNTIF and COUNTIFS

People ask: count the number of times a name appears; how many cells say yes; count cells greater than; how many of each; count text.

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

### COUNTIF and COUNTIFS: Example

Flag every row that is a repeat:

```excel
=IF(COUNTIF($A$2:$A$100, A2)>1, "Duplicate", "")
```

## AVERAGEIF

People ask: average only the west region; average excluding zeros; average ignoring zeros; average without blanks.

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

People ask: highest sale in the west region; largest value for one category; latest date for a customer.

```excel
=MAXIFS($C$2:$C$100, $A$2:$A$100, "West")
```

```excel
=MINIFS($C$2:$C$100, $A$2:$A$100, "West")
```

The numbers come first, then pairs of range and condition. It works on dates too, so MAXIFS on a date column gives the latest date. Needs Excel 2019 or later.

## Sum, average and the basics

People ask: whats the average of a column; how do i add a column of numbers; total a column; how do i write a formula; find the highest number; how do i subtract; multiply two cells.

```excel
=SUM(A2:A100)
```

- `=AVERAGE(A2:A100)` mean
- `=MEDIAN(A2:A100)` middle value
- `=MIN(A2:A100)` and `=MAX(A2:A100)`
- `=COUNT(A2:A100)` how many numbers
- `=A2-B2`, `=A2*B2`, `=A2/B2` for subtract, multiply, divide

**Alt+=** writes the SUM for you. Use MEDIAN when a few extreme values would distort the mean, such as home prices. AVERAGE skips blanks and text but counts zeros.

### Sum, average and the basics: On a Mac

AutoSum is **Cmd+Shift+T**.

## Largest, smallest and rank

People ask: how to find the second largest; how do i use rank; rank students by score; top five values; bottom three.

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

People ask: how do i calculate my gpa; calculate my final grade; average with weights; assignments worth different percentages.

Multiply each value by its weight, add those up, then divide by the total weight.

```excel
=SUMPRODUCT(B2:B10, C2:C10) / SUM(C2:C10)
```

**For GPA:** column B is the grade points (A = 4, B = 3), column C is the credits.
**For a course grade:** column B is the score, column C is the weight. If the weights already add to 100%, the division does not change anything, but it protects you when only some grades are in.

A plain AVERAGE is wrong here, because it treats a 1-credit class like a 4-credit class.

## SUMPRODUCT

People ask: multiply two columns and add the results; total revenue from price and quantity.

**SUMPRODUCT** multiplies columns row by row and adds the results.

```excel
=SUMPRODUCT(B2:B100, C2:C100)
```

If B is price and C is quantity, that is total revenue without a helper column. Both ranges must be the same size, or you get `#VALUE!`. It can also apply conditions:

```excel
=SUMPRODUCT((A2:A100="West")*(B2:B100)*(C2:C100))
```

## Percent change

People ask: how to calculate percent change; how do i calculate percent increase; how much did sales grow.

New minus old, divided by **old**:

```excel
=(B2-A2)/A2
```

Then format as a percentage (**Ctrl+Shift+%**). Do not multiply by 100 as well, or 12% becomes 1200%.

Two traps: dividing by the new value instead of the old one, and an old value of zero, which gives `#DIV/0!`:

```excel
=IF(A2=0, "n/a", (B2-A2)/A2)
```

### Percent change: Example

Sales went from 400 to 500. `=(500-400)/400` is 0.25, which shows as 25% once formatted. Going back down from 500 to 400 is -20%, not -25%, because the starting point changed.

## Percent of total

People ask: what percent of the total is each row; each items share; show each as a percentage.

```excel
=B2/SUM($B$2:$B$10)
```

The `$` signs keep the total fixed while B2 moves as you fill down. Format as a percentage with **Ctrl+Shift+%**. The results should add to 100%, which is a quick way to check it.

## Percentages, discounts and tax

People ask: how do i calculate a percentage; take 20 percent off; add sales tax; increase a price by ten percent; how do i do percentages.

- **Part of a whole:** `=B2/C2`, formatted as a percentage
- **20% of a number:** `=B2*20%`
- **Take 20% off:** `=B2*(1-20%)`
- **Add 8.265% tax:** `=B2*(1+8.265%)`

Better: keep the rate in its own cell and lock it, so you can change it once.

```excel
=B2*(1+$E$1)
```

## Absolute references and the $ sign

People ask: how do i stop a cell from changing when i drag; formula changes when i copy it; keep a cell fixed in a formula; what does the dollar sign mean; what is the difference between relative and absolute.

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

### Absolute references and the $ sign: Example

A multiplication table, with numbers down column A and across row 1. Type this in B2, then fill right and down:

```excel
=$A2*B$1
```

### Absolute references and the $ sign: On a Mac

Press **Cmd+T** (or **Fn+F4**) while the cursor is in the reference.

## Fill handle and copying formulas

People ask: how do i apply a formula to the whole column; copy a formula to all rows; fill numbers 1 to 100; drag a formula down.

Drag the small square at the bottom-right of the cell, or **double-click it** to fill to the end of the data beside it. **Ctrl+D** fills down a selection and **Ctrl+R** fills right.

For a pattern (1, 2, 3 or Jan, Feb), type the first two, select both, then drag. For a list of 100 numbers in Microsoft 365:

```excel
=SEQUENCE(100)
```

### Fill handle and copying formulas: If it is not working

**Every row shows the same number:** calculation is set to manual. Formulas → Calculation Options → **Automatic**.
**Results drift:** lock the fixed cells with `$`.

## IFERROR and hiding errors

People ask: how do i hide errors; show blank instead of error; replace n/a with text.

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

People ask: what do the errors mean; my formula has an error; list of excel errors.

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

People ask: why do i get #n/a; vlookup says n/a; value not found but it is there.

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

People ask: what does value error mean; why do i get #value.

`#VALUE!` means the formula got the wrong kind of thing, usually text where a number belongs.

1. Look for a cell that **looks** like a number but is text, such as `12 lbs` or a number with a space.
2. `=A1+B1` fails on text. `=SUM(A1:B1)` skips it.
3. In SUMIFS, COUNTIFS and SUMPRODUCT, it means the ranges are different sizes.
4. Date math fails when the date is really text. Convert it with Data → Text to Columns → Date.

## #REF!

People ask: what does #ref mean; why do i get a ref error.

`#REF!` means the formula points at something that no longer exists.

1. You deleted a row, column or sheet it used. Press **Ctrl+Z** right away, since the original address cannot be recovered later.
2. A VLOOKUP column number is larger than the table is wide.
3. You copied a formula somewhere its relative references fall off the sheet.

To find them all: **Ctrl+F**, search for `#REF!`, with Look in set to **Formulas**.

## #NAME?

People ask: what does name error mean; why does it say #name.

`#NAME?` means Excel does not recognize a word in the formula.

1. A misspelled function: `VLOKUP`, `SUMIFF`.
2. Text without quotes: `=IF(A2=Yes, ...)` should be `=IF(A2="Yes", ...)`.
3. A named range that does not exist.
4. A function your version does not have, such as XLOOKUP in Excel 2016.
5. Curly quotes pasted from Word or a website. Retype them as straight quotes.

## #DIV/0!

People ask: why do i get div 0; how do i stop divide by zero errors.

`#DIV/0!` means the bottom of a division is zero or empty. Test for it:

```excel
=IF(B2=0, "", A2/B2)
```

AVERAGE, AVERAGEIF and similar functions show it when there is nothing to average.

## #SPILL!

People ask: why do i get a spill error; what is an array formula; what is spilling; what does control shift enter do.

In Microsoft 365, one formula can return many cells. That is called **spilling**. `#SPILL!` means something is in the way.

1. Click the cell. The dashed outline shows where the result needs to go.
2. Clear anything inside that outline, including a stray space.
3. Unmerge any merged cells there.
4. Spilling does not work inside a Table. Move the formula outside it.

Refer to a whole spilled result with `#`, as in `=SUM(E2#)`. In Excel 2019 and earlier, array formulas need **Ctrl+Shift+Enter**.

## #NUM! and #CALC!

People ask: what does num error mean; what does calc error mean.

**`#NUM!`** means the math is impossible: a square root of a negative, an IRR that cannot settle, or DATEDIF with the dates reversed.

**`#CALC!`** usually means FILTER found nothing. Give it a fallback:

```excel
=FILTER(A2:C100, B2:B100="West", "None found")
```

**`#NULL!`** means a space where a comma or colon belongs, such as `SUM(A1 A5)`.

## Column shows #####

People ask: why does my cell show hashtags; why does it show pound signs; make the column fit the text; how do i widen a column.

`#####` is not an error. The column is too narrow for the number or date. **Double-click** the border on the right of the column letter to AutoFit.

If it stays after widening, the cell holds a negative date or time, usually from subtracting a later date from an earlier one.

To AutoFit every column: **Ctrl+A**, then double-click any column border.

## Formula shows as text

People ask: why is my formula showing as text instead of the result; formula does not calculate; i see the formula not the answer; my formula is not updating; how do i show all formulas.

1. **The cell is formatted as Text.** Set Home → Number Format → **General**, then press **F2** and **Enter**.
2. **Show Formulas is on.** Press **Ctrl+`** (the key left of 1) to switch it off.
3. **There is a space or an apostrophe before the `=`.** Delete it.
4. **It shows an old result:** Formulas → Calculation Options → **Automatic**.

### Formula shows as text: On a Mac

Edit a cell with **Control+U**, and toggle Show Formulas with **Control+`**.

## Numbers stored as text

People ask: my sum returns zero; numbers will not add up; convert text to numbers; green triangle in the corner of a cell; my numbers will not sort.

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

People ask: excel deletes my zeros; zip codes lose the zero; how do i keep the zero in front; how to format phone numbers.

Excel drops leading zeros because it treats the entry as a number.

- **Before typing:** format the cells as **Text**, or start with an apostrophe: `'08901`.
- **Already lost, ZIP codes:** Ctrl+1 → Special → **Zip Code**.
- **By formula, five digits:**

```excel
=TEXT(A2, "00000")
```

When importing a CSV, use Data → From Text/CSV → Transform Data and set the column type to **Text**.

## Conditional formatting

People ask: change the color of a cell based on its value; highlight overdue dates; turn cell red if negative; color code my spreadsheet; highlight the entire row.

**Home → Conditional Formatting**:

- **Highlight Cells Rules:** greater than, text contains, duplicates
- **Top/Bottom Rules:** top 10, above average
- **Data Bars / Color Scales:** quick visual comparison

To color a **whole row**, select the rows from row 2, then New Rule → **Use a formula**:

```excel
=$C2<TODAY()
```

Write the formula for the first row only. `$C` locks the column and the plain `2` lets the row move.

### Conditional formatting: Example

Highlight the whole row when status in column D is Late:

```excel
=$D2="Late"
```

### Conditional formatting: If it is not working

**The wrong rows light up:** the formula's row number does not match the first row you selected, or the `$` is missing. Check it in Conditional Formatting → Manage Rules.

## Charts

People ask: how do i make a chart; make a graph; which chart should i use; add a chart to my sheet; show data over time.

Select the data **with its headers** → **Insert** → pick a chart. **Alt+F1** makes one instantly.

- **Column / Bar:** comparing categories (bar when labels are long)
- **Line:** change over time
- **Scatter:** relationship between two numbers
- **Pie:** parts of one whole, with five slices or fewer
- **Combo:** two different scales, such as revenue with a margin line

Title it with the finding. "Sales fell 12% in Q3" beats "Q3 Sales".

### Charts: If it is not working

1. **Years became a data line:** right-click → Select Data, remove that series, and set it as the axis labels.
2. **Rows and columns swapped:** Chart Design → **Switch Row/Column**.

## Chart titles, axes and labels

People ask: how do i add axis titles; label my chart; change the axis scale; add a second axis; rename the chart title.

Click the chart, then the **+** button beside it: tick Axis Titles, Data Labels, Legend or Trendline.

- **Change the scale:** double-click the axis → set Minimum and Maximum. Start bars at zero.
- **Second axis:** right-click a series → Format Data Series → **Secondary Axis**.
- **Title linked to a cell:** click the title, type `=`, click the cell, press Enter.

### Chart titles, axes and labels: On a Mac

There is no + button. Use **Chart Design → Add Chart Element**.

## Trendline and regression

People ask: how do i add a trendline; line of best fit; how to run a regression; show the equation on a chart; forecast next month.

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

People ask: are two columns related; how do i calculate correlation.

```excel
=CORREL(A2:A100, B2:B100)
```

The result runs from -1 to 1. Near 1 means they rise together, near -1 means one falls as the other rises, near 0 means no straight-line link. Always look at a scatter chart too, because one outlier can create or hide a correlation. Correlation does not show cause.

## Histogram

People ask: how do i make a histogram; group numbers into ranges; frequency table.

Select the numbers → **Insert → Statistic Chart → Histogram**. To set the groups, double-click the horizontal axis and change **Bin width**.

For a frequency table, list the upper limit of each group in D2:D6, then:

```excel
=FREQUENCY(A2:A100, D2:D6)
```

In Microsoft 365 it fills down by itself and adds one extra row for everything above the last group.

## Standard deviation

People ask: how do i calculate standard deviation; sample or population standard deviation; measure the spread.

```excel
=STDEV.S(A2:A100)
```

Use **STDEV.S** for a sample, which is nearly always what you have. Use **STDEV.P** only when the data is the entire population. Variance works the same way with `VAR.S` and `VAR.P`.

## Analysis ToolPak

People ask: where is the data analysis button; turn on the toolpak; run descriptive statistics; how do i do a t test.

**Windows:** File → Options → Add-ins → Manage: Excel Add-ins → **Go** → tick **Analysis ToolPak**.
**Mac:** Tools → Excel Add-ins → tick **Analysis ToolPak**.

Then use **Data → Data Analysis** for descriptive statistics, histograms, regression, t-tests and ANOVA. Its results do not update when the data changes, so run it again.

## Goal Seek

People ask: what number do i need to get a result; what grade do i need on the final; find the break even point; how do i use goal seek.

**Goal Seek** works backwards: you name the answer, Excel finds the input.

1. Set up a formula that depends on one input cell.
2. **Data → What-If Analysis → Goal Seek**.
3. **Set cell:** the formula. **To value:** your target. **By changing cell:** the input.

### Goal Seek: Example

Your course average is in B5 and depends on the final exam score in B4. Set cell `B5`, to value `90`, by changing cell `B4`. Excel tells you the score you need.

It changes one input only. For several inputs or limits, use Solver.

## What-if analysis and data tables

People ask: compare several scenarios; best case worst case; how does the result change if; make a sensitivity table.

**Data → What-If Analysis** has three tools:

- **Goal Seek:** one target, one input
- **Scenario Manager:** saved sets of inputs such as Best, Expected and Worst
- **Data Table:** a grid of results for one or two changing inputs

For a two-input Data Table: put your formula in the **top-left corner** of the grid, one set of inputs across the top, the other down the side. Select the whole grid → Data Table → choose the row and column input cells. Those input cells must be on the same sheet.

## Solver

People ask: maximize profit with limits; find the best mix; optimize with constraints.

**Solver** finds the best value of a formula by changing several cells within limits you set.

Turn it on: File → Options → Add-ins → Go → **Solver Add-in** (Mac: Tools → Excel Add-ins). Then Data → **Solver**:

1. **Objective:** the formula cell. Choose Max, Min or a value.
2. **By changing:** the decision cells.
3. **Constraints:** limits, such as `B2:B5 <= D2:D5` or whole numbers only (`int`).
4. Choose **Simplex LP** if everything is linear, otherwise GRG Nonlinear.

## Loan payments and time value of money

People ask: monthly loan payment; how much is my car payment; calculate mortgage; how do i calculate compound interest; how much will my savings grow; net present value.

Monthly payment on $20,000 at 6% for 5 years:

```excel
=PMT(6%/12, 5*12, -20000)
```

- `=FV(6%/12, 10*12, -200)` value of saving $200 a month for 10 years
- `=NPV(8%, B3:B7)+B2` with the cost in B2 as a **negative** number
- `=IRR(B2:B7)` with the cost first, as a negative

Two traps: match the rate to the period (divide a yearly rate by 12 and multiply the years by 12), and leave the time-zero cost **outside** NPV, because NPV discounts its first value by a full period.

## Tables

People ask: how do i make a table; turn my data into a table; why should i use tables; auto expand range.

Press **Ctrl+T** to turn a range into a **Table**. You get:

- formulas that fill themselves into new rows
- charts and PivotTables whose source grows with the data
- filter buttons and banded rows
- readable formulas:

```excel
=SUM(Sales[Revenue])
```

Name it under **Table Design → Table Name**. Toggle a total row with **Ctrl+Shift+T**.

### Tables: On a Mac

**Cmd+T** or **Control+T**.

## Sort and filter

People ask: how do i sort alphabetically; show only certain rows; sort by two columns; sort largest to smallest; filter by color.

Click **one cell** inside the data, then **Ctrl+Shift+L** for filter buttons. To sort by several columns: **Data → Sort → Add Level**, most important first.

Never select a single column and sort it alone. The rest of the row does not follow, and the data is scrambled. If Excel asks, choose **Expand the selection**. Turning the range into a Table (Ctrl+T) removes the risk.

### Sort and filter: If it is not working

1. **Dates sort wrong:** they are text. Data → Text to Columns → Date.
2. **Header got sorted:** tick **My data has headers**.
3. **Stops at a blank row:** Excel treats it as the end. Delete blank rows first.

### Sort and filter: On a Mac

**Cmd+Shift+F** toggles filters.

## FILTER, SORT and other live lists

People ask: return all rows that match; pull every row for one person; vlookup that returns multiple results; list that updates by itself.

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

People ask: get a list of unique values; list each name once; remove repeats with a formula.

```excel
=UNIQUE(A2:A100)
```

Sorted, with blanks left out:

```excel
=SORT(UNIQUE(FILTER(A2:A100, A2:A100<>"")))
```

Needs Microsoft 365 or Excel 2021. In older versions: Data → Advanced → **Unique records only**.

## Count unique values

People ask: how many unique values; how many different customers; count each value once.

```excel
=COUNTA(UNIQUE(A2:A100))
```

Works in every version, as long as the range has no blanks:

```excel
=SUMPRODUCT(1/COUNTIF(A2:A100, A2:A100))
```

In a PivotTable: tick **Add this data to the Data Model** when you create it, then Value Field Settings → **Distinct Count**.

## Duplicates

People ask: how do i remove duplicates; highlight duplicate values; find repeats; delete repeated rows.

- **Delete them:** Data → **Remove Duplicates** → tick the columns that define a duplicate. This removes rows, so copy the sheet first.
- **Only highlight them:** Home → Conditional Formatting → Highlight Cells Rules → **Duplicate Values**.
- **Flag them:**

```excel
=IF(COUNTIF($A$2:$A$100, A2)>1, "Duplicate", "")
```

If obvious duplicates are missed, the values differ by a space. Clean them with TRIM first.

## Remove blank rows

People ask: how do i delete blank rows; get rid of empty rows; fill in blank cells with the value above.

Safest: turn on filters (**Ctrl+Shift+L**), filter one column to **(Blanks)**, check that those rows are really empty, then delete them.

Faster but riskier: **Home → Find & Select → Go To Special → Blanks**, then Delete Sheet Rows. This deletes **any** row with one blank in the selection, so select a column that is never blank in real rows.

## Freeze panes

People ask: how do i lock a row when scrolling; keep the top row visible; keep headers on screen; freeze the header row.

**View → Freeze Panes**

- **Freeze Top Row** keeps row 1
- **Freeze First Column** keeps column A
- **Freeze Panes** keeps everything **above and left** of the selected cell

To keep row 1 and column A, click **B2** first. To keep two rows, click **A3**. To undo, use Unfreeze Panes in the same menu.

## Drop-down lists and data validation

People ask: how do i make a drop down list; only allow certain values; make a list to choose from; stop people typing the wrong thing; dependent drop down.

1. Select the cells → **Data → Data Validation**.
2. Allow: **List**.
3. Source: type `Yes,No,Pending`, or point at a range:

```excel
=$H$2:$H$10
```

Other rules: whole number between 1 and 100, date after today, text length. The **Error Alert** tab sets the message people see.

### Drop-down lists and data validation: Example

A drop-down that grows by itself, from a spilled list that starts in H2:

```excel
=$H$2#
```

### Drop-down lists and data validation: If it is not working

Validation does not check values **pasted** in. Data → Data Validation → **Circle Invalid Data** finds them.

## Combine text

People ask: how do i combine first and last name; join two cells; put two columns together; merge two columns into one.

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

People ask: comma separated text to columns; split first and last name; separate a column into two; get text before a comma; pull out part of a cell; extract the area code.

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

People ask: how do i remove extra spaces; capitalize names; change to uppercase; remove a character; clean messy data.

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

People ask: fill in a pattern automatically; excel guesses the rest; split names without a formula.

Type the result you want for the first row, start the second, and Excel shows the rest in grey. Press **Enter** to accept, or **Ctrl+E** at any time.

It handles names, area codes, dates and initials. Two cautions: it makes fixed text that will **not** update, and it guesses, so give it two examples if the first try is wrong.

### Flash Fill: On a Mac

Use **Data → Flash Fill**.

## Find and replace

People ask: how do i find something; replace a word everywhere; search my spreadsheet.

**Ctrl+F** finds, **Ctrl+H** replaces. Click **Options** to search the whole workbook, match case, or match the entire cell.

Wildcards: `*` is any text and `?` is one character. To find a real asterisk, type `~*`. Select a range first to limit where it replaces.

### Find and replace: On a Mac

**Cmd+F** to find, **Control+H** to replace.

## Dates

People ask: days until a date; how many days between two dates; calculate age from birthday; add months to a date; business days between dates; get the month from a date; insert todays date.

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

People ask: my dates will not sort; date shows as a number; convert text into a date; change the date format; excel changes my number to a date.

- **A date shows as 46000-something:** the cell is General. Press **Ctrl+Shift+#**.
- **Dates will not sort:** they are text. Data → Text to Columns → Next → Next → **Date** → pick the order (MDY) → Finish.
- **By formula:** `=DATEVALUE(A2)`
- **Excel turns 1/2 into a date:** format the cell as **Text** first, or type `'1/2`.

## Time and hours worked

People ask: calculate hours worked; add up hours; subtract times; timesheet over 24 hours; convert time to decimal hours.

```excel
=(B2-A2)*24
```

That gives decimal hours, formatted as Number. If a shift passes midnight:

```excel
=MOD(B2-A2, 1)*24
```

Totals over 24 hours wrap around unless the cell uses the custom format `[h]:mm` (Ctrl+1 → Custom).

## Rounding

People ask: how do i round to two decimals; round up; round to the nearest 5; remove decimals.

- `=ROUND(A2, 2)` two decimals
- `=ROUNDUP(A2, 0)` and `=ROUNDDOWN(A2, 0)` force the direction
- `=MROUND(A2, 5)` nearest 5
- `=ROUND(A2, -2)` nearest hundred

Formatting only changes what you **see**. If a cell shows 2 decimals, the rest is still there, and totals can look off by a cent. Use ROUND when the value itself must be rounded.

## Number formats

People ask: how do i show dollars; add commas to numbers; show as currency; number turned into 1e+10; format as thousands; stop scientific notation.

**Ctrl+1** opens Format Cells. Quick keys: **Ctrl+Shift+$** currency, **Ctrl+Shift+%** percent, **Ctrl+Shift+1** comma style.

Useful custom formats:

- `#,##0` commas, no decimals
- `$#,##0.0,,"M"` shows 2500000 as $2.5M
- `0.0%` one decimal percent

If a long ID shows as `1E+15`, format it as **Text** before entering it. Excel keeps only 15 digits of a number.

## Merge cells

People ask: how do i merge cells; center a title across columns; why can i not sort merged cells.

**Home → Merge & Center**. Only the top-left value is kept.

Better for titles, because merged cells break sorting, filtering and copying: select the cells → **Ctrl+1 → Alignment → Horizontal → Center Across Selection**. It looks the same and breaks nothing.

To join the **text** of cells, use `=A2&" "&B2` instead.

## Wrap text and line breaks

People ask: how to wrap text; put two lines in one cell; start a new line inside a cell; my text runs into the next cell.

**Home → Wrap Text** shows long text on several lines. For a break exactly where you want it, press **Alt+Enter** while typing. In a formula, use `CHAR(10)` with Wrap Text on:

```excel
=A2&CHAR(10)&B2
```

### Wrap text and line breaks: On a Mac

**Control+Option+Return** starts a new line.

## Insert, delete and hide rows or columns

People ask: how do i insert a row; hide a column; unhide rows; add a column in the middle; move a column; delete several rows.

- **Insert or delete:** right-click the row number or column letter → Insert / Delete. Keys: **Ctrl+Shift++** and **Ctrl+-**.
- **Hide:** right-click → Hide. Keys: **Ctrl+9** rows, **Ctrl+0** columns.
- **Unhide:** select the rows or columns on both sides → right-click → **Unhide**.
- **Move a column:** select it, hold **Shift**, drag its edge.

If column A is hidden, type `A1` in the Name Box, then Home → Format → Hide & Unhide → Unhide Columns.

## Transpose

People ask: turn rows into columns; flip my table sideways; switch rows and columns.

**One time:** copy → right-click the destination → **Paste Special → Transpose**.

**Live:**

```excel
=TRANSPOSE(A1:D10)
```

In Microsoft 365 that spills. In older versions, select the output range first and press Ctrl+Shift+Enter.

## Paste Special

People ask: copy the result not the formula; paste only the values; copy formatting to another cell.

Copy, then **Ctrl+Alt+V**, and choose:

- **Values:** the result without the formula (**Ctrl+Shift+V** in Microsoft 365)
- **Formats:** looks only, same as the Format Painter brush
- **Transpose:** rows become columns
- **Multiply / Add:** apply one copied number to a whole range

### Paste Special: On a Mac

**Control+Cmd+V** opens Paste Special. **Cmd+Shift+V** pastes values.

## Named ranges

People ask: give a cell a name; use a name instead of a cell reference; delete a named range.

Select the cell or range, type a name in the **Name Box** (left of the formula bar), press Enter. Then:

```excel
=B2*TaxRate
```

Names cannot have spaces, start with a number, or look like a cell address. Manage them under **Formulas → Name Manager**. A named cell is already absolute, so it needs no `$`.

## Protect a sheet

People ask: how do i protect a sheet; stop people editing my formulas; lock certain cells; add a password to my workbook.

Every cell is locked by default, but it has no effect until the sheet is protected.

1. Select the cells people **may** edit → Ctrl+1 → Protection → untick **Locked**.
2. **Review → Protect Sheet**, with an optional password.

To require a password to **open** the file: File → Info → Protect Workbook → **Encrypt with Password**. Keep it safe, because Microsoft cannot recover it. Sheet protection prevents accidents. It is not real security.

## Printing

People ask: how do i print on one page; repeat the header on every page; print only part of the sheet; my columns print on separate pages.

**Page Layout** tab:

- **Orientation → Landscape** for wide data
- **Width: 1 page**, with Height on Automatic
- **Print Titles → Rows to repeat:** `$1:$1`
- **Print Area → Set Print Area** for a selection
- **Sheet Options → Gridlines → Print**

Check **Ctrl+P** for the preview first. View → **Page Break Preview** lets you drag the page edges.

## Keyboard shortcuts

People ask: best excel shortcuts; what are the keyboard shortcuts; how do i work faster.

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

### Keyboard shortcuts: On a Mac

- **Cmd+Arrow** jump; add **Shift** to select
- **Cmd+T** Table, or cycle `$` while editing a formula
- **Cmd+Shift+T** AutoSum
- **Control+U** edit a cell
- **Cmd+Shift+F** filters
- **Cmd+Shift+V** paste values
- **Cmd+1** format cells
- **Control+;** today's date

## Power Query

People ask: combine many files; import data and clean it; automate cleaning; get data from a website; combine two tables.

**Power Query** imports and cleans data with steps Excel records and can replay.

1. **Data → Get Data → From File** → choose it → **Transform Data**.
2. Remove columns, split, change types, filter, replace.
3. **Close & Load**.

Next month, replace the file and press **Refresh**. **Merge** joins two tables by a shared column, like a lookup. **Append** stacks them. **From Folder** combines many files at once.

## Import a CSV

People ask: how do i open a csv; import data from a text file; csv is all in one column.

Use **Data → From Text/CSV** rather than double-clicking the file. You can check the separator and set column types before loading, which protects leading zeros and long IDs.

If everything landed in one column: Data → **Text to Columns → Delimited → Comma**.

A CSV saves **one sheet of values only**: no formulas, formatting or extra tabs. Keep an `.xlsx` copy.

## Save and export

People ask: save as a pdf; recover an unsaved file; how do i get back an old version.

- **PDF:** File → Save As → PDF. Set the print area first.
- **Recover an unsaved file:** File → Info → Manage Workbook → **Recover Unsaved Workbooks**.
- **Older version** (OneDrive or SharePoint): File → Info → **Version History**.
- **Formats:** `.xlsx` is normal, `.xlsm` keeps macros, `.csv` keeps values on one sheet.

## Macros and VBA

People ask: how do i write a macro; record a macro; automate a repeated task; turn on the developer tab.

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

People ask: make a long formula shorter; reuse a calculation inside a formula.

**LET** names a value so you can reuse it in one formula.

```excel
=LET(total, SUM(B2:B10), IF(total>1000, total*0.9, total))
```

Pairs of name and value come first, and the last part is the result. It is easier to read and calculates the named part once. Needs Microsoft 365 or Excel 2021.

## LAMBDA

People ask: how do i create my own function; write a custom function without vba.

**LAMBDA** makes your own function with no VBA. Test it in a cell by adding the inputs at the end:

```excel
=LAMBDA(price, rate, price*(1+rate))(100, 8%)
```

When it works, go to **Formulas → Name Manager → New**, name it `WITHTAX`, and paste the part without `(100, 8%)`. Then `=WITHTAX(B2, 8%)` works anywhere in that workbook. Needs Microsoft 365 or Excel 2024.

## Circular references

People ask: why do i get a circular reference; how do i fix a circular reference.

A circular reference means a formula includes **its own cell**, directly or through others. The usual cause is a total that includes itself: `=SUM(B2:B10)` typed in B10.

Find it: **Formulas → Error Checking arrow → Circular References**. The status bar shows one too. Shorten the range so it stops above the formula.

## SUBTOTAL and filtered totals

People ask: sum only the visible rows; total after filtering; average of filtered data.

SUM keeps counting filtered-out rows. **SUBTOTAL** skips them:

```excel
=SUBTOTAL(109, C2:C100)
```

`109` is sum, `101` average, `102` count, `104` max. The 100 versions also skip rows you hid by hand. To ignore errors as well:

```excel
=AGGREGATE(9, 7, C2:C100)
```

## Running total

People ask: how do i keep a running total; checkbook balance; add each row to the one above.

Lock the start of the range and let the end move:

```excel
=SUM($C$2:C2)
```

Fill down and each row adds everything above it. For a balance with money in (C) and money out (D):

```excel
=SUM($C$2:C2)-SUM($D$2:D2)
```

## Moving average

People ask: how do i calculate a moving average; smooth out my data.

For a three-period average, start on the third row of data and fill down:

```excel
=AVERAGE(B2:B4)
```

Leave the range **without** `$` so the window slides. On a chart: right-click the line → Add Trendline → **Moving Average**.

## Budget

People ask: how do i make a budget; track my spending; build an expense tracker.

1. **Transactions sheet**, as a Table (Ctrl+T) named `Spend`: Date, Category, Amount. Add a drop-down for Category.
2. **Budget sheet:** Category in A, Planned in B, Actual in C:

```excel
=SUMIFS(Spend[Amount], Spend[Category], A2)
```

3. Left over in D: `=B2-C2`
4. Conditional Formatting: red when D is below 0.

Every new row you type updates the budget.

## Dashboard

People ask: how do i build a dashboard; make an interactive report.

1. Put raw data in a **Table** on its own sheet.
2. Build one **PivotTable** per question on a second sheet.
3. Insert a **PivotChart** from each, and move the charts to a Dashboard sheet.
4. Add **slicers** and connect them to every pivot (right-click → Report Connections).
5. Turn off gridlines (View) and put the two or three numbers that matter at the top.

## Sparklines

People ask: put a small chart in a cell; show a trend in each row.

**Insert → Sparklines → Line**, choose the data range and the cell for it. Drag the fill handle to copy it down. **Sparkline → High Point / Low Point** adds markers. To delete one, use Sparkline → **Clear**, because the Delete key will not.

## Comments and notes

People ask: how do i add a comment to a cell; leave a note in a cell.

- **Comment** (a conversation people can reply to): Review → New Comment, or **Ctrl+Shift+F2**
- **Note** (a simple sticky note): right-click → New Note, or **Shift+F2**

## View and zoom

People ask: see two sheets at once; turn off gridlines; compare two sheets.

- **Two sheets side by side:** View → New Window, then View → **Arrange All**
- **Two parts of one sheet:** View → **Split**
- **Gridlines off:** View → untick Gridlines
- **Zoom:** Ctrl + scroll wheel

## Copilot and Python in Excel

People ask: can excel use ai; how do i use copilot in excel; how do i use python in excel.

- **Copilot:** Home → Copilot, with a Microsoft 365 plan that includes it. The file usually needs to be on OneDrive or SharePoint.
- **Analyze Data:** Home → Analyze Data suggests charts and answers plain questions.
- **Python in Excel:** type `=PY(` in a cell. Availability depends on your plan.

Check any AI formula on a few rows where you already know the answer.

## Function list

If a function is not listed here, check that it exists before using it.

| Function | Syntax | What it does | Needs |
|---|---|---|---|
| SUM | `=SUM(number1, [number2], …)` | adds numbers; text and blanks are skipped | any version |
| AVERAGE | `=AVERAGE(number1, …)` | mean; skips blanks and text, counts zeros | any version |
| MEDIAN | `=MEDIAN(number1, …)` | middle value | any version |
| MODE.SNGL | `=MODE.SNGL(number1, …)` | most common value | any version |
| MIN | `=MIN(number1, …)` | smallest number | any version |
| MAX | `=MAX(number1, …)` | largest number | any version |
| COUNT | `=COUNT(value1, …)` | counts cells that hold numbers | any version |
| COUNTA | `=COUNTA(value1, …)` | counts cells that are not empty | any version |
| COUNTBLANK | `=COUNTBLANK(range)` | counts empty cells | any version |
| COUNTIF | `=COUNTIF(range, criteria)` | counts cells that meet one condition | any version |
| COUNTIFS | `=COUNTIFS(range1, criteria1, [range2, criteria2], …)` | counts rows that meet every condition | any version |
| SUMIF | `=SUMIF(range, criteria, [sum_range])` | adds cells that meet one condition | any version |
| SUMIFS | `=SUMIFS(sum_range, range1, criteria1, …)` | adds cells that meet every condition | any version |
| AVERAGEIF | `=AVERAGEIF(range, criteria, [average_range])` | averages cells that meet one condition | any version |
| AVERAGEIFS | `=AVERAGEIFS(average_range, range1, criteria1, …)` | averages cells that meet every condition | any version |
| MAXIFS | `=MAXIFS(max_range, range1, criteria1, …)` | largest value among matching rows | Excel 2019+ or Microsoft 365 |
| MINIFS | `=MINIFS(min_range, range1, criteria1, …)` | smallest value among matching rows | Excel 2019+ or Microsoft 365 |
| SUMPRODUCT | `=SUMPRODUCT(array1, [array2], …)` | multiplies matching cells, then adds the results | any version |
| SUBTOTAL | `=SUBTOTAL(function_num, ref1, …)` | totals only the rows a filter leaves visible | any version |
| AGGREGATE | `=AGGREGATE(function_num, options, array)` | like SUBTOTAL, and can ignore errors | any version |
| PRODUCT | `=PRODUCT(number1, …)` | multiplies numbers | any version |
| POWER | `=POWER(number, power)` | raises to a power, same as ^ | any version |
| SQRT | `=SQRT(number)` | square root | any version |
| ABS | `=ABS(number)` | drops the minus sign | any version |
| MOD | `=MOD(number, divisor)` | remainder after dividing | any version |
| QUOTIENT | `=QUOTIENT(numerator, denominator)` | whole part of a division | any version |
| INT | `=INT(number)` | rounds down to a whole number | any version |
| TRUNC | `=TRUNC(number, [digits])` | cuts off decimals | any version |
| ROUND | `=ROUND(number, digits)` | rounds to a number of decimals | any version |
| ROUNDUP | `=ROUNDUP(number, digits)` | always rounds away from zero | any version |
| ROUNDDOWN | `=ROUNDDOWN(number, digits)` | always rounds toward zero | any version |
| MROUND | `=MROUND(number, multiple)` | rounds to the nearest multiple | any version |
| CEILING | `=CEILING(number, significance)` | rounds up to a multiple | any version |
| CEILING.MATH | `=CEILING.MATH(number, [significance])` | rounds up to a multiple | any version |
| FLOOR | `=FLOOR(number, significance)` | rounds down to a multiple | any version |
| FLOOR.MATH | `=FLOOR.MATH(number, [significance])` | rounds down to a multiple | any version |
| SIGN | `=SIGN(number)` | 1, 0 or -1 | any version |
| EXP | `=EXP(number)` | e raised to a power | any version |
| LN | `=LN(number)` | natural logarithm | any version |
| LOG | `=LOG(number, [base])` | logarithm, base 10 by default | any version |
| LOG10 | `=LOG10(number)` | base-10 logarithm | any version |
| PI | `=PI()` | the value of pi | any version |
| RAND | `=RAND()` | random decimal from 0 up to 1; changes on every recalculation | any version |
| RANDBETWEEN | `=RANDBETWEEN(bottom, top)` | random whole number; changes on every recalculation | any version |
| RANDARRAY | `=RANDARRAY([rows], [columns], [min], [max], [whole])` | a block of random numbers | Excel 2021+ or Microsoft 365 |
| SEQUENCE | `=SEQUENCE(rows, [columns], [start], [step])` | a list of numbers in order | Excel 2021+ or Microsoft 365 |
| LARGE | `=LARGE(array, k)` | k-th largest value | any version |
| SMALL | `=SMALL(array, k)` | k-th smallest value | any version |
| RANK | `=RANK(number, ref, [order])` | rank of a number; kept for old files, use RANK.EQ | any version |
| RANK.EQ | `=RANK.EQ(number, ref, [order])` | rank of a number; ties share a rank | any version |
| RANK.AVG | `=RANK.AVG(number, ref, [order])` | rank of a number; ties get the average rank | any version |
| PERCENTILE.INC | `=PERCENTILE.INC(array, k)` | value at a percentile | any version |
| QUARTILE.INC | `=QUARTILE.INC(array, quart)` | value at a quartile | any version |
| STDEV | `=STDEV(number1, …)` | standard deviation of a sample; kept for old files, use STDEV.S | any version |
| STDEV.S | `=STDEV.S(number1, …)` | standard deviation of a sample | any version |
| STDEV.P | `=STDEV.P(number1, …)` | standard deviation of a whole population | any version |
| VAR.S | `=VAR.S(number1, …)` | variance of a sample | any version |
| VAR.P | `=VAR.P(number1, …)` | variance of a whole population | any version |
| CORREL | `=CORREL(array1, array2)` | correlation, from -1 to 1 | any version |
| SLOPE | `=SLOPE(known_ys, known_xs)` | slope of the best-fit line | any version |
| INTERCEPT | `=INTERCEPT(known_ys, known_xs)` | where the best-fit line crosses the y axis | any version |
| RSQ | `=RSQ(known_ys, known_xs)` | R-squared, how well the line fits | any version |
| FORECAST | `=FORECAST(x, known_ys, known_xs)` | predicts a value; kept for old files, use FORECAST.LINEAR | any version |
| FORECAST.LINEAR | `=FORECAST.LINEAR(x, known_ys, known_xs)` | predicts a value from a straight line | any version |
| TREND | `=TREND(known_ys, [known_xs], [new_xs])` | predicts several values from a straight line | any version |
| LINEST | `=LINEST(known_ys, [known_xs], [const], [stats])` | full regression statistics | any version |
| FREQUENCY | `=FREQUENCY(data, bins)` | counts how many values fall in each group | any version |
| NORM.DIST | `=NORM.DIST(x, mean, sd, cumulative)` | normal distribution | any version |
| T.TEST | `=T.TEST(array1, array2, tails, type)` | p-value of a t-test | any version |
| CONFIDENCE.T | `=CONFIDENCE.T(alpha, sd, size)` | margin of error for a mean | any version |
| IF | `=IF(test, value_if_true, [value_if_false])` | one result when a test is true, another when false | any version |
| IFS | `=IFS(test1, value1, [test2, value2], …)` | first result whose test is true | Excel 2019+ or Microsoft 365 |
| SWITCH | `=SWITCH(expression, value1, result1, …, [default])` | matches one value against a list | Excel 2019+ or Microsoft 365 |
| CHOOSE | `=CHOOSE(index, value1, …)` | picks an item by its position | any version |
| AND | `=AND(test1, …)` | TRUE when every test is true | any version |
| OR | `=OR(test1, …)` | TRUE when at least one test is true | any version |
| NOT | `=NOT(test)` | flips TRUE and FALSE | any version |
| XOR | `=XOR(test1, …)` | TRUE when an odd number of tests are true | any version |
| IFERROR | `=IFERROR(value, value_if_error)` | replaces any error | any version |
| IFNA | `=IFNA(value, value_if_na)` | replaces only #N/A | any version |
| ISBLANK | `=ISBLANK(value)` | TRUE when a cell is empty | any version |
| ISNUMBER | `=ISNUMBER(value)` | TRUE when a cell holds a number | any version |
| ISTEXT | `=ISTEXT(value)` | TRUE when a cell holds text | any version |
| ISERROR | `=ISERROR(value)` | TRUE when there is any error | any version |
| ISNA | `=ISNA(value)` | TRUE when there is #N/A | any version |
| ISEVEN | `=ISEVEN(number)` | TRUE for even numbers | any version |
| ISODD | `=ISODD(number)` | TRUE for odd numbers | any version |
| ISFORMULA | `=ISFORMULA(reference)` | TRUE when a cell holds a formula | any version |
| NA | `=NA()` | returns #N/A on purpose | any version |
| TRUE | `=TRUE()` | the value TRUE | any version |
| FALSE | `=FALSE()` | the value FALSE | any version |
| VLOOKUP | `=VLOOKUP(lookup_value, table, col_number, [range_lookup])` | finds a value in a first column, returns one to its right | any version |
| HLOOKUP | `=HLOOKUP(lookup_value, table, row_number, [range_lookup])` | finds a value in a top row, returns one below it | any version |
| XLOOKUP | `=XLOOKUP(lookup_value, lookup_range, return_range, [if_not_found], [match_mode], [search_mode])` | finds a value and returns its match from any direction | Excel 2021+ or Microsoft 365 |
| LOOKUP | `=LOOKUP(lookup_value, lookup_vector, [result_vector])` | older lookup that needs sorted data | any version |
| INDEX | `=INDEX(array, row_num, [column_num])` | returns the value at a position | any version |
| MATCH | `=MATCH(lookup_value, lookup_array, [match_type])` | returns the position of a value; use 0 for exact | any version |
| XMATCH | `=XMATCH(lookup_value, lookup_array, [match_mode])` | returns the position of a value, exact by default | Excel 2021+ or Microsoft 365 |
| OFFSET | `=OFFSET(reference, rows, cols, [height], [width])` | a range a number of steps away; recalculates constantly | any version |
| INDIRECT | `=INDIRECT(ref_text)` | turns text into a reference; recalculates constantly and breaks silently | any version |
| ADDRESS | `=ADDRESS(row, column, [abs], [a1], [sheet])` | builds a cell address as text | any version |
| ROW | `=ROW([reference])` | row number | any version |
| ROWS | `=ROWS(array)` | how many rows | any version |
| COLUMN | `=COLUMN([reference])` | column number | any version |
| COLUMNS | `=COLUMNS(array)` | how many columns | any version |
| TRANSPOSE | `=TRANSPOSE(array)` | swaps rows and columns | any version |
| FORMULATEXT | `=FORMULATEXT(reference)` | shows a formula as text | any version |
| HYPERLINK | `=HYPERLINK(link, [name])` | makes a clickable link | any version |
| GETPIVOTDATA | `=GETPIVOTDATA(field, pivot, …)` | reads a value from a PivotTable | any version |
| FILTER | `=FILTER(array, include, [if_empty])` | returns every row that matches | Excel 2021+ or Microsoft 365 |
| SORT | `=SORT(array, [sort_index], [sort_order], [by_col])` | sorted copy of a range | Excel 2021+ or Microsoft 365 |
| SORTBY | `=SORTBY(array, by_array1, [order1], …)` | sorts one range by another | Excel 2021+ or Microsoft 365 |
| UNIQUE | `=UNIQUE(array, [by_col], [exactly_once])` | list without repeats | Excel 2021+ or Microsoft 365 |
| TAKE | `=TAKE(array, rows, [columns])` | first or last rows of a result | Excel 2024+ or Microsoft 365 |
| DROP | `=DROP(array, rows, [columns])` | removes rows from a result | Excel 2024+ or Microsoft 365 |
| CHOOSECOLS | `=CHOOSECOLS(array, col1, …)` | picks columns from a result | Excel 2024+ or Microsoft 365 |
| CHOOSEROWS | `=CHOOSEROWS(array, row1, …)` | picks rows from a result | Excel 2024+ or Microsoft 365 |
| VSTACK | `=VSTACK(array1, …)` | stacks ranges on top of each other | Excel 2024+ or Microsoft 365 |
| HSTACK | `=HSTACK(array1, …)` | puts ranges side by side | Excel 2024+ or Microsoft 365 |
| TOCOL | `=TOCOL(array, [ignore])` | turns a block into one column | Excel 2024+ or Microsoft 365 |
| TOROW | `=TOROW(array, [ignore])` | turns a block into one row | Excel 2024+ or Microsoft 365 |
| WRAPROWS | `=WRAPROWS(vector, count)` | wraps a list into rows | Excel 2024+ or Microsoft 365 |
| WRAPCOLS | `=WRAPCOLS(vector, count)` | wraps a list into columns | Excel 2024+ or Microsoft 365 |
| GROUPBY | `=GROUPBY(row_fields, values, function)` | summary table from one formula | Microsoft 365 |
| PIVOTBY | `=PIVOTBY(row_fields, col_fields, values, function)` | pivot from one formula | Microsoft 365 |
| LET | `=LET(name1, value1, …, result)` | names values inside one formula | Excel 2021+ or Microsoft 365 |
| LAMBDA | `=LAMBDA(parameter1, …, calculation)` | makes your own function | Excel 2024+ or Microsoft 365 |
| MAP | `=MAP(array, lambda)` | runs a LAMBDA on every item | Excel 2024+ or Microsoft 365 |
| BYROW | `=BYROW(array, lambda)` | runs a LAMBDA on every row | Excel 2024+ or Microsoft 365 |
| BYCOL | `=BYCOL(array, lambda)` | runs a LAMBDA on every column | Excel 2024+ or Microsoft 365 |
| REDUCE | `=REDUCE(initial, array, lambda)` | runs a LAMBDA down to one value | Excel 2024+ or Microsoft 365 |
| SCAN | `=SCAN(initial, array, lambda)` | running results from a LAMBDA | Excel 2024+ or Microsoft 365 |
| CONCAT | `=CONCAT(text1, …)` | joins text or a whole range | Excel 2019+ or Microsoft 365 |
| CONCATENATE | `=CONCATENATE(text1, …)` | joins text; kept for old files, use CONCAT or & | any version |
| TEXTJOIN | `=TEXTJOIN(delimiter, ignore_empty, text1, …)` | joins text with a separator | Excel 2019+ or Microsoft 365 |
| TEXTSPLIT | `=TEXTSPLIT(text, col_delimiter, [row_delimiter])` | splits text into cells | Excel 2024+ or Microsoft 365 |
| TEXTBEFORE | `=TEXTBEFORE(text, delimiter, [instance])` | text before a character | Excel 2024+ or Microsoft 365 |
| TEXTAFTER | `=TEXTAFTER(text, delimiter, [instance])` | text after a character | Excel 2024+ or Microsoft 365 |
| LEFT | `=LEFT(text, [num_chars])` | first characters | any version |
| RIGHT | `=RIGHT(text, [num_chars])` | last characters | any version |
| MID | `=MID(text, start, num_chars)` | characters from the middle | any version |
| LEN | `=LEN(text)` | number of characters | any version |
| FIND | `=FIND(find_text, within_text, [start])` | position of text; case matters | any version |
| SEARCH | `=SEARCH(find_text, within_text, [start])` | position of text; case ignored, wildcards allowed | any version |
| SUBSTITUTE | `=SUBSTITUTE(text, old, new, [instance])` | replaces text by what it says | any version |
| REPLACE | `=REPLACE(text, start, num_chars, new)` | replaces text by its position | any version |
| TRIM | `=TRIM(text)` | removes extra spaces | any version |
| CLEAN | `=CLEAN(text)` | removes hidden characters | any version |
| UPPER | `=UPPER(text)` | all capitals | any version |
| LOWER | `=LOWER(text)` | all lower case | any version |
| PROPER | `=PROPER(text)` | Capitalizes Each Word | any version |
| TEXT | `=TEXT(value, format)` | turns a number or date into formatted text | any version |
| VALUE | `=VALUE(text)` | turns text into a number | any version |
| NUMBERVALUE | `=NUMBERVALUE(text, [decimal], [group])` | turns text into a number with set separators | any version |
| EXACT | `=EXACT(text1, text2)` | TRUE when two texts match, case included | any version |
| REPT | `=REPT(text, times)` | repeats text | any version |
| CHAR | `=CHAR(number)` | character from a code; CHAR(10) is a line break | any version |
| CODE | `=CODE(text)` | code of the first character | any version |
| UNICHAR | `=UNICHAR(number)` | character from a Unicode number | any version |
| TODAY | `=TODAY()` | today's date, updates daily | any version |
| NOW | `=NOW()` | date and time now | any version |
| DATE | `=DATE(year, month, day)` | builds a date | any version |
| DATEVALUE | `=DATEVALUE(text)` | turns text into a date | any version |
| DATEDIF | `=DATEDIF(start, end, unit)` | whole years "Y", months "M" or days "D" between dates | any version |
| DAYS | `=DAYS(end, start)` | days between two dates | any version |
| YEAR | `=YEAR(date)` | the year | any version |
| MONTH | `=MONTH(date)` | the month number | any version |
| DAY | `=DAY(date)` | the day of the month | any version |
| WEEKDAY | `=WEEKDAY(date, [type])` | day of the week as a number; type 2 makes Monday 1 | any version |
| WEEKNUM | `=WEEKNUM(date, [type])` | week of the year | any version |
| ISOWEEKNUM | `=ISOWEEKNUM(date)` | ISO week of the year | any version |
| EDATE | `=EDATE(date, months)` | same day a number of months later | any version |
| EOMONTH | `=EOMONTH(date, months)` | last day of a month | any version |
| NETWORKDAYS | `=NETWORKDAYS(start, end, [holidays])` | weekdays between dates, counting both ends | any version |
| NETWORKDAYS.INTL | `=NETWORKDAYS.INTL(start, end, [weekend], [holidays])` | workdays with your own weekend | any version |
| WORKDAY | `=WORKDAY(start, days, [holidays])` | date a number of workdays away | any version |
| WORKDAY.INTL | `=WORKDAY.INTL(start, days, [weekend], [holidays])` | same, with your own weekend | any version |
| YEARFRAC | `=YEARFRAC(start, end, [basis])` | part of a year between dates | any version |
| TIME | `=TIME(hour, minute, second)` | builds a time | any version |
| TIMEVALUE | `=TIMEVALUE(text)` | turns text into a time | any version |
| HOUR | `=HOUR(time)` | the hour | any version |
| MINUTE | `=MINUTE(time)` | the minute | any version |
| SECOND | `=SECOND(time)` | the second | any version |
| PMT | `=PMT(rate, periods, present_value, [future_value], [type])` | payment on a loan | any version |
| IPMT | `=IPMT(rate, period, periods, present_value)` | interest part of one payment | any version |
| PPMT | `=PPMT(rate, period, periods, present_value)` | principal part of one payment | any version |
| CUMIPMT | `=CUMIPMT(rate, periods, pv, start, end, type)` | interest paid over several payments | any version |
| FV | `=FV(rate, periods, payment, [present_value], [type])` | future value of savings | any version |
| PV | `=PV(rate, periods, payment, [future_value], [type])` | value today of future payments | any version |
| NPER | `=NPER(rate, payment, present_value)` | how many payments | any version |
| RATE | `=RATE(periods, payment, present_value)` | interest rate per period | any version |
| NPV | `=NPV(rate, value1, …)` | net present value; first value is discounted one period | any version |
| XNPV | `=XNPV(rate, values, dates)` | net present value with real dates | any version |
| IRR | `=IRR(values, [guess])` | return that makes NPV zero | any version |
| XIRR | `=XIRR(values, dates, [guess])` | return with real dates | any version |
| EFFECT | `=EFFECT(nominal_rate, periods)` | effective yearly rate | any version |
| SLN | `=SLN(cost, salvage, life)` | straight-line depreciation | any version |
| DB | `=DB(cost, salvage, life, period)` | declining-balance depreciation | any version |
| IMAGE | `=IMAGE(url, [alt_text])` | picture from a web address | Microsoft 365 |
| STOCKHISTORY | `=STOCKHISTORY(ticker, start, [end])` | past share prices | Microsoft 365 |
| CONVERT | `=CONVERT(number, from, to)` | changes units | any version |
| CELL | `=CELL(info_type, [reference])` | facts about a cell | any version |
| TYPE | `=TYPE(value)` | what kind of value it is | any version |
| N | `=N(value)` | turns a value into a number | any version |
| T | `=T(value)` | returns text, or nothing | any version |
| REGEXTEST | `=REGEXTEST(text, pattern)` | TRUE when text fits a pattern | Microsoft 365 |
| REGEXEXTRACT | `=REGEXEXTRACT(text, pattern)` | pulls out text that fits a pattern | Microsoft 365 |
| REGEXREPLACE | `=REGEXREPLACE(text, pattern, replacement)` | replaces text that fits a pattern | Microsoft 365 |
