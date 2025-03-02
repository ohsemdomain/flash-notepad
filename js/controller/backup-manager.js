// File: js/controller/backup-manager.js - Handles import/export functionality

import { convertNotesToPlainText, parseTextNotes } from '../backup-utils.js';

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
                const notes = parseTextNotes(content, existingCategories);

                if (notes.length === 0) {
                    throw new Error('No valid notes found in the imported file');
                }

                // Confirm before replacing all notes
                this.view.showModal(
                    'Import Notes',
                    `This will import ${notes.length} note(s) and replace all existing notes. Continue?`,
                    async () => {
                        try {
                            // Delete all existing notes
                            const existingNotes = this.model.getAllNotes();
                            for (const note of existingNotes) {
                                await this.model.deleteNote(note.id);
                            }

                            // Import each note
                            for (const note of notes) {
                                // Create a new note with the imported data
                                const newNote = await this.model.createNote();
                                await this.model.updateNote(newNote.id, {
                                    title: note.title,
                                    content: note.content,
                                    categories: note.categories || []
                                });
                            }

                            this.controller.refreshView();
                            this.controller.showNotification(`Successfully imported ${notes.length} notes`, 'success');
                        } catch (error) {
                            this.controller.showNotification(`Error during import: ${error.message}`, 'error');
                        }
                    }
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