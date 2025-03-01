// File: js/controller.js - Connects Model and View, handles events

import CategoriesManager from './categories.js';

class NotesController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.categoriesManager = new CategoriesManager();
        this.categoriesMap = new Map(); // For quick lookup

        // Initialize
        this.init();
    }

    async init() {
        await this.model.init();
        await this.loadCategories();
        this.refreshView();
        this.setupEventListeners();
    }

    async loadCategories() {
        const categories = await this.categoriesManager.getAllCategories();
        // Create a map for quick lookups
        this.categoriesMap.clear();
        categories.forEach(category => {
            this.categoriesMap.set(category.id, category);
        });
        return categories;
    }

    refreshView() {
        this.view.renderNotesList(this.model.getAllNotes(), this.model.activeNoteId, this.categoriesMap);
        this.view.renderActiveNote(this.model.getActiveNote());

        const activeNote = this.model.getActiveNote();
        if (activeNote && this.view.categoriesContainer) {
            this.view.renderNoteCategories(
                activeNote.categories || [],
                Array.from(this.categoriesMap.values())
            );
        }
    }

    setupEventListeners() {
        // Add new note
        this.view.addNoteBtn.addEventListener('click', () => {
            this.model.createNote();
            this.refreshView();
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
            const activeNote = this.model.getActiveNote();
            if (activeNote) {
                this.model.updateNote(activeNote.id, { title: e.target.value });
                this.view.renderNotesList(this.model.getAllNotes(), this.model.activeNoteId, this.categoriesMap);
            }
        });

        // Update note content
        this.view.noteContent.addEventListener('input', (e) => {
            const activeNote = this.model.getActiveNote();
            if (activeNote) {
                this.model.updateNote(activeNote.id, { content: e.target.value });
            }
        });

        // In controller.js, update the setupEventListeners method

        // Add category button
        if (this.view.addCategoryBtn) {
            this.view.addCategoryBtn.addEventListener('click', async (e) => {
                e.preventDefault(); // Prevent default behavior
                e.stopPropagation(); // Stop event propagation

                const rect = e.target.closest('.icon-button').getBoundingClientRect();
                const categories = await this.categoriesManager.getAllCategories();

                const dropdown = this.view.showCategorySelector(
                    categories,
                    window.innerWidth - rect.right,
                    rect.bottom
                );

                // Handle category selection - Fix for first click not working
                const handleCategoryClick = async (e) => {
                    e.preventDefault(); // Prevent default
                    e.stopPropagation(); // Stop propagation

                    const categoryOption = e.target.closest('.category-option');
                    const createOption = e.target.closest('.create-category-option');

                    if (categoryOption) {
                        const categoryId = categoryOption.dataset.id;
                        const activeNote = this.model.getActiveNote();
                        if (activeNote) {
                            await this.model.addCategoryToNote(activeNote.id, categoryId);
                            dropdown.remove();
                            this.refreshView();
                            document.removeEventListener('click', handleCategoryClick); // Clean up
                        }
                    } else if (createOption) {
                        dropdown.remove();
                        this.showCreateCategoryForm(
                            window.innerWidth - rect.right,
                            rect.bottom
                        );
                        document.removeEventListener('click', handleCategoryClick); // Clean up
                    }
                };

                // Use direct click handlers instead of event delegation
                const categoryOptions = dropdown.querySelectorAll('.category-option');
                categoryOptions.forEach(option => {
                    option.addEventListener('click', handleCategoryClick);
                });

                const createOption = dropdown.querySelector('.create-category-option');
                if (createOption) {
                    createOption.addEventListener('click', handleCategoryClick);
                }
            });
        }

        // Remove category - Fix for remove (x) not working on first click
        if (this.view.categoriesContainer) {
            this.view.categoriesContainer.addEventListener('click', async (e) => {
                e.preventDefault(); // Prevent default

                if (e.target.classList.contains('remove-category')) {
                    const badge = e.target.closest('.category-badge');
                    if (badge) {
                        const categoryId = badge.dataset.id;
                        const activeNote = this.model.getActiveNote();
                        if (activeNote) {
                            await this.model.removeCategoryFromNote(activeNote.id, categoryId);
                            this.refreshView();
                        }
                    }
                }
            });
        }

        // Download all notes
        this.view.downloadNotesBtn.addEventListener('click', () => {
            this.downloadNotes();
        });

        // Open in new tab
        this.view.openTabBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
        });

        // Note options dropdown
        this.view.noteOptionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = e.target.closest('.icon-button').getBoundingClientRect();
            const dropdown = this.view.showNoteOptions(window.innerWidth - rect.right, rect.bottom);

            // Manage categories action
            dropdown.querySelector('#manage-categories').addEventListener('click', async () => {
                dropdown.remove();
                await this.showCategoriesManager();
            });

            // Delete note action
            dropdown.querySelector('#delete-note').addEventListener('click', () => {
                const activeNote = this.model.getActiveNote();
                if (activeNote) {
                    this.view.showModal(
                        'Delete Note',
                        `Are you sure you want to delete "${activeNote.title}"?`,
                        async () => {
                            await this.model.deleteNote(activeNote.id);
                            this.refreshView();
                        }
                    );
                }
                dropdown.remove();
            });
        });
    }

    // Show form to create a new category
    showCreateCategoryForm(x, y) {
        const form = this.view.showCreateCategoryForm(x, y);

        form.querySelector('#save-category').addEventListener('click', async () => {
            const nameInput = form.querySelector('#category-name');
            const colorInput = form.querySelector('#category-color');

            const name = nameInput.value.trim();
            const color = colorInput.value;

            if (name) {
                const newCategory = await this.categoriesManager.createCategory(name, color);
                await this.loadCategories();

                // Add to current note
                const activeNote = this.model.getActiveNote();
                if (activeNote) {
                    this.model.addCategoryToNote(activeNote.id, newCategory.id);
                }

                form.remove();
                this.refreshView();
            } else {
                nameInput.focus();
            }
        });
    }

    // Show the categories manager modal
    async showCategoriesManager() {
        // This would be a more complex UI for managing all categories
        // For now, we'll just show a simple alert
        alert('Category management coming soon!');
    }

    downloadNotes() {
        const notes = this.model.getAllNotes();

        // Prepare data
        const jsonData = JSON.stringify(notes, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        // Clean up
        URL.revokeObjectURL(url);
    }
}

export default NotesController;