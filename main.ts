import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  Notice
} from "obsidian";

interface ObsiRandomSettings {
  customDirectory1: string;
  customDirectory2: string;
  customDirectory3: string;
}

const DEFAULT_SETTINGS: ObsiRandomSettings = {
  customDirectory1: "",
  customDirectory2: "",
  customDirectory3: ""
};

const TIME_PERIODS = {
  WEEK: 7,
  MONTH: 30,
  YEAR: 365
} as const;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export default class ObsiRandomPlugin extends Plugin {
  settings: ObsiRandomSettings;

  private getAllNotes(): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }

  private getNotesFromPastDays(days: number): TFile[] {
    const cutoffTime = Date.now() - days * MILLISECONDS_PER_DAY;
    const markdownFiles = this.app.vault.getMarkdownFiles();

    return markdownFiles.filter((file) => file.stat.ctime >= cutoffTime);
  }

  private getNotesFromPastWeek(): TFile[] {
    return this.getNotesFromPastDays(TIME_PERIODS.WEEK);
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
        console.error("ObsiRandom: Failed to open note:", error);
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

  private async openRandomRecentNote(): Promise<void> {
    await this.executeRandomNoteCommand(
      () => this.getNotesFromPastWeek(),
      "from the past 7 days"
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
        `Please set Custom Directory ${directoryNumber} in plugin settings first!`
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

  private removeCustomCommands(): void {
    [1, 2, 3].forEach((num) => {
      const commandId = `${this.manifest.id}:open-random-custom-directory-${num}`;
      // @ts-ignore - accessing private property
      if (this.app.commands.commands[commandId]) {
        // @ts-ignore - accessing private property
        this.app.commands.removeCommand(commandId);
      }
    });
  }

  private addCustomCommands(): void {
    [1, 2, 3].forEach((num) => {
      const directoryPath =
        this.settings[`customDirectory${num}` as keyof ObsiRandomSettings];
      if (directoryPath.trim()) {
        this.addCommand({
          id: `open-random-custom-directory-${num}`,
          name: `Random note from ${directoryPath}`,
          callback: () => {
            this.openRandomNoteFromCustomDirectory(num as 1 | 2 | 3);
          }
        });
      }
    });
  }

  public updateCommands(): void {
    this.removeCustomCommands();
    this.addCustomCommands();
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
        id: "open-random-recent-note",
        name: "Random note from past 7 days",
        callback: () => this.openRandomRecentNote()
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

    // Add dynamic custom directory commands
    this.updateCommands();

    // Add settings tab
    this.addSettingTab(new ObsiRandomSettingTab(this.app, this));
  }

  onunload() {}
}

class ObsiRandomSettingTab extends PluginSettingTab {
  plugin: ObsiRandomPlugin;

  constructor(app: App, plugin: ObsiRandomPlugin) {
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
    const settingKey = `customDirectory${num}` as keyof ObsiRandomSettings;

    new Setting(containerEl)
      .setName(`Custom Directory ${num}`)
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
          this.plugin.updateCommands();
        });
      })
      .addText((text) =>
        text
          .setPlaceholder("Or type custom path")
          .setValue(this.plugin.settings[settingKey])
          .onChange(async (value) => {
            this.plugin.settings[settingKey] = value;
            await this.plugin.saveSettings();
            this.plugin.updateCommands();
          })
      );
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    // Header
    containerEl.createEl("h2", { text: "ObsiRandom Settings" });

    containerEl.createEl("p", {
      text: "Configure custom directories to quickly access random notes from specific folders in your vault.",
      cls: "setting-item-description"
    });

    // Available Commands Section (moved to top)
    containerEl.createEl("h3", { text: "Available Commands" });

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
      "Random note from past 7 days",
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
          `customDirectory${num}` as keyof ObsiRandomSettings
        ];
      if (directoryPath.trim()) {
        commandList.createEl("li", {
          text: `Random note from ${directoryPath}`
        });
      }
    });

    // Divider
    containerEl.createEl("hr", { cls: "setting-item-description" });

    // Custom Directories Section (moved to bottom)
    containerEl.createEl("h3", { text: "Custom Directories" });

    const directories = this.getAllDirectories();

    // Create all three directory settings
    [1, 2, 3].forEach((num) => {
      this.createDirectorySetting(containerEl, num as 1 | 2 | 3, directories);
    });
  }
}
