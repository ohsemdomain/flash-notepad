// js/controller/backup-manager.js
/**
 * @file js/controller/backup-manager.js
 * @description Handles import/export functionality
 * @requires backup-utils.js
 * 
 * Manages the backup and restoration of notes using JSON format.
 * Handles file selection, parsing, and confirmation dialogs.
 */

import { prepareExportData, validateImportData } from '../model/backup-utils.js';

class BackupManager {
    constructor(controller) {
        this.controller = controller;
        this.model = controller.model;
        this.view = controller.view;
    }

    // Export notes as JSON
    exportNotes() {
        const notes = this.model.getAllNotes();
        if (notes.length === 0) {
            this.controller.showNotification('No notes to export', 'warning');
            return;
        }

        // Prepare data for JSON export using the utility function
        const exportData = prepareExportData(
            notes,
            this.controller.categoryManager.categoriesMap
        );

        // Convert to JSON
        const fileContent = JSON.stringify(exportData, null, 2); // Pretty print with 2 spaces
        const fileName = `flash-notepad-${new Date().toISOString().split('T')[0]}.json`;
        const mimeType = 'application/json';

        // Create download
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

            if (file.name.endsWith('.json')) {
                reader.readAsText(file);
            } else {
                this.controller.showNotification('Please select a .json file', 'error');
            }
        }
    }

    // Import notes from file
    async importNotes(file, content) {
        if (file.name.endsWith('.json')) {
            try {
                // Parse the JSON content
                const importData = JSON.parse(content);

                // Validate the imported data using the utility function
                const validation = validateImportData(importData);

                if (!validation.valid) {
                    throw new Error(validation.message);
                }

                const notes = importData.notes;
                const categories = importData.categories || [];

                // Confirm before replacing all notes
                let confirmMessage = `Import backup file that contain ${validation.noteCount} note(s) and`;
                if (validation.categoryCount > 0) {
                    confirmMessage += ` ${validation.categoryCount} category(s). This action will replace all existing notes.`;
                }
                confirmMessage += " Continue?";

                this.view.showModal(
                    'Import Backup File',
                    confirmMessage,
                    async () => {
                        try {
                            // Delete all existing notes
                            const existingNotes = this.model.getAllNotes();
                            for (const note of existingNotes) {
                                await this.model.deleteNote(note.id);
                            }

                            // First import categories and build a mapping
                            const categoryIdMap = {};

                            // Delete existing categories if we have new ones to import
                            if (categories.length > 0) {
                                const existingCategories = await this.controller.categoryManager.categoriesManager.getAllCategories();
                                for (const cat of existingCategories) {
                                    try {
                                        await this.controller.categoryManager.categoriesManager.deleteCategory(cat.id);
                                    } catch (error) {
                                        console.error(`Failed to delete category ${cat.name}:`, error);
                                    }
                                }

                                // Import new categories
                                for (const category of categories) {
                                    try {
                                        const newId = category.id;
                                        const createdCategory = await this.controller.categoryManager.categoriesManager.createCategory(
                                            category.name,
                                            category.color
                                        );
                                        categoryIdMap[newId] = createdCategory.id;
                                    } catch (error) {
                                        console.error(`Failed to create category ${category.name}:`, error);
                                    }
                                }
                            }

                            // Import each note
                            for (const note of notes) {
                                // Create a new note
                                const newNote = await this.model.createNote();

                                // Map any category IDs if needed
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
                            if (categories.length > 0) {
                                successMsg += ` and ${categories.length} categories`;
                            }
                            this.controller.showNotification(successMsg, 'success');
                        } catch (error) {
                            this.controller.showNotification(`Error during import: ${error.message}`, 'error');
                        }
                    },
                    'Import' // Specify the button text appropriate for this action
                );
            } catch (error) {
                throw new Error(`Failed to parse JSON file: ${error.message}`);
            }
        } else {
            throw new Error('Unsupported file format. Please use .json files.');
        }
    }
}

export default BackupManager;