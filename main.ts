import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  Notice
} from "obsidian";

interface RandomNotePickerSettings {
  customDirectory1: string;
  customDirectory2: string;
  customDirectory3: string;
}

const DEFAULT_SETTINGS: RandomNotePickerSettings = {
  customDirectory1: "",
  customDirectory2: "",
  customDirectory3: ""
};

const TIME_PERIODS = {
  DAY: 1,
  WEEK: 7,
  TWO_WEEKS: 14,
  MONTH: 30,
  YEAR: 365
} as const;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export default class RandomNotePickerPlugin extends Plugin {
  settings: RandomNotePickerSettings;

  private getAllNotes(): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }

  private getNotesFromPastDays(days: number): TFile[] {
    const cutoffTime = Date.now() - days * MILLISECONDS_PER_DAY;
    const markdownFiles = this.app.vault.getMarkdownFiles();

    return markdownFiles.filter((file) => file.stat.ctime >= cutoffTime);
  }

  private getNotesFromPastDay(): TFile[] {
    return this.getNotesFromPastDays(TIME_PERIODS.DAY);
  }

  private getNotesFromPastWeek(): TFile[] {
    return this.getNotesFromPastDays(TIME_PERIODS.WEEK);
  }

  private getNotesFromPastTwoWeeks(): TFile[] {
    return this.getNotesFromPastDays(TIME_PERIODS.TWO_WEEKS);
  }

  private getNotesFromPastMonth(): TFile[] {
    return this.getNotesFromPastDays(TIME_PERIODS.MONTH);
  }

  private getNotesFromPastYear(): TFile[] {
    return this.getNotesFromPastDays(TIME_PERIODS.YEAR);
  }

  private getNotesFromDirectory(directoryPath: string): TFile[] {
    const markdownFiles = this.app.vault.getMarkdownFiles();

    return markdownFiles.filter((file) => file.path.startsWith(directoryPath));
  }

  private getRandomNote(notes: TFile[]): TFile | null {
    if (notes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * notes.length);
    return notes[randomIndex];
  }

  private async openRandomNote(notes: TFile[], context: string): Promise<void> {
    if (notes.length === 0) {
      new Notice(`No notes found ${context}!`);
      return;
    }

    const randomNote = this.getRandomNote(notes);
    if (randomNote) {
      try {
        await this.app.workspace.getLeaf().openFile(randomNote);
        new Notice(`Opened random note: ${randomNote.basename}`);
      } catch (error) {
        console.error("Random Note Picker: Failed to open note:", error);
        new Notice(`Failed to open note: ${randomNote.basename}`);
      }
    }
  }

  private async executeRandomNoteCommand(
    getNotes: () => TFile[],
    context: string
  ): Promise<void> {
    const notes = getNotes();
    await this.openRandomNote(notes, context);
  }

  private async openRandomNoteFromVault(): Promise<void> {
    await this.executeRandomNoteCommand(
      () => this.getAllNotes(),
      "in the vault"
    );
  }

  private async openRandomNoteFromDay(): Promise<void> {
    await this.executeRandomNoteCommand(
      () => this.getNotesFromPastDay(),
      "from the past 24 hours"
    );
  }

  private async openRandomRecentNote(): Promise<void> {
    await this.executeRandomNoteCommand(
      () => this.getNotesFromPastWeek(),
      "from the past 7 days"
    );
  }

  private async openRandomNoteFromTwoWeeks(): Promise<void> {
    await this.executeRandomNoteCommand(
      () => this.getNotesFromPastTwoWeeks(),
      "from the past two weeks"
    );
  }

  private async openRandomNoteFromMonth(): Promise<void> {
    await this.executeRandomNoteCommand(
      () => this.getNotesFromPastMonth(),
      "from the past month"
    );
  }

  private async openRandomNoteFromYear(): Promise<void> {
    await this.executeRandomNoteCommand(
      () => this.getNotesFromPastYear(),
      "from the past year"
    );
  }

  private async openRandomNoteFromCustomDirectory(
    directoryNumber: 1 | 2 | 3
  ): Promise<void> {
    const directoryPath = this.settings[`customDirectory${directoryNumber}`];

    if (!directoryPath.trim()) {
      new Notice(
        `Please set custom directory ${directoryNumber} in plugin settings first!`
      );
      return;
    }

    const customNotes = this.getNotesFromDirectory(directoryPath);
    await this.openRandomNote(customNotes, `in ${directoryPath} directory`);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private registerCustomDirectoryCommands(): void {
    const directoryNumbers: Array<1 | 2 | 3> = [1, 2, 3];

    directoryNumbers.forEach((directoryNumber) => {
      this.addCommand({
        id: `open-random-custom-directory-${directoryNumber}`,
        name: `Random note from custom directory ${directoryNumber}`,
        // Reason: checkCallback hides the command from the palette when the
        // directory is not configured, so no private command-removal API is needed.
        checkCallback: (checking) => {
          const directoryPath =
            this.settings[`customDirectory${directoryNumber}`];
          if (!directoryPath.trim()) return false;
          if (!checking) {
            this.openRandomNoteFromCustomDirectory(directoryNumber);
          }
          return true;
        }
      });
    });
  }

  async onload() {
    await this.loadSettings();

    // Built-in commands configuration
    const builtInCommands = [
      {
        id: "open-random-note",
        name: "Random note from vault",
        callback: () => this.openRandomNoteFromVault()
      },
      {
        id: "open-random-day-note",
        name: "Random note from past 24 hours",
        callback: () => this.openRandomNoteFromDay()
      },
      {
        id: "open-random-recent-note",
        name: "Random note from past 7 days",
        callback: () => this.openRandomRecentNote()
      },
      {
        id: "open-random-two-weeks-note",
        name: "Random note from past two weeks",
        callback: () => this.openRandomNoteFromTwoWeeks()
      },
      {
        id: "open-random-month-note",
        name: "Random note from past month",
        callback: () => this.openRandomNoteFromMonth()
      },
      {
        id: "open-random-year-note",
        name: "Random note from past year",
        callback: () => this.openRandomNoteFromYear()
      }
    ];

    // Register built-in commands
    builtInCommands.forEach((cmd) => this.addCommand(cmd));

    // Custom directory commands are always registered; checkCallback hides
    // them until the corresponding directory setting is configured.
    this.registerCustomDirectoryCommands();

    // Add settings tab
    this.addSettingTab(new RandomNotePickerSettingTab(this.app, this));
  }

  onunload() {}
}

