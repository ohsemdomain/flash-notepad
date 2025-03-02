// js/view/view.js
/**
 * @file js/view/view.js
 * @description Main view coordinator
 * @requires notes-list-view.js, note-editor-view.js, category-view.js, dropdown-view.js, modal-view.js
 * 
 * Central view class that coordinates all UI components and delegates rendering
 * tasks to specialized view modules. Acts as a facade for the controller to
 * interact with all view-related functionality.
 */

import NotesListView from './notes-list-view.js';
import NoteEditorView from './note-editor-view.js';
import CategoryView from './category-view.js';
import DropdownView from './dropdown-view.js';
import ModalView from './modal-view.js';

class NotesView {
    constructor() {
        // Initialize DOM elements
        this.notesList = document.getElementById('notes-list');
        this.noteTitle = document.getElementById('note-title');
        this.noteContent = document.getElementById('note-content');
        this.addNoteBtn = document.getElementById('add-note-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        this.openTabBtn = document.getElementById('open-tab-btn');
        this.noteOptionsBtn = document.getElementById('note-options-btn');
        this.categoriesContainer = document.getElementById('categories-container');
        this.addCategoryBtn = document.getElementById('add-category-btn');

        // Initialize specialized view components
        this.listView = new NotesListView(this.notesList);
        this.editorView = new NoteEditorView(this.noteTitle, this.noteContent, this.noteOptionsBtn);
        this.categoryView = new CategoryView(this.categoriesContainer, this.addCategoryBtn);
        this.dropdownView = new DropdownView();
        this.modalView = new ModalView();
    }

    // Delegate to specialized views
    renderNotesList(notes, activeNoteId, categoriesMap) {
        this.listView.renderNotesList(notes, activeNoteId, categoriesMap);
    }

    renderActiveNote(note) {
        this.editorView.renderActiveNote(note);
    }

    renderNoteCategories(noteCategories, allCategories) {
        this.categoryView.renderNoteCategories(noteCategories, allCategories);
    }

    createCategoryBadge(category) {
        return this.categoryView.createCategoryBadge(category);
    }

    showCategorySelector(categories, x, y) {
        return this.categoryView.showCategorySelector(categories, x, y, this.dropdownView);
    }

    showCreateCategoryForm(x, y) {
        return this.categoryView.showCreateCategoryForm(x, y);
    }

    showNoteOptions(x, y) {
        return this.dropdownView.showNoteOptions(x, y);
    }

    showModal(title, message, onConfirm) {
        this.modalView.showModal(title, message, onConfirm);
    }

    hideModal() {
        this.modalView.hideModal();
    }
}

export default NotesView;