# New Document Wizard — right inset (v1.231)

Apply when `gui/` is writable.

## Root cause

Line ~27 in `gui/new-label-wizard.js` sets `padding-right:0!important` on both `.nw-body` and `.nw-body>aside`, which keeps the preview column and "Template Size" caption flush against the modal edge.

## Fix in `gui/new-label-wizard.js`

1. Change the footer/body rule to drop aside padding reset:

```diff
-#newLabelWizard .nw-body,#newLabelWizard .nw-body>aside{margin-right:0!important;padding-right:0!important}
+#newLabelWizard .nw-body,#newLabelWizard .nw-body>aside{margin-right:0!important}
```

2. Replace the steps 1–3 preview CSS block (~line 33) with inset on body (20px), aside (`padding:0 10px 0 0`), and caption (`padding:0 6px 0 2px`).

3. In the steps 4–7 block (~line 283): `padding-right:20px` on body, `padding:0 10px 0 0` on aside, caption `padding:0 6px 0 2px`.

## Runtime override (if JS cannot be edited yet)

Add after `<script src="new-label-wizard.js"></script>` in `gui/index.html`:

```html
<style id="new-label-wizard-preview-inset">
  #newLabelWizard .nw-body:is([data-step="1"],[data-step="2"],[data-step="3"],[data-step="4"],[data-step="5"],[data-step="6"],[data-step="7"]){padding-right:20px!important}
  #newLabelWizard .nw-body:is([data-step="1"],[data-step="2"],[data-step="3"]) aside{box-sizing:border-box;padding:0 10px 0 0!important;background:transparent!important}
  #newLabelWizard .nw-body:is([data-step="1"],[data-step="2"],[data-step="3"]) aside>small{padding:0 6px 0 2px!important}
  #newLabelWizard .nw-body:is([data-step="4"],[data-step="5"],[data-step="6"],[data-step="7"]) aside{padding:0 10px 0 0!important}
  #newLabelWizard .nw-body:is([data-step="4"],[data-step="5"],[data-step="6"],[data-step="7"]) aside>small{padding:0 6px 0 2px!important}
</style>
```

## Tests

After apply, run `npm run test:basic`. Optionally assert Items Per Page `body.paddingRight >= 16` and `aside.paddingRight >= 8` in `test/printer-resolution.test.js`.
