# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A collection of **independent sample extensions** for SAP Digital Manufacturing (DM), a cloud MES. There is **no root-level build, test, or dependency manifest** — each sample under the top-level `dm-*` folders is its own self-contained project. Always `cd` into the specific sample directory before running any build/test/deploy command. Most samples are demonstration code meant to be copied and adapted, not run as a single application.

`package-lock.json` is gitignored repo-wide, so commit only `package.json` changes.

## Extension categories (the big picture)

Each top-level folder is a different DM **extensibility mechanism**. Understanding which mechanism a sample uses determines how it is built and deployed:

| Folder | Mechanism | Runtime / tech |
|--------|-----------|----------------|
| `dm-podplugin-extensions/` | Custom POD (Production Operator Dashboard) plugins | SAPUI5, runs inside DM's POD |
| `dm-coreplugin-extensions/` | **Extension providers** that hook into and modify *standard* POD plugins (add columns, change views, intercept actions/lifecycle) | SAPUI5, deployed as an MTA/HTML5 app on Cloud Foundry |
| `dm-sidebyside-extension/` | Standalone apps alongside DM, calling DM **public APIs** | UI5 frontends + Node.js services, deployed to Kyma (Docker/k8s) or CF (MTA) |
| `dm-inapp-service-extensions/` | **Service/function extensions** (e.g. next-number generation, custom REST APIs) invoked by DM execution | Node.js (Express), deployed to Kyma/CF, called via BTP destinations |
| `dm-integration-extensions/` | Inbound/outbound ERP integration | XSLT mappings + SAP CPI (Cloud Integration) workflows — no JS build |
| `dm-extension-scenarios/` | Larger end-to-end scenarios. **Note: not one tech** — `cap-custom-plugins` is a CAP app; `advanced-audit-log-viewer` is a CAP microservice + UI; `whereUsedReport` is a POD plugin (MTA) + PPD artifacts; **`dm-pod2-translation` and `manufacturingX-collaboration` are themselves POD 2.0 extensions** (`extension.json`-based, same model as `custom-pod2-examples`) | Mix of CAP (`@sap/cds`), UI5, POD 2.0, MTA |
| `dm-issue-resolution/` | A SCIM custom user-attribute schema (`scim_custom_schema.json`, `urn:sap:cloud:scim:...psp:2.0:User`) for provisioning custom user attributes (plant PSP edit/delete permissions) in the identity provider | JSON config, no build |
| `dm-archive/` | **Deprecated** older versions of the plugin/template samples — prefer the non-archived equivalents | — |
| `bootcampdocs/` | Bootcamp exercise & reference **markdown** files (`ExerciseN.md`, `*Extensions.md`, `FAQ.md`) plus a vendored MkDocs-material `theme/`. No `mkdocs.yml` is committed, so there is no build target here — treat it as plain docs | Documentation only |
| `documentation/` | Zipped JSDoc for POD 1.0 and POD 2.0 APIs (`jsdoc_pod1.zip`, `jsdoc-pod2-2605.zip`) | Unzip these for offline API reference |

## POD 1.0 vs POD 2.0 (most important distinction)

`dm-podplugin-extensions/` contains two fundamentally different plugin architectures. New development should use **POD 2.0**.

- **POD 1.0** (`custom-pod1-examples/`): full UI5 MVC. Each plugin is a folder with `Component.js` (extends `sap/dm/dme/podfoundation/component/production/ProductionUIComponent`), `manifest.json`, `controller/`, `view/*.view.xml`, `builder/PropertyEditor.js`, `i18n/`. Registered via a `designer/components.json` file at the package root. API access goes through `this.getPodController()...`.
- **POD 2.0** (`custom-pod2-examples/`): lightweight ES6 classes, typically **one `.js` file per widget/action**. Widgets extend `sap/dm/dme/pod2/widget/Widget` (or a more specific standard widget to subclass it); actions extend `sap/dm/dme/pod2/action/Action`. Registered via `extension.json` at the package root, where each entry's `type` is the `modulePath` with `/` replaced by `.`. API access goes through the static `PodContext` / `ModelPath` modules.

