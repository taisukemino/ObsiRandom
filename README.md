# Random Note Picker

An Obsidian plugin that opens random notes from your vault — from recent time periods or from custom directories.

## Commands

Open the command palette (Ctrl/Cmd + P) and search for "Random":

- **Random note from \<folder name\>** — notes from a folder you configure (up to 3; each command appears once its directory is set in the plugin settings, named after the folder)
- **Random note from past 24 hours** — notes created in the last day
- **Random note from past 7 days** — notes created in the last week
- **Random note from past month** — notes created in the last 30 days

## Settings

In Settings → Community plugins → Random Note Picker, you can configure up to 3 custom directories. Pick a folder from the dropdown or type a path manually.

## Installation

### From the community plugin directory

1. Open Settings → Community plugins → Browse
2. Search for "Random Note Picker"
3. Install and enable the plugin

### Manual installation

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/taisukemino/random-note-obsidian/releases/latest)
2. Copy them into `<your-vault>/.obsidian/plugins/random-note-picker/`
3. Reload Obsidian and enable the plugin in Settings → Community plugins

## Requirements

- Obsidian v0.15.0 or higher
- Works on desktop and mobile

## License

[MIT](LICENSE)
