# My Kitchen

Your recipes. Your body. Your goals. A personal recipe adaptation assistant, built as a Progressive Web App.

## Files

| File | What it does |
|---|---|
| `index.html` | Page shell and navigation |
| `styles.css` | Bakery visual design (light and dark mode) |
| `core.js` | Data model, storage, migration, helpers |
| `service.js` | Adaptation service: nutrition engine, built-in rules, Claude engine |
| `screens.js` | All screens |
| `actions.js` | Buttons, inputs, the Make It Mine flow, startup |
| `sw.js` | Offline support |
| `manifest.webmanifest` + icons | Install to home screen |

Scripts must load in the order shown in `index.html`.

## Publish on GitHub Pages

1. Upload every file to the root of the repository (keep the names exactly).
2. Settings → Pages → Deploy from branch → `main` / root.
3. Open the Pages link on your phone and choose Add to Home Screen.

## Updating

After uploading changed files, edit `VERSION` in `sw.js` (for example `v2.0.1`) so installed copies pick up the new version.

## Notes

- Data is stored in the browser (`localStorage`), per device. Use Profile → Export my cookbook for backups.
- On GitHub Pages, adaptations use the built-in rules (labelled "not AI"). Claude-powered reading of photos and AI adaptation only works when the app runs inside Claude.
- Nutrition is estimated from typical ingredient values unless you enter label values.
