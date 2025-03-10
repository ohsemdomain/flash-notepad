// js/controller/controller.js
/**
 * @file js/controller/controller.js
 * @description Main controller for the application
 * @requires category-controller.js, note-controller.js, backup-controller.js, ui-controller.js
 * 
 * Central controller that coordinates between the model and view, and delegates
 * specific functionalities to specialized controller components. Sets up event
 * listeners and initializes the application.
 */

import CategoryController from './category-controller.js';
import NoteController from './note-controller.js';
import BackupController from './backup-controller.js';
import UIController from './ui-controller.js';

class AppController {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        // Initialize sub-controllers
        this.categoryController = new CategoryController(this);
        this.noteController = new NoteController(this);
        this.backupController = new BackupController(this);
        this.uiController = new UIController(this);

        // Initialize
        this.init();
    }

    async init() {
        await this.model.init();
        await this.categoryController.loadCategories();
        this.refreshView();
        this.setupEventListeners();
    }

    refreshView() {
        this.view.renderNotesList(
            this.model.getAllNotes(),
            this.model.activeNoteId,
            this.categoryController.categoriesMap
        );
        this.view.renderActiveNote(this.model.getActiveNote());

        const activeNote = this.model.getActiveNote();
        if (activeNote && this.view.categoriesContainer) {
            this.view.renderNoteCategories(
                activeNote.categories || [],
                Array.from(this.categoryController.categoriesMap.values())
            );
        }
    }

    setupEventListeners() {
        // Add new note
        this.view.addNoteBtn.addEventListener('click', () => {
            this.noteController.createNote();
        });

        // Select note
        this.view.notesList.addEventListener('click', (e) => {
            const noteItem = e.target.closest('.note-item');
            if (noteItem) {
                this.model.activeNoteId = noteItem.dataset.id;
                this.refreshView();
            }
        });

        // Update note title
        this.view.noteTitle.addEventListener('input', (e) => {
            this.noteController.updateNoteTitle(e.target.value);
        });

        // Update note content
        this.view.noteContent.addEventListener('input', (e) => {
            this.noteController.updateNoteContent(e.target.value);
        });

        // Add category button
        if (this.view.addCategoryBtn) {
            this.view.addCategoryBtn.addEventListener('click', (e) => {
                this.categoryController.handleAddCategoryClick(e);
            });
        }

        // Remove category
        if (this.view.categoriesContainer) {
            this.view.categoriesContainer.addEventListener('click', (e) => {
                this.categoryController.handleRemoveCategoryClick(e);
            });
        }

        // Open settings
        this.view.settingsBtn.addEventListener('click', () => {
            this.uiController.openSettings();
        });

        // Open in new tab
        this.view.openTabBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
        });

        // Note options dropdown
        this.view.noteOptionsBtn.addEventListener('click', (e) => {
            this.noteController.showNoteOptions(e);
        });

        // Settings modal event listeners
        this.setupSettingsEventListeners();
    }

    setupSettingsEventListeners() {
        // Close settings button
        document.getElementById('close-settings-btn').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.add('hidden');
        });

        // Settings tabs
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Deactivate all tabs
                document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

                // Activate clicked tab
                tab.classList.add('active');
                const tabId = `${tab.dataset.tab}-tab`;
                document.getElementById(tabId).classList.add('active');
            });
        });

        // Export notes
        document.getElementById('export-notes-btn').addEventListener('click', () => {
            this.backupController.exportNotes();
        });

        // Import notes
        document.getElementById('import-notes-btn').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        // Handle file import
        document.getElementById('import-file-input').addEventListener('change', (e) => {
            this.backupController.handleFileImport(e);
        });

        // Category management in settings
        document.getElementById('add-category-settings-btn').addEventListener('click', () => {
            this.categoryController.showCreateCategoryInSettings();
        });
    }

    // Helper method to show notification (delegated to UIController)
    showNotification(message, type = 'info') {
        this.uiController.showNotification(message, type);
    }
}

export default AppController;