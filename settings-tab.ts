import {
  App,
  PluginSettingTab,
  Setting,
  SettingDefinitionItem
} from "obsidian";
import type RandomNotePickerPlugin from "./main";
import {
  CUSTOM_DIRECTORY_NUMBERS,
  CustomDirectoryNumber,
  getCustomDirectoryKey
} from "./settings";

export class RandomNotePickerSettingTab extends PluginSettingTab {
  plugin: RandomNotePickerPlugin;

  constructor(app: App, plugin: RandomNotePickerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * Declarative settings for Obsidian 1.13.0+. Makes the settings searchable
   * and uses the built-in folder picker instead of manual vault enumeration.
   */
  getSettingDefinitions(): SettingDefinitionItem[] {
    return CUSTOM_DIRECTORY_NUMBERS.map((directoryNumber) => ({
      name: `Custom directory ${directoryNumber}`,
      desc: `Folder used by the "Random note from custom directory ${directoryNumber}" command.`,
      control: {
        type: "folder",
        key: getCustomDirectoryKey(directoryNumber),
        placeholder: "Select a folder",
        defaultValue: ""
      }
    }));
  }

  private getAllDirectories(): string[] {
    const folders = new Set<string>();
    const files = this.app.vault.getAllLoadedFiles();

    files.forEach((file) => {
      if (file.path.includes("/")) {
        const pathParts = file.path.split("/");
        // Add all possible directory paths
        for (let i = 1; i < pathParts.length; i++) {
          const dirPath = pathParts.slice(0, i).join("/");
          if (dirPath) folders.add(dirPath);
        }
      }
    });

    return Array.from(folders).sort();
  }

  private createDirectorySetting(
    containerEl: HTMLElement,
    directoryNumber: CustomDirectoryNumber,
    directories: string[]
  ): void {
    const settingKey = getCustomDirectoryKey(directoryNumber);

    new Setting(containerEl)
      .setName(`Custom directory ${directoryNumber}`)
      .setDesc(`Select or enter directory path ${directoryNumber}`)
      .addDropdown((dropdown) => {
        dropdown.addOption("", "Select a directory");
        directories.forEach((dir) => {
          dropdown.addOption(dir, dir);
        });
        dropdown.setValue(this.plugin.settings[settingKey]);
        dropdown.onChange(async (value) => {
          this.plugin.settings[settingKey] = value;
          await this.plugin.saveSettings();
        });
      })
      .addText((text) =>
        text
          .setPlaceholder("Or type custom path")
          .setValue(this.plugin.settings[settingKey])
          .onChange(async (value) => {
            this.plugin.settings[settingKey] = value;
            await this.plugin.saveSettings();
          })
      );
  }

  /**
   * Imperative fallback for Obsidian versions older than 1.13.0. Newer
   * versions render from {@link getSettingDefinitions} and never call this.
   */
  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("p", {
      text: "Configure custom directories to quickly access random notes from specific folders in your vault.",
      cls: "setting-item-description"
    });

    new Setting(containerEl).setName("Custom directories").setHeading();

    const directories = this.getAllDirectories();

    CUSTOM_DIRECTORY_NUMBERS.forEach((directoryNumber) => {
      this.createDirectorySetting(containerEl, directoryNumber, directories);
    });
  }
}
