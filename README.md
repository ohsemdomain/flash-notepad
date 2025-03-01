# Flash Notepad Chrome Extension

This is a simple notepad Chrome extension that allows you to create and manage multiple notes with categories. It uses Dexie.js for efficient database management and provides options for backup and import.

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
-   **Deleting a note:** Select a note, click the "..." icon in the top right of the note editor, and select "Delete note". A confirmation dialog will appear.
-   **Opening in a new tab:** Click the external link icon in the sidebar to open the notepad in a new tab.
- **Settings:** Click the cog icon in the sidebar to open the settings modal.
    - **Backup & Import:**
        - **Export All Notes:** Downloads all notes as a JSON file.
        - **Export as Plain Text:** Downloads all notes as a single plain text file.
        - **Import Notes:** Opens a file dialog to select a JSON or TXT file to import.
        - **Merge with existing notes:** Checkbox to control whether imported notes should be merged with existing notes or replace them.
    - **Appearance:** (Placeholder)
        - **Theme:** Select between light, dark, or system default theme.
        - **Font Size:** Select between small, medium, or large font size.
    - **Categories:**
        - **Manage Categories:** List existing categories with options to edit or delete them.
        - **Add New Category:** Button to add a new category (placeholder functionality).

## File Structure

-   `manifest.json`: Contains the extension's metadata, including name, version, description, permissions, and configuration for the popup and icons. It specifies that the extension uses version 3 of the manifest format, requires "storage" permission, and defines the default popup as `popup.html`.
-   `popup.html`: The HTML structure for the extension's popup. It includes:
    -   A sidebar for note management (add note, list notes, settings, open in new tab).
    -   A content area for editing the selected note (title, content, categories).
    -   A settings modal with tabs for "Backup & Import", "Appearance", and "Categories".
    -   A confirmation modal for actions like deleting notes.
    -   It links to `css/styles.css` for styling and `js/app.js` for functionality.
-   `css/styles.css`: Stylesheet for the popup, defining the layout, colors, and appearance of the extension's UI elements. It includes styles for:
    -   Global styles (font, colors, etc.)
    -   App container, sidebar, content area
    -   Notes list, note items, note header
    -   Buttons, custom scrollbar
    -   Dropdown menus
    -   Category badges, categories container
    -   Form elements (input, select, checkbox)
    -   Modal dialogs (confirmation and settings)
    -   Settings tabs and tab content
-   `icons/icon.png`: Extension icon, used in the Chrome toolbar and extensions page.
-   `js/app.js`: Main application script, serving as the entry point. It initializes the `NotesModel`, `NotesView`, `NotesController`, and `CategoriesManager` after opening the database connection using Dexie.js.
-   `js/controller.js`: Controller logic, connecting the Model and View. It handles user interactions, such as adding, selecting, updating, and deleting notes. It also includes functionality for:
    -   Managing categories (adding, removing, creating, and displaying).
    -   Opening the settings modal.
    -   Exporting notes as JSON or plain text.
    -   Importing notes from JSON or plain text files.
    -   Displaying confirmation modals.
-   `js/model.js`: Data model, responsible for managing the notes data. It uses Dexie.js (`db.js`) for database operations. It handles:
    -   Loading and saving notes to the database.
    -   Creating, updating, and deleting notes.
    -   Adding and removing categories from notes.
    -   Filtering notes by category.
    -   Searching notes by content.
-   `js/view.js`: View logic, managing UI updates. It renders:
    -   The list of notes (including category badges).
    -   The active note.
    -   Category selector dropdown.
    -   Create category form.
    -   Note options dropdown.
    -   Confirmation modals.
    -   Settings modal content (categories list, etc.).
-   `js/categories.js`: Utility for managing note categories. It includes a `CategoriesManager` class that handles loading, saving, creating, and deleting categories. It provides default categories and interacts with the Dexie.js database.
- `js/db.js`: Sets up the Dexie.js database (using `lib/dexie.js`). Defines the database schema, including tables for notes and categories, and initializes default categories.
- `js/backup-utils.js`: Provides utility functions for converting notes to and from a plain text format for backup and import purposes.
- `lib/dexie.js`: The Dexie.js library file.