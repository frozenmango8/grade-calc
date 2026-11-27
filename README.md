# Grade Calc

A static grade calculator for high school and college students. It runs in the browser and stores classes on this device.

Live: https://frozenmango8.github.io/grade-calc/

## Use

Open the live site. Work is saved in this browser.

**Class grade.** Add categories with weights and assignments with points earned and possible. The percentage and letter update as you type. If the weights do not total 100, a warning shows. Categories with no graded work are left out and the rest are rescaled. Set "Drop lowest" to ignore the lowest scores in a category.

**Final exam.** Enter the current grade, the final's weight, and the grade you want. The calculator shows the score you need, or tells you the target is already guaranteed or impossible.

**GPA.** Add courses with credits and letter grades. Turn on weighted GPA for Honors (+0.5) and AP/IB (+1.0). Enter a prior GPA and its credits for a cumulative figure.

Letter cutoffs start at A 90, B 80, C 70, D 60. Edit them on the Class tab. Plus and minus splits each letter into equal thirds. Percentages and GPA round half up to two decimals.

Use "Copy link" to share one class. The link contains that class and nothing else. Opening it saves the class in the browser that opens it.

## Develop

Requires Node 22.

```bash
npm install
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
```

The dev server and the production build use the base path `/grade-calc/`.
