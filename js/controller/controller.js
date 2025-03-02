// js/controller/controller.js
/**
 * @file js/controller/controller.js
 * @description Main controller for the application
 * @requires category-manager.js, note-manager.js, backup-manager.js, ui-manager.js
 * 
 * Central controller that coordinates between the model and view, and delegates
 * specific functionalities to specialized controller components. Sets up event
 * listeners and initializes the application.
 */

import CategoryManager from './category-manager.js';
import NoteManager from './note-manager.js';
import BackupManager from './backup-manager.js';
import UIManager from './ui-manager.js';

class NotesController {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        // Initialize sub-managers
        this.categoryManager = new CategoryManager(this);
        this.noteManager = new NoteManager(this);
        this.backupManager = new BackupManager(this);
        this.uiManager = new UIManager(this);

        // Initialize
        this.init();
    }

    async init() {
        await this.model.init();
        await this.categoryManager.loadCategories();
        this.refreshView();
        this.setupEventListeners();
    }

    refreshView() {
        this.view.renderNotesList(
            this.model.getAllNotes(),
            this.model.activeNoteId,
            this.categoryManager.categoriesMap
        );
        this.view.renderActiveNote(this.model.getActiveNote());

        const activeNote = this.model.getActiveNote();
        if (activeNote && this.view.categoriesContainer) {
            this.view.renderNoteCategories(
                activeNote.categories || [],
                Array.from(this.categoryManager.categoriesMap.values())
            );
        }
    }

    setupEventListeners() {
        // Add new note
        this.view.addNoteBtn.addEventListener('click', () => {
            this.noteManager.createNote();
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
            this.noteManager.updateNoteTitle(e.target.value);
        });

        // Update note content
        this.view.noteContent.addEventListener('input', (e) => {
            this.noteManager.updateNoteContent(e.target.value);
        });

        // Add category button
        if (this.view.addCategoryBtn) {
            this.view.addCategoryBtn.addEventListener('click', (e) => {
                this.categoryManager.handleAddCategoryClick(e);
            });
        }

        // Remove category
        if (this.view.categoriesContainer) {
            this.view.categoriesContainer.addEventListener('click', (e) => {
                this.categoryManager.handleRemoveCategoryClick(e);
            });
        }

        // Open settings
        this.view.settingsBtn.addEventListener('click', () => {
            this.uiManager.openSettings();
        });

        // Open in new tab
        this.view.openTabBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
        });

        // Note options dropdown
        this.view.noteOptionsBtn.addEventListener('click', (e) => {
            this.noteManager.showNoteOptions(e);
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

        // Export notes (Plain Text)
        document.getElementById('export-text-btn').addEventListener('click', () => {
            this.backupManager.exportNotes('text');
        });

        // Import notes
        document.getElementById('import-notes-btn').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        // Handle file import
        document.getElementById('import-file-input').addEventListener('change', (e) => {
            this.backupManager.handleFileImport(e);
        });

        // Category management in settings
        document.getElementById('add-category-settings-btn').addEventListener('click', () => {
            this.categoryManager.showCreateCategoryInSettings();
        });
    }

    // Helper method to show notification (delegated to UIManager)
    showNotification(message, type = 'info') {
        this.uiManager.showNotification(message, type);
    }
}

export default NotesController;