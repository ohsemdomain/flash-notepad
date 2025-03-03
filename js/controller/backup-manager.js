// js/controller/backup-manager.js
/**
 * @file js/controller/backup-manager.js
 * @description Handles import/export functionality
 * @requires backup-utils.js
 * 
 * Manages the backup and restoration of notes, including exporting to plain text
 * and importing from files. Handles file selection, parsing, and confirmation dialogs.
 */

import { convertNotesToPlainText, parseTextNotes } from '../model/backup-utils.js';

class BackupManager {
    constructor(controller) {
        this.controller = controller;
        this.model = controller.model;
        this.view = controller.view;
    }

    // Export notes as text
    exportNotes(format = 'text') {
        const notes = this.model.getAllNotes();
        if (notes.length === 0) {
            this.controller.showNotification('No notes to export', 'warning');
            return;
        }

        let fileContent;
        let fileName;
        let mimeType;

        // Export as plain text
        fileContent = convertNotesToPlainText(
            notes,
            this.controller.categoryManager.categoriesMap
        );
        fileName = `flash-notepad-${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';

        const blob = new Blob([fileContent], { type: mimeType });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();

        // Clean up
        URL.revokeObjectURL(url);

        this.controller.showNotification('Notes exported successfully', 'success');
    }

    // Handle file import from input event
    handleFileImport(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = async (event) => {
                const content = event.target.result;
                try {
                    await this.importNotes(file, content);
                    // Reset the file input
                    e.target.value = '';
                } catch (error) {
                    this.controller.showNotification(`Error importing notes: ${error.message}`, 'error');
                }
            };

            if (file.name.endsWith('.txt')) {
                reader.readAsText(file);
            } else {
                this.controller.showNotification('Please select a .txt file', 'error');
            }
        }
    }

    // Import notes from file
    async importNotes(file, content) {
        if (file.name.endsWith('.txt')) {
            try {
                // Get existing categories for resolving during import
                const existingCategories = await this.controller.categoryManager.categoriesManager.getAllCategories();

                // Parse notes from the content
                const { notes, newCategories } = parseTextNotes(content, existingCategories);

                if (notes.length === 0) {
                    throw new Error('No valid notes found in the imported file');
                }

                // Confirm before replacing all notes
                let confirmMessage = `This will import ${notes.length} note(s) and replace all existing notes.`;
                if (newCategories.length > 0) {
                    confirmMessage += ` ${newCategories.length} new categories will also be created.`;
                }
                confirmMessage += " Continue?";

                this.view.showModal(
                    'Import Notes',
                    confirmMessage,
                    async () => {
                        try {
                            // Delete all existing notes
                            const existingNotes = this.model.getAllNotes();
                            for (const note of existingNotes) {
                                await this.model.deleteNote(note.id);
                            }

                            // First create any new categories and build a mapping
                            const categoryIdMap = {};
                            for (const newCat of newCategories) {
                                try {
                                    const createdCategory = await this.controller.categoryManager.categoriesManager.createCategory(
                                        newCat.name,
                                        newCat.color
                                    );
                                    categoryIdMap[newCat.tempId] = createdCategory.id;
                                } catch (error) {
                                    console.error(`Failed to create category ${newCat.name}:`, error);
                                }
                            }

                            // Import each note, replacing temp IDs with actual category IDs
                            for (const note of notes) {
                                // Create a new note with the imported data
                                const newNote = await this.model.createNote();

                                // Map any temporary category IDs to actual IDs
                                const mappedCategories = (note.categories || []).map(catId =>
                                    categoryIdMap[catId] || catId
                                );

                                await this.model.updateNote(newNote.id, {
                                    title: note.title,
                                    content: note.content,
                                    categories: mappedCategories
                                });
                            }

                            // Reload categories and refresh view
                            await this.controller.categoryManager.loadCategories();
                            this.controller.refreshView();

                            let successMsg = `Successfully imported ${notes.length} notes`;
                            if (newCategories.length > 0) {
                                successMsg += ` and ${newCategories.length} categories`;
                            }
                            this.controller.showNotification(successMsg, 'success');
                        } catch (error) {
                            this.controller.showNotification(`Error during import: ${error.message}`, 'error');
                        }
                    },
                    'Import' // Specify the button text appropriate for this action
                );
            } catch (error) {
                throw new Error(`Failed to parse text file: ${error.message}`);
            }
        } else {
            throw new Error('Unsupported file format');
        }
    }
}

export default BackupManager;