import { Plugin, TFile, Notice } from "obsidian";
import {
  RandomNotePickerSettings,
  DEFAULT_SETTINGS,
  CUSTOM_DIRECTORY_NUMBERS,
  CustomDirectoryNumber,
  getCustomDirectoryKey
} from "./settings";
import { RandomNotePickerSettingTab } from "./settings-tab";

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

  private async openRandomNoteFromPastDays(
    days: number,
    context: string
  ): Promise<void> {
    await this.openRandomNote(this.getNotesFromPastDays(days), context);
  }

  private async openRandomNoteFromVault(): Promise<void> {
    await this.openRandomNote(this.getAllNotes(), "in the vault");
  }

  private async openRandomNoteFromCustomDirectory(
    directoryNumber: CustomDirectoryNumber
  ): Promise<void> {
    const directoryPath = this.settings[getCustomDirectoryKey(directoryNumber)];

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
    const savedSettings = (await this.loadData()) as
      | Partial<RandomNotePickerSettings>
      | null;
    this.settings = { ...DEFAULT_SETTINGS, ...savedSettings };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private registerCustomDirectoryCommands(): void {
    CUSTOM_DIRECTORY_NUMBERS.forEach((directoryNumber) => {
      this.addCommand({
        id: `open-random-custom-directory-${directoryNumber}`,
        name: `Random note from custom directory ${directoryNumber}`,
        // Reason: checkCallback hides the command from the palette when the
        // directory is not configured, so no private command-removal API is needed.
        checkCallback: (checking) => {
          const directoryPath =
            this.settings[getCustomDirectoryKey(directoryNumber)];
          if (!directoryPath.trim()) return false;
          if (!checking) {
            void this.openRandomNoteFromCustomDirectory(directoryNumber);
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
        callback: () => void this.openRandomNoteFromVault()
      },
      {
        id: "open-random-day-note",
        name: "Random note from past 24 hours",
        callback: () =>
          void this.openRandomNoteFromPastDays(
            TIME_PERIODS.DAY,
            "from the past 24 hours"
          )
      },
      {
        id: "open-random-recent-note",
        name: "Random note from past 7 days",
        callback: () =>
          void this.openRandomNoteFromPastDays(
            TIME_PERIODS.WEEK,
            "from the past 7 days"
          )
      },
      {
        id: "open-random-two-weeks-note",
        name: "Random note from past two weeks",
        callback: () =>
          void this.openRandomNoteFromPastDays(
            TIME_PERIODS.TWO_WEEKS,
            "from the past two weeks"
          )
      },
      {
        id: "open-random-month-note",
        name: "Random note from past month",
        callback: () =>
          void this.openRandomNoteFromPastDays(
            TIME_PERIODS.MONTH,
            "from the past month"
          )
      },
      {
        id: "open-random-year-note",
        name: "Random note from past year",
        callback: () =>
          void this.openRandomNoteFromPastDays(
            TIME_PERIODS.YEAR,
            "from the past year"
          )
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
