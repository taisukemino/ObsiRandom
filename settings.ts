export interface RandomNotePickerSettings {
  customDirectory1: string;
  customDirectory2: string;
  customDirectory3: string;
}

export const DEFAULT_SETTINGS: RandomNotePickerSettings = {
  customDirectory1: "",
  customDirectory2: "",
  customDirectory3: ""
};

export const CUSTOM_DIRECTORY_NUMBERS = [1, 2, 3] as const;

export type CustomDirectoryNumber = (typeof CUSTOM_DIRECTORY_NUMBERS)[number];

/**
 * Builds the settings key for a numbered custom directory.
 *
 * @param directoryNumber - Which of the three custom directory slots to use
 * @returns The corresponding key in {@link RandomNotePickerSettings}
 */
export function getCustomDirectoryKey(
  directoryNumber: CustomDirectoryNumber
): keyof RandomNotePickerSettings {
  return `customDirectory${directoryNumber}`;
}