class RandomNotePickerSettingTab extends PluginSettingTab {
  plugin: RandomNotePickerPlugin;

  constructor(app: App, plugin: RandomNotePickerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
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
    num: 1 | 2 | 3,
    directories: string[]
  ): void {
    const settingKey = `customDirectory${num}` as keyof RandomNotePickerSettings;

    new Setting(containerEl)
      .setName(`Custom directory ${num}`)
      .setDesc(`Select or enter directory path ${num}`)
      .addDropdown((dropdown) => {
        dropdown.addOption("", "-- Select a directory --");
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

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("p", {
      text: "Configure custom directories to quickly access random notes from specific folders in your vault.",
      cls: "setting-item-description"
    });

    new Setting(containerEl).setName("Available commands").setHeading();

    containerEl.createEl("p", {
      text: "Use the command palette (Ctrl/Cmd + P) to access these commands:",
      cls: "setting-item-description"
    });

    const commandList = containerEl.createEl("ul", {
      cls: "setting-item-description"
    });

    // Built-in commands
    const builtInCommands = [
      "Random note from vault",
      "Random note from past 24 hours",
      "Random note from past 7 days",
      "Random note from past two weeks",
      "Random note from past month",
      "Random note from past year"
    ];

    builtInCommands.forEach((command) => {
      commandList.createEl("li", { text: command });
    });

    // Dynamic custom directory commands (only show configured ones)
    [1, 2, 3].forEach((num) => {
      const directoryPath =
        this.plugin.settings[
          `customDirectory${num}` as keyof RandomNotePickerSettings
        ];
      if (directoryPath.trim()) {
        commandList.createEl("li", {
          text: `Random note from ${directoryPath}`
        });
      }
    });

    new Setting(containerEl).setName("Custom directories").setHeading();

    const directories = this.getAllDirectories();

    // Create all three directory settings
    [1, 2, 3].forEach((num) => {
      this.createDirectorySetting(containerEl, num as 1 | 2 | 3, directories);
    });
  }
}