`dm-podplugin-extensions/README.md` has a full API cheat-sheet for both versions and a side-by-side comparison. `custom-pod2-examples/SHOWCASE.md` documents every widget/action in that package plus the three inter-plugin communication patterns (designer event→action wiring, `PodContext` model subscriptions, and direct delegate refresh).

## Build, test, run

Commands depend on the sample's tooling — check its `package.json` / `mta.yaml` first. Common cases:

**UI5 apps** (e.g. `dm-sidebyside-extension/SideBySide_UI5/`):
```bash
npm install
npm start          # ui5 serve -o index.html (local dev server)
npm run lint       # eslint webapp
npm test           # lint + karma (single run, with coverage)
npm run karma      # karma in watch mode
npm run build      # ui5 build --a  → dist/
```
Run a single UI5 test by editing the test suite/QUnit module filter in the karma config or the `*.qunit.html` test page — there is no per-test CLI flag.

**Core plugin extensions** (`dm-coreplugin-extensions/plugins/`): `npm test` runs `grunt unit_and_integration_tests`; `npm start` runs the `@sap/approuter`. Each standard plugin you extend lives in its own `webapp/<name>ExtensionProvider/` folder following a fixed file pattern — `ExtensionProvider.js` (entry point), `LifecycleExtension.js`, `PluginEventExtension.js`, `PropertyEditorExtension.js`, and a local `ExtensionUtilities.js`. Providers are registered in `webapp/designer/components.json`.

**Node.js services** (e.g. `dm-inapp-service-extensions/api-mssql-nodejs/app/`, `sidebyside .../api-nodejs/`): `npm install` then `npm start` (`node server.js`). Several have no real test script (`npm test` just errors) — don't assume tests exist.

**CAP scenarios** (e.g. `dm-extension-scenarios/cap-custom-plugins/`): `npm start` runs `cds-serve`; uses `@sap/cds` with a sqlite db and a `DMC_Cloud_API` REST destination.

**Integration extensions** (`dm-integration-extensions/`): plain `.xsl` files and CPI workflow zips — no build. Edit/validate the XSLT directly.

## Deployment model

- **POD plugins**: zip the *contents* of the package (so `extension.json` for 2.0, or `designer/components.json` for 1.0, sits at the zip root — not the folder itself), then upload. POD 1.0 → **POD Designer**; POD 2.0 → **Manage PODs 2.0** app (you supply Extension Name + Namespace).
  - For POD 2.0 packaging, use the project slash command **`/pod2-extension-package`** (defined in `dm-podplugin-extensions/custom-pod2-examples/.claude/commands/`). It locates the package, builds `custom-pod2-extension.zip` (excluding `.claude/` and macOS metadata), and prints the exact upload-dialog values.
- **MTA samples** (folders with `mta.yaml`, e.g. core plugins, `cap-custom-plugins`, several side-by-side apps): build with `mbt build` → produces an `.mtar` in `mta_archives/` (gitignored), deploy to Cloud Foundry with `cf deploy mta_archives/<file>.mtar`. These wire an `xsuaa` service and an `@sap/approuter` with CORS rules pointing at the DM host (`<DM_HOST>` placeholder in `mta.yaml`).
- **Plain CF push** (e.g. `SideBySide_MaintPersonnelId_CF`): no MTA — deploy with `cf push --random-route` from the sample folder.
- **Kyma samples** (folders with `docker/Dockerfile` + `k8s/`): `docker build -f docker/Dockerfile`, `docker push` to your registry, then `kubectl -n <ns> apply -f ./k8s/*.yaml`. Some samples deploy a Node service + an MSSQL pod + a UI5 frontend as separate images.

## Conventions

- Per-sample `README.md` files are authoritative for that sample's purpose, config, and deployment — read them before changing a sample. The root `README.md` is the index of all samples.
- This repo is REUSE-compliant (`REUSE.toml`, `LICENSES/`): source files carry SPDX license headers and new files are expected to as well. License is Apache-2.0 unless a file states otherwise.
