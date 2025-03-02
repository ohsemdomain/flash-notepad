// js/controller/note-manager.js
/**
 * @file js/controller/note-manager.js
 * @description Handles note-related operations
 * 
 * Manages note creation, updating, and deletion. Handles UI interactions
 * specific to note management, including note options and confirmation dialogs.
 */

class NoteManager {
    constructor(controller) {
        this.controller = controller;
        this.model = controller.model;
        this.view = controller.view;
    }

    async createNote() {
        await this.model.createNote();
        this.controller.refreshView();
    }

    updateNoteTitle(title) {
        const activeNote = this.model.getActiveNote();
        if (activeNote) {
            this.model.updateNote(activeNote.id, { title }).then(() => {
                this.view.renderNotesList(
                    this.model.getAllNotes(),
                    this.model.activeNoteId,
                    this.controller.categoryManager.categoriesMap
                );
            });
        }
    }

    updateNoteContent(content) {
        const activeNote = this.model.getActiveNote();
        if (activeNote) {
            this.model.updateNote(activeNote.id, { content });
        }
    }

    showNoteOptions(e) {
        e.stopPropagation();
        const rect = e.target.closest('.icon-button').getBoundingClientRect();
        const dropdown = this.view.showNoteOptions(window.innerWidth - rect.right, rect.bottom);

        // Manage categories action
        dropdown.querySelector('#manage-categories').addEventListener('click', async () => {
            dropdown.remove();
            await this.controller.categoryManager.showCategoriesManager();
        });

        // Delete note action
        dropdown.querySelector('#delete-note').addEventListener('click', () => {
            this.showDeleteNoteConfirmation(dropdown);
        });
    }

    showDeleteNoteConfirmation(dropdown) {
        const activeNote = this.model.getActiveNote();
        if (activeNote) {
            this.view.showModal(
                'Delete Note',
                `Are you sure you want to delete "${activeNote.title}"?`,
                async () => {
                    try {
                        await this.model.deleteNote(activeNote.id);
                        this.controller.refreshView();
                        this.controller.showNotification('Note deleted successfully', 'success');
                    } catch (error) {
                        this.controller.showNotification(`Error deleting note: ${error.message}`, 'error');
                    }
                }
            );
        }
        dropdown.remove();
    }
}

export default NoteManager;