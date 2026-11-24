/*
 * Excel Helper engine. Runs entirely in the page: no network, no key, no cost.
 * Generated files embed this; edit chatbot/src/, then run `npm run chatbot`.
 *
 *   ExcelBrain.reply(text, state) -> { md, chips, kind, id }
 *   ExcelBrain.render(md)         -> safe HTML
 */
var ExcelBrain = (function () {
  'use strict';

  var TOPICS = [{"id":"vlookup","title":"VLOOKUP","keys":["vlookup","hlookup","vertical lookup","lookup","lookup function"],"ask":["how do i look up a value","find a price in a table","return a matching value","get data from a table based on an id","why is my vlookup not working"],"next":["xlookup","index-match","na-error","absolute-reference"],"body":"**VLOOKUP** finds a value in the first column of a range and returns something from a column to its right.\n\n```excel\n=VLOOKUP(A2, $D$2:$F$50, 3, FALSE)\n```\n\n1. `A2` is what you are looking for.\n2. `$D$2:$F$50` is the table. Its **first** column must hold the thing you are matching.\n3. `3` means return the third column of that table.\n4. `FALSE` means exact match. Leave it off and Excel can return a wrong answer with no error.\n\nWatch out: VLOOKUP only looks to the right. If your answer is left of the match column, use XLOOKUP or INDEX/MATCH.","ex":"Product IDs are in D2:D50, names in E, prices in F. To get the price for the ID typed in A2:\n\n```excel\n=VLOOKUP(A2, $D$2:$F$50, 3, FALSE)\n```\n\nTo show a friendly message when the ID is missing:\n\n```excel\n=IFNA(VLOOKUP(A2, $D$2:$F$50, 3, FALSE), \"Not found\")\n```","fix":"Work down this list. It covers nearly every broken VLOOKUP:\n\n1. **#N/A:** stray spaces. Try `=VLOOKUP(TRIM(A2), $D$2:$F$50, 3, FALSE)`.\n2. **#N/A on numbers:** one side is stored as text. Select the column, then Data → Text to Columns → Finish.\n3. **Wrong answer, no error:** the fourth argument is missing. Add `FALSE`.\n4. **Right on row 1, broken lower down:** the table slid. Lock it with `$` (F4).\n5. **#REF!:** the column number is bigger than the table is wide."},{"id":"xlookup","title":"XLOOKUP","keys":["xlookup","x lookup","modern lookup","lookup left"],"ask":["what replaced vlookup","look to the left","vlookup vs xlookup","should i use xlookup or vlookup"],"next":["vlookup","lookup-two-criteria","index-match"],"body":"**XLOOKUP** is the modern replacement for VLOOKUP. It looks in any direction, and exact match is the default.\n\n```excel\n=XLOOKUP(A2, $D$2:$D$50, $F$2:$F$50, \"Not found\")\n```\n\n1. What to find.\n2. The column to search.\n3. The column to return. It can be left or right of the search column.\n4. What to show when there is no match.\n\nInserting a column will not break it. The two ranges must be the same length. Needs Microsoft 365 or Excel 2021 and later.","ex":"Return the **last** matching row instead of the first:\n\n```excel\n=XLOOKUP(A2, $D$2:$D$50, $F$2:$F$50, \"Not found\", 0, -1)\n```","fix":"1. **#NAME?:** your version of Excel does not have XLOOKUP. Use INDEX/MATCH.\n2. **#VALUE!:** the search and return ranges are different lengths.\n3. **Not found, but it is there:** spaces or numbers stored as text. Try `TRIM(A2)`."},{"id":"index-match","title":"INDEX and MATCH","keys":["index match","index/match","index and match","match function","index function"],"ask":["lookup that works in every version","find the row number of a value"],"next":["xlookup","vlookup","lookup-two-criteria"],"body":"**INDEX + MATCH** is the flexible lookup that works in every version of Excel.\n\n```excel\n=INDEX($F$2:$F$50, MATCH(A2, $D$2:$D$50, 0))\n```\n\nRead it inside out: **MATCH** finds which row the value is on, and **INDEX** returns what is in that row. The `0` means exact match, so never leave it off. It can return a column to the left, and inserting a column does not break it.","ex":"Two-way lookup, where a row label is in A2 and a column label is in B1:\n\n```excel\n=INDEX($C$5:$H$20, MATCH($A2, $B$5:$B$20, 0), MATCH(B$1, $C$4:$H$4, 0))\n```","fix":"1. The INDEX range and the MATCH range must start on the same row and be the same height.\n2. `#N/A` means MATCH found nothing. Check for spaces and for numbers stored as text."},{"id":"lookup-two-criteria","title":"Look up with two criteria","keys":["two criteria","multiple criteria","two conditions lookup","lookup with two values","match two columns"],"ask":["how do i lookup with two criteria","vlookup with two conditions","match on first and last name","find a value using two columns"],"next":["xlookup","sumifs","index-match"],"body":"Join the criteria together with `&` and match on the joined result:\n\n```excel\n=XLOOKUP(A2&B2, $D$2:$D$50&$E$2:$E$50, $F$2:$F$50, \"Not found\")\n```\n\nIf the answer is a **number** and each pair appears once, SUMIFS is simpler and works in every version:\n\n```excel\n=SUMIFS($F$2:$F$50, $D$2:$D$50, A2, $E$2:$E$50, B2)\n```\n\nSUMIFS returns 0 rather than an error when nothing matches, so check that 0 makes sense for your data."},{"id":"other-sheet","title":"Refer to another sheet","keys":["another sheet","other sheet","different sheet","cross sheet","another worksheet","another workbook","different tab","another tab","sheet reference"],"ask":["how do i pull data from another sheet","reference a cell on a different tab","find a price from another sheet","link two sheets","sum across sheets"],"next":["vlookup","xlookup","named-range"],"body":"Put the sheet name and an exclamation mark in front of the reference:\n\n```excel\n=Prices!B2\n```\n\nIf the sheet name has a space, wrap it in single quotes:\n\n```excel\n='Q1 Sales'!B2\n```\n\nEasiest way: type `=`, click the other tab, click the cell, press Enter. Excel writes it for you. Lookups work the same way:\n\n```excel\n=XLOOKUP(A2, Prices!$A:$A, Prices!$C:$C, \"Not found\")\n```","ex":"Add the same cell across sheets named Jan through Dec:\n\n```excel\n=SUM(Jan:Dec!B2)\n```","fix":"`#REF!` means the sheet or the cell was deleted. Undo right away, or use Data → Edit Links if it points at another workbook."},{"id":"pivot","title":"PivotTables","keys":["pivot","pivottable","pivot table","pivots","summarize data","cross tab","crosstab"],"ask":["how do i make a pivot table","summarize sales by region","total by category","group my data","group dates by month in a pivot table"],"next":["pivot-refresh","slicer","pivot-calculated","excel-table"],"body":"A **PivotTable** turns thousands of rows into a small summary you rearrange by dragging.\n\n1. Click any cell in your data. Every column needs a header and there should be no blank rows.\n2. **Insert → PivotTable → OK**.\n3. Drag a text field (Region) to **Rows**.\n4. Drag a number field (Sales) to **Values**.\n5. Optional: drag another field to **Columns** or **Filters**.\n\nTip: press **Ctrl+T** on your data first, so new rows are included when you refresh.","ex":"Average sale by region and month: Region in **Rows**, Date in **Columns** (right-click → Group → Months), Sales in **Values**, then click the Values field → **Value Field Settings → Average**.","fix":"1. **Numbers show as Count, not Sum:** the column contains text or blanks. Fix the data, then Value Field Settings → Sum.\n2. **New rows missing:** right-click → Refresh, or check Change Data Source.\n3. **\"Field name is not valid\":** a header cell is blank.","mac":"Same steps: Insert → PivotTable. Refresh is right-click → Refresh."},{"id":"pivot-refresh","title":"Refresh a PivotTable","keys":["refresh pivot","update pivot","pivot not updating","change data source"],"ask":["why is my pivot table not updating","new rows do not show in my pivot table","my pivot table is out of date"],"next":["pivot","excel-table"],"body":"PivotTables do not update on their own. Right-click the pivot → **Refresh**, or press **Alt+F5**. **Ctrl+Alt+F5** refreshes everything in the workbook.\n\nIf new **rows** are missing even after a refresh, the source range is fixed. Go to **PivotTable Analyze → Change Data Source**. To stop it happening again, turn the source into a Table with **Ctrl+T**."},{"id":"pivot-calculated","title":"PivotTable calculations and percentages","keys":["calculated field","pivot percent","show values as","percent of total in pivot","pivot percentage"],"ask":["how do i show percentages in a pivot table","add a calculation to a pivot table"],"next":["pivot","percent-total"],"body":"To show a percentage: right-click a value → **Show Values As → % of Grand Total** (or % of Column Total, Running Total, Difference From).\n\nTo add your own formula: **PivotTable Analyze → Fields, Items & Sets → Calculated Field**. For margin, the formula would be:\n\n```excel\n=Profit/Sales\n```\n\nA calculated field works on the **sums**, so it gives total profit over total sales, not the average of each row's margin."},{"id":"slicer","title":"Slicers","keys":["slicer","slicers","timeline","filter buttons","interactive filter"],"ask":["add filter buttons","make an interactive dashboard"],"next":["pivot","dashboard","sort-filter"],"body":"A **slicer** is a set of clickable filter buttons for a Table or PivotTable.\n\n1. Click inside the Table or PivotTable.\n2. **Insert → Slicer** and tick the fields you want.\n3. Click a button to filter. Ctrl+click picks several.\n\nOne slicer can drive several PivotTables that share the same source: right-click it → **Report Connections**. For dates, use **Insert → Timeline** (PivotTables only)."},{"id":"if","title":"IF and IFS","keys":["if","ifs","if statement","if function","if formula","nested if","if then","if else","conditional formula"],"ask":["how do i write an if statement","pass or fail formula","letter grade formula","if a cell is greater than","if vs ifs","if cell is blank"],"next":["and-or","iferror","sumifs"],"body":"**IF** returns one thing when a test is true and another when it is false.\n\n```excel\n=IF(B2>=70, \"Pass\", \"Fail\")\n```\n\nFor several outcomes, use **IFS** instead of nesting:\n\n```excel\n=IFS(B2>=90,\"A\", B2>=80,\"B\", B2>=70,\"C\", B2>=60,\"D\", TRUE,\"F\")\n```\n\nOrder matters. IFS stops at the first true test, so go from strictest to loosest. The final `TRUE` catches everything left over. Text must be in quotes; numbers must not.","ex":"Leave a cell blank when there is nothing to calculate yet:\n\n```excel\n=IF(B2=\"\", \"\", B2*C2)\n```","fix":"1. **#NAME?:** text without quotes. Write `\"Pass\"`, not `Pass`.\n2. **Always the same answer:** the number is stored as text, or you compared to `\"70\"` instead of `70`.\n3. **Shows FALSE:** you left out the third part.\n4. **Wrong letter grade:** the tests are in loosest-first order."},{"id":"and-or","title":"AND, OR and NOT","keys":["and or","and function","or function","not function","multiple conditions","two conditions","both conditions","if and","if or"],"ask":["if two things are true","if either is true","check more than one condition","what about two conditions","between two numbers"],"next":["if","sumifs","countifs"],"body":"Put **AND** or **OR** inside an IF to test more than one thing.\n\n```excel\n=IF(AND(B2>=70, C2=\"Yes\"), \"Eligible\", \"No\")\n```\n\n```excel\n=IF(OR(B2=\"West\", B2=\"South\"), \"Region 1\", \"Region 2\")\n```\n\n`AND` needs every test true, and `OR` needs at least one. For a number between two values, write both tests:\n\n```excel\n=AND(A2>=70, A2<90)\n```\n\n`70<=A2<90` looks right, but Excel does not evaluate it that way."},{"id":"sumifs","title":"SUMIF and SUMIFS","keys":["sumif","sumifs","sum if","sum ifs","conditional sum","sum based on","sum only","sum where","add up if","total for","total by"],"ask":["add up sales for only the west region","sum one category","total for one person","sum if greater than","add only certain rows","how do i total by month","sum with multiple conditions"],"next":["countifs","averageif","pivot","absolute-reference"],"body":"**SUMIF** adds what meets one condition. **SUMIFS** handles several.\n\n```excel\n=SUMIF($A$2:$A$100, \"West\", $C$2:$C$100)\n```\n\n```excel\n=SUMIFS($C$2:$C$100, $A$2:$A$100, \"West\", $B$2:$B$100, \">1000\")\n```\n\nWatch the order, because it flips: SUMIF puts the numbers to add **last**, SUMIFS puts them **first**. Put an operator in quotes: `\">1000\"`. To compare with a cell, join it: `\">\"&E1`.","ex":"Total for one month, with dates in column B:\n\n```excel\n=SUMIFS($C$2:$C$100, $B$2:$B$100, \">=\"&DATE(2026,11,1), $B$2:$B$100, \"<\"&DATE(2026,12,1))\n```","fix":"1. **0:** the criteria does not match. Look for spaces, or numbers stored as text.\n2. **#VALUE!:** the ranges are different sizes.\n3. **Wrong total:** you used SUMIF order inside SUMIFS."},{"id":"countifs","title":"COUNTIF and COUNTIFS","keys":["countif","countifs","count if","count how many","count cells","count times","count a word","tally"],"ask":["count the number of times a name appears","how many cells say yes","count cells greater than","how many of each","count text"],"next":["sumifs","unique-count","duplicates"],"body":"**COUNTIF** counts cells meeting one condition. **COUNTIFS** handles several.\n\n```excel\n=COUNTIF($A$2:$A$100, \"West\")\n```\n\n```excel\n=COUNTIFS($A$2:$A$100, \"West\", $B$2:$B$100, \">1000\")\n```\n\n- `=COUNTA(A2:A100)` counts cells that are not empty\n- `=COUNT(A2:A100)` counts numbers only\n- `=COUNTBLANK(A2:A100)` counts empty cells\n- `=COUNTIF(A2:A100, \"*west*\")` counts anything containing \"west\"","ex":"Flag every row that is a repeat:\n\n```excel\n=IF(COUNTIF($A$2:$A$100, A2)>1, \"Duplicate\", \"\")\n```"},{"id":"averageif","title":"AVERAGEIF","keys":["averageif","averageifs","average if","conditional average","average only"],"ask":["average only the west region","average excluding zeros","average ignoring zeros","average without blanks"],"next":["sumifs","average","weighted-average"],"body":"**AVERAGEIF** averages only the rows that match.\n\n```excel\n=AVERAGEIF($A$2:$A$100, \"West\", $C$2:$C$100)\n```\n\nAverage while ignoring zeros:\n\n```excel\n=AVERAGEIF(C2:C100, \"<>0\")\n```\n\nSeveral conditions, with the numbers first:\n\n```excel\n=AVERAGEIFS($C$2:$C$100, $A$2:$A$100, \"West\", $B$2:$B$100, \">=2025\")\n```\n\n`#DIV/0!` here means no row matched."},{"id":"maxifs","title":"MAXIFS and MINIFS","keys":["maxifs","minifs","max if","min if","highest where","largest for","lowest for"],"ask":["highest sale in the west region","largest value for one category","latest date for a customer"],"next":["sumifs","large-small","averageif"],"body":"```excel\n=MAXIFS($C$2:$C$100, $A$2:$A$100, \"West\")\n```\n\n```excel\n=MINIFS($C$2:$C$100, $A$2:$A$100, \"West\")\n```\n\nThe numbers come first, then pairs of range and condition. It works on dates too, so MAXIFS on a date column gives the latest date. Needs Excel 2019 or later."},{"id":"average","title":"Sum, average and the basics","keys":["sum","average","mean","median","mode","autosum","add up","add a column","total","basic formula","basic formulas","write a formula","make a formula","statistics","max","min"],"ask":["whats the average of a column","how do i add a column of numbers","total a column","how do i write a formula","find the highest number","how do i subtract","multiply two cells"],"next":["sumifs","large-small","weighted-average","percent-change"],"body":"```excel\n=SUM(A2:A100)\n```\n\n- `=AVERAGE(A2:A100)` mean\n- `=MEDIAN(A2:A100)` middle value\n- `=MIN(A2:A100)` and `=MAX(A2:A100)`\n- `=COUNT(A2:A100)` how many numbers\n- `=A2-B2`, `=A2*B2`, `=A2/B2` for subtract, multiply, divide\n\n**Alt+=** writes the SUM for you. Use MEDIAN when a few extreme values would distort the mean, such as home prices. AVERAGE skips blanks and text but counts zeros.","mac":"AutoSum is **Cmd+Shift+T**."},{"id":"large-small","title":"Largest, smallest and rank","keys":["second largest","second highest","largest","smallest","top 3","top 5","top 10","large","small","rank","ranking","nth"],"ask":["how to find the second largest","how do i use rank","rank students by score","top five values","bottom three"],"next":["average","sort-filter","maxifs"],"body":"```excel\n=LARGE($A$2:$A$100, 2)\n```\n\nThat is the second largest. `SMALL` works the same from the bottom. To rank each row, with 1 as the highest:\n\n```excel\n=RANK.EQ(A2, $A$2:$A$100)\n```\n\nLock the range with `$` before filling down, or every row ranks against a different list. Ties get the same rank. For a live top 5 list in Microsoft 365:\n\n```excel\n=TAKE(SORT(A2:A100, 1, -1), 5)\n```"},{"id":"weighted-average","title":"Weighted average and GPA","keys":["weighted average","weighted mean","gpa","grade point average","sumproduct","weighted grade","course grade"],"ask":["how do i calculate my gpa","calculate my final grade","average with weights","assignments worth different percentages"],"next":["average","sumproduct","if"],"body":"Multiply each value by its weight, add those up, then divide by the total weight.\n\n```excel\n=SUMPRODUCT(B2:B10, C2:C10) / SUM(C2:C10)\n```\n\n**For GPA:** column B is the grade points (A = 4, B = 3), column C is the credits.\n**For a course grade:** column B is the score, column C is the weight. If the weights already add to 100%, the division does not change anything, but it protects you when only some grades are in.\n\nA plain AVERAGE is wrong here, because it treats a 1-credit class like a 4-credit class."},{"id":"sumproduct","title":"SUMPRODUCT","keys":["sumproduct","sum product","multiply and add","multiply two columns and sum"],"ask":["multiply two columns and add the results","total revenue from price and quantity"],"next":["weighted-average","sumifs"],"body":"**SUMPRODUCT** multiplies columns row by row and adds the results.\n\n```excel\n=SUMPRODUCT(B2:B100, C2:C100)\n```\n\nIf B is price and C is quantity, that is total revenue without a helper column. Both ranges must be the same size, or you get `#VALUE!`. It can also apply conditions:\n\n```excel\n=SUMPRODUCT((A2:A100=\"West\")*(B2:B100)*(C2:C100))\n```"},{"id":"percent-change","title":"Percent change","keys":["percent change","percentage change","percent increase","percentage increase","percent decrease","growth rate","percent difference","growth","yoy","year over year"],"ask":["how to calculate percent change","how do i calculate percent increase","how much did sales grow"],"next":["percent-total","percent-of","div0-error"],"body":"New minus old, divided by **old**:\n\n```excel\n=(B2-A2)/A2\n```\n\nThen format as a percentage (**Ctrl+Shift+%**). Do not multiply by 100 as well, or 12% becomes 1200%.\n\nTwo traps: dividing by the new value instead of the old one, and an old value of zero, which gives `#DIV/0!`:\n\n```excel\n=IF(A2=0, \"n/a\", (B2-A2)/A2)\n```","ex":"Sales went from 400 to 500. `=(500-400)/400` is 0.25, which shows as 25% once formatted. Going back down from 500 to 400 is -20%, not -25%, because the starting point changed."},{"id":"percent-total","title":"Percent of total","keys":["percent of total","percentage of total","share of total","proportion","percent of whole"],"ask":["what percent of the total is each row","each items share","show each as a percentage"],"next":["percent-change","absolute-reference","pivot-calculated"],"body":"```excel\n=B2/SUM($B$2:$B$10)\n```\n\nThe `$` signs keep the total fixed while B2 moves as you fill down. Format as a percentage with **Ctrl+Shift+%**. The results should add to 100%, which is a quick way to check it."},{"id":"percent-of","title":"Percentages, discounts and tax","keys":["percentage","percent","discount","sales tax","tax","markup","tip","percent off","add a percentage","subtract a percentage"],"ask":["how do i calculate a percentage","take 20 percent off","add sales tax","increase a price by ten percent","how do i do percentages"],"next":["percent-change","percent-total","absolute-reference"],"body":"- **Part of a whole:** `=B2/C2`, formatted as a percentage\n- **20% of a number:** `=B2*20%`\n- **Take 20% off:** `=B2*(1-20%)`\n- **Add 8.265% tax:** `=B2*(1+8.265%)`\n\nBetter: keep the rate in its own cell and lock it, so you can change it once.\n\n```excel\n=B2*(1+$E$1)\n```"},{"id":"absolute-reference","title":"Absolute references and the $ sign","keys":["absolute reference","absolute","dollar sign","f4","relative reference","mixed reference","lock a cell","anchor","lock cell reference","cell reference"],"ask":["how do i stop a cell from changing when i drag","formula changes when i copy it","keep a cell fixed in a formula","what does the dollar sign mean","what is the difference between relative and absolute"],"next":["fill-handle","percent-total","named-range"],"body":"The `$` locks part of a reference so it does not move when you copy the formula. Click the reference in the formula and press **F4** to cycle through these:\n\n- `A1` both parts move\n- `$A$1` nothing moves\n- `A$1` row locked\n- `$A1` column locked\n\nClassic use, with a tax rate in E1:\n\n```excel\n=B2*$E$1\n```\n\nWithout the `$`, row 3 multiplies by E2, which is empty, and you get zero.","ex":"A multiplication table, with numbers down column A and across row 1. Type this in B2, then fill right and down:\n\n```excel\n=$A2*B$1\n```","mac":"Press **Cmd+T** (or **Fn+F4**) while the cursor is in the reference."},{"id":"fill-handle","title":"Fill handle and copying formulas","keys":["fill handle","fill down","autofill","drag formula","copy formula down","fill series","copy a formula"],"ask":["how do i apply a formula to the whole column","copy a formula to all rows","fill numbers 1 to 100","drag a formula down"],"next":["absolute-reference","flash-fill","excel-table"],"body":"Drag the small square at the bottom-right of the cell, or **double-click it** to fill to the end of the data beside it. **Ctrl+D** fills down a selection and **Ctrl+R** fills right.\n\nFor a pattern (1, 2, 3 or Jan, Feb), type the first two, select both, then drag. For a list of 100 numbers in Microsoft 365:\n\n```excel\n=SEQUENCE(100)\n```","fix":"**Every row shows the same number:** calculation is set to manual. Formulas → Calculation Options → **Automatic**.\n**Results drift:** lock the fixed cells with `$`."},{"id":"iferror","title":"IFERROR and hiding errors","keys":["iferror","ifna","hide errors","replace error","suppress error","error handling"],"ask":["how do i hide errors","show blank instead of error","replace n/a with text"],"next":["na-error","div0-error","errors"],"body":"**IFERROR** replaces any error with something readable.\n\n```excel\n=IFERROR(A2/B2, \"n/a\")\n```\n\nFor lookups, prefer **IFNA**. It only catches \"not found\" and lets real mistakes such as `#REF!` show:\n\n```excel\n=IFNA(VLOOKUP(A2, $D$2:$F$50, 3, FALSE), \"Not found\")\n```\n\nWrap a formula only after you know **why** it errors. IFERROR hides the cause as well as the symptom."},{"id":"errors","title":"Excel error messages","keys":["error","errors","error message","error messages","excel error","error codes","what does this error mean"],"ask":["what do the errors mean","my formula has an error","list of excel errors"],"next":["na-error","value-error","ref-error","name-error"],"body":"- `#N/A` a lookup found nothing\n- `#VALUE!` wrong type, usually text where a number belongs\n- `#REF!` the formula points at something deleted\n- `#NAME?` misspelled function, or text missing its quotes\n- `#DIV/0!` dividing by zero or an empty cell\n- `#NUM!` a number that is impossible or too large\n- `#SPILL!` something is in the way of a result that needs several cells\n- `#CALC!` an array came back empty, often from FILTER\n- `#####` not an error; the column is too narrow\n\nPaste your formula here and I will check it for you."},{"id":"na-error","title":"#N/A","keys":["#n/a","n/a error","na error","not available","lookup returns na"],"ask":["why do i get #n/a","vlookup says n/a","value not found but it is there"],"next":["vlookup","numbers-as-text","iferror"],"body":"`#N/A` means a lookup could not find your value. In order of likelihood:\n\n1. **Stray spaces.** Wrap the value: `TRIM(A2)`.\n2. **Numbers stored as text** on one side. Text sits on the left of the cell, real numbers on the right.\n3. **Missing exact match.** End VLOOKUP with `FALSE`, and MATCH with `0`.\n4. **The table slid** because it was not locked with `$`.\n5. **It really is not there.** Show a message instead:\n\n```excel\n=IFNA(VLOOKUP(A2, $D$2:$F$50, 3, FALSE), \"Not found\")\n```\n\nTo test two cells that look identical, try `=A2=D2` and `=LEN(A2)=LEN(D2)`."},{"id":"value-error","title":"#VALUE!","keys":["#value!","#value","value error"],"ask":["what does value error mean","why do i get #value"],"next":["numbers-as-text","errors","date"],"body":"`#VALUE!` means the formula got the wrong kind of thing, usually text where a number belongs.\n\n1. Look for a cell that **looks** like a number but is text, such as `12 lbs` or a number with a space.\n2. `=A1+B1` fails on text. `=SUM(A1:B1)` skips it.\n3. In SUMIFS, COUNTIFS and SUMPRODUCT, it means the ranges are different sizes.\n4. Date math fails when the date is really text. Convert it with Data → Text to Columns → Date."},{"id":"ref-error","title":"#REF!","keys":["#ref!","#ref","ref error","reference error","deleted cell"],"ask":["what does #ref mean","why do i get a ref error"],"next":["errors","vlookup","other-sheet"],"body":"`#REF!` means the formula points at something that no longer exists.\n\n1. You deleted a row, column or sheet it used. Press **Ctrl+Z** right away, since the original address cannot be recovered later.\n2. A VLOOKUP column number is larger than the table is wide.\n3. You copied a formula somewhere its relative references fall off the sheet.\n\nTo find them all: **Ctrl+F**, search for `#REF!`, with Look in set to **Formulas**."},{"id":"name-error","title":"#NAME?","keys":["#name?","#name","name error","invalid name"],"ask":["what does name error mean","why does it say #name"],"next":["errors","if","named-range"],"body":"`#NAME?` means Excel does not recognize a word in the formula.\n\n1. A misspelled function: `VLOKUP`, `SUMIFF`.\n2. Text without quotes: `=IF(A2=Yes, ...)` should be `=IF(A2=\"Yes\", ...)`.\n3. A named range that does not exist.\n4. A function your version does not have, such as XLOOKUP in Excel 2016.\n5. Curly quotes pasted from Word or a website. Retype them as straight quotes."},{"id":"div0-error","title":"#DIV/0!","keys":["#div/0!","#div/0","div0","divide by zero","division by zero"],"ask":["why do i get div 0","how do i stop divide by zero errors"],"next":["iferror","percent-change","average"],"body":"`#DIV/0!` means the bottom of a division is zero or empty. Test for it:\n\n```excel\n=IF(B2=0, \"\", A2/B2)\n```\n\nAVERAGE, AVERAGEIF and similar functions show it when there is nothing to average."},{"id":"spill-error","title":"#SPILL!","keys":["#spill!","#spill","spill error","spill","spilled","dynamic array","dynamic arrays","array formula","array formulas"],"ask":["why do i get a spill error","what is an array formula","what is spilling","what does control shift enter do"],"next":["filter-function","unique-list","errors"],"body":"In Microsoft 365, one formula can return many cells. That is called **spilling**. `#SPILL!` means something is in the way.\n\n1. Click the cell. The dashed outline shows where the result needs to go.\n2. Clear anything inside that outline, including a stray space.\n3. Unmerge any merged cells there.\n4. Spilling does not work inside a Table. Move the formula outside it.\n\nRefer to a whole spilled result with `#`, as in `=SUM(E2#)`. In Excel 2019 and earlier, array formulas need **Ctrl+Shift+Enter**."},{"id":"num-error","title":"#NUM! and #CALC!","keys":["#num!","#num","num error","#calc!","#calc","calc error","#null!"],"ask":["what does num error mean","what does calc error mean"],"next":["errors","filter-function","loan"],"body":"**`#NUM!`** means the math is impossible: a square root of a negative, an IRR that cannot settle, or DATEDIF with the dates reversed.\n\n**`#CALC!`** usually means FILTER found nothing. Give it a fallback:\n\n```excel\n=FILTER(A2:C100, B2:B100=\"West\", \"None found\")\n```\n\n**`#NULL!`** means a space where a comma or colon belongs, such as `SUM(A1 A5)`."},{"id":"hash-width","title":"Column shows #####","keys":["#####","####","hashes","pound signs","hashtags","number signs","column too narrow","column width","autofit"],"ask":["why does my cell show hashtags","why does it show pound signs","make the column fit the text","how do i widen a column"],"next":["number-format","date","wrap-text"],"body":"`#####` is not an error. The column is too narrow for the number or date. **Double-click** the border on the right of the column letter to AutoFit.\n\nIf it stays after widening, the cell holds a negative date or time, usually from subtracting a later date from an earlier one.\n\nTo AutoFit every column: **Ctrl+A**, then double-click any column border."},{"id":"formula-as-text","title":"Formula shows as text","keys":["formula showing as text","formula not calculating","formula not working","shows formula instead of result","show formulas","formula shows text","formula wont calculate"],"ask":["why is my formula showing as text instead of the result","formula does not calculate","i see the formula not the answer","my formula is not updating","how do i show all formulas"],"next":["numbers-as-text","errors","fill-handle"],"body":"1. **The cell is formatted as Text.** Set Home → Number Format → **General**, then press **F2** and **Enter**.\n2. **Show Formulas is on.** Press **Ctrl+`** (the key left of 1) to switch it off.\n3. **There is a space or an apostrophe before the `=`.** Delete it.\n4. **It shows an old result:** Formulas → Calculation Options → **Automatic**.","mac":"Edit a cell with **Control+U**, and toggle Show Formulas with **Control+`**."},{"id":"numbers-as-text","title":"Numbers stored as text","keys":["numbers stored as text","number stored as text","text to number","convert text to number","green triangle","numbers wont sum","sum is zero"],"ask":["my sum returns zero","numbers will not add up","convert text to numbers","green triangle in the corner of a cell","my numbers will not sort"],"next":["value-error","na-error","text-cleanup"],"body":"The sign: the number hugs the **left** of the cell, or there is a green triangle in the corner.\n\n- **Fast:** select the cells → click the warning icon → **Convert to Number**.\n- **Whole column:** Data → Text to Columns → **Finish**.\n- **By formula:**\n\n```excel\n=VALUE(TRIM(A2))\n```\n\nIf it still fails, the data has non-breaking spaces from a website:\n\n```excel\n=VALUE(SUBSTITUTE(A2, CHAR(160), \"\"))\n```"},{"id":"leading-zeros","title":"Leading zeros","keys":["leading zero","leading zeros","zip code","zip codes","phone number format","keep zeros"],"ask":["excel deletes my zeros","zip codes lose the zero","how do i keep the zero in front","how to format phone numbers"],"next":["number-format","numbers-as-text"],"body":"Excel drops leading zeros because it treats the entry as a number.\n\n- **Before typing:** format the cells as **Text**, or start with an apostrophe: `'08901`.\n- **Already lost, ZIP codes:** Ctrl+1 → Special → **Zip Code**.\n- **By formula, five digits:**\n\n```excel\n=TEXT(A2, \"00000\")\n```\n\nWhen importing a CSV, use Data → From Text/CSV → Transform Data and set the column type to **Text**."},{"id":"conditional-formatting","title":"Conditional formatting","keys":["conditional formatting","conditional format","highlight cells","highlight a row","color cells","color scale","data bar","data bars","icon sets","change color based on value"],"ask":["change the color of a cell based on its value","highlight overdue dates","turn cell red if negative","color code my spreadsheet","highlight the entire row"],"next":["duplicates","if","absolute-reference"],"body":"**Home → Conditional Formatting**:\n\n- **Highlight Cells Rules:** greater than, text contains, duplicates\n- **Top/Bottom Rules:** top 10, above average\n- **Data Bars / Color Scales:** quick visual comparison\n\nTo color a **whole row**, select the rows from row 2, then New Rule → **Use a formula**:\n\n```excel\n=$C2<TODAY()\n```\n\nWrite the formula for the first row only. `$C` locks the column and the plain `2` lets the row move.","ex":"Highlight the whole row when status in column D is Late:\n\n```excel\n=$D2=\"Late\"\n```","fix":"**The wrong rows light up:** the formula's row number does not match the first row you selected, or the `$` is missing. Check it in Conditional Formatting → Manage Rules."},{"id":"chart","title":"Charts","keys":["chart","charts","graph","graphs","bar chart","line chart","pie chart","column chart","visualize","plot","combo chart","scatter plot"],"ask":["how do i make a chart","make a graph","which chart should i use","add a chart to my sheet","show data over time"],"next":["trendline","chart-cleanup","histogram","sparklines"],"body":"Select the data **with its headers** → **Insert** → pick a chart. **Alt+F1** makes one instantly.\n\n- **Column / Bar:** comparing categories (bar when labels are long)\n- **Line:** change over time\n- **Scatter:** relationship between two numbers\n- **Pie:** parts of one whole, with five slices or fewer\n- **Combo:** two different scales, such as revenue with a margin line\n\nTitle it with the finding. \"Sales fell 12% in Q3\" beats \"Q3 Sales\".","fix":"1. **Years became a data line:** right-click → Select Data, remove that series, and set it as the axis labels.\n2. **Rows and columns swapped:** Chart Design → **Switch Row/Column**."},{"id":"chart-cleanup","title":"Chart titles, axes and labels","keys":["chart title","axis title","axis titles","axis label","data labels","legend","gridlines","secondary axis","change axis","axis scale"],"ask":["how do i add axis titles","label my chart","change the axis scale","add a second axis","rename the chart title"],"next":["chart","trendline"],"body":"Click the chart, then the **+** button beside it: tick Axis Titles, Data Labels, Legend or Trendline.\n\n- **Change the scale:** double-click the axis → set Minimum and Maximum. Start bars at zero.\n- **Second axis:** right-click a series → Format Data Series → **Secondary Axis**.\n- **Title linked to a cell:** click the title, type `=`, click the cell, press Enter.","mac":"There is no + button. Use **Chart Design → Add Chart Element**."},{"id":"trendline","title":"Trendline and regression","keys":["trendline","trend line","regression","line of best fit","slope","r squared","linear regression","forecast","prediction","predict"],"ask":["how do i add a trendline","line of best fit","how to run a regression","show the equation on a chart","forecast next month"],"next":["correlation","chart","analysis-toolpak"],"body":"On a scatter or line chart: click a data point → right-click → **Add Trendline**. Tick **Display Equation** and **Display R-squared**.\n\nWithout a chart:\n\n```excel\n=SLOPE(known_ys, known_xs)\n```\n\n- `=INTERCEPT(known_ys, known_xs)`\n- `=RSQ(known_ys, known_xs)` how well the line fits, from 0 to 1\n- `=FORECAST.LINEAR(next_x, known_ys, known_xs)` predicts a value\n\nThe y values come first. A good fit does not mean one thing causes the other."},{"id":"correlation","title":"Correlation","keys":["correlation","correl","correlate","relationship between two variables"],"ask":["are two columns related","how do i calculate correlation"],"next":["trendline","chart","analysis-toolpak"],"body":"```excel\n=CORREL(A2:A100, B2:B100)\n```\n\nThe result runs from -1 to 1. Near 1 means they rise together, near -1 means one falls as the other rises, near 0 means no straight-line link. Always look at a scatter chart too, because one outlier can create or hide a correlation. Correlation does not show cause."},{"id":"histogram","title":"Histogram","keys":["histogram","frequency distribution","frequency","bins","bell curve","distribution"],"ask":["how do i make a histogram","group numbers into ranges","frequency table"],"next":["chart","stdev","analysis-toolpak"],"body":"Select the numbers → **Insert → Statistic Chart → Histogram**. To set the groups, double-click the horizontal axis and change **Bin width**.\n\nFor a frequency table, list the upper limit of each group in D2:D6, then:\n\n```excel\n=FREQUENCY(A2:A100, D2:D6)\n```\n\nIn Microsoft 365 it fills down by itself and adds one extra row for everything above the last group."},{"id":"stdev","title":"Standard deviation","keys":["standard deviation","stdev","stdev.s","stdev.p","variance","var","spread","std dev"],"ask":["how do i calculate standard deviation","sample or population standard deviation","measure the spread"],"next":["average","histogram","correlation"],"body":"```excel\n=STDEV.S(A2:A100)\n```\n\nUse **STDEV.S** for a sample, which is nearly always what you have. Use **STDEV.P** only when the data is the entire population. Variance works the same way with `VAR.S` and `VAR.P`."},{"id":"analysis-toolpak","title":"Analysis ToolPak","keys":["analysis toolpak","data analysis","toolpak","t-test","anova","descriptive statistics","add-in","add in","add-ins"],"ask":["where is the data analysis button","turn on the toolpak","run descriptive statistics","how do i do a t test"],"next":["trendline","histogram","stdev"],"body":"**Windows:** File → Options → Add-ins → Manage: Excel Add-ins → **Go** → tick **Analysis ToolPak**.\n**Mac:** Tools → Excel Add-ins → tick **Analysis ToolPak**.\n\nThen use **Data → Data Analysis** for descriptive statistics, histograms, regression, t-tests and ANOVA. Its results do not update when the data changes, so run it again."},{"id":"goal-seek","title":"Goal Seek","keys":["goal seek","goalseek","break even","breakeven","work backwards","solve for"],"ask":["what number do i need to get a result","what grade do i need on the final","find the break even point","how do i use goal seek"],"next":["what-if","solver","loan"],"body":"**Goal Seek** works backwards: you name the answer, Excel finds the input.\n\n1. Set up a formula that depends on one input cell.\n2. **Data → What-If Analysis → Goal Seek**.\n3. **Set cell:** the formula. **To value:** your target. **By changing cell:** the input.","ex":"Your course average is in B5 and depends on the final exam score in B4. Set cell `B5`, to value `90`, by changing cell `B4`. Excel tells you the score you need.\n\nIt changes one input only. For several inputs or limits, use Solver."},{"id":"what-if","title":"What-if analysis and data tables","keys":["what if","what-if","what if analysis","scenario","scenarios","scenario manager","data table","sensitivity","sensitivity analysis","two variable"],"ask":["compare several scenarios","best case worst case","how does the result change if","make a sensitivity table"],"next":["goal-seek","loan","solver"],"body":"**Data → What-If Analysis** has three tools:\n\n- **Goal Seek:** one target, one input\n- **Scenario Manager:** saved sets of inputs such as Best, Expected and Worst\n- **Data Table:** a grid of results for one or two changing inputs\n\nFor a two-input Data Table: put your formula in the **top-left corner** of the grid, one set of inputs across the top, the other down the side. Select the whole grid → Data Table → choose the row and column input cells. Those input cells must be on the same sheet."},{"id":"solver","title":"Solver","keys":["solver","optimization","optimize","maximize","minimize","constraints","linear programming"],"ask":["maximize profit with limits","find the best mix","optimize with constraints"],"next":["goal-seek","what-if"],"body":"**Solver** finds the best value of a formula by changing several cells within limits you set.\n\nTurn it on: File → Options → Add-ins → Go → **Solver Add-in** (Mac: Tools → Excel Add-ins). Then Data → **Solver**:\n\n1. **Objective:** the formula cell. Choose Max, Min or a value.\n2. **By changing:** the decision cells.\n3. **Constraints:** limits, such as `B2:B5 <= D2:D5` or whole numbers only (`int`).\n4. Choose **Simplex LP** if everything is linear, otherwise GRG Nonlinear."},{"id":"loan","title":"Loan payments and time value of money","keys":["loan","loan payment","mortgage","pmt","car payment","interest","compound interest","future value","present value","fv","pv","npv","irr","amortization","investment","savings","annuity"],"ask":["monthly loan payment","how much is my car payment","calculate mortgage","how do i calculate compound interest","how much will my savings grow","net present value"],"next":["goal-seek","what-if","percent-of"],"body":"Monthly payment on $20,000 at 6% for 5 years:\n\n```excel\n=PMT(6%/12, 5*12, -20000)\n```\n\n- `=FV(6%/12, 10*12, -200)` value of saving $200 a month for 10 years\n- `=NPV(8%, B3:B7)+B2` with the cost in B2 as a **negative** number\n- `=IRR(B2:B7)` with the cost first, as a negative\n\nTwo traps: match the rate to the period (divide a yearly rate by 12 and multiply the years by 12), and leave the time-zero cost **outside** NPV, because NPV discounts its first value by a full period."},{"id":"excel-table","title":"Tables","keys":["excel table","format as table","ctrl+t","structured reference","structured references","banded rows","total row","convert to table","create a table"],"ask":["how do i make a table","turn my data into a table","why should i use tables","auto expand range"],"next":["sort-filter","pivot","slicer","data-validation"],"body":"Press **Ctrl+T** to turn a range into a **Table**. You get:\n\n- formulas that fill themselves into new rows\n- charts and PivotTables whose source grows with the data\n- filter buttons and banded rows\n- readable formulas:\n\n```excel\n=SUM(Sales[Revenue])\n```\n\nName it under **Table Design → Table Name**. Toggle a total row with **Ctrl+Shift+T**.","mac":"**Cmd+T** or **Control+T**."},{"id":"sort-filter","title":"Sort and filter","keys":["sort","filter","autofilter","sort by","alphabetical","alphabetize","filter data","sort by multiple columns","sort by date","sort a to z"],"ask":["how do i sort alphabetically","show only certain rows","sort by two columns","sort largest to smallest","filter by color"],"next":["filter-function","excel-table","remove-blanks"],"body":"Click **one cell** inside the data, then **Ctrl+Shift+L** for filter buttons. To sort by several columns: **Data → Sort → Add Level**, most important first.\n\nNever select a single column and sort it alone. The rest of the row does not follow, and the data is scrambled. If Excel asks, choose **Expand the selection**. Turning the range into a Table (Ctrl+T) removes the risk.","fix":"1. **Dates sort wrong:** they are text. Data → Text to Columns → Date.\n2. **Header got sorted:** tick **My data has headers**.\n3. **Stops at a blank row:** Excel treats it as the end. Delete blank rows first.","mac":"**Cmd+Shift+F** toggles filters."},{"id":"filter-function","title":"FILTER, SORT and other live lists","keys":["filter function","filter formula","sort function","sortby","live filter","extract rows","return multiple matches","return all matches"],"ask":["return all rows that match","pull every row for one person","vlookup that returns multiple results","list that updates by itself"],"next":["unique-list","spill-error","sort-filter"],"body":"Microsoft 365 and Excel 2021 can return every matching row with one formula:\n\n```excel\n=FILTER(A2:D100, B2:B100=\"West\", \"None found\")\n```\n\nTwo conditions, both required (use `+` instead of `*` for either):\n\n```excel\n=FILTER(A2:D100, (B2:B100=\"West\")*(C2:C100>1000), \"None found\")\n```\n\nSort the result, largest first by column 3:\n\n```excel\n=SORT(FILTER(A2:D100, B2:B100=\"West\"), 3, -1)\n```"},{"id":"unique-list","title":"Unique lists","keys":["unique","unique list","unique values","distinct","distinct values","list without duplicates"],"ask":["get a list of unique values","list each name once","remove repeats with a formula"],"next":["unique-count","duplicates","data-validation"],"body":"```excel\n=UNIQUE(A2:A100)\n```\n\nSorted, with blanks left out:\n\n```excel\n=SORT(UNIQUE(FILTER(A2:A100, A2:A100<>\"\")))\n```\n\nNeeds Microsoft 365 or Excel 2021. In older versions: Data → Advanced → **Unique records only**."},{"id":"unique-count","title":"Count unique values","keys":["count unique","unique count","distinct count","how many unique","count distinct"],"ask":["how many unique values","how many different customers","count each value once"],"next":["unique-list","countifs","pivot"],"body":"```excel\n=COUNTA(UNIQUE(A2:A100))\n```\n\nWorks in every version, as long as the range has no blanks:\n\n```excel\n=SUMPRODUCT(1/COUNTIF(A2:A100, A2:A100))\n```\n\nIn a PivotTable: tick **Add this data to the Data Model** when you create it, then Value Field Settings → **Distinct Count**."},{"id":"duplicates","title":"Duplicates","keys":["duplicate","duplicates","remove duplicates","duplicate rows","dedupe","find duplicates","repeated values"],"ask":["how do i remove duplicates","highlight duplicate values","find repeats","delete repeated rows"],"next":["unique-list","countifs","conditional-formatting"],"body":"- **Delete them:** Data → **Remove Duplicates** → tick the columns that define a duplicate. This removes rows, so copy the sheet first.\n- **Only highlight them:** Home → Conditional Formatting → Highlight Cells Rules → **Duplicate Values**.\n- **Flag them:**\n\n```excel\n=IF(COUNTIF($A$2:$A$100, A2)>1, \"Duplicate\", \"\")\n```\n\nIf obvious duplicates are missed, the values differ by a space. Clean them with TRIM first."},{"id":"remove-blanks","title":"Remove blank rows","keys":["blank rows","delete blank rows","empty rows","remove blanks","blank cells","empty cells","fill blanks"],"ask":["how do i delete blank rows","get rid of empty rows","fill in blank cells with the value above"],"next":["sort-filter","text-cleanup","power-query"],"body":"Safest: turn on filters (**Ctrl+Shift+L**), filter one column to **(Blanks)**, check that those rows are really empty, then delete them.\n\nFaster but riskier: **Home → Find & Select → Go To Special → Blanks**, then Delete Sheet Rows. This deletes **any** row with one blank in the selection, so select a column that is never blank in real rows."},{"id":"freeze","title":"Freeze panes","keys":["freeze","freeze panes","freeze row","freeze column","lock row","lock top row","header row stays","split panes","keep header visible","unfreeze"],"ask":["how do i lock a row when scrolling","keep the top row visible","keep headers on screen","freeze the header row"],"next":["excel-table","print","other-view"],"body":"**View → Freeze Panes**\n\n- **Freeze Top Row** keeps row 1\n- **Freeze First Column** keeps column A\n- **Freeze Panes** keeps everything **above and left** of the selected cell\n\nTo keep row 1 and column A, click **B2** first. To keep two rows, click **A3**. To undo, use Unfreeze Panes in the same menu."},{"id":"data-validation","title":"Drop-down lists and data validation","keys":["data validation","dropdown","dropdown list","drop down","drop down list","validation","restrict input","pick list","limit entries"],"ask":["how do i make a drop down list","only allow certain values","make a list to choose from","stop people typing the wrong thing","dependent drop down"],"next":["excel-table","conditional-formatting","protect"],"body":"1. Select the cells → **Data → Data Validation**.\n2. Allow: **List**.\n3. Source: type `Yes,No,Pending`, or point at a range:\n\n```excel\n=$H$2:$H$10\n```\n\nOther rules: whole number between 1 and 100, date after today, text length. The **Error Alert** tab sets the message people see.","ex":"A drop-down that grows by itself, from a spilled list that starts in H2:\n\n```excel\n=$H$2#\n```","fix":"Validation does not check values **pasted** in. Data → Data Validation → **Circle Invalid Data** finds them."},{"id":"combine-text","title":"Combine text","keys":["combine text","concatenate","concat","textjoin","join text","merge text","make a full name","combine first and last name","combine cells","ampersand","combine columns"],"ask":["how do i combine first and last name","join two cells","put two columns together","merge two columns into one"],"next":["split-text","text-cleanup","merge-cells"],"body":"```excel\n=A2&\" \"&B2\n```\n\nThe `\" \"` adds a space. For a list with a separator that skips blanks:\n\n```excel\n=TEXTJOIN(\", \", TRUE, A2:A10)\n```\n\nJoining a number or date loses its format, so set it:\n\n```excel\n=\"Due \"&TEXT(B2, \"mmm d, yyyy\")\n```"},{"id":"split-text","title":"Split text","keys":["split text","text to columns","split a name","split names","separate names","first name","last name","textsplit","textbefore","textafter","left","right","mid","extract text","comma separated","delimiter","parse"],"ask":["comma separated text to columns","split first and last name","separate a column into two","get text before a comma","pull out part of a cell","extract the area code"],"next":["combine-text","flash-fill","text-cleanup"],"body":"**One time:** select the column → **Data → Text to Columns → Delimited** → choose comma or space. It overwrites the columns to the right, so insert blank ones first.\n\n**Live formula, Microsoft 365:**\n\n```excel\n=TEXTSPLIT(A2, \",\")\n```\n\n- `=TEXTBEFORE(A2, \" \")` first name\n- `=TEXTAFTER(A2, \" \", -1)` last name\n\n**Any version:**\n\n```excel\n=LEFT(A2, FIND(\" \", A2)-1)\n```\n\n`LEFT`, `RIGHT` and `MID` pull a fixed number of characters: `=MID(A2, 3, 4)` takes 4 starting at the third."},{"id":"text-cleanup","title":"Clean up text","keys":["trim","clean","proper","upper","lower","substitute","remove spaces","extra spaces","capitalize","uppercase","lowercase","change case","clean data","clean up data"],"ask":["how do i remove extra spaces","capitalize names","change to uppercase","remove a character","clean messy data"],"next":["split-text","find-replace","flash-fill","power-query"],"body":"- `=TRIM(A2)` removes extra spaces\n- `=PROPER(A2)`, `=UPPER(A2)`, `=LOWER(A2)` change case\n- `=SUBSTITUTE(A2, \"-\", \"\")` removes a character\n- `=CLEAN(A2)` removes line breaks and hidden characters\n\nFor data pasted from a website:\n\n```excel\n=TRIM(SUBSTITUTE(A2, CHAR(160), \" \"))\n```\n\nThen copy the results and **Paste Special → Values** over the originals."},{"id":"flash-fill","title":"Flash Fill","keys":["flash fill","flashfill","ctrl+e","autofill pattern","fill pattern"],"ask":["fill in a pattern automatically","excel guesses the rest","split names without a formula"],"next":["split-text","combine-text","fill-handle"],"body":"Type the result you want for the first row, start the second, and Excel shows the rest in grey. Press **Enter** to accept, or **Ctrl+E** at any time.\n\nIt handles names, area codes, dates and initials. Two cautions: it makes fixed text that will **not** update, and it guesses, so give it two examples if the first try is wrong.","mac":"Use **Data → Flash Fill**."},{"id":"find-replace","title":"Find and replace","keys":["find and replace","find replace","find","replace","ctrl+f","ctrl+h","search for","wildcard","wildcards"],"ask":["how do i find something","replace a word everywhere","search my spreadsheet"],"next":["text-cleanup","countifs","sort-filter"],"body":"**Ctrl+F** finds, **Ctrl+H** replaces. Click **Options** to search the whole workbook, match case, or match the entire cell.\n\nWildcards: `*` is any text and `?` is one character. To find a real asterisk, type `~*`. Select a range first to limit where it replaces.","mac":"**Cmd+F** to find, **Control+H** to replace."},{"id":"date","title":"Dates","keys":["date","dates","today","now","datedif","networkdays","workday","age","calculate age","days between","days until","add months","weekday","month name","due date","edate","eomonth"],"ask":["days until a date","how many days between two dates","calculate age from birthday","add months to a date","business days between dates","get the month from a date","insert todays date"],"next":["time","number-format","text-to-date"],"body":"Excel stores dates as numbers, so date math works directly.\n\n- `=TODAY()` today, updating daily. **Ctrl+;** types a fixed date\n- `=B2-A2` days between\n- `=B2-TODAY()` days until\n- `=EDATE(A2, 3)` three months later\n- `=EOMONTH(A2, 0)` last day of that month\n- `=NETWORKDAYS(A2, B2)` weekdays, counting both ends\n- `=TEXT(A2, \"mmmm\")` month name\n\nAge in whole years:\n\n```excel\n=DATEDIF(A2, TODAY(), \"Y\")\n```\n\nIf the answer shows as a date, set the cell format to **General**."},{"id":"text-to-date","title":"Text that should be a date","keys":["text to date","convert to date","date as text","date not recognized","datevalue","date format","date shows as number","five digit number"],"ask":["my dates will not sort","date shows as a number","convert text into a date","change the date format","excel changes my number to a date"],"next":["date","numbers-as-text","number-format"],"body":"- **A date shows as 46000-something:** the cell is General. Press **Ctrl+Shift+#**.\n- **Dates will not sort:** they are text. Data → Text to Columns → Next → Next → **Date** → pick the order (MDY) → Finish.\n- **By formula:** `=DATEVALUE(A2)`\n- **Excel turns 1/2 into a date:** format the cell as **Text** first, or type `'1/2`."},{"id":"time","title":"Time and hours worked","keys":["time","hours","hours worked","timesheet","time sheet","minutes","overtime","time difference","add times","midnight"],"ask":["calculate hours worked","add up hours","subtract times","timesheet over 24 hours","convert time to decimal hours"],"next":["date","number-format","if"],"body":"```excel\n=(B2-A2)*24\n```\n\nThat gives decimal hours, formatted as Number. If a shift passes midnight:\n\n```excel\n=MOD(B2-A2, 1)*24\n```\n\nTotals over 24 hours wrap around unless the cell uses the custom format `[h]:mm` (Ctrl+1 → Custom)."},{"id":"round","title":"Rounding","keys":["round","rounding","roundup","rounddown","mround","ceiling","floor","decimal","decimals","decimal places","nearest","int","trunc"],"ask":["how do i round to two decimals","round up","round to the nearest 5","remove decimals"],"next":["number-format","average"],"body":"- `=ROUND(A2, 2)` two decimals\n- `=ROUNDUP(A2, 0)` and `=ROUNDDOWN(A2, 0)` force the direction\n- `=MROUND(A2, 5)` nearest 5\n- `=ROUND(A2, -2)` nearest hundred\n\nFormatting only changes what you **see**. If a cell shows 2 decimals, the rest is still there, and totals can look off by a cent. Use ROUND when the value itself must be rounded."},{"id":"number-format","title":"Number formats","keys":["number format","format cells","currency","accounting","format number","thousands","comma style","custom format","scientific notation","percent format","dollar format"],"ask":["how do i show dollars","add commas to numbers","show as currency","number turned into 1e+10","format as thousands","stop scientific notation"],"next":["round","hash-width","leading-zeros"],"body":"**Ctrl+1** opens Format Cells. Quick keys: **Ctrl+Shift+$** currency, **Ctrl+Shift+%** percent, **Ctrl+Shift+1** comma style.\n\nUseful custom formats:\n\n- `#,##0` commas, no decimals\n- `$#,##0.0,,\"M\"` shows 2500000 as $2.5M\n- `0.0%` one decimal percent\n\nIf a long ID shows as `1E+15`, format it as **Text** before entering it. Excel keeps only 15 digits of a number."},{"id":"merge-cells","title":"Merge cells","keys":["merge cells","merge","merge and center","unmerge","center across selection","merged cells"],"ask":["how do i merge cells","center a title across columns","why can i not sort merged cells"],"next":["combine-text","wrap-text"],"body":"**Home → Merge & Center**. Only the top-left value is kept.\n\nBetter for titles, because merged cells break sorting, filtering and copying: select the cells → **Ctrl+1 → Alignment → Horizontal → Center Across Selection**. It looks the same and breaks nothing.\n\nTo join the **text** of cells, use `=A2&\" \"&B2` instead."},{"id":"wrap-text","title":"Wrap text and line breaks","keys":["wrap text","wrap","line break","new line in cell","multiple lines in a cell","text overflow","text cut off"],"ask":["how to wrap text","put two lines in one cell","start a new line inside a cell","my text runs into the next cell"],"next":["hash-width","merge-cells"],"body":"**Home → Wrap Text** shows long text on several lines. For a break exactly where you want it, press **Alt+Enter** while typing. In a formula, use `CHAR(10)` with Wrap Text on:\n\n```excel\n=A2&CHAR(10)&B2\n```","mac":"**Control+Option+Return** starts a new line."},{"id":"rows-columns","title":"Insert, delete and hide rows or columns","keys":["insert row","insert column","delete row","delete column","hide column","hide row","unhide","hide columns","hide rows","add a row","add a column","hidden","move column","group rows"],"ask":["how do i insert a row","hide a column","unhide rows","add a column in the middle","move a column","delete several rows"],"next":["freeze","remove-blanks","transpose"],"body":"- **Insert or delete:** right-click the row number or column letter → Insert / Delete. Keys: **Ctrl+Shift++** and **Ctrl+-**.\n- **Hide:** right-click → Hide. Keys: **Ctrl+9** rows, **Ctrl+0** columns.\n- **Unhide:** select the rows or columns on both sides → right-click → **Unhide**.\n- **Move a column:** select it, hold **Shift**, drag its edge.\n\nIf column A is hidden, type `A1` in the Name Box, then Home → Format → Hide & Unhide → Unhide Columns."},{"id":"transpose","title":"Transpose","keys":["transpose","switch rows and columns","rows to columns","columns to rows","flip","rotate data"],"ask":["turn rows into columns","flip my table sideways","switch rows and columns"],"next":["paste-special","pivot","rows-columns"],"body":"**One time:** copy → right-click the destination → **Paste Special → Transpose**.\n\n**Live:**\n\n```excel\n=TRANSPOSE(A1:D10)\n```\n\nIn Microsoft 365 that spills. In older versions, select the output range first and press Ctrl+Shift+Enter."},{"id":"paste-special","title":"Paste Special","keys":["paste special","paste values","values only","paste without formatting","paste as values","copy values","format painter","paste formatting"],"ask":["copy the result not the formula","paste only the values","copy formatting to another cell"],"next":["transpose","fill-handle"],"body":"Copy, then **Ctrl+Alt+V**, and choose:\n\n- **Values:** the result without the formula (**Ctrl+Shift+V** in Microsoft 365)\n- **Formats:** looks only, same as the Format Painter brush\n- **Transpose:** rows become columns\n- **Multiply / Add:** apply one copied number to a whole range","mac":"**Control+Cmd+V** opens Paste Special. **Cmd+Shift+V** pastes values."},{"id":"named-range","title":"Named ranges","keys":["named range","name a range","define name","name manager","named cell","name box"],"ask":["give a cell a name","use a name instead of a cell reference","delete a named range"],"next":["absolute-reference","excel-table","other-sheet"],"body":"Select the cell or range, type a name in the **Name Box** (left of the formula bar), press Enter. Then:\n\n```excel\n=B2*TaxRate\n```\n\nNames cannot have spaces, start with a number, or look like a cell address. Manage them under **Formulas → Name Manager**. A named cell is already absolute, so it needs no `$`."},{"id":"protect","title":"Protect a sheet","keys":["protect","protect sheet","lock cells","password","password protect","unprotect","lock the sheet","read only","protect workbook"],"ask":["how do i protect a sheet","stop people editing my formulas","lock certain cells","add a password to my workbook"],"next":["data-validation","rows-columns"],"body":"Every cell is locked by default, but it has no effect until the sheet is protected.\n\n1. Select the cells people **may** edit → Ctrl+1 → Protection → untick **Locked**.\n2. **Review → Protect Sheet**, with an optional password.\n\nTo require a password to **open** the file: File → Info → Protect Workbook → **Encrypt with Password**. Keep it safe, because Microsoft cannot recover it. Sheet protection prevents accidents. It is not real security."},{"id":"print","title":"Printing","keys":["print","printing","page setup","fit to one page","print titles","print area","page break","landscape","print gridlines","header and footer"],"ask":["how do i print on one page","repeat the header on every page","print only part of the sheet","my columns print on separate pages"],"next":["freeze","save-export"],"body":"**Page Layout** tab:\n\n- **Orientation → Landscape** for wide data\n- **Width: 1 page**, with Height on Automatic\n- **Print Titles → Rows to repeat:** `$1:$1`\n- **Print Area → Set Print Area** for a selection\n- **Sheet Options → Gridlines → Print**\n\nCheck **Ctrl+P** for the preview first. View → **Page Break Preview** lets you drag the page edges."},{"id":"shortcuts","title":"Keyboard shortcuts","keys":["shortcut","shortcuts","keyboard","hotkey","hotkeys","keyboard shortcuts","faster","speed up"],"ask":["best excel shortcuts","what are the keyboard shortcuts","how do i work faster"],"next":["fill-handle","paste-special","excel-table"],"body":"- **Ctrl+Arrow** jump to the edge of the data; add **Shift** to select\n- **Ctrl+T** make a Table\n- **Alt+=** AutoSum\n- **F4** cycle `$`, or repeat the last action\n- **Ctrl+D** fill down\n- **Ctrl+E** Flash Fill\n- **Ctrl+Shift+L** filters on or off\n- **Ctrl+Shift+V** paste values\n- **Ctrl+1** format cells\n- **Ctrl+;** today's date\n- **Ctrl+PgUp / PgDn** switch sheets","mac":"- **Cmd+Arrow** jump; add **Shift** to select\n- **Cmd+T** Table, or cycle `$` while editing a formula\n- **Cmd+Shift+T** AutoSum\n- **Control+U** edit a cell\n- **Cmd+Shift+F** filters\n- **Cmd+Shift+V** paste values\n- **Cmd+1** format cells\n- **Control+;** today's date"},{"id":"power-query","title":"Power Query","keys":["power query","get data","data from the web","get and transform","clean data repeatedly","unpivot","append queries","merge queries"],"ask":["combine many files","import data and clean it","automate cleaning","get data from a website","combine two tables"],"next":["text-cleanup","pivot","import-csv"],"body":"**Power Query** imports and cleans data with steps Excel records and can replay.\n\n1. **Data → Get Data → From File** → choose it → **Transform Data**.\n2. Remove columns, split, change types, filter, replace.\n3. **Close & Load**.\n\nNext month, replace the file and press **Refresh**. **Merge** joins two tables by a shared column, like a lookup. **Append** stacks them. **From Folder** combines many files at once."},{"id":"import-csv","title":"Import a CSV","keys":["csv","import","import csv","open csv","text file","import data","export csv"],"ask":["how do i open a csv","import data from a text file","csv is all in one column"],"next":["power-query","split-text","leading-zeros"],"body":"Use **Data → From Text/CSV** rather than double-clicking the file. You can check the separator and set column types before loading, which protects leading zeros and long IDs.\n\nIf everything landed in one column: Data → **Text to Columns → Delimited → Comma**.\n\nA CSV saves **one sheet of values only**: no formulas, formatting or extra tabs. Keep an `.xlsx` copy."},{"id":"save-export","title":"Save and export","keys":["save as pdf","export pdf","pdf","save","file format","xlsx","xlsm","recover","autosave","unsaved","version history"],"ask":["save as a pdf","recover an unsaved file","how do i get back an old version"],"next":["print","import-csv","macro"],"body":"- **PDF:** File → Save As → PDF. Set the print area first.\n- **Recover an unsaved file:** File → Info → Manage Workbook → **Recover Unsaved Workbooks**.\n- **Older version** (OneDrive or SharePoint): File → Info → **Version History**.\n- **Formats:** `.xlsx` is normal, `.xlsm` keeps macros, `.csv` keeps values on one sheet."},{"id":"macro","title":"Macros and VBA","keys":["macro","macros","vba","record macro","automate","visual basic","script","developer tab","xlsm"],"ask":["how do i write a macro","record a macro","automate a repeated task","turn on the developer tab"],"next":["power-query","save-export"],"body":"Start by recording one:\n\n1. **View → Macros → Record Macro**, give it a name and a shortcut.\n2. Do the steps once.\n3. **Stop Recording**. Run it with the shortcut or **Alt+F8**.\n\nSee or edit the code with **Alt+F11**. A first macro by hand:\n\n```vba\nSub BoldHeader()\n    Rows(1).Font.Bold = True\nEnd Sub\n```\n\nSave as `.xlsm` or the macro is lost. A macro cannot be undone, so work on a copy. Never enable macros in a file you did not expect."},{"id":"let","title":"LET","keys":["let","let function","name a value in a formula","simplify long formula"],"ask":["make a long formula shorter","reuse a calculation inside a formula"],"next":["lambda","if"],"body":"**LET** names a value so you can reuse it in one formula.\n\n```excel\n=LET(total, SUM(B2:B10), IF(total>1000, total*0.9, total))\n```\n\nPairs of name and value come first, and the last part is the result. It is easier to read and calculates the named part once. Needs Microsoft 365 or Excel 2021."},{"id":"lambda","title":"LAMBDA","keys":["lambda","custom function","make my own function","create a function"],"ask":["how do i create my own function","write a custom function without vba"],"next":["let","named-range","macro"],"body":"**LAMBDA** makes your own function with no VBA. Test it in a cell by adding the inputs at the end:\n\n```excel\n=LAMBDA(price, rate, price*(1+rate))(100, 8%)\n```\n\nWhen it works, go to **Formulas → Name Manager → New**, name it `WITHTAX`, and paste the part without `(100, 8%)`. Then `=WITHTAX(B2, 8%)` works anywhere in that workbook. Needs Microsoft 365 or Excel 2024."},{"id":"circular","title":"Circular references","keys":["circular reference","circular","circular reference warning","iterative"],"ask":["why do i get a circular reference","how do i fix a circular reference"],"next":["errors","average"],"body":"A circular reference means a formula includes **its own cell**, directly or through others. The usual cause is a total that includes itself: `=SUM(B2:B10)` typed in B10.\n\nFind it: **Formulas → Error Checking arrow → Circular References**. The status bar shows one too. Shorten the range so it stops above the formula."},{"id":"subtotal","title":"SUBTOTAL and filtered totals","keys":["subtotal","aggregate","sum visible","visible cells only","sum filtered","ignore hidden rows","total of filtered rows"],"ask":["sum only the visible rows","total after filtering","average of filtered data"],"next":["sort-filter","excel-table","sumifs"],"body":"SUM keeps counting filtered-out rows. **SUBTOTAL** skips them:\n\n```excel\n=SUBTOTAL(109, C2:C100)\n```\n\n`109` is sum, `101` average, `102` count, `104` max. The 100 versions also skip rows you hid by hand. To ignore errors as well:\n\n```excel\n=AGGREGATE(9, 7, C2:C100)\n```"},{"id":"running-total","title":"Running total","keys":["running total","cumulative","cumulative sum","running balance","checkbook","running sum","cumulative total"],"ask":["how do i keep a running total","checkbook balance","add each row to the one above"],"next":["absolute-reference","budget","sumifs"],"body":"Lock the start of the range and let the end move:\n\n```excel\n=SUM($C$2:C2)\n```\n\nFill down and each row adds everything above it. For a balance with money in (C) and money out (D):\n\n```excel\n=SUM($C$2:C2)-SUM($D$2:D2)\n```"},{"id":"moving-average","title":"Moving average","keys":["moving average","rolling average","smoothing","7 day average","three month average"],"ask":["how do i calculate a moving average","smooth out my data"],"next":["trendline","average","chart"],"body":"For a three-period average, start on the third row of data and fill down:\n\n```excel\n=AVERAGE(B2:B4)\n```\n\nLeave the range **without** `$` so the window slides. On a chart: right-click the line → Add Trendline → **Moving Average**."},{"id":"budget","title":"Budget","keys":["budget","personal budget","expense tracker","expenses","monthly budget","track spending","college budget"],"ask":["how do i make a budget","track my spending","build an expense tracker"],"next":["sumifs","running-total","data-validation","pivot"],"body":"1. **Transactions sheet**, as a Table (Ctrl+T) named `Spend`: Date, Category, Amount. Add a drop-down for Category.\n2. **Budget sheet:** Category in A, Planned in B, Actual in C:\n\n```excel\n=SUMIFS(Spend[Amount], Spend[Category], A2)\n```\n\n3. Left over in D: `=B2-C2`\n4. Conditional Formatting: red when D is below 0.\n\nEvery new row you type updates the budget."},{"id":"dashboard","title":"Dashboard","keys":["dashboard","report","kpi","summary page"],"ask":["how do i build a dashboard","make an interactive report"],"next":["pivot","slicer","chart","sparklines"],"body":"1. Put raw data in a **Table** on its own sheet.\n2. Build one **PivotTable** per question on a second sheet.\n3. Insert a **PivotChart** from each, and move the charts to a Dashboard sheet.\n4. Add **slicers** and connect them to every pivot (right-click → Report Connections).\n5. Turn off gridlines (View) and put the two or three numbers that matter at the top."},{"id":"sparklines","title":"Sparklines","keys":["sparkline","sparklines","mini chart","tiny chart","chart in a cell","in cell chart"],"ask":["put a small chart in a cell","show a trend in each row"],"next":["chart","conditional-formatting"],"body":"**Insert → Sparklines → Line**, choose the data range and the cell for it. Drag the fill handle to copy it down. **Sparkline → High Point / Low Point** adds markers. To delete one, use Sparkline → **Clear**, because the Delete key will not."},{"id":"comments","title":"Comments and notes","keys":["comment","comments","note","notes","add a note","threaded comment","annotate"],"ask":["how do i add a comment to a cell","leave a note in a cell"],"next":["protect","data-validation"],"body":"- **Comment** (a conversation people can reply to): Review → New Comment, or **Ctrl+Shift+F2**\n- **Note** (a simple sticky note): right-click → New Note, or **Shift+F2**"},{"id":"other-view","title":"View and zoom","keys":["split screen","new window","side by side","zoom","gridlines off","view two sheets","view"],"ask":["see two sheets at once","turn off gridlines","compare two sheets"],"next":["freeze","print"],"body":"- **Two sheets side by side:** View → New Window, then View → **Arrange All**\n- **Two parts of one sheet:** View → **Split**\n- **Gridlines off:** View → untick Gridlines\n- **Zoom:** Ctrl + scroll wheel"},{"id":"copilot","title":"Copilot and Python in Excel","keys":["copilot","ai in excel","python in excel","=py","python","analyze data"],"ask":["can excel use ai","how do i use copilot in excel","how do i use python in excel"],"next":["pivot","power-query"],"body":"- **Copilot:** Home → Copilot, with a Microsoft 365 plan that includes it. The file usually needs to be on OneDrive or SharePoint.\n- **Analyze Data:** Home → Analyze Data suggests charts and answers plain questions.\n- **Python in Excel:** type `=PY(` in a cell. Availability depends on your plan.\n\nCheck any AI formula on a few rows where you already know the answer."}];
  var FUNCS = {"SUM":{"s":"SUM(number1, [number2], …)","d":"adds numbers; text and blanks are skipped"},"AVERAGE":{"s":"AVERAGE(number1, …)","d":"mean; skips blanks and text, counts zeros"},"MEDIAN":{"s":"MEDIAN(number1, …)","d":"middle value"},"MODE.SNGL":{"s":"MODE.SNGL(number1, …)","d":"most common value"},"MIN":{"s":"MIN(number1, …)","d":"smallest number"},"MAX":{"s":"MAX(number1, …)","d":"largest number"},"COUNT":{"s":"COUNT(value1, …)","d":"counts cells that hold numbers"},"COUNTA":{"s":"COUNTA(value1, …)","d":"counts cells that are not empty"},"COUNTBLANK":{"s":"COUNTBLANK(range)","d":"counts empty cells"},"COUNTIF":{"s":"COUNTIF(range, criteria)","d":"counts cells that meet one condition"},"COUNTIFS":{"s":"COUNTIFS(range1, criteria1, [range2, criteria2], …)","d":"counts rows that meet every condition"},"SUMIF":{"s":"SUMIF(range, criteria, [sum_range])","d":"adds cells that meet one condition"},"SUMIFS":{"s":"SUMIFS(sum_range, range1, criteria1, …)","d":"adds cells that meet every condition"},"AVERAGEIF":{"s":"AVERAGEIF(range, criteria, [average_range])","d":"averages cells that meet one condition"},"AVERAGEIFS":{"s":"AVERAGEIFS(average_range, range1, criteria1, …)","d":"averages cells that meet every condition"},"MAXIFS":{"s":"MAXIFS(max_range, range1, criteria1, …)","d":"largest value among matching rows","v":"2019"},"MINIFS":{"s":"MINIFS(min_range, range1, criteria1, …)","d":"smallest value among matching rows","v":"2019"},"SUMPRODUCT":{"s":"SUMPRODUCT(array1, [array2], …)","d":"multiplies matching cells, then adds the results"},"SUBTOTAL":{"s":"SUBTOTAL(function_num, ref1, …)","d":"totals only the rows a filter leaves visible"},"AGGREGATE":{"s":"AGGREGATE(function_num, options, array)","d":"like SUBTOTAL, and can ignore errors"},"PRODUCT":{"s":"PRODUCT(number1, …)","d":"multiplies numbers"},"POWER":{"s":"POWER(number, power)","d":"raises to a power, same as ^"},"SQRT":{"s":"SQRT(number)","d":"square root"},"ABS":{"s":"ABS(number)","d":"drops the minus sign"},"MOD":{"s":"MOD(number, divisor)","d":"remainder after dividing"},"QUOTIENT":{"s":"QUOTIENT(numerator, denominator)","d":"whole part of a division"},"INT":{"s":"INT(number)","d":"rounds down to a whole number"},"TRUNC":{"s":"TRUNC(number, [digits])","d":"cuts off decimals"},"ROUND":{"s":"ROUND(number, digits)","d":"rounds to a number of decimals"},"ROUNDUP":{"s":"ROUNDUP(number, digits)","d":"always rounds away from zero"},"ROUNDDOWN":{"s":"ROUNDDOWN(number, digits)","d":"always rounds toward zero"},"MROUND":{"s":"MROUND(number, multiple)","d":"rounds to the nearest multiple"},"CEILING":{"s":"CEILING(number, significance)","d":"rounds up to a multiple"},"CEILING.MATH":{"s":"CEILING.MATH(number, [significance])","d":"rounds up to a multiple"},"FLOOR":{"s":"FLOOR(number, significance)","d":"rounds down to a multiple"},"FLOOR.MATH":{"s":"FLOOR.MATH(number, [significance])","d":"rounds down to a multiple"},"SIGN":{"s":"SIGN(number)","d":"1, 0 or -1"},"EXP":{"s":"EXP(number)","d":"e raised to a power"},"LN":{"s":"LN(number)","d":"natural logarithm"},"LOG":{"s":"LOG(number, [base])","d":"logarithm, base 10 by default"},"LOG10":{"s":"LOG10(number)","d":"base-10 logarithm"},"PI":{"s":"PI()","d":"the value of pi"},"RAND":{"s":"RAND()","d":"random decimal from 0 up to 1; changes on every recalculation"},"RANDBETWEEN":{"s":"RANDBETWEEN(bottom, top)","d":"random whole number; changes on every recalculation"},"RANDARRAY":{"s":"RANDARRAY([rows], [columns], [min], [max], [whole])","d":"a block of random numbers","v":"2021"},"SEQUENCE":{"s":"SEQUENCE(rows, [columns], [start], [step])","d":"a list of numbers in order","v":"2021"},"LARGE":{"s":"LARGE(array, k)","d":"k-th largest value"},"SMALL":{"s":"SMALL(array, k)","d":"k-th smallest value"},"RANK":{"s":"RANK(number, ref, [order])","d":"rank of a number; kept for old files, use RANK.EQ"},"RANK.EQ":{"s":"RANK.EQ(number, ref, [order])","d":"rank of a number; ties share a rank"},"RANK.AVG":{"s":"RANK.AVG(number, ref, [order])","d":"rank of a number; ties get the average rank"},"PERCENTILE.INC":{"s":"PERCENTILE.INC(array, k)","d":"value at a percentile"},"QUARTILE.INC":{"s":"QUARTILE.INC(array, quart)","d":"value at a quartile"},"STDEV":{"s":"STDEV(number1, …)","d":"standard deviation of a sample; kept for old files, use STDEV.S"},"STDEV.S":{"s":"STDEV.S(number1, …)","d":"standard deviation of a sample"},"STDEV.P":{"s":"STDEV.P(number1, …)","d":"standard deviation of a whole population"},"VAR.S":{"s":"VAR.S(number1, …)","d":"variance of a sample"},"VAR.P":{"s":"VAR.P(number1, …)","d":"variance of a whole population"},"CORREL":{"s":"CORREL(array1, array2)","d":"correlation, from -1 to 1"},"SLOPE":{"s":"SLOPE(known_ys, known_xs)","d":"slope of the best-fit line"},"INTERCEPT":{"s":"INTERCEPT(known_ys, known_xs)","d":"where the best-fit line crosses the y axis"},"RSQ":{"s":"RSQ(known_ys, known_xs)","d":"R-squared, how well the line fits"},"FORECAST":{"s":"FORECAST(x, known_ys, known_xs)","d":"predicts a value; kept for old files, use FORECAST.LINEAR"},"FORECAST.LINEAR":{"s":"FORECAST.LINEAR(x, known_ys, known_xs)","d":"predicts a value from a straight line"},"TREND":{"s":"TREND(known_ys, [known_xs], [new_xs])","d":"predicts several values from a straight line"},"LINEST":{"s":"LINEST(known_ys, [known_xs], [const], [stats])","d":"full regression statistics"},"FREQUENCY":{"s":"FREQUENCY(data, bins)","d":"counts how many values fall in each group"},"NORM.DIST":{"s":"NORM.DIST(x, mean, sd, cumulative)","d":"normal distribution"},"T.TEST":{"s":"T.TEST(array1, array2, tails, type)","d":"p-value of a t-test"},"CONFIDENCE.T":{"s":"CONFIDENCE.T(alpha, sd, size)","d":"margin of error for a mean"},"IF":{"s":"IF(test, value_if_true, [value_if_false])","d":"one result when a test is true, another when false"},"IFS":{"s":"IFS(test1, value1, [test2, value2], …)","d":"first result whose test is true","v":"2019"},"SWITCH":{"s":"SWITCH(expression, value1, result1, …, [default])","d":"matches one value against a list","v":"2019"},"CHOOSE":{"s":"CHOOSE(index, value1, …)","d":"picks an item by its position"},"AND":{"s":"AND(test1, …)","d":"TRUE when every test is true"},"OR":{"s":"OR(test1, …)","d":"TRUE when at least one test is true"},"NOT":{"s":"NOT(test)","d":"flips TRUE and FALSE"},"XOR":{"s":"XOR(test1, …)","d":"TRUE when an odd number of tests are true"},"IFERROR":{"s":"IFERROR(value, value_if_error)","d":"replaces any error"},"IFNA":{"s":"IFNA(value, value_if_na)","d":"replaces only #N/A"},"ISBLANK":{"s":"ISBLANK(value)","d":"TRUE when a cell is empty"},"ISNUMBER":{"s":"ISNUMBER(value)","d":"TRUE when a cell holds a number"},"ISTEXT":{"s":"ISTEXT(value)","d":"TRUE when a cell holds text"},"ISERROR":{"s":"ISERROR(value)","d":"TRUE when there is any error"},"ISNA":{"s":"ISNA(value)","d":"TRUE when there is #N/A"},"ISEVEN":{"s":"ISEVEN(number)","d":"TRUE for even numbers"},"ISODD":{"s":"ISODD(number)","d":"TRUE for odd numbers"},"ISFORMULA":{"s":"ISFORMULA(reference)","d":"TRUE when a cell holds a formula"},"NA":{"s":"NA()","d":"returns #N/A on purpose"},"TRUE":{"s":"TRUE()","d":"the value TRUE"},"FALSE":{"s":"FALSE()","d":"the value FALSE"},"VLOOKUP":{"s":"VLOOKUP(lookup_value, table, col_number, [range_lookup])","d":"finds a value in a first column, returns one to its right"},"HLOOKUP":{"s":"HLOOKUP(lookup_value, table, row_number, [range_lookup])","d":"finds a value in a top row, returns one below it"},"XLOOKUP":{"s":"XLOOKUP(lookup_value, lookup_range, return_range, [if_not_found], [match_mode], [search_mode])","d":"finds a value and returns its match from any direction","v":"2021"},"LOOKUP":{"s":"LOOKUP(lookup_value, lookup_vector, [result_vector])","d":"older lookup that needs sorted data"},"INDEX":{"s":"INDEX(array, row_num, [column_num])","d":"returns the value at a position"},"MATCH":{"s":"MATCH(lookup_value, lookup_array, [match_type])","d":"returns the position of a value; use 0 for exact"},"XMATCH":{"s":"XMATCH(lookup_value, lookup_array, [match_mode])","d":"returns the position of a value, exact by default","v":"2021"},"OFFSET":{"s":"OFFSET(reference, rows, cols, [height], [width])","d":"a range a number of steps away; recalculates constantly"},"INDIRECT":{"s":"INDIRECT(ref_text)","d":"turns text into a reference; recalculates constantly and breaks silently"},"ADDRESS":{"s":"ADDRESS(row, column, [abs], [a1], [sheet])","d":"builds a cell address as text"},"ROW":{"s":"ROW([reference])","d":"row number"},"ROWS":{"s":"ROWS(array)","d":"how many rows"},"COLUMN":{"s":"COLUMN([reference])","d":"column number"},"COLUMNS":{"s":"COLUMNS(array)","d":"how many columns"},"TRANSPOSE":{"s":"TRANSPOSE(array)","d":"swaps rows and columns"},"FORMULATEXT":{"s":"FORMULATEXT(reference)","d":"shows a formula as text"},"HYPERLINK":{"s":"HYPERLINK(link, [name])","d":"makes a clickable link"},"GETPIVOTDATA":{"s":"GETPIVOTDATA(field, pivot, …)","d":"reads a value from a PivotTable"},"FILTER":{"s":"FILTER(array, include, [if_empty])","d":"returns every row that matches","v":"2021"},"SORT":{"s":"SORT(array, [sort_index], [sort_order], [by_col])","d":"sorted copy of a range","v":"2021"},"SORTBY":{"s":"SORTBY(array, by_array1, [order1], …)","d":"sorts one range by another","v":"2021"},"UNIQUE":{"s":"UNIQUE(array, [by_col], [exactly_once])","d":"list without repeats","v":"2021"},"TAKE":{"s":"TAKE(array, rows, [columns])","d":"first or last rows of a result","v":"2024"},"DROP":{"s":"DROP(array, rows, [columns])","d":"removes rows from a result","v":"2024"},"CHOOSECOLS":{"s":"CHOOSECOLS(array, col1, …)","d":"picks columns from a result","v":"2024"},"CHOOSEROWS":{"s":"CHOOSEROWS(array, row1, …)","d":"picks rows from a result","v":"2024"},"VSTACK":{"s":"VSTACK(array1, …)","d":"stacks ranges on top of each other","v":"2024"},"HSTACK":{"s":"HSTACK(array1, …)","d":"puts ranges side by side","v":"2024"},"TOCOL":{"s":"TOCOL(array, [ignore])","d":"turns a block into one column","v":"2024"},"TOROW":{"s":"TOROW(array, [ignore])","d":"turns a block into one row","v":"2024"},"WRAPROWS":{"s":"WRAPROWS(vector, count)","d":"wraps a list into rows","v":"2024"},"WRAPCOLS":{"s":"WRAPCOLS(vector, count)","d":"wraps a list into columns","v":"2024"},"GROUPBY":{"s":"GROUPBY(row_fields, values, function)","d":"summary table from one formula","v":"365"},"PIVOTBY":{"s":"PIVOTBY(row_fields, col_fields, values, function)","d":"pivot from one formula","v":"365"},"LET":{"s":"LET(name1, value1, …, result)","d":"names values inside one formula","v":"2021"},"LAMBDA":{"s":"LAMBDA(parameter1, …, calculation)","d":"makes your own function","v":"2024"},"MAP":{"s":"MAP(array, lambda)","d":"runs a LAMBDA on every item","v":"2024"},"BYROW":{"s":"BYROW(array, lambda)","d":"runs a LAMBDA on every row","v":"2024"},"BYCOL":{"s":"BYCOL(array, lambda)","d":"runs a LAMBDA on every column","v":"2024"},"REDUCE":{"s":"REDUCE(initial, array, lambda)","d":"runs a LAMBDA down to one value","v":"2024"},"SCAN":{"s":"SCAN(initial, array, lambda)","d":"running results from a LAMBDA","v":"2024"},"CONCAT":{"s":"CONCAT(text1, …)","d":"joins text or a whole range","v":"2019"},"CONCATENATE":{"s":"CONCATENATE(text1, …)","d":"joins text; kept for old files, use CONCAT or &"},"TEXTJOIN":{"s":"TEXTJOIN(delimiter, ignore_empty, text1, …)","d":"joins text with a separator","v":"2019"},"TEXTSPLIT":{"s":"TEXTSPLIT(text, col_delimiter, [row_delimiter])","d":"splits text into cells","v":"2024"},"TEXTBEFORE":{"s":"TEXTBEFORE(text, delimiter, [instance])","d":"text before a character","v":"2024"},"TEXTAFTER":{"s":"TEXTAFTER(text, delimiter, [instance])","d":"text after a character","v":"2024"},"LEFT":{"s":"LEFT(text, [num_chars])","d":"first characters"},"RIGHT":{"s":"RIGHT(text, [num_chars])","d":"last characters"},"MID":{"s":"MID(text, start, num_chars)","d":"characters from the middle"},"LEN":{"s":"LEN(text)","d":"number of characters"},"FIND":{"s":"FIND(find_text, within_text, [start])","d":"position of text; case matters"},"SEARCH":{"s":"SEARCH(find_text, within_text, [start])","d":"position of text; case ignored, wildcards allowed"},"SUBSTITUTE":{"s":"SUBSTITUTE(text, old, new, [instance])","d":"replaces text by what it says"},"REPLACE":{"s":"REPLACE(text, start, num_chars, new)","d":"replaces text by its position"},"TRIM":{"s":"TRIM(text)","d":"removes extra spaces"},"CLEAN":{"s":"CLEAN(text)","d":"removes hidden characters"},"UPPER":{"s":"UPPER(text)","d":"all capitals"},"LOWER":{"s":"LOWER(text)","d":"all lower case"},"PROPER":{"s":"PROPER(text)","d":"Capitalizes Each Word"},"TEXT":{"s":"TEXT(value, format)","d":"turns a number or date into formatted text"},"VALUE":{"s":"VALUE(text)","d":"turns text into a number"},"NUMBERVALUE":{"s":"NUMBERVALUE(text, [decimal], [group])","d":"turns text into a number with set separators"},"EXACT":{"s":"EXACT(text1, text2)","d":"TRUE when two texts match, case included"},"REPT":{"s":"REPT(text, times)","d":"repeats text"},"CHAR":{"s":"CHAR(number)","d":"character from a code; CHAR(10) is a line break"},"CODE":{"s":"CODE(text)","d":"code of the first character"},"UNICHAR":{"s":"UNICHAR(number)","d":"character from a Unicode number"},"TODAY":{"s":"TODAY()","d":"today's date, updates daily"},"NOW":{"s":"NOW()","d":"date and time now"},"DATE":{"s":"DATE(year, month, day)","d":"builds a date"},"DATEVALUE":{"s":"DATEVALUE(text)","d":"turns text into a date"},"DATEDIF":{"s":"DATEDIF(start, end, unit)","d":"whole years \"Y\", months \"M\" or days \"D\" between dates"},"DAYS":{"s":"DAYS(end, start)","d":"days between two dates"},"YEAR":{"s":"YEAR(date)","d":"the year"},"MONTH":{"s":"MONTH(date)","d":"the month number"},"DAY":{"s":"DAY(date)","d":"the day of the month"},"WEEKDAY":{"s":"WEEKDAY(date, [type])","d":"day of the week as a number; type 2 makes Monday 1"},"WEEKNUM":{"s":"WEEKNUM(date, [type])","d":"week of the year"},"ISOWEEKNUM":{"s":"ISOWEEKNUM(date)","d":"ISO week of the year"},"EDATE":{"s":"EDATE(date, months)","d":"same day a number of months later"},"EOMONTH":{"s":"EOMONTH(date, months)","d":"last day of a month"},"NETWORKDAYS":{"s":"NETWORKDAYS(start, end, [holidays])","d":"weekdays between dates, counting both ends"},"NETWORKDAYS.INTL":{"s":"NETWORKDAYS.INTL(start, end, [weekend], [holidays])","d":"workdays with your own weekend"},"WORKDAY":{"s":"WORKDAY(start, days, [holidays])","d":"date a number of workdays away"},"WORKDAY.INTL":{"s":"WORKDAY.INTL(start, days, [weekend], [holidays])","d":"same, with your own weekend"},"YEARFRAC":{"s":"YEARFRAC(start, end, [basis])","d":"part of a year between dates"},"TIME":{"s":"TIME(hour, minute, second)","d":"builds a time"},"TIMEVALUE":{"s":"TIMEVALUE(text)","d":"turns text into a time"},"HOUR":{"s":"HOUR(time)","d":"the hour"},"MINUTE":{"s":"MINUTE(time)","d":"the minute"},"SECOND":{"s":"SECOND(time)","d":"the second"},"PMT":{"s":"PMT(rate, periods, present_value, [future_value], [type])","d":"payment on a loan"},"IPMT":{"s":"IPMT(rate, period, periods, present_value)","d":"interest part of one payment"},"PPMT":{"s":"PPMT(rate, period, periods, present_value)","d":"principal part of one payment"},"CUMIPMT":{"s":"CUMIPMT(rate, periods, pv, start, end, type)","d":"interest paid over several payments"},"FV":{"s":"FV(rate, periods, payment, [present_value], [type])","d":"future value of savings"},"PV":{"s":"PV(rate, periods, payment, [future_value], [type])","d":"value today of future payments"},"NPER":{"s":"NPER(rate, payment, present_value)","d":"how many payments"},"RATE":{"s":"RATE(periods, payment, present_value)","d":"interest rate per period"},"NPV":{"s":"NPV(rate, value1, …)","d":"net present value; first value is discounted one period"},"XNPV":{"s":"XNPV(rate, values, dates)","d":"net present value with real dates"},"IRR":{"s":"IRR(values, [guess])","d":"return that makes NPV zero"},"XIRR":{"s":"XIRR(values, dates, [guess])","d":"return with real dates"},"EFFECT":{"s":"EFFECT(nominal_rate, periods)","d":"effective yearly rate"},"SLN":{"s":"SLN(cost, salvage, life)","d":"straight-line depreciation"},"DB":{"s":"DB(cost, salvage, life, period)","d":"declining-balance depreciation"},"IMAGE":{"s":"IMAGE(url, [alt_text])","d":"picture from a web address","v":"365"},"STOCKHISTORY":{"s":"STOCKHISTORY(ticker, start, [end])","d":"past share prices","v":"365"},"CONVERT":{"s":"CONVERT(number, from, to)","d":"changes units"},"CELL":{"s":"CELL(info_type, [reference])","d":"facts about a cell"},"TYPE":{"s":"TYPE(value)","d":"what kind of value it is"},"N":{"s":"N(value)","d":"turns a value into a number"},"T":{"s":"T(value)","d":"returns text, or nothing"},"REGEXTEST":{"s":"REGEXTEST(text, pattern)","d":"TRUE when text fits a pattern","v":"365"},"REGEXEXTRACT":{"s":"REGEXEXTRACT(text, pattern)","d":"pulls out text that fits a pattern","v":"365"},"REGEXREPLACE":{"s":"REGEXREPLACE(text, pattern, replacement)","d":"replaces text that fits a pattern","v":"365"}};

  /* ------------------------------------------------------------------
   * Text handling
   * --------------------------------------------------------------- */
  var STOP = {};
  ('a an the is are was were be been am do does did doing how what why when where which who whom can could should would will shall may might ' +
   'i me my mine we our you your it its this that these those there here of to in on at for from by with about into onto as and or if then so ' +
   'but not no just please help want need know tell show explain teach give get got make makes making use using used way best good right ' +
   'excel formula formulas function functions spreadsheet spreadsheets cell cells sheet work works working thing things something some any all each ' +
   'im ive id dont doesnt cant isnt wont have has had like also up out s t m re ve ll ok okay hey hi whats hows wheres whos').split(' ').forEach(function (w) { STOP[w] = 1; });
  // Words that matter in function names but are noise on their own.
  var SOFT = { show: 1, find: 1, use: 1, write: 1, writing: 1 };

  var PHRASES = [
    [/\bpivot\s*-?\s*tables?\b/g, ' pivot '], [/\bpivots\b/g, ' pivot '],
    [/\b([vhx])[\s-]+look\s*-?\s*ups?\b/g, ' $1lookup '], [/\blook(?:ing)?\s*-?\s*ups?\b/g, ' lookup '],
    [/\bdrop\s*-?\s*downs?\b/g, ' dropdown '], [/\bdropdowns\b/g, ' dropdown '],
    [/\bcond(?:itional)?\.?\s+format(?:ting)?\b/g, ' conditional formatting '],
    [/\b(sum|count|average|max|min)\s+ifs\b/g, ' $1ifs '], [/\b(sum|count|average)\s+if\s+(formula|function)\b/g, ' $1if '],
    [/\bif\s+(?:then|else)\b/g, ' if statement '],
    [/\bper\s?cents?\b/g, ' percent '], [/\bpercentages?\b/g, ' percent '], [/%/g, ' percent '],
    [/\bdupes?\b/g, ' duplicate '], [/\bshort\s*cuts?\b/g, ' shortcut '], [/\bhot\s*keys?\b/g, ' shortcut '],
    [/\b(?:that )?i can see\b/g, ' visible '], [/\bhow old\b/g, ' age '],
    [/\btrend\s+lines?\b/g, ' trendline '], [/\bstd\s*\.?\s*dev\b/g, ' standard deviation '],
    [/\bpower\s*query\b/g, ' power query '], [/\bmacros\b/g, ' macro '],
    [/\bdollar\s+signs?\b/g, ' dollar sign '], [/\bwork\s*sheets?\b/g, ' sheet '], [/\btabs\b/g, ' tab '],
    [/\bdoesn'?t\b/g, ' not '], [/\bisn'?t\b/g, ' not '], [/\bwon'?t\b/g, ' not '], [/\bcan'?t\b/g, ' not ']
  ];
  var SYN = {
    add: 'sum', adding: 'sum', total: 'sum', totals: 'sum', totaling: 'sum', mean: 'average', avg: 'average', averages: 'average',
    graph: 'chart', graphs: 'chart', plot: 'chart', biggest: 'largest', highest: 'largest', top: 'largest', lowest: 'smallest', bottom: 'smallest',
    repeated: 'duplicate', repeats: 'duplicate', repeat: 'duplicate', copies: 'duplicate', dedupe: 'duplicate', colour: 'color',
    empty: 'blank', blanks: 'blank', picklist: 'dropdown', concatenate: 'combine', concat: 'combine', join: 'combine', joining: 'combine',
    separate: 'split', separating: 'split', anchor: 'lock', locking: 'lock', sorting: 'sort', filtering: 'filter', rounding: 'round',
    hashtag: 'hash', hashtags: 'hash', hashes: 'hash', mortgage: 'loan', headers: 'header', heading: 'header', headings: 'header', titles: 'title',
    occurrences: 'times', occurs: 'times', appears: 'times', distinct: 'unique', remaining: 'left', erase: 'delete', remove: 'delete', removing: 'delete',
    rid: 'delete', deleting: 'delete', capitalise: 'capitalize', colored: 'color', birthday: 'age', worksheet: 'sheet', tab: 'sheet',
    scrolling: 'scroll', skip: 'ignore', skipping: 'ignore', ignoring: 'ignore', excluding: 'ignore', exclude: 'ignore', except: 'ignore',
    drag: 'copy', dragging: 'copy', dragged: 'copy', copying: 'copy', copied: 'copy', cursor: 'cell', pounds: 'hash', pound: 'hash'
  };

  function stem(w) {
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (w.length > 5 && /(ss|x|ch|sh)es$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /[^su]s$/.test(w) && !/ifs$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function straighten(s) { return String(s).replace(/[“”„]/g, '"').replace(/[‘’]/g, "'").replace(/ /g, ' '); }
  function flat(s) {
    s = ' ' + straighten(s).toLowerCase() + ' ';
    PHRASES.forEach(function (p) { s = s.replace(p[0], p[1]); });
    return s;
  }
  function words(s) {
    return (flat(s).match(/#[a-z0-9/]+[!?]?|[a-z0-9]+(?:\.[a-z0-9]+)*|\$/g) || []).map(function (w) { return w.replace(/[!?]$/, ''); });
  }
  function tokens(s, keepStop) {
    var out = [];
    words(s).forEach(function (w) {
      if (!keepStop && STOP[w] && !SOFT[w]) return;
      if (SOFT[w] && !keepStop) return;
      w = SYN[w] || w;
      w = stem(w);
      w = SYN[w] || w;
      out.push(w);
    });
    return out;
  }
  function phrase(s) { return ' ' + tokens(s, true).join(' ') + ' '; }

  /* Edit distance with adjacent swaps, stopping early past `max`. */
  function near(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var p2 = null, p = [], c, i, j, best;
    for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) {
      c = [i]; best = i;
      for (j = 1; j <= b.length; j++) {
        c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (p2 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) c[j] = Math.min(c[j], p2[j - 2] + 1);
        if (c[j] < best) best = c[j];
      }
      if (best > max) return max + 1;
      p2 = p; p = c;
    }
    return p[b.length];
  }

  /* ------------------------------------------------------------------
   * Index
   * --------------------------------------------------------------- */
  var BY = {}, VOCAB = {}, DF = {}, INDEX = [];
  TOPICS.forEach(function (t) {
    BY[t.id] = t;
    var w = {};
    function put(text, weight) { tokens(text).forEach(function (k) { if (!w[k] || w[k] < weight) w[k] = weight; }); }
    put(t.body, 0.35);
    t.ask.forEach(function (q) { put(q, 1.6); });
    t.keys.forEach(function (k) { put(k, 2.2); });
    put(t.title, 3);
    var ph = t.keys.concat([t.title]).map(function (k) { return { p: phrase(k), n: tokens(k, true).length, content: tokens(k).length }; });
    var asks = t.ask.map(function (q) { return tokens(q); });
    INDEX.push({ t: t, w: w, ph: ph, asks: asks });
    Object.keys(w).forEach(function (k) { if (w[k] >= 1.6) { DF[k] = (DF[k] || 0) + 1; VOCAB[k] = 1; } });
  });
  Object.keys(FUNCS).forEach(function (f) { VOCAB[f.toLowerCase()] = VOCAB[f.toLowerCase()] || 2; });
  var N = TOPICS.length || 1;
  function idf(k) { return Math.log(1 + N / (DF[k] || 0.6)); }

  // Everyday words a spelling fix must never turn into Excel vocabulary.
  var PLAIN = {};
  ('president poem story weather joke movie music song sport game food recipe love life world people person house home car city country school ' +
   'teacher friend money today tomorrow time year write read tell think weather capital history math science essay paper email letter phone water ' +
   'name names thanks thank hello please sorry great cool nice more less other another same good better write never always meaning dinner cooking pizza').split(' ')
    .forEach(function (w) { PLAIN[w] = 1; });

  function correct(k) {
    if (VOCAB[k] || PLAIN[k] || k.length < 5 || /^[#$\d]/.test(k)) return null;
    var max = k.length >= 7 ? 2 : 1, best = null, bd = max + 1;
    Object.keys(VOCAB).forEach(function (v) {
      if (v.length < 4 || v[0] !== k[0]) return;
      var d = near(k, v, max);
      if (d < bd || (d === bd && best && (DF[v] || 0) > (DF[best] || 0))) { bd = d; best = v; }
    });
    return bd <= max ? best : null;
  }

  function spell(text) {
    return flat(text).replace(/[a-z][a-z0-9]{3,}/g, function (w) {
      if (STOP[w] || SYN[w]) return w;
      var k = stem(w);
      if (VOCAB[k] || VOCAB[w]) return w;
      return correct(k) || w;
    });
  }
  // A word Excel Helper has never seen says little about which topic is meant.
  function weigh(k) { return VOCAB[k] ? idf(k) : 2; }
  function search(text) {
    text = spell(text);
    var q = [], seen = {};
    tokens(text).forEach(function (k) { if (!seen[k]) { seen[k] = 1; q.push({ k: k, w: 1 }); } });
    var total = 0; q.forEach(function (x) { total += weigh(x.k); });
    var ph = phrase(text), fixed = ' ' + q.map(function (x) { return x.k; }).join(' ') + ' ';
    var res = INDEX.map(function (e) {
      var s = 0, hit = 0;
      q.forEach(function (x) {
        var fw = e.w[x.k];
        if (!fw) return;
        s += idf(x.k) * fw * x.w;
        hit += weigh(x.k) * (fw >= 1.6 ? 1 : 0.4);
      });
      var bonus = 0;
      e.ph.forEach(function (p) {
        if (ph.indexOf(p.p) !== -1 || (p.content && fixed.indexOf(p.p) !== -1)) {
          var b = p.content ? 4 + 3.2 * p.n : (p.n > 2 ? 7.5 : p.n > 1 ? 4 : 0);
          if (b > bonus) bonus = b;
        }
      });
      var askBest = 0;
      e.asks.forEach(function (a) {
        if (!a.length || !q.length) return;
        var both = 0, set = {};
        a.forEach(function (k) { set[k] = 1; });
        q.forEach(function (x) { if (set[x.k]) both++; });
        var sim = 2 * both / (a.length + q.length);
        if (sim > askBest) askBest = sim;
      });
      return { t: e.t, s: s + bonus + askBest * 7 + (askBest >= 0.7 ? (askBest - 0.7) * 40 : 0), cover: total ? hit / total : (bonus ? 1 : 0), bonus: bonus, ask: askBest };
    });
    res.sort(function (a, b) { return b.s - a.s; });
    return { top: res, q: q, total: total };
  }

  /* ------------------------------------------------------------------
   * Formula reading
   * --------------------------------------------------------------- */
  var REF = /^\$?[A-Z]{1,3}\$?\d{1,7}$/i;
  var RANGE = /^(?:(?:'[^']+'|[A-Za-z0-9_.]+)!)?\$?[A-Z]{1,3}\$?\d{0,7}:\$?[A-Z]{1,3}\$?\d{0,7}$/i;

  /* Pull the formula out of a message. Returns { f, before, after } or null. */
  function extract(text) {
    var s = straighten(text).replace(/^\s*`+|`+\s*$/g, '');
    var m = /=\s*[-+]?(?:[A-Z][A-Z0-9.]*\s*\(|\$?[A-Z]{1,3}\$?\d+\s*(?:[-+*\/&<>^:=×÷]|x\s*\$?[A-Z]{1,3}\$?\d)|\(|\d+(?:\.\d+)?%?\s*[-+*\/]\s*\$?[A-Z]{1,3}\$?\d|"[^"]*"\s*&|\$?[A-Z]{1,3}\$?\d+\s*$|[A-Za-z0-9_]+!\$?[A-Z]{1,3}\$?\d|'[^']+'!)/i.exec(s);
    var start, bare = false;
    if (m) start = m.index;
    else {
      m = /^\s*([A-Z][A-Z0-9.]{1,})\(\s*[^)\s]/.exec(s);
      if (!m || !(FUNCS[m[1].toUpperCase()] || suggest(m[1]))) return null;
      start = s.indexOf(m[1]); bare = true;
    }
    var rest = s.slice(start), depth = 0, inq = false, end = rest.length, opened = false;
    for (var i = 0; i < rest.length; i++) {
      var ch = rest[i];
      if (ch === '"') inq = !inq;
      if (inq) continue;
      if (ch === '\n' && depth <= 0) { end = i; break; }
      if (ch === '(') { depth++; opened = true; }
      if (ch === ')') depth--;
      if (/\s/.test(ch)) {
        var tail = rest.slice(i);
        var prose = /^\s+(?:and |but )?(?:giv(?:es?|ing)|is|are|isn'?t|doesn'?t|does|returns?|returning|shows?|showing|says|not|why|what|it|keeps?|when|won'?t|can|please|to|work(?:s|ing)?|error|with|because|did|do|i|my|the|in (?:row|col|my|excel)|for (?:my|the|all)|wrong|correct|right|fix|explain|mean)\b/i;
        if (prose.test(tail) && (depth <= 0 || !/^\s+(?:is|not|right)\s*\(/i.test(tail))) { end = i; break; }
        if (depth <= 0 && opened && /^\s+[?.!]*\s*[a-z]{2,}\b(?!\s*\()/.test(tail)) { end = i; break; }
      }
    }
    var f = rest.slice(0, end).replace(/[\s?.;,]+$/, '').replace(/`/g, '').trim();
    if (f.length < 3) return null;
    return { f: f, bare: bare, before: s.slice(0, start).trim(), after: rest.slice(end).trim() };
  }

  /* Split a formula into calls with raw argument text. */
  function parse(f) {
    var calls = [], stack = [], inq = false, sq = false, br = 0, brace = 0, i, ch, nm;
    var quotes = 0, extraClose = 0;
    for (i = 0; i < f.length; i++) {
      ch = f[i];
      if (inq) { if (ch === '"') { inq = false; quotes++; } continue; }
      if (sq) { if (ch === "'") sq = false; continue; }
      if (ch === '"') { inq = true; quotes++; continue; }
      if (ch === "'") { sq = true; continue; }
      if (ch === '[') { br++; continue; }
      if (ch === ']') { br = Math.max(0, br - 1); continue; }
      if (br) continue;
      if (ch === '{') { brace++; continue; }
      if (ch === '}') { brace--; continue; }
      if (brace) continue;
      if (ch === '(') {
        nm = /([A-Za-z_][A-Za-z0-9_.]*)\s*$/.exec(f.slice(0, i));
        stack.push({ name: nm ? nm[1].toUpperCase() : '', start: nm ? nm.index : i, open: i, args: [], from: i + 1, depth: stack.length });
        continue;
      }
      if ((ch === ',' || ch === ';') && stack.length) { var t = stack[stack.length - 1]; t.args.push(f.slice(t.from, i).trim()); t.from = i + 1; continue; }
      if (ch === ')') {
        if (!stack.length) { extraClose++; continue; }
        close(stack.pop(), i);
      }
    }
    var unclosed = stack.length;
    while (stack.length) close(stack.pop(), f.length);
    function close(c, at) {
      var last = f.slice(c.from, at).trim();
      if (last !== '' || c.args.length) c.args.push(last);
      c.end = at;
      calls.push(c);
    }
    calls.sort(function (a, b) { return a.start - b.start; });
    return { calls: calls, unclosed: unclosed, extraClose: extraClose, quotes: quotes };
  }

  function suggest(name) {
    name = name.toUpperCase();
    var best = null, bd = 3;
    Object.keys(FUNCS).forEach(function (f) {
      if (f.length < 2 || name.length < 3) return;
      var max = f.length <= 3 ? 1 : 2;
      var d = near(name, f, max);
      if (d <= max && d < bd) { bd = d; best = f; }
    });
    return best;
  }

  /* Run a fix on the parts of a formula outside quoted text. */
  function outside(f, fn) {
    return f.split(/("(?:[^"]|"")*")/).map(function (part, i) { return i % 2 ? part : fn(part); }).join('');
  }
  function colNum(s) { var n = 0; s = s.replace(/[^A-Z]/gi, '').toUpperCase(); for (var i = 0; i < s.length; i++) n = n * 26 + s.charCodeAt(i) - 64; return n; }
  function rangeInfo(r) {
    var m = /^(?:(?:'[^']+'|[A-Za-z0-9_.]+)!)?(\$?)([A-Z]{1,3})(\$?)(\d*):(\$?)([A-Z]{1,3})(\$?)(\d*)$/i.exec(r.trim());
    if (!m) return null;
    return { cols: Math.abs(colNum(m[6]) - colNum(m[2])) + 1, rows: m[4] && m[8] ? Math.abs(+m[8] - +m[4]) + 1 : null, whole: !m[4], locked: (m[4] ? m[3] === '$' : true) && (m[8] ? m[7] === '$' : true) };
  }
  function lockRange(r) {
    return r.replace(/\$?([A-Z]{1,3})\$?(\d+):\$?([A-Z]{1,3})\$?(\d+)/i, function (_, a, b, c, d) { return '$' + a.toUpperCase() + '$' + b + ':$' + c.toUpperCase() + '$' + d; });
  }
  function swapArg(f, call, i, value) {
    // Rebuild one call with one argument replaced.
    var args = call.args.slice(); args[i] = value;
    return f.slice(0, call.open + 1) + args.join(', ') + f.slice(call.end);
  }
  function isStr(a) { return /^"(?:[^"]|"")*"$/.test(a || ''); }

  var LOOKUPISH = { VLOOKUP: 1, HLOOKUP: 1, XLOOKUP: 1, MATCH: 1, XMATCH: 1, SUMIF: 1, SUMIFS: 1, COUNTIF: 1, COUNTIFS: 1, AVERAGEIF: 1, AVERAGEIFS: 1, RANK: 1, 'RANK.EQ': 1, 'RANK.AVG': 1, MAXIFS: 1, MINIFS: 1, LARGE: 1, SMALL: 1 };
  var LOCKARG = { VLOOKUP: [1], HLOOKUP: [1], XLOOKUP: [1, 2], MATCH: [1], XMATCH: [1], SUMIF: [0, 2], COUNTIF: [0], AVERAGEIF: [0, 2], RANK: [1], 'RANK.EQ': [1], 'RANK.AVG': [1], LARGE: [0], SMALL: [0] };
  var OLD = { CONCATENATE: 'CONCAT, TEXTJOIN or the & sign', RANK: 'RANK.EQ', STDEV: 'STDEV.S', FORECAST: 'FORECAST.LINEAR', CEILING: null, FLOOR: null };

  function check(input, bare) {
    var bad = [], warn = [], tip = [], f = input, p, m;
    function B(s) { bad.push(s); } function W(s) { warn.push(s); } function T(s) { if (tip.indexOf(s) < 0) tip.push(s); }

    if (bare) { B('It is missing the `=` at the start, so Excel treats it as plain text.'); f = '=' + f; }

    // Operators borrowed from other languages or typed on the wrong key.
    var g = outside(f, function (s) {
      return s.replace(/=\s*</g, function () { B('`=<` is backwards. Excel uses `<=`.'); return '<='; })
        .replace(/=\s*>/g, function () { B('`=>` is backwards. Excel uses `>=`.'); return '>='; })
        .replace(/!=/g, function () { B('`!=` is not an Excel operator. Not equal is `<>`.'); return '<>'; })
        .replace(/([^=<>])==/g, function (_, a) { B('`==` should be a single `=` in Excel.'); return a + '='; })
        .replace(/×/g, function () { B('`×` is not a multiply sign in Excel. Use `*`.'); return '*'; })
        .replace(/÷/g, function () { B('`÷` is not a divide sign in Excel. Use `/`.'); return '/'; })
        .replace(/(\b\$?[A-Z]{1,3}\$?\d+)\s*x\s*(\$?[A-Z]{1,3}\$?\d+\b)/g, function (_, a, b) { B('Use `*` to multiply, not the letter x.'); return a + '*' + b; })
        .replace(/([-+*\/(,=<>]\s*)\$(\d)/g, function (_, a, b) { B('Leave the dollar sign off numbers. Format the cell as currency instead.'); return a + b; });
    });
    f = g;

    p = parse(f);
    if (p.quotes % 2) B('A quotation mark is missing. Text needs a `"` on both sides.');
    if (p.extraClose) {
      B('There ' + (p.extraClose === 1 ? 'is 1 closing bracket' : 'are ' + p.extraClose + ' closing brackets') + ' too many.');
      if (/\)+$/.test(f)) f = f.slice(0, f.length - p.extraClose);
    }
    if (p.unclosed) {
      B('It is missing ' + (p.unclosed === 1 ? 'a closing bracket' : p.unclosed + ' closing brackets') + ' at the end. Excel may guess where it goes and guess wrong.');
      if (p.quotes % 2 === 0) f += new Array(p.unclosed + 1).join(')');
    }
    p = parse(f);

    // Chained comparison, e.g. 70<=A2<90.
    f = outside(f, function (s) {
      return s.replace(/(\d+(?:\.\d+)?)\s*(<=?|>=?)\s*(\$?[A-Z]{1,3}\$?\d+)\s*(<=?|>=?)\s*(\d+(?:\.\d+)?)/gi, function (_, a, o1, r, o2, b) {
        B('Excel cannot read `' + a + o1 + r + o2 + b + '` as "between". Use AND with two tests.');
        var flip = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' };
        return 'AND(' + r + flip[o1] + a + ', ' + r + o2 + b + ')';
      });
    });
    p = parse(f);

    // Unknown functions.
    p.calls.forEach(function (c) {
      if (!c.name || FUNCS[c.name]) return;
      if (/^(_XLFN|_XLWS)/.test(c.name)) { T('`_xlfn` means the file uses a function this version of Excel does not have.'); return; }
      var near1 = suggest(c.name);
      if (near1) B('`' + c.name + '` is not a function. Did you mean `' + near1 + '`?');
      else W('I do not recognize `' + c.name + '`. Unless it is your own LAMBDA or VBA function, Excel will show `#NAME?`.');
    });
    f = outside(f, function (s) {
      return s.replace(/([A-Za-z_][A-Za-z0-9_.]*)(\s*)\(/g, function (all, n) {
        var u = n.toUpperCase();
        if (FUNCS[u]) return u + '(';
        var sg = suggest(u);
        return sg && !/^_XL/.test(u) ? sg + '(' : all;
      });
    });
    p = parse(f);

    // Text that should be in quotes. LET and LAMBDA define names, so skip there.
    var defines = p.calls.some(function (c) { return /^(LET|LAMBDA|MAP|BYROW|BYCOL|REDUCE|SCAN)$/.test(c.name); });
    if (!defines) {
      var bareNames = {};
      f = outside(f, function (s) {
        return s.replace(/'[^']*'!|\[[^\]]*\]|([A-Za-z_][A-Za-z0-9_.]*)(?![A-Za-z0-9_.]*[!(\[:])/g, function (all, n, off, str) {
          if (!n) return all;
          if (/^(TRUE|FALSE)$/i.test(n) || FUNCS[n.toUpperCase()] || REF.test(n)) return all;
          if (/[:!$\]]$/.test(str.slice(0, off)) || /^\s*[:(!\[]/.test(str.slice(off + n.length))) return all;
          if (/[$A-Za-z0-9_.]$/.test(str.slice(0, off))) return all;
          if (/^[A-Z]{1,3}$/.test(n) && /\d/.test(str.slice(off + n.length, off + n.length + 2))) return all;
          // Comparing with it, or using it as an IF result, means it is text.
          var before = str.slice(0, off), textual = /[=<>]\s*$/.test(before) && before.trim() !== '=' || /,\s*$/.test(before);
          bareNames[n] = textual;
          return textual && !/^\w*(Rate|Total|Range|List|Table|Data|Sales)$/.test(n) ? '"' + n + '"' : all;
        });
      });
      var quoteThese = Object.keys(bareNames).filter(function (n) { return bareNames[n] && !/^\w*(Rate|Total|Range|List|Table|Data|Sales)$/.test(n); });
      if (quoteThese.length > 1) B(quoteThese.map(function (n) { return '`' + n + '`'; }).join(' and ') + ' are text, so each needs quotes: ' + quoteThese.map(function (n) { return '`"' + n + '"`'; }).join(' and ') + '. Without them Excel looks for named ranges and shows `#NAME?`.');
      Object.keys(bareNames).forEach(function (n) {
        if (quoteThese.length > 1 && quoteThese.indexOf(n) > -1) return;
        if (bareNames[n] && !/^\w*(Rate|Total|Range|List|Table|Data|Sales)$/.test(n)) B('`' + n + '` is text, so it needs quotes: `"' + n + '"`. Without them Excel looks for a named range and shows `#NAME?`.');
        else T('`' + n + '` must be a named range or Table in your workbook. If it is meant to be text, put it in quotes.');
      });
    }
    p = parse(f);

    // Function by function. Work from the end so earlier positions stay valid.
    var order = p.calls.slice().sort(function (a, b) { return b.start - a.start; });
    order.forEach(function (c) {
      var a = c.args, n = a.length, r, k;
      switch (c.name) {
        case 'VLOOKUP': case 'HLOOKUP':
          var what = c.name === 'VLOOKUP' ? 'column' : 'row';
          if (n < 3) { B(c.name + ' needs at least 3 parts: what to find, the table, and the ' + what + ' number.'); break; }
          r = rangeInfo(a[1]);
          if (/^\d+$/.test(a[2])) {
            k = +a[2];
            if (k < 1) B('The ' + what + ' number starts at 1.');
            else if (r && (c.name === 'VLOOKUP' ? r.cols : r.rows) && k > (c.name === 'VLOOKUP' ? r.cols : r.rows)) B('The table `' + a[1] + '` is only ' + (c.name === 'VLOOKUP' ? r.cols + ' columns wide' : r.rows + ' rows tall') + ', so ' + what + ' ' + k + ' gives `#REF!`.');
            if (c.name === 'VLOOKUP' && k === 1) W('Column 1 is the column you are matching on, so this returns the value you already have.');
          }
          if (n === 3) { B('The fourth part is missing, so Excel uses **approximate** match and can return a wrong answer with no error. Add `FALSE`.'); f = f.slice(0, c.open + 1) + a.concat('FALSE').join(', ') + f.slice(c.end); c = find(f, c.start); a = c.args; }
          else if (/^(TRUE|1)$/i.test(a[3])) W('`' + a[3] + '` means approximate match. That is right for brackets such as tax or grade scales sorted smallest first. For IDs or names, use `FALSE`.');
          if (n > 4) B(c.name + ' takes 4 parts at most, and this has ' + n + '.');
          if (c.name === 'VLOOKUP') T('VLOOKUP only looks right. XLOOKUP (Excel 2021 and later) looks either way.');
          break;
        case 'XLOOKUP':
          if (n < 3) { B('XLOOKUP needs 3 parts: what to find, where to look, and what to return.'); break; }
          var x1 = rangeInfo(a[1]), x2 = rangeInfo(a[2]);
          if (x1 && x2 && x1.rows && x2.rows && x1.rows !== x2.rows && x1.cols === 1) B('The search range has ' + x1.rows + ' rows and the return range has ' + x2.rows + '. They must match, or you get `#VALUE!`.');
          if (n === 3) T('Add a fourth part such as `"Not found"` to replace `#N/A`.');
          if (n > 3 && /^(TRUE|FALSE)$/i.test(a[3])) W('The fourth part of XLOOKUP is the **not found** message, not exact match. XLOOKUP is already exact, so `' + a[3] + '` can go.');
          break;
        case 'MATCH':
          if (n < 2) B('MATCH needs what to find and where to look.');
          else if (n === 2) { B('MATCH is missing its third part. Without `0` it uses approximate match on sorted data.'); f = f.slice(0, c.open + 1) + a.concat('0').join(', ') + f.slice(c.end); c = find(f, c.start); }
          break;
        case 'IF':
          if (n === 1) B('IF needs a test **and** at least one result.');
          else if (n === 2) W('There is no third part, so it shows FALSE when the test fails. Add what you want instead, such as `""`.');
          else if (n > 3) B('IF takes 3 parts and this has ' + n + '. Check for a misplaced bracket, or a comma inside a number such as 1,000.');
          break;
        case 'IFS':
          if (n % 2) B('IFS needs pairs of test and result, and this has an odd number of parts.');
          if (n >= 2 && !/^(TRUE|1=1)$/i.test(a[n - 2])) T('End IFS with `TRUE, "something"` so rows that match nothing do not show `#N/A`.');
          ladder(a, W);
          break;
        case 'IFERROR': case 'IFNA':
          if (n === 1) B(c.name + ' needs a second part: what to show instead.');
          else if (c.name === 'IFERROR' && /LOOKUP|MATCH/i.test(a[0])) T('For lookups, IFNA is safer than IFERROR. It hides "not found" but still shows real mistakes.');
          break;
        case 'COUNTIF':
          if (n !== 2) B('COUNTIF takes exactly 2 parts (range, condition) and this has ' + n + '.' + (n > 2 ? ' For more conditions use COUNTIFS.' : ''));
          crit(c, 1);
          break;
        case 'SUMIF': case 'AVERAGEIF':
          if (n < 2 || n > 3) B(c.name + ' takes 2 or 3 parts and this has ' + n + '.' + (n > 3 ? ' For several conditions use ' + c.name + 'S, with the numbers **first**.' : ''));
          if (n === 3 && isStr(a[0])) B('The range comes first in ' + c.name + ', then the condition.');
          sizes([a[0], a[2]], c.name);
          crit(c, 1);
          break;
        case 'SUMIFS': case 'AVERAGEIFS': case 'MAXIFS': case 'MINIFS':
          if (n < 3 || n % 2 === 0) B(c.name + ' needs the numbers first, then pairs of range and condition. This has ' + n + ' parts' + (n >= 3 ? ', so one half of a pair is missing.' : '.'));
          if (n >= 2 && (isStr(a[1]) || /^[<>=]/.test(a[1]))) B('The numbers to use come **first** in ' + c.name + '. This looks like the order for ' + c.name.slice(0, -1) + '.');
          else { sizes(a.filter(function (_, i) { return i === 0 || i % 2 === 1; }), c.name); for (k = 2; k < n; k += 2) crit(c, k); }
          break;
        case 'COUNTIFS':
          if (n % 2) B('COUNTIFS needs pairs of range and condition, and this has an odd number of parts.');
          sizes(a.filter(function (_, i) { return i % 2 === 0; }), c.name);
          for (k = 1; k < n; k += 2) crit(c, k);
          break;
        case 'SUMPRODUCT':
          sizes(a, c.name);
          break;
        case 'SUM': case 'AVERAGE': case 'MAX': case 'MIN':
          if (n === 1 && /^\$?[A-Z]{1,3}\$?\d+(\s*\+\s*\$?[A-Z]{1,3}\$?\d+)+$/i.test(a[0])) T('With `+` inside it, SUM is not doing anything. Use a range such as `SUM(A1:A5)`, which also skips text.');
          if (n === 1 && /^\$?[A-Z]{1,3}\$?\d+\s*-\s*\$?[A-Z]{1,3}\$?\d+$/i.test(a[0])) W('`' + a[0] + '` subtracts. For a range use a colon: `' + a[0].replace(/\s*-\s*/, ':') + '`.');
          if (n === 2 && REF.test(a[0]) && REF.test(a[1])) T('With a comma this uses only those two cells. For everything between them, use a colon: `' + a[0] + ':' + a[1] + '`.');
          if (n === 0) B(c.name + ' needs a range inside the brackets.');
          break;
        case 'PMT': case 'FV': case 'PV':
          if (n < 3) B(c.name + ' needs a rate, a number of periods and an amount.');
          else if (/^\d+(\.\d+)?%$|^0?\.\d+$/.test(a[0])) W('`' + a[0] + '` is used as the rate for **each period**. If it is a yearly rate and payments are monthly, use `' + a[0] + '/12` and multiply the years by 12.');
          else if (/^\d{1,2}(\.\d+)?$/.test(a[0]) && +a[0] >= 1) B('The rate `' + a[0] + '` means ' + a[0] + '00%. Write it as a percentage: `' + a[0] + '%`.');
          break;
        case 'NPV':
          T('NPV discounts its first value by a full period, so add the time-zero cost outside it.');
          break;
        case 'DATEDIF':
          if (n !== 3) B('DATEDIF takes 3 parts: start, end and a unit such as `"Y"`.');
          break;
        case 'ROUND': case 'ROUNDUP': case 'ROUNDDOWN':
          if (n < 2) B(c.name + ' needs the number of decimals, such as `, 2`.');
          break;
        case 'LEFT': case 'RIGHT': case 'MID':
          if (c.name === 'MID' && n !== 3) B('MID takes 3 parts: text, start position, how many characters.');
          break;
        case 'TEXTJOIN':
          if (n < 3) B('TEXTJOIN takes a separator, TRUE or FALSE for skipping blanks, then the text.');
          break;
        case 'INDIRECT': case 'OFFSET':
          T(c.name + ' recalculates on every change and breaks silently when cells move. INDEX usually does the same job.');
          break;
      }
      // Lock the ranges that must not slide.
      if (LOCKARG[c.name]) {
        var slid = [];
        LOCKARG[c.name].forEach(function (i) {
          var q = a[i] && rangeInfo(a[i]);
          if (q && !q.whole && !q.locked) slid.push(i);
        });
        if (slid.length) {
          W('`' + slid.map(function (i) { return a[i]; }).join('` and `') + '` will slide as you copy the formula down. Lock ' + (slid.length > 1 ? 'them' : 'it') + ' with `$` (F4).');
          c = find(f, c.start);
          slid.forEach(function (i) { f = swapArg(f, c, i, lockRange(c.args[i])); c = find(f, c.start); });
        }
      } else if (/^(SUMIFS|AVERAGEIFS|MAXIFS|MINIFS|COUNTIFS)$/.test(c.name)) {
        var off = c.name === 'COUNTIFS' ? 0 : 1, any = [];
        a.forEach(function (v, i) { var q = rangeInfo(v); if (q && !q.whole && !q.locked && (off ? (i === 0 || i % 2 === 1) : i % 2 === 0)) any.push(i); });
        if (any.length) {
          W('The ranges will slide as you copy the formula down. Lock them with `$` (F4).');
          c = find(f, c.start);
          any.forEach(function (i) { f = swapArg(f, c, i, lockRange(c.args[i])); c = find(f, c.start); });
        }
      }
      if (OLD[c.name]) T('`' + c.name + '` still works, but the current version is ' + OLD[c.name] + '.');
      var fn = FUNCS[c.name];
      if (fn && fn.v && +fn.v >= 2021) T('`' + c.name + '` needs ' + (fn.v === '365' ? 'Microsoft 365' : 'Excel ' + fn.v + ' or Microsoft 365') + '. Older versions show `#NAME?`.');
    });

    function find(s, start) { return parse(s).calls.filter(function (c) { return c.start === start; })[0]; }
    function sizes(list, name) {
      var seen = list.filter(Boolean).map(function (r) { return { r: r, i: rangeInfo(r) }; }).filter(function (x) { return x.i && x.i.rows; });
      for (var i = 1; i < seen.length; i++) if (seen[i].i.rows !== seen[0].i.rows) { B('`' + seen[0].r + '` has ' + seen[0].i.rows + ' rows and `' + seen[i].r + '` has ' + seen[i].i.rows + '. ' + (name === 'SUMIF' || name === 'AVERAGEIF' ? 'They should match, or the wrong rows get used.' : 'They must match, or you get `#VALUE!`.')); return; }
    }
    function crit(c, i) {
      var v = c.args[i], cur;
      if (v == null) return;
      if (/^(<=|>=|<>|<|>|=)/.test(v)) {
        var mm = /^(<=|>=|<>|<|>|=)\s*(.+)$/.exec(v); if (!mm) return;
        var fixed = /^-?[\d.]+%?$/.test(mm[2]) ? '"' + mm[1] + mm[2] + '"' : '"' + mm[1] + '"&' + mm[2];
        B('A condition with an operator needs quotes: `' + fixed + '`.');
        cur = find(f, c.start); f = swapArg(f, cur, i, fixed); c.args[i] = fixed;
      } else if ((m = /^"(<=|>=|<>|<|>|=)\s*(\$?[A-Z]{1,3}\$?\d+)"$/i.exec(v))) {
        var joined = '"' + m[1] + '"&' + m[2];
        B('Inside quotes, `' + m[2] + '` is just letters. Join the cell on: `' + joined + '`.');
        cur = find(f, c.start); f = swapArg(f, cur, i, joined); c.args[i] = joined;
      }
    }
    function ladder(a, say) {
      var last = null;
      for (var i = 0; i < a.length; i += 2) {
        var t = /^(\$?[A-Z]{1,3}\$?\d+)\s*(>=?|<=?)\s*(-?[\d.]+)$/i.exec(a[i]);
        if (!t) { last = null; continue; }
        if (last && last.ref === t[1] && last.op[0] === t[2][0] && ((t[2][0] === '>' && +t[3] > last.v) || (t[2][0] === '<' && +t[3] < last.v))) {
          say('The test `' + a[i] + '` can never be reached, because `' + last.text + '` catches it first. Put the strictest test first.'); return;
        }
        last = { ref: t[1], op: t[2], v: +t[3], text: a[i] };
      }
    }

    // Nested IFs, checked as one ladder.
    p = parse(f);
    var ifs = p.calls.filter(function (c) { return c.name === 'IF'; });
    if (ifs.length >= 3) T('With ' + ifs.length + ' IFs nested, **IFS** is easier to read.');
    if (ifs.length >= 2) { var flatArgs = []; ifs.forEach(function (c) { flatArgs.push(c.args[0] || '', ''); }); ladder(flatArgs, W); }

    // Whole-formula patterns.
    if ((m = /(?:[<>=])\s*"(-?\d+(?:\.\d+)?)"/.exec(f)) && !/(SUMIFS?|COUNTIFS?|AVERAGEIFS?|MAXIFS|MINIFS)\([^)]*"[<>=]*\d/i.test(f)) {
      B('`"' + m[1] + '"` in quotes is text, so comparing it with a number never matches the way you want. Use `' + m[1] + '`.');
      f = f.replace(/([<>=]\s*)"(-?\d+(?:\.\d+)?)"/g, '$1$2');
    }
    if (/\/\s*\$?[A-Z]{1,3}\$?\d+/i.test(outside(f, function (s) { return s; }).replace(/"[^"]*"/g, '')) && !/IFERROR|IF\(/i.test(f)) T('If the cell you divide by can be empty or zero, you will see `#DIV/0!`.');
    if (/^=\s*\$?[A-Z]{1,3}\$?\d+(\s*\+\s*\$?[A-Z]{1,3}\$?\d+){3,}$/i.test(f)) T('A SUM over a range is shorter, and it will not break when one cell holds text.');
    if (/#REF!/i.test(f)) B('`#REF!` inside the formula means a cell it used was deleted. Undo, or type the reference again.');
    if (/;/.test(f.replace(/"[^"]*"/g, '')) && !/,/.test(f.replace(/"[^"]*"/g, '')) && !/\{/.test(f)) T('You are using `;` between parts, which is right for European settings. US Excel uses commas.');

    return { f: f, bad: bad, warn: warn, tip: tip, calls: parse(f).calls };
  }

  /* Plain-English reading of a formula. */
  function splitTop(s, re) {
    var depth = 0, inq = false;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (ch === '"') inq = !inq;
      if (inq) continue;
      if (ch === '(' || ch === '[') depth++;
      if (ch === ')' || ch === ']') depth--;
      if (!depth) { var m = re.exec(s.slice(i)); if (m && m.index === 0) return [s.slice(0, i).trim(), m[0].trim(), s.slice(i + m[0].length).trim()]; }
    }
    return null;
  }
  function say(s) {
    s = (s || '').trim();
    if (s === '') return 'nothing';
    if (s === '""') return 'a blank';
    if (isStr(s)) return '"' + s.slice(1, -1) + '"';
    var c = splitTop(s, /^(<=|>=|<>|=|<|>)/);
    if (c && c[0]) return say(c[0]) + ({ '=': ' is ', '<>': ' is not ', '>': ' is more than ', '>=': ' is at least ', '<': ' is less than ', '<=': ' is at most ' })[c[1]] + (c[2] === '""' ? 'blank' : say(c[2]));
    var call = /^([A-Z][A-Z0-9.]*)\(/i.exec(s);
    if (call) {
      var p = parse(s).calls[0];
      if (p && p.start === 0 && p.end === s.length - 1) return sayCall(p.name, p.args);
    }
    return '`' + s + '`';
  }
  function sayCrit(v) {
    var m = /^"(<=|>=|<>|<|>|=)(.*)"$/.exec(v || '');
    var j = /^"(<=|>=|<>|<|>|=)"\s*&\s*(.+)$/.exec(v || '');
    var t = { '=': 'is', '<>': 'is not', '>': 'is more than', '>=': 'is at least', '<': 'is less than', '<=': 'is at most' };
    if (m) return t[m[1]] + ' ' + (m[2] || 'blank');
    if (j) return t[j[1]] + ' ' + say(j[2]);
    return 'is ' + say(v);
  }
  function sayCall(n, a) {
    var i, out;
    switch (n) {
      case 'IF': return 'if ' + say(a[0]) + ', show ' + say(a[1]) + (a.length > 2 ? '; otherwise ' + (/^IF\(/i.test(a[2]) ? say(a[2]) : 'show ' + say(a[2])) : '');
      case 'IFS': out = []; for (i = 0; i + 1 < a.length; i += 2) out.push(/^TRUE$/i.test(a[i]) ? 'anything else gives ' + say(a[i + 1]) : 'if ' + say(a[i]) + ', show ' + say(a[i + 1])); return out.join('; ');
      case 'AND': return a.map(say).join(' and ');
      case 'OR': return a.map(say).join(' or ');
      case 'NOT': return 'not (' + say(a[0]) + ')';
      case 'SUM': return 'the total of ' + a.map(say).join(' and ');
      case 'AVERAGE': return 'the average of ' + a.map(say).join(' and ');
      case 'COUNT': return 'how many numbers are in ' + a.map(say).join(' and ');
      case 'COUNTA': return 'how many cells are filled in ' + a.map(say).join(' and ');
      case 'MAX': return 'the largest value in ' + a.map(say).join(' and ');
      case 'MIN': return 'the smallest value in ' + a.map(say).join(' and ');
      case 'VLOOKUP': return 'find ' + say(a[0]) + ' in the first column of ' + say(a[1]) + ' and return column ' + (a[2] || '?') + (/^(FALSE|0)$/i.test(a[3] || '') ? ', exact match' : ', approximate match');
      case 'XLOOKUP': return 'find ' + say(a[0]) + ' in ' + say(a[1]) + ' and return the matching value from ' + say(a[2]) + (a[3] ? '; if it is missing, show ' + say(a[3]) : '');
      case 'MATCH': return 'the position of ' + say(a[0]) + ' in ' + say(a[1]);
      case 'INDEX': return 'from ' + say(a[0]) + ', return row ' + say(a[1]) + (a[2] ? ', column ' + say(a[2]) : '');
      case 'SUMIF': return 'add ' + say(a[2] || a[0]) + ' where ' + say(a[0]) + ' ' + sayCrit(a[1]);
      case 'AVERAGEIF': return 'average ' + say(a[2] || a[0]) + ' where ' + say(a[0]) + ' ' + sayCrit(a[1]);
      case 'COUNTIF': return 'count the cells in ' + say(a[0]) + ' where the value ' + sayCrit(a[1]);
      case 'SUMIFS': case 'AVERAGEIFS': case 'MAXIFS': case 'MINIFS':
        out = []; for (i = 1; i + 1 < a.length; i += 2) out.push(say(a[i]) + ' ' + sayCrit(a[i + 1]));
        return ({ SUMIFS: 'add ', AVERAGEIFS: 'average ', MAXIFS: 'the largest of ', MINIFS: 'the smallest of ' })[n] + say(a[0]) + ' where ' + out.join(' and ');
      case 'COUNTIFS': out = []; for (i = 0; i + 1 < a.length; i += 2) out.push(say(a[i]) + ' ' + sayCrit(a[i + 1])); return 'count the rows where ' + out.join(' and ');
      case 'IFERROR': return say(a[0]) + '; if that gives any error, show ' + say(a[1]);
      case 'IFNA': return say(a[0]) + '; if it is not found, show ' + say(a[1]);
      case 'ROUND': return say(a[0]) + ', rounded to ' + (a[1] || '?') + ' decimals';
      case 'LEFT': return 'the first ' + (a[1] || '1') + ' characters of ' + say(a[0]);
      case 'RIGHT': return 'the last ' + (a[1] || '1') + ' characters of ' + say(a[0]);
      case 'TRIM': return say(a[0]) + ' without extra spaces';
      case 'PMT': return 'the payment per period on ' + say((a[2] || '').replace(/^-/, '')) + ' over ' + say(a[1]) + ' periods at ' + say(a[0]) + ' a period';
      case 'TODAY': return 'today';
    }
    var fn = FUNCS[n];
    return (fn ? fn.d : n) + (a.length ? ' (using ' + a.map(say).join(', ') + ')' : '');
  }
  function cap(s) { return s.replace(/^(["`]?)([a-z])/, function (_, q, c) { return q === '`' ? q + c : q + c.toUpperCase(); }); }

  function doctor(ex) {
    var r = check(ex.f, ex.bare), out = [], body = r.f.replace(/^=/, '');
    var norm = function (s) { return s.replace(/\s+/g, '').toUpperCase(); };
    var changed = norm(r.f) !== norm(ex.f), nBad = r.bad.length, nWarn = r.warn.length;
    if (nBad) {
      out.push('**Found ' + (nBad === 1 ? 'a problem' : nBad + ' problems') + '**');
      out.push(r.bad.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n'));
    } else out.push('**The structure looks right.** Every bracket closes and the parts are in the order Excel expects.');
    if (nWarn) { out.push('**Check this**'); out.push(r.warn.map(function (s) { return '- ' + s; }).join('\n')); }
    if (changed) { out.push('**Try this instead**'); out.push('```excel\n' + r.f + '\n```'); }
    var known = r.calls.every(function (c) { return !c.name || FUNCS[c.name]; });
    if (known && r.f.length < 220 && !(nBad && !changed)) out.push('**In plain English:** ' + cap(say(body)) + '.');
    if (r.tip.length) out.push(r.tip.slice(0, 2).map(function (s) { return '*Tip:* ' + s; }).join('\n'));
    if (!nBad) out.push('I can read the formula but not your data. If it still goes wrong, tell me the exact error it shows.');
    var ids = [], map = { VLOOKUP: 'vlookup', HLOOKUP: 'vlookup', XLOOKUP: 'xlookup', INDEX: 'index-match', MATCH: 'index-match', IF: 'if', IFS: 'if', SUMIF: 'sumifs', SUMIFS: 'sumifs', COUNTIF: 'countifs', COUNTIFS: 'countifs', AVERAGEIF: 'averageif', IFERROR: 'iferror', IFNA: 'iferror', PMT: 'loan', FV: 'loan', SUMPRODUCT: 'sumproduct', LET: 'let', LAMBDA: 'lambda', FILTER: 'filter-function', UNIQUE: 'unique-list', TEXTJOIN: 'combine-text', DATEDIF: 'date', ROUND: 'round', AND: 'and-or', OR: 'and-or' };
    r.calls.forEach(function (c) { var id = map[c.name]; if (id && ids.indexOf(id) < 0) ids.push(id); });
    return { md: out.join('\n\n'), kind: 'check', id: ids[0] || null, chips: ids.slice(0, 2).map(label).concat(['Explain the error codes', 'Check another formula']), fixed: r.f, report: r };
  }

  /* ------------------------------------------------------------------
   * Formula writing from a sentence
   * --------------------------------------------------------------- */
  var OPS = [
    [/^(?:is |are |=|==)?\s*(?:greater than or equal to|at least|no less than|>=|or more)\s*/i, '>='],
    [/^(?:is |are )?\s*(?:less than or equal to|at most|no more than|<=|up to)\s*/i, '<='],
    [/^(?:is |are )?\s*(?:greater than|more than|bigger than|higher than|larger than|over|above|>)\s*/i, '>'],
    [/^(?:is |are )?\s*(?:less than|lower than|smaller than|fewer than|under|below|<)\s*/i, '<'],
    [/^(?:is not|are not|isn'?t|is n'?t|not equal to|does not equal|<>|!=)\s*(?:equal to )?/i, '<>'],
    [/^(?:contains?|includes?|has)\s+/i, '*'],
    [/^(?:is equal to|equals?|is|are|says?|=)\s*/i, '=']
  ];
  function cond(s) {
    s = s.trim().replace(/[?.!]+$/, '');
    for (var i = 0; i < OPS.length; i++) {
      var m = OPS[i][0].exec(s);
      if (m && m[0]) return { op: OPS[i][1], v: s.slice(m[0].length).trim().replace(/^["']|["']$/g, '') };
    }
    return null;
  }
  function critText(c) {
    var v = c.v.replace(/^\$(?=\d)/, '').replace(/(\d),(?=\d{3}\b)/g, '$1');
    if (/^(?:blank|empty|nothing)$/i.test(v)) return c.op === '<>' ? '"<>"' : '""';
    if (REF.test(v) && /^[A-Z]/.test(v)) return c.op === '=' ? v.toUpperCase() : c.op === '*' ? '"*"&' + v.toUpperCase() + '&"*"' : '"' + c.op + '"&' + v.toUpperCase();
    if (c.op === '*') return '"*' + v + '*"';
    if (c.op === '=') return /^-?[\d.]+%?$/.test(v) ? v : '"' + v + '"';
    return '"' + c.op + v + '"';
  }
  function col(c) { c = c.toUpperCase(); return '$' + c + ':$' + c; }
  function rng(s) {
    var m = /^column\s+([a-z]{1,2})$/i.exec(s.trim()) || /^([a-z]{1,2})$/i.exec(s.trim());
    if (m) return col(m[1]);
    m = /^([a-z]{1,2})(\d+)\s*(?::|to|through|-)\s*([a-z]{1,2})(\d+)$/i.exec(s.trim());
    if (m) return '$' + m[1].toUpperCase() + '$' + m[2] + ':$' + m[3].toUpperCase() + '$' + m[4];
    return null;
  }
  function lit(v) {
    v = v.trim().replace(/[?.!,]+$/, '').replace(/^(?:show|say|display|return|put|write|it says|then|give)\s+/i, '').replace(/^["']|["']$/g, '');
    if (/^-?[\d.]+%?$/.test(v)) return v;
    if (REF.test(v) && /\d/.test(v)) return v.toUpperCase();
    if (/^(?:blank|empty|nothing)$/i.test(v)) return '""';
    if (/^\$?[A-Z]{1,3}\$?\d+\s*[-+*\/]/i.test(v)) return v.toUpperCase();
    return '"' + v.replace(/"/g, '""') + '"';
  }
  function built(f, why, id, extra) {
    return { md: '```excel\n' + f + '\n```\n\n' + why + (extra ? '\n\n' + extra : '') + '\n\nSwap in your own cells if yours are different.', kind: 'write', id: id, fixed: f, chips: [label(id), 'Explain it', 'Write another formula'] };
  }
  var C = '(?:the\\s+)?(?:(?:values?|numbers?|cells?|amounts?)\\s+in\\s+)?(?:the\\s+)?(column\\s+[a-z]{1,2}|[a-z]{1,2}\\d+\\s*(?::|to|through)\\s*[a-z]{1,2}\\d+)';
  function write(text) {
    var s = straighten(text).replace(/\s+/g, ' ').trim(), m, v;
    var cell = '(\\$?[a-z]{1,2}\\$?\\d+)';

    // Add / average / count / max / min, with any number of conditions.
    m = new RegExp('\\b(sum|add(?: up)?|total|average|mean|count|how many|max(?:imum)?|highest|largest|min(?:imum)?|lowest|smallest)\\b(.*)$', 'i').exec(s);
    if (m) {
      var verb = m[1].toLowerCase(), rest = m[2], kind = /sum|add|total/.test(verb) ? 'SUM' : /aver|mean/.test(verb) ? 'AVERAGE' : /count|how many/.test(verb) ? 'COUNT' : /max|high|larg/.test(verb) ? 'MAX' : 'MIN';
      var w = /\b(?:where|when|if|for which|only if|whenever)\b(.*)$/i.exec(rest);
      var head = w ? rest.slice(0, w.index) : rest;
      var target = new RegExp(C, 'i').exec(head), tr = target && rng(target[1]);
      if (w) {
        var conds = w[1].split(/\s+and\s+(?=(?:the\s+)?(?:column\s+[a-z]{1,2}\b|[a-z]{1,2}\d+\s*(?::|to)))/i).map(function (part) {
          var cm = new RegExp('^\\s*' + C + '\\s*(.*)$', 'i').exec(part);
          if (!cm) return null;
          var k = cond(cm[2]);
          return k && k.v ? { r: rng(cm[1]), c: k } : null;
        });
        if (conds.length && conds.every(Boolean)) {
          var pairs = conds.map(function (x) { return x.r + ', ' + critText(x.c); }).join(', ');
          if (kind === 'COUNT') return built('=COUNTIFS(' + pairs + ')', 'COUNTIFS counts the rows where ' + (conds.length > 1 ? 'every condition is' : 'the condition is') + ' met.', 'countifs');
          if (tr) {
            var name = { SUM: 'SUMIFS', AVERAGE: 'AVERAGEIFS', MAX: 'MAXIFS', MIN: 'MINIFS' }[kind];
            return built('=' + name + '(' + tr + ', ' + pairs + ')', 'The numbers come first, then each range with its condition. Whole columns are used so new rows are included.', kind === 'SUM' ? 'sumifs' : kind === 'AVERAGE' ? 'averageif' : 'maxifs', /MAX|MIN/.test(kind) ? name + ' needs Excel 2019 or later.' : '');
          }
        }
      } else if (kind === 'COUNT') {
        m = new RegExp('(?:times|often|cells?|how many)?\\s*["\']?([a-z0-9][\\w .-]*?)["\']?\\s+(?:appears?|shows? up|occurs?|is|are)\\s+(?:listed )?in\\s+' + C, 'i').exec(rest.replace(/^\s*(?:the\s+)?(?:number of\s+)?(?:times|often)?\s*(?:does|do|did|that)?\s*/i, ''));
        if (m && rng(m[2])) return built('=COUNTIF(' + rng(m[2]) + ', ' + lit(m[1]) + ')', 'COUNTIF counts the cells equal to your value. Upper and lower case count the same.', 'countifs');
        if (tr && /\b(unique|different|distinct)\b/i.test(rest)) return built('=COUNTA(UNIQUE(FILTER(' + tr + ', ' + tr + '<>"")))', 'FILTER drops the blanks, UNIQUE keeps one of each, and COUNTA counts them.', 'unique-count', 'Needs Microsoft 365 or Excel 2021.');
        if (tr) return built('=COUNTA(' + tr + ')', 'COUNTA counts every cell that is not empty. Use COUNT instead for numbers only. A header row counts as one.', 'countifs');
      } else if (tr && !/\b(second|third|2nd|3rd|top|bottom)\b/i.test(s)) {
        return built('=' + kind + '(' + tr.replace(/\$/g, '') + ')', 'Type it in a cell **outside** that range, or it will be a circular reference.', 'average');
      }
    }

    // IF sentences.
    m = new RegExp('\\bif\\s+' + cell + '\\s+(.+?)\\s*(?:,|\\bthen\\b|\\bshow\\b|\\bsay\\b|\\breturn\\b|\\bput\\b|\\bdisplay\\b)\\s*(.+?)(?:\\s*[,;]?\\s*\\b(?:otherwise|else|if not|or else)\\b\\s*,?\\s*(.+))?$', 'i').exec(s);
    if (m) {
      var k = cond(m[2]);
      if (k && k.v && m[3]) {
        var ref = m[1].toUpperCase(), test = k.op === '*' ? 'ISNUMBER(SEARCH("' + k.v + '", ' + ref + '))' : ref + k.op + lit(k.v.replace(/^\$(?=\d)/, '').replace(/(\d),(?=\d{3}\b)/g, '$1'));
        return built('=IF(' + test + ', ' + lit(m[3]) + ', ' + (m[4] ? lit(m[4]) : '""') + ')', 'Text goes in quotes and numbers do not.' + (m[4] ? '' : ' You did not say what to show otherwise, so it stays blank.'), 'if');
      }
    }

    // Lookups.
    m = new RegExp('\\b(?:look\\s*up|find|match)\\s+' + cell + '\\s+in\\s+(?:the\\s+)?column\\s+([a-z]{1,2})\\b(.*?)\\b(?:return|get|give me|bring back|pull)\\s+(?:the\\s+)?(?:value\\s+(?:from|in)\\s+)?column\\s+([a-z]{1,2})(.*)$', 'i').exec(s);
    if (m) {
      var sh = /\b(?:on|from|in)\s+(?:the\s+)?(?:sheet\s+(?:called\s+|named\s+)?["']?([\w ]+?)["']?|["']?([\w]+)["']?\s+(?:sheet|tab))\s*(?:,|and\b|$|\.)/i.exec(m[3] + ' ' + m[5]);
      var sn = sh ? (sh[1] || sh[2]) : '', pre = sn ? (/[^A-Za-z0-9_]/.test(sn) ? "'" + sn + "'!" : sn + '!') : '';
      return built('=XLOOKUP(' + m[1].toUpperCase() + ', ' + pre + col(m[2]) + ', ' + pre + col(m[4]) + ', "Not found")', 'It finds your value in column ' + m[2].toUpperCase() + ' and returns the same row from column ' + m[4].toUpperCase() + '.', 'xlookup', 'No XLOOKUP in your version? Use this:\n\n```excel\n=IFNA(INDEX(' + pre + col(m[4]) + ', MATCH(' + m[1].toUpperCase() + ', ' + pre + col(m[2]) + ', 0)), "Not found")\n```');
    }

    // Percent change.
    m = new RegExp('\\b(?:percent(?:age)?|%)\\s+(?:change|increase|decrease|growth|difference)\\b.*?' + cell + '\\s+(?:to|and|vs\\.?)\\s+' + cell, 'i').exec(s);
    if (m) return built('=(' + m[2].toUpperCase() + '-' + m[1].toUpperCase() + ')/' + m[1].toUpperCase(), 'New minus old, divided by old. Format it as a percentage with **Ctrl+Shift+%**.', 'percent-change');

    // Days between.
    m = new RegExp('\\b(days|weekdays|workdays|business days|months|years)\\b.*?\\b(?:between|from)\\s+' + cell + '\\s+(?:and|to)\\s+' + cell, 'i').exec(s);
    if (m) {
      var u = m[1].toLowerCase(), a = m[2].toUpperCase(), b = m[3].toUpperCase();
      if (/week|work|business/.test(u)) return built('=NETWORKDAYS(' + a + ', ' + b + ')', 'Counts Monday to Friday, including both the first and the last day.', 'date');
      if (u === 'days') return built('=' + b + '-' + a, 'Later date minus earlier date. Format the cell as **General** if it shows a date.', 'date');
      return built('=DATEDIF(' + a + ', ' + b + ', "' + (u === 'months' ? 'M' : 'Y') + '")', 'Whole ' + u + ' only. The earlier date must come first.', 'date');
    }

    // Join, round, names.
    m = new RegExp('\\b(?:combine|join|concatenate|merge|put together)\\s+' + cell + '\\s+(?:and|with)\\s+' + cell + '(.*)$', 'i').exec(s);
    if (m) { var sep = /comma/i.test(m[3]) ? ', ' : /dash|hyphen/i.test(m[3]) ? '-' : /no space|without/i.test(m[3]) ? '' : ' '; return built('=' + m[1].toUpperCase() + (sep ? '&"' + sep + '"&' : '&') + m[2].toUpperCase(), 'The part in quotes goes between them.', 'combine-text'); }
    m = new RegExp('\\bround\\s+' + cell + '\\s+(?:up |down )?to\\s+(?:the nearest\\s+)?(\\d+|one|two|three|whole)', 'i').exec(s);
    if (m) {
      var num = { one: 1, two: 2, three: 3, whole: 0 }[m[2].toLowerCase()]; if (num === undefined) num = +m[2];
      if (/nearest\s+\d/i.test(s)) return built('=MROUND(' + m[1].toUpperCase() + ', ' + num + ')', 'Rounds to the nearest multiple of ' + num + '.', 'round');
      return built('=ROUND' + (/round\s+\S+\s+up/i.test(s) ? 'UP' : /round\s+\S+\s+down/i.test(s) ? 'DOWN' : '') + '(' + m[1].toUpperCase() + ', ' + num + ')', 'The second number is how many decimals to keep.', 'round');
    }
    m = new RegExp('\\b(first|last)\\s+name\\b.*?\\b(?:from|in|of)\\s+' + cell, 'i').exec(s);
    if (m) {
      v = m[2].toUpperCase();
      return /first/i.test(m[1]) ? built('=LEFT(' + v + ', FIND(" ", ' + v + ')-1)', 'Takes everything before the first space. Works in every version.', 'split-text')
        : built('=TRIM(RIGHT(SUBSTITUTE(' + v + ', " ", REPT(" ", 100)), 100))', 'Takes everything after the last space. Works in every version.', 'split-text');
    }

    // Loan payment, with the answer worked out.
    m = /\$?\s*([\d,]+(?:\.\d+)?)\s*(k)?\b.*?\b(\d+(?:\.\d+)?)\s*(?:%|percent).*?\b(\d+)\s*[- ]?\s*(year|yr|month)/i.exec(s);
    if (m && /\b(loan|payment|mortgage|borrow|financ|car|pay)\w*/i.test(s)) {
      var P = +m[1].replace(/,/g, '') * (m[2] ? 1000 : 1), R = +m[3], months = /month/i.test(m[4 + 1]) ? +m[4] : +m[4] * 12, rr = R / 1200;
      if (P > 0 && months > 0) {
        var pay = rr ? P * rr / (1 - Math.pow(1 + rr, -months)) : P / months;
        var money = function (x) { return '$' + x.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
        return built('=PMT(' + R + '%/12, ' + (/month/i.test(m[5]) ? months : m[4] + '*12') + ', -' + P + ')', 'That comes to **' + money(pay) + ' a month**, with about ' + money(pay * months - P) + ' of interest in total. The yearly rate is divided by 12, and the minus sign makes the answer positive.', 'loan');
      }
    }
    return null;
  }

  /* ------------------------------------------------------------------
   * Quiz
   * --------------------------------------------------------------- */
  var QUIZ = [
    { q: 'You fill `=B2*E1` down to row 3. What does row 3 calculate?', o: ['B3*E1', 'B3*E2', 'B2*E1'], a: 1, w: 'Both references move down one row. To keep E1 fixed, write `$E$1`.', id: 'absolute-reference' },
    { q: 'What does `FALSE` do at the end of a VLOOKUP?', o: ['Hides errors', 'Requires an exact match', 'Sorts the table'], a: 1, w: 'Without it, Excel uses approximate match and can return a wrong answer with no error.', id: 'vlookup' },
    { q: 'Which error means a lookup did not find the value?', o: ['#N/A', '#REF!', '#VALUE!'], a: 0, w: '`#N/A` is "not available". `#REF!` is a deleted reference, and `#VALUE!` is the wrong type.', id: 'na-error' },
    { q: 'Sales went from 400 to 500. What is the percent change?', o: ['20%', '25%', '125%'], a: 1, w: '(500-400)/400 = 25%. Divide by the **old** value.', id: 'percent-change' },
    { q: 'In SUMIFS, which part comes first?', o: ['The condition', 'The range to check', 'The numbers to add'], a: 2, w: 'SUMIFS puts the numbers first. SUMIF puts them last.', id: 'sumifs' },
    { q: 'Your source data changed but the PivotTable did not. What do you do?', o: ['Refresh it', 'Rebuild it', 'Save and reopen'], a: 0, w: 'Right-click → Refresh. PivotTables do not update on their own.', id: 'pivot-refresh' },
    { q: 'Which chart suits monthly sales over three years?', o: ['Pie', 'Line', 'Scatter'], a: 1, w: 'A line shows change over time. A pie shows parts of one whole.', id: 'chart' },
    { q: 'A cell shows `#####`. What is wrong?', o: ['The formula has an error', 'The column is too narrow', 'The file is damaged'], a: 1, w: 'Double-click the column border to widen it.', id: 'hash-width' },
    { q: 'Which formula counts cells that contain the word West?', o: ['=COUNT(A:A, "West")', '=COUNTIF(A:A, "West")', '=COUNTA("West")'], a: 1, w: 'COUNTIF takes the range, then the condition.', id: 'countifs' },
    { q: 'To freeze row 1 **and** column A, which cell do you select first?', o: ['A1', 'B2', 'A2'], a: 1, w: 'Freeze Panes keeps everything above and to the left of the selected cell.', id: 'freeze' },
    { q: 'You format 2.349 to show 2 decimals. What is stored in the cell?', o: ['2.35', '2.34', '2.349'], a: 2, w: 'Formatting changes only what you see. Use ROUND to change the value.', id: 'round' },
    { q: 'What does `=IF(A2>=70, "Pass")` show when A2 is 60?', o: ['A blank', 'FALSE', 'An error'], a: 1, w: 'With no third part, IF returns FALSE when the test fails.', id: 'if' },
    { q: 'Which one tests that A2 is between 70 and 90?', o: ['=70<A2<90', '=AND(A2>70, A2<90)', '=BETWEEN(A2,70,90)'], a: 1, w: 'Excel needs two separate tests joined by AND.', id: 'and-or' },
    { q: 'What is the safest way to add the visible rows after filtering?', o: ['SUM', 'SUBTOTAL', 'COUNT'], a: 1, w: 'SUM still counts hidden rows. SUBTOTAL(109, …) skips them.', id: 'subtotal' }
  ];
  function quizAsk(st) {
    var z = st.quiz, item = QUIZ[z.order[z.i]];
    return { md: '**Question ' + (z.i + 1) + ' of ' + z.order.length + '**\n\n' + item.q, kind: 'quiz', chips: item.o.concat(['Stop quiz']), id: item.id };
  }
  function quizStart(st, rnd) {
    var idx = QUIZ.map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor((rnd || Math.random)() * (i + 1)), t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    st.quiz = { order: idx.slice(0, 5), i: 0, score: 0, missed: [] };
    var r = quizAsk(st);
    r.md = 'Five quick questions. Tap an answer.\n\n' + r.md;
    return r;
  }
  function quizAnswer(text, st) {
    var z = st.quiz, item = QUIZ[z.order[z.i]], t = text.trim().toLowerCase();
    if (/^(stop|quit|exit|end|cancel)\b/.test(t)) { st.quiz = null; return { md: 'Quiz stopped at ' + z.score + ' of ' + z.i + '. Ask me anything else about Excel.', kind: 'talk', chips: HOME }; }
    var pick = -1;
    item.o.forEach(function (o, i) { if (o.toLowerCase() === t) pick = i; });
    if (pick < 0 && /^[a-c]$/.test(t)) pick = t.charCodeAt(0) - 97;
    if (pick < 0 && /^[1-3]$/.test(t)) pick = +t - 1;
    if (pick < 0) return null;
    var ok = pick === item.a, out;
    if (ok) z.score++; else z.missed.push(item.id);
    out = (ok ? '**Correct.** ' : '**Not quite.** The answer is ' + item.o[item.a].replace(/^=.*$/, '`$&`') + '. ') + item.w;
    z.i++;
    if (z.i >= z.order.length) {
      var missed = z.missed.filter(function (x, i, arr) { return arr.indexOf(x) === i; });
      out += '\n\n**Score: ' + z.score + ' of ' + z.order.length + '.** ' + (z.score === z.order.length ? 'Perfect.' : 'Review the ones you missed below.');
      st.quiz = null;
      return { md: out, kind: 'talk', chips: missed.slice(0, 3).map(label).concat(['Quiz me again']) };
    }
    var next = quizAsk(st);
    next.md = out + '\n\n' + next.md;
    return next;
  }

  /* ------------------------------------------------------------------
   * Conversation
   * --------------------------------------------------------------- */
  var HOME = ['Check my formula', 'Write a formula for me', 'How does VLOOKUP work?', 'Make a PivotTable', 'Why do I get #N/A?', 'Quiz me'];
  function label(id) { return BY[id] ? BY[id].title : id; }
  function chipsFor(t) {
    var c = [];
    if (t.ex) c.push('Show an example');
    if (t.fix) c.push('It is not working');
    if (t.mac) c.push('On a Mac?');
    return c.concat((t.next || []).slice(0, 3).map(label));
  }
  function topicReply(t, st) { st.last = t.id; return { md: t.body, kind: 'topic', id: t.id, title: t.title, chips: chipsFor(t) }; }
  function funcReply(name, st) {
    var f = FUNCS[name];
    st.last = null; st.func = name;
    return { md: '**' + name + ':** ' + f.d + '.\n\n```excel\n=' + f.s + '\n```' + (f.s.indexOf('[') > -1 ? '\n\nParts in square brackets are optional.' : '') + (f.v ? '\n\nNeeds ' + (f.v === '365' ? 'Microsoft 365' : 'Excel ' + f.v + ' or Microsoft 365') + '.' : ''), kind: 'function', id: name, chips: ['Check my formula', 'Write a formula for me', 'Explain the error codes'] };
  }
  var MULTI = { vlookup: 'lookup-two-criteria', xlookup: 'lookup-two-criteria', 'index-match': 'lookup-two-criteria', 'other-sheet': 'lookup-two-criteria', if: 'and-or' };

  function followUp(text, st) {
    var t = BY[st.last], s = text.trim().toLowerCase().replace(/[?.!]+$/, '');
    if (s.length > 60) return null;
    if (/^(explain( it| that| this)?|what does (it|that) (do|mean)|in plain english|break it down)$/.test(s) && st.formula) {
      return { md: '**In plain English:** ' + cap(say(st.formula.replace(/^=/, ''))) + '.', kind: 'topic', id: st.last, chips: t ? chipsFor(t) : HOME };
    }
    if (!t) return null;
    if (/^(show (me )?)?(an?|another|one more|more)?\s*examples?( please)?$|^(can you )?(show|give) me an(other)? example|^for example$|^like what$/.test(s)) {
      return t.ex ? { md: t.ex, kind: 'topic', id: t.id, title: t.title, chips: chipsFor(t).filter(function (c) { return c !== 'Show an example'; }) } : topicReply(t, st);
    }
    if (/^(it|that|this|mine)?\s*('s| is|s)? ?(still )?(not|isn'?t|doesn'?t|does not|didn'?t) ?(work|working|right)?\b|^(that )?(didn'?t|doesn'?t|did not|does not) work|^what if it (fails|does ?n.t work)|^(i )?(still )?get(ting)? (an )?error$|^why not$|^still (wrong|broken)/.test(s) && s.length < 40) {
      if (t.fix) return { md: '**If ' + t.title + ' is not working**\n\n' + t.fix, kind: 'topic', id: t.id, chips: ['Check my formula', 'Explain the error codes'].concat((t.next || []).slice(0, 2).map(label)) };
      return { md: 'Paste the exact formula, starting with `=`, and tell me the error it shows. I will check it.', kind: 'talk', chips: ['Explain the error codes'].concat((t.next || []).slice(0, 2).map(label)) };
    }
    if (/\b(mac|macbook|macos|cmd|command key)\b/.test(s) && tokens(s).filter(function (k) { return k !== 'mac' && VOCAB[k]; }).length === 0) {
      if (t.mac) return { md: t.mac, kind: 'topic', id: t.id, chips: chipsFor(t).filter(function (c) { return c !== 'On a Mac?'; }) };
      return { md: 'The formulas are identical on a Mac. Most shortcuts swap **Ctrl** for **Cmd**, and the menus have the same names.', kind: 'topic', id: t.id, chips: ['Keyboard shortcuts'].concat((t.next || []).slice(0, 2).map(label)) };
    }
    if (/\bgoogle sheets?\b/.test(s)) return { md: 'Most of this is the same in Google Sheets. FILTER, UNIQUE and SORT work with slightly different options, and `Ctrl+T` Tables and Power Query do not carry over. I am built for Excel, so test it there.', kind: 'topic', id: t.id, chips: chipsFor(t) };
    if (/\b(two|multiple|several|more than one|2|many) (conditions?|criteria|tests?|values?)\b/.test(s) && MULTI[t.id]) return topicReply(BY[MULTI[t.id]], st);
    if (/^(why|how come)$/.test(s)) return t.fix ? { md: t.fix, kind: 'topic', id: t.id, chips: chipsFor(t) } : null;
    if (/^(more|tell me more|go on|continue|and|what else|keep going)$/.test(s)) {
      if (t.ex && !st.sawEx) { st.sawEx = t.id; return { md: t.ex, kind: 'topic', id: t.id, chips: chipsFor(t) }; }
      var n = BY[(t.next || [])[0]]; return n ? topicReply(n, st) : null;
    }
    return null;
  }

  function talk(text) {
    var s = text.trim().toLowerCase().replace(/[?.!,]+$/, '');
    if (/^(hi+|hey+|hello+|yo|sup|howdy|good (morning|afternoon|evening)|what'?s up|hiya)( there| excel helper| bot)?$/.test(s)) return { md: 'Hi. Ask an Excel question, paste a formula to check, or describe what you want and I will write it.', chips: HOME };
    if (/^(thanks|thank you|thx|ty|cheers|appreciate it|perfect|great|awesome|nice|cool|got it|ok|okay|that worked|it worked|that helps)\b.{0,24}$/.test(s)) return { md: 'Glad it helped. What is next?', chips: ['Check my formula', 'Write a formula for me', 'Quiz me'] };
    if (/^(bye|goodbye|see ya|see you|later)\b/.test(s)) return { md: 'See you. Press Ctrl+S on the way out.', chips: HOME };
    if (/\b(who|what) are you\b|\bare you (a |an )?(real|human|bot|ai|gpt|chatgpt|robot)\b|\bwho (made|built|created) you\b|\bhow do you work\b|\bare you (using )?(chat)?gpt\b/.test(s)) return { md: 'I am **Excel Helper**, built by Roman Heuser for this site. I answer from a written Excel knowledge base and I check formulas with real rules, all inside this page. I am not a live language model, so I will not make up a function. If I do not know, I say so.', chips: HOME };
    if (/^(help|menu|what can you do|what do you (do|know)|what can i ask( you)?|how does this work|start|options|topics)$/.test(s)) return { md: 'Four things:\n\n1. **Answer** questions on ' + TOPICS.length + ' Excel topics.\n2. **Check a formula.** Paste it, starting with `=`.\n3. **Write a formula.** Say something like "add column C where column A is West".\n4. **Quiz you** with five quick questions.', chips: HOME };
    if (/^(please )?(check|fix|debug|review|look at) (my|a|another|this|the) formula$|^check another( formula)?$/.test(s)) return { md: 'Paste the formula, starting with `=`. For example:\n\n```excel\n=VLOOKUP(A2,D2:F50,3)\n```', chips: ['=VLOOKUP(A2,D2:F50,3)', '=IF(A2>=70,Pass,Fail)', '=SUMIF(A2:A50,>100,C2:C40)'] };
    if (/^(please )?(write|make|build|create) (me )?(a|another) formula( for me)?$/.test(s)) return { md: 'Describe it in a sentence, with your columns. For example:\n\n- Add column C where column A is West and column B is over 1000\n- If B2 is at least 70 show Pass, otherwise Fail\n- Look up A2 in column D and return column F\n- Payment on $20,000 at 6% for 5 years', chips: ['Add column C where column A is West', 'If B2 is at least 70 show Pass, otherwise Fail', 'Payment on $20,000 at 6% for 5 years'] };
    if (/\b(quiz|test) me\b|^(quiz|practice|start quiz|quiz me again|another quiz)$|\bpractice questions?\b/.test(s)) return { quiz: 1 };
    if (/\b(do|finish|complete|solve) (my|this|the) (homework|assignment|lab|exam|quiz|project|test|midterm|final)\b|\bgive me the answers?\b/.test(s)) return { md: 'I will not do graded work for you, but I can get you through it. Tell me the step you are stuck on, or paste the formula you have so far and I will show you what is wrong.', chips: ['Check my formula', 'Write a formula for me', 'Quiz me'] };
    return null;
  }

  var HINT = /\b(excel|formula|function|cell|column|row|sheet|workbook|worksheet|spreadsheet|data|table|chart|graph|pivot|cursor|ribbon|csv|xlsx|number|percent|average|sum|count|total|date|text)s?\b/i;
  function exactFunc(text) {
    var s = straighten(text), m;
    var bare = s.trim().replace(/[?.!]+$/, '');
    if (/^=?[A-Za-z][A-Za-z0-9.]*(\(\))?$/.test(bare)) { var b = bare.replace(/[=()]/g, '').toUpperCase(); if (FUNCS[b]) return b; }
    if ((m = /\b([A-Za-z][A-Za-z0-9.]{1,})\s+(?:function|formula)\b/i.exec(s)) && FUNCS[m[1].toUpperCase()]) return m[1].toUpperCase();
    if ((m = /\b(?:what (?:does|is)|explain|how (?:do|does|to)(?: (?:i|you))?(?: use)?|use|using)\s+(?:the\s+)?=?([A-Za-z][A-Za-z0-9.]{1,})\b(?:\s+(?:do|mean|work|function|formula))?\s*\??$/i.exec(s)) && FUNCS[m[1].toUpperCase()]) return m[1].toUpperCase();
    var caps = s.match(/\b[A-Z][A-Z0-9.]{2,}\b/g) || [];
    if (s !== s.toUpperCase()) for (var i = 0; i < caps.length; i++) if (FUNCS[caps[i]]) return caps[i];
    return null;
  }

  function reply(text, st) {
    st = st || {};
    text = String(text || '').slice(0, 2000).trim();
    if (!text) return { md: 'Type a question, or paste a formula that starts with `=`.', kind: 'talk', chips: HOME };
    var r;

    if (st.quiz) { r = quizAnswer(text, st); if (r) return r; }

    var ex = extract(text);
    if (ex) {
      st.quiz = null;
      r = doctor(ex);
      st.formula = r.fixed; if (r.id) st.last = r.id;
      return r;
    }

    r = talk(text);
    if (r) {
      if (r.quiz) return quizStart(st);
      r.kind = 'talk';
      return r;
    }
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].title.toLowerCase() === text.toLowerCase()) return topicReply(TOPICS[i], st);

    r = followUp(text, st);
    if (r) return r;

    r = write(text);
    if (r) { st.quiz = null; st.formula = r.fixed; st.last = r.id; return r; }

    // An error code anywhere in the message wins.
    var err = /#(n\/a|value|ref|name|div\/0|spill|num|calc|null)/i.exec(text);
    if (err) {
      var eid = { 'n/a': 'na-error', value: 'value-error', ref: 'ref-error', name: 'name-error', 'div/0': 'div0-error', spill: 'spill-error', num: 'num-error', calc: 'num-error', 'null': 'num-error' }[err[1].toLowerCase()];
      return topicReply(BY[eid], st);
    }
    if (/#{3,}/.test(text)) return topicReply(BY['hash-width'], st);
    if (/^(please )?(explain|list|what are) (the )?(excel )?error (codes|messages)$/i.test(text.replace(/[?.!]+$/, ''))) return topicReply(BY.errors, st);

    var found = search(text), top = found.top[0], fn = exactFunc(text);
    if (fn) {
      var covered = found.top.slice(0, 3).filter(function (x) { return x.t.keys.indexOf(fn.toLowerCase()) > -1; })[0];
      if (covered) return topicReply(covered.t, st);
      return funcReply(fn, st);
    }
    var strong = top && (top.bonus >= 7 && top.cover >= 0.3 || top.s >= 9 && top.cover >= 0.5 || top.ask >= 0.75);
    if (strong) {
      r = topicReply(top.t, st);
      var second = found.top[1];
      if (second && second.s > top.s * 0.86 && r.chips.indexOf(second.t.title) < 0) r.chips.splice(Math.min(2, r.chips.length), 0, second.t.title);
      return r;
    }
    var plain = words(text).some(function (w) { return PLAIN[w] && !VOCAB[w] && !STOP[w] && !/^(name|names|time|times|today|year|write|read|think|less|more|other|another|same|better|never|always|please|sorry|great|nice|city|state|house|person|people|number|email|phone|math|letter|money|water)$/.test(w); });
    var near3 = plain && !HINT.test(text) ? [] : found.top.filter(function (x) { return x.s >= 4 && x.cover >= 0.2; }).slice(0, 3);
    if (near3.length && (top.cover >= 0.34 || HINT.test(text))) {
      return { md: 'I am not certain which one you mean. Is it one of these? If not, try naming the function or the menu you are using.', kind: 'unsure', chips: near3.map(function (x) { return x.t.title; }).concat(['Check my formula']) };
    }
    if (HINT.test(text)) return { md: 'I do not have a reliable answer for that, and I would rather say so than guess. Try naming the function or the menu, or paste the formula you have.', kind: 'miss', chips: ['Check my formula', 'Write a formula for me', 'Explain the error codes'] };
    return { md: 'I only answer Microsoft Excel questions. Ask me about a formula, a PivotTable, a chart, or an error you are stuck on.', kind: 'off', chips: HOME };
  }

  /* ------------------------------------------------------------------
   * Rendering. Everything is escaped before any markup is added.
   * --------------------------------------------------------------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function inline(s) {
    var keep = [];
    s = s.replace(/`([^`\n]+)`/g, function (_, c) { keep.push('<code>' + esc(c) + '</code>'); return '\u0001' + (keep.length - 1) + '\u0002'; });
    s = esc(s)
      .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\*\*([^*\n]+?)\*\*/g, '<b>$1</b>')
      .replace(/(^|[\s(])\*([^*\n]+?)\*(?=[\s).,:;!?]|$)/g, '$1<em>$2</em>');
    return s.replace(/\u0001(\d+)\u0002/g, function (_, i) { return keep[+i]; });
  }
  function render(md) {
    var out = [], lines = String(md).replace(/\r/g, '').replace(/[\u0001\u0002]/g, '').split('\n'), i = 0, para = [], list = null;
    function flush() { if (para.length) { out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; } }
    function endList() { if (list) { out.push('<' + list.tag + (list.start > 1 ? ' start="' + list.start + '"' : '') + '>' + list.items.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</' + list.tag + '>'); list = null; } }
    while (i < lines.length) {
      var l = lines[i], m;
      if ((m = /^\s*```\s*(\w*)\s*$/.exec(l))) {
        flush(); endList();
        var code = []; i++;
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) code.push(lines[i++]);
        i++;
        out.push('<div class="xb-code"><pre><code>' + esc(code.join('\n').replace(/^\n+|\n+$/g, '')) + '</code></pre><button type="button" class="xb-copy">Copy</button></div>');
        continue;
      }
      if ((m = /^\s*#{1,6}\s+(.*)$/.exec(l))) { flush(); endList(); out.push('<p><b>' + inline(m[1].replace(/\*\*/g, '')) + '</b></p>'); i++; continue; }
      if ((m = /^\s*(?:[-*•])\s+(.*)$/.exec(l))) { flush(); if (!list || list.tag !== 'ul') { endList(); list = { tag: 'ul', items: [], start: 1 }; } list.items.push(m[1]); i++; continue; }
      if ((m = /^\s*(\d+)[.)]\s+(.*)$/.exec(l))) { flush(); if (!list || list.tag !== 'ol') { endList(); list = { tag: 'ol', items: [], start: +m[1] }; } list.items.push(m[2]); i++; continue; }
      if (/^\s*$/.test(l)) { flush(); if (!/^\s*(?:[-*•]|\d+[.)])\s+/.test(lines[i + 1] || '')) endList(); i++; continue; }
      if (list && /^\s{2,}\S/.test(l)) { list.items[list.items.length - 1] += ' ' + l.trim(); i++; continue; }
      endList(); para.push(l); i++;
    }
    flush(); endList();
    return out.join('');
  }

  /* Copy buttons, shared by every front end. */
  function wireCopy(root) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.xb-copy') : null;
      if (!b) return;
      var text = b.parentNode.querySelector('code').textContent;
      function done(ok) { b.textContent = ok ? 'Copied' : 'Press Ctrl+C'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); }
      function select() {
        var r = document.createRange(), s = window.getSelection();
        r.selectNodeContents(b.parentNode.querySelector('code')); s.removeAllRanges(); s.addRange(r);
        try { done(document.execCommand('copy')); } catch (err) { done(false); }
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { done(true); }, select);
      else select();
    });
  }

  /* ------------------------------------------------------------------
   * Asking. Uses the site's live model when one is switched on, and falls
   * back to the built-in answer whenever it is off, busy or unreachable.
   * --------------------------------------------------------------- */
  function ask(text, st, cfg) {
    var local = reply(text, st);
    var small = local.kind === 'talk' || local.kind === 'quiz' || st.quiz;
    st.history = st.history || [];
    function keep(r) { st.history.push({ role: 'user', text: text }, { role: 'assistant', text: r.md }); st.history = st.history.slice(-6); return r; }
    if (small || !cfg || !Number(cfg.live) || typeof fetch !== 'function') return Promise.resolve(keep(local));

    var stop = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (stop) stop.abort(); }, 45000);
    function post(withNonce) {
      var h = { 'Content-Type': 'application/json' };
      if (withNonce && cfg.nonce) h['X-WP-Nonce'] = cfg.nonce;
      return fetch(cfg.endpoint, { method: 'POST', credentials: withNonce ? 'same-origin' : 'omit', headers: h, signal: stop ? stop.signal : undefined, body: JSON.stringify({ message: text, history: st.history }) })
        .then(function (r) {
          // A cached page carries an expired nonce. The route is public, so try once without it.
          if (r.status === 403 && withNonce) return post(false);
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        });
    }
    return post(true).then(function (d) {
      if (d && d.reply) return { md: d.reply, kind: 'live', id: local.id, chips: local.kind === 'off' || local.kind === 'miss' ? HOME : (local.chips || []).filter(function (c) { return c !== 'Explain it'; }) };
      local.note = d && d.error === 'rate_limited' ? 'Live answers have hit their limit for now, so this one is built in.' : 'The live model is unavailable, so this answer is built in.';
      if (d && d.detail) local.note += ' (Only you can see this: ' + d.detail + ')';
      return local;
    }, function () {
      local.note = 'The live model is unavailable, so this answer is built in.';
      return local;
    }).then(function (r) { clearTimeout(timer); return keep(r); });
  }

  /* ------------------------------------------------------------------
   * Chat controller shared by the inline panel and the floating launcher.
   * o = { root, log, chips, form, input, send, reset, cls, greeting, cfg }
   * --------------------------------------------------------------- */
  function mount(o) {
    var st = {}, busy = false, turn = 0, sent = [], at = 0, touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    function push(html, who, note) {
      var d = document.createElement('div');
      d.className = o.cls + '__msg ' + o.cls + '__msg--' + who;
      d.innerHTML = html;
      if (note) { var n = document.createElement('p'); n.className = 'xb-note'; n.textContent = note; d.appendChild(n); }
      o.log.appendChild(d);
      // Long answers start at the question, not at their last line.
      var top = who === 'bot' && d.previousElementSibling ? d.previousElementSibling : d;
      if (who === 'bot') o.log.scrollTop += top.getBoundingClientRect().top - o.log.getBoundingClientRect().top - 12;
      else o.log.scrollTop = o.log.scrollHeight;
      return d;
    }
    function chips(list) {
      o.chips.innerHTML = '';
      (list || HOME).filter(function (c, i, a) { return a.indexOf(c) === i; }).slice(0, 6).forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = o.cls + '__chip'; b.textContent = c;
        b.addEventListener('click', function () { go(c, true); });
        o.chips.appendChild(b);
      });
      o.chips.scrollLeft = 0;
    }
    function grow() { o.input.style.height = 'auto'; o.input.style.height = Math.min(o.input.scrollHeight, 132) + 'px'; }
    function go(text, fromChip) {
      text = String(text).trim();
      if (!text || busy) return;
      busy = true; o.send.disabled = true;
      var mine = ++turn;
      push(esc(text).replace(/\n/g, '<br>'), 'me');
      if (sent[sent.length - 1] !== text) sent.push(text);
      at = sent.length;
      o.input.value = ''; grow();
      var t = document.createElement('div');
      t.className = o.cls + '__typing'; t.innerHTML = '<i></i><i></i><i></i>';
      t.setAttribute('aria-hidden', 'true');
      o.log.appendChild(t); o.log.scrollTop = o.log.scrollHeight;
      var wait = new Promise(function (r) { setTimeout(r, 260); });
      Promise.all([ask(text, st, o.cfg), wait]).then(function (a) { return a[0]; }, function () {
        return { md: 'Something went wrong on this page. Please try that again.', chips: HOME };
      }).then(function (r) {
        t.remove();
        if (mine !== turn) return;
        push(render(r.md), 'bot', r.note);
        chips(r.chips);
        busy = false; o.send.disabled = false;
        if (!(touch && fromChip)) o.input.focus({ preventScroll: true });
      });
    }
    function reset() {
      turn++; st = {}; busy = false; o.send.disabled = false;
      o.log.innerHTML = '';
      push(render(o.greeting), 'bot');
      chips(HOME);
    }
    o.form.addEventListener('submit', function (e) { e.preventDefault(); go(o.input.value); });
    o.input.addEventListener('input', grow);
    o.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); go(o.input.value); }
      else if (e.key === 'ArrowUp' && (o.input.value === '' || o.input.value === sent[at]) && at > 0) { e.preventDefault(); o.input.value = sent[--at]; grow(); }
      else if (e.key === 'ArrowDown' && at < sent.length && o.input.value === sent[at]) { e.preventDefault(); o.input.value = sent[++at] || ''; grow(); }
    });
    if (o.reset) o.reset.addEventListener('click', function () { reset(); o.input.focus({ preventScroll: true }); });
    wireCopy(o.log);
    reset();
    return { ask: go, reset: reset };
  }

  /* OpenAI retires custom GPT pages on this date; links are hidden after it. */
  var GPT_RETIRES = '2026-12-11';
  function gptLive(url, until) { return /^https?:\/\//.test(url || '') && new Date().toISOString().slice(0, 10) < (until || GPT_RETIRES); }

  return { reply: reply, render: render, ask: ask, mount: mount, gptLive: gptLive, wireCopy: wireCopy, home: HOME, topics: TOPICS, funcs: FUNCS, quiz: QUIZ, _check: check, _extract: extract, _search: search };
}());
if (typeof module !== 'undefined' && module.exports) module.exports = ExcelBrain;
