# Flash Notepad Chrome Extension

This is a simple and lightweight notepad extension that allows you to create and manage multiple notes with categories. It uses Chrome's local storage to persist data.

## Installation

1.  Clone this repository or download the ZIP file.
2.  Open Chrome and go to `chrome://extensions/`.
3.  Enable "Developer mode" in the top right corner.
4.  Click "Load unpacked".
5.  Select the directory where you cloned the repository or extracted the ZIP file.

## Usage

-   **Adding a note:** Click the "+" icon in the sidebar.
-   **Selecting a note:** Click on a note in the sidebar.
-   **Editing a note:** Select a note and edit the title or content in the right panel. Changes are automatically saved.
-   **Adding a category to a note:**
    -   Click the tag icon in the note header.
    -   Select an existing category from the dropdown or click "Create new category".
    -   If creating a new category, enter a name and select a color, then click "Save".
-   **Removing a category from a note:** Click the "x" icon on the category badge in the note header.
-   **Deleting a note:** Select a note, click the "..." icon in the top right of the note editor, and select "Delete note".
-   **Downloading notes:** Click the download icon in the sidebar to download all notes as a JSON file.
-   **Opening in a new tab:** Click the external link icon in the sidebar to open the notepad in a new tab.
- **Managing Categories:** Click the "..." icon in the top right of the note editor, and select "Manage categories". (Note: Currently, this displays a placeholder alert.)

## File Structure

-   `manifest.json`: Contains the extension's metadata, including name, version, description, permissions, and configuration for the popup and icons. It specifies that the extension uses version 3 of the manifest format, requires "storage" permission, and defines the default popup as `popup.html`.
-   `popup.html`: The HTML structure for the extension's popup. It includes a sidebar for note management and a content area for editing the selected note. It now also includes a `categories-container` for displaying note categories and an `add-category-btn` in the note header. It links to `css/styles.css` for styling and `js/app.js` for functionality.
-   `css/styles.css`: Stylesheet for the popup, defining the layout, colors, and appearance of the extension's UI elements. It uses CSS variables for easy customization and includes styles for the sidebar, note list, content area, buttons, custom scrollbar, category badges, categories container, category selector dropdown, and create category form.
-   `icons/icon.png`: Extension icon, used in the Chrome toolbar and extensions page.
-   `js/app.js`: Main application script, serving as the entry point. It initializes the `NotesModel`, `NotesView`, `NotesController`, and `CategoriesManager` when the DOM is loaded.
-   `js/controller.js`: Controller logic, connecting the Model and View. It handles user interactions, such as adding, selecting, updating, and deleting notes. It also includes functionality for downloading notes, opening the notepad in a new tab, and managing categories (adding, removing, creating, and displaying).
-   `js/model.js`: Data model, responsible for managing the notes data. It handles loading and saving notes to Chrome's local storage, creating, updating, and deleting notes. It also includes methods for adding and removing categories from notes.
-   `js/view.js`: View logic, managing UI updates. It renders the list of notes (including category badges), displays the active note, and handles the creation of the note options dropdown, category selector dropdown, and create category form.
-   `js/categories.js`: Utility for managing note categories. It includes a `CategoriesManager` class that handles loading, saving, creating, and deleting categories. It provides default categories and interacts with Chrome's local storage.