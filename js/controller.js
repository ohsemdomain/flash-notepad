// File: js/controller.js - Connects Model and View, handles events

import CategoriesManager from './categories.js';
import { convertNotesToPlainText, parseTextNotes } from './backup-utils.js';

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
            this.model.createNote().then(() => {
                this.refreshView();
            });
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
                this.model.updateNote(activeNote.id, { title: e.target.value }).then(() => {
                    this.view.renderNotesList(this.model.getAllNotes(), this.model.activeNoteId, this.categoriesMap);
                });
            }
        });

        // Update note content
        this.view.noteContent.addEventListener('input', (e) => {
            const activeNote = this.model.getActiveNote();
            if (activeNote) {
                this.model.updateNote(activeNote.id, { content: e.target.value });
            }
        });

        // Add category button
        if (this.view.addCategoryBtn) {
            this.view.addCategoryBtn.addEventListener('click', async (e) => {
                e.preventDefault(); // Prevent default behavior
                e.stopPropagation(); // Stop event propagation

                // Check if a note is active
                const activeNote = this.model.getActiveNote();
                if (!activeNote) {
                    this.showNotification('Please select a note first', 'warning');
                    return;
                }

                const rect = e.target.closest('.icon-button').getBoundingClientRect();
                const categories = await this.categoriesManager.getAllCategories();

                const dropdown = this.view.showCategorySelector(
                    categories,
                    window.innerWidth - rect.right,
                    rect.bottom
                );

                // Handle category selection
                const handleCategoryClick = async (e) => {
                    e.preventDefault(); // Prevent default
                    e.stopPropagation(); // Stop propagation

                    const categoryOption = e.target.closest('.category-option');
                    const createOption = e.target.closest('.create-category-option');

                    if (categoryOption) {
                        const categoryId = categoryOption.dataset.id;
                        const activeNote = this.model.getActiveNote();
                        if (activeNote && activeNote.id) {
                            try {
                                await this.model.addCategoryToNote(activeNote.id, categoryId);
                                dropdown.remove();
                                this.refreshView();
                            } catch (error) {
                                this.showNotification(`Error adding category: ${error.message}`, 'error');
                            }
                        }
                    } else if (createOption) {
                        dropdown.remove();
                        this.showCreateCategoryForm(
                            window.innerWidth - rect.right,
                            rect.bottom
                        );
                    }
                    document.removeEventListener('click', handleCategoryClick);
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

        // Remove category
        if (this.view.categoriesContainer) {
            this.view.categoriesContainer.addEventListener('click', async (e) => {
                e.preventDefault(); // Prevent default

                if (e.target.classList.contains('remove-category')) {
                    const badge = e.target.closest('.category-badge');
                    if (badge) {
                        const categoryId = badge.dataset.id;
                        const activeNote = this.model.getActiveNote();
                        if (activeNote && activeNote.id) {
                            try {
                                await this.model.removeCategoryFromNote(activeNote.id, categoryId);
                                this.refreshView();
                            } catch (error) {
                                this.showNotification(`Error removing category: ${error.message}`, 'error');
                            }
                        }
                    }
                }
            });
        }

        // Open settings
        this.view.settingsBtn.addEventListener('click', () => {
            this.openSettings();
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
                            try {
                                await this.model.deleteNote(activeNote.id);
                                this.refreshView();
                                this.showNotification('Note deleted successfully', 'success');
                            } catch (error) {
                                this.showNotification(`Error deleting note: ${error.message}`, 'error');
                            }
                        }
                    );
                }
                dropdown.remove();
            });
        });

        // Settings modal event listeners
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
            this.exportNotes('text');
        });

        // Import notes
        document.getElementById('import-notes-btn').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        // Handle file import
        document.getElementById('import-file-input').addEventListener('change', (e) => {
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
                        this.showNotification(`Error importing notes: ${error.message}`, 'error');
                    }
                };

                if (file.name.endsWith('.txt')) {
                    reader.readAsText(file);
                } else {
                    this.showNotification('Please select a .txt file', 'error');
                }
            }
        });

        // Category management in settings
        document.getElementById('add-category-settings-btn').addEventListener('click', () => {
            // Show create category form in settings
            this.showCreateCategoryInSettings();
        });
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove any existing notification first
        const existingNotification = document.getElementById('notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create a fresh notification element
        const notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Directly append to body
        document.body.appendChild(notification);

        // Trigger the animation in the next frame to ensure proper rendering
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Hide and remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300); // Wait for fade-out animation
        }, 3000);
    }

    // Open settings modal
    async openSettings() {
        // Populate categories list
        await this.renderCategoriesInSettings();

        // Show settings modal
        document.getElementById('settings-modal').classList.remove('hidden');
    }

    // Show form to create a new category
    showCreateCategoryForm(x, y) {
        // First remove any existing form
        const existingForm = document.getElementById('create-category-form');
        if (existingForm) {
            existingForm.remove();
        }

        // Create a new form with a unique ID to avoid conflicts
        const form = document.createElement('div');
        form.id = 'create-category-form';
        form.className = 'dropdown-menu';
        form.style.top = `${y}px`;
        form.style.right = `${x}px`;
        form.style.padding = '12px';
        form.style.width = '240px';

        form.innerHTML = `
            <div class="form-group">
                <label for="category-name">Category Name</label>
                <input type="text" id="category-name" class="form-input" placeholder="Enter category name" required>
            </div>
            <div class="form-group">
                <label for="category-color">Category Color</label>
                <input type="color" id="category-color" class="form-input color-picker" value="#4285F4">
            </div>
            <div class="form-actions">
                <button id="cancel-category" class="btn btn-secondary">Cancel</button>
                <button id="save-category" class="btn btn-primary">Save</button>
            </div>
        `;

        // Append to body only after the form is fully configured
        document.body.appendChild(form);

        // Focus on the input field after the element is in the DOM
        setTimeout(() => form.querySelector('#category-name').focus(), 10);

        // Set up event listeners after the element is in the DOM
        form.querySelector('#cancel-category').addEventListener('click', () => {
            form.remove();
        });

        // Save button event listener
        form.querySelector('#save-category').addEventListener('click', async () => {
            const nameInput = form.querySelector('#category-name');
            const colorInput = form.querySelector('#category-color');

            const name = nameInput.value.trim();
            const color = colorInput.value;

            if (name) {
                try {
                    const newCategory = await this.categoriesManager.createCategory(name, color);
                    await this.loadCategories();

                    // Add to current note - ensure activeNote exists
                    const activeNote = this.model.getActiveNote();
                    if (activeNote && activeNote.id) {
                        await this.model.addCategoryToNote(activeNote.id, newCategory.id);
                    }

                    form.remove();
                    this.refreshView();
                    this.showNotification(`Category "${name}" created successfully`, 'success');
                } catch (error) {
                    this.showNotification(error.message, 'error');
                }
            } else {
                nameInput.focus();
                this.showNotification('Category name cannot be empty', 'warning');
            }
        });

        return form;
    }

    // Show create category in settings panel
    showCreateCategoryInSettings() {
        // Create a modal form for adding a new category
        const existingModal = document.getElementById('create-category-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'create-category-modal';

        modal.innerHTML = `
            <div class="modal-container" style="max-width: 400px;">
                <div class="modal-content">
                    <h3>Create New Category</h3>
                    <div class="form-group">
                        <label for="settings-category-name">Category Name</label>
                        <input type="text" id="settings-category-name" class="form-input" placeholder="Enter category name" required>
                    </div>
                    <div class="form-group">
                        <label for="settings-category-color">Category Color</label>
                        <input type="color" id="settings-category-color" class="form-input color-picker" value="#4285F4">
                    </div>
                    <div class="modal-actions">
                        <button id="settings-cancel-category" class="btn btn-secondary">Cancel</button>
                        <button id="settings-save-category" class="btn btn-primary">Save</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Show the modal
        setTimeout(() => {
            modal.style.display = 'flex';
            document.getElementById('settings-category-name').focus();
        }, 10);

        // Set up event listeners
        document.getElementById('settings-cancel-category').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('settings-save-category').addEventListener('click', async () => {
            const nameInput = document.getElementById('settings-category-name');
            const colorInput = document.getElementById('settings-category-color');

            const name = nameInput.value.trim();
            const color = colorInput.value;

            if (name) {
                try {
                    await this.categoriesManager.createCategory(name, color);
                    await this.loadCategories();
                    await this.renderCategoriesInSettings();
                    modal.remove();
                    this.showNotification(`Category "${name}" created successfully`, 'success');
                } catch (error) {
                    this.showNotification(error.message, 'error');
                }
            } else {
                nameInput.focus();
                this.showNotification('Category name cannot be empty', 'warning');
            }
        });
    }

    // Show edit category form in settings
    async showEditCategoryForm(categoryId) {
        try {
            const category = await this.categoriesManager.getCategoryById(categoryId);
            if (!category) {
                throw new Error(`Category not found`);
            }

            // Remove existing edit modal if any
            const existingModal = document.getElementById('edit-category-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // Create a modal form for editing the category
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'edit-category-modal';

            modal.innerHTML = `
                <div class="modal-container" style="max-width: 400px;">
                    <div class="modal-content">
                        <h3>Edit Category</h3>
                        <div class="form-group">
                            <label for="edit-category-name">Category Name</label>
                            <input type="text" id="edit-category-name" class="form-input" value="${category.name}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-category-color">Category Color</label>
                            <input type="color" id="edit-category-color" class="form-input color-picker" value="${category.color}">
                        </div>
                        <div class="modal-actions">
                            <button id="edit-cancel-category" class="btn btn-secondary">Cancel</button>
                            <button id="edit-save-category" class="btn btn-primary">Save</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Show the modal
            setTimeout(() => {
                modal.style.display = 'flex';
                document.getElementById('edit-category-name').focus();
            }, 10);

            // Set up event listeners
            document.getElementById('edit-cancel-category').addEventListener('click', () => {
                modal.remove();
            });

            document.getElementById('edit-save-category').addEventListener('click', async () => {
                const nameInput = document.getElementById('edit-category-name');
                const colorInput = document.getElementById('edit-category-color');

                const name = nameInput.value.trim();
                const color = colorInput.value;

                if (name) {
                    try {
                        await this.categoriesManager.updateCategory(categoryId, { name, color });
                        await this.loadCategories();
                        this.refreshView();
                        await this.renderCategoriesInSettings();
                        modal.remove();
                        this.showNotification(`Category updated successfully`, 'success');
                    } catch (error) {
                        this.showNotification(error.message, 'error');
                    }
                } else {
                    nameInput.focus();
                    this.showNotification('Category name cannot be empty', 'warning');
                }
            });
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Show delete category confirmation
    async showDeleteCategoryConfirmation(categoryId) {
        try {
            const category = await this.categoriesManager.getCategoryById(categoryId);
            if (!category) {
                throw new Error(`Category not found`);
            }

            const notesCount = await this.categoriesManager.getNotesCountForCategory(categoryId);

            this.view.showModal(
                'Delete Category',
                `Are you sure you want to delete the "${category.name}" category? It is currently used in ${notesCount} note(s). This action cannot be undone.`,
                async () => {
                    try {
                        const result = await this.categoriesManager.deleteCategory(categoryId);
                        await this.loadCategories();
                        this.refreshView();
                        await this.renderCategoriesInSettings();
                        this.showNotification(result.message, 'success');
                    } catch (error) {
                        this.showNotification(error.message, 'error');
                    }
                }
            );
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Render categories in the settings panel
    async renderCategoriesInSettings() {
        const categoriesList = document.getElementById('categories-list');
        if (!categoriesList) return;

        categoriesList.innerHTML = '';

        const categories = await this.categoriesManager.getAllCategories();

        if (categories.length === 0) {
            categoriesList.innerHTML = '<div class="empty-state">No categories created yet</div>';
            return;
        }

        for (const category of categories) {
            const notesCount = await this.categoriesManager.getNotesCountForCategory(category.id);

            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <div class="category-color" style="background-color: ${category.color}"></div>
                <div class="category-name">
                    ${category.name}
                    <small class="notes-count">${notesCount} note${notesCount !== 1 ? 's' : ''}</small>
                </div>
                <div class="category-actions">
                    <button class="icon-button edit-category" data-id="${category.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-button delete-category" data-id="${category.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            categoriesList.appendChild(categoryItem);
        }

        // Add event listeners for edit and delete actions
        categoriesList.querySelectorAll('.edit-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.id;
                this.showEditCategoryForm(categoryId);
            });
        });

        categoriesList.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.id;
                this.showDeleteCategoryConfirmation(categoryId);
            });
        });
    }

    // Export notes as text
    exportNotes(format = 'text') {
        const notes = this.model.getAllNotes();
        if (notes.length === 0) {
            this.showNotification('No notes to export', 'warning');
            return;
        }

        let fileContent;
        let fileName;
        let mimeType;

        // Export as plain text
        fileContent = convertNotesToPlainText(notes, this.categoriesMap);
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

        this.showNotification('Notes exported successfully', 'success');
    }

    // Import notes from file
    async importNotes(file, content) {
        if (file.name.endsWith('.txt')) {
            try {
                // Get existing categories for resolving during import
                const existingCategories = await this.categoriesManager.getAllCategories();

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

                            this.refreshView();
                            this.showNotification(`Successfully imported ${notes.length} notes`, 'success');
                        } catch (error) {
                            this.showNotification(`Error during import: ${error.message}`, 'error');
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

    // Show the categories manager modal
    async showCategoriesManager() {
        // Open the settings panel to the categories tab
        await this.openSettings();

        // Activate the categories tab
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        const categoriesTab = document.querySelector('.settings-tab[data-tab="categories"]');
        if (categoriesTab) categoriesTab.classList.add('active');

        const categoriesPane = document.getElementById('categories-tab');
        if (categoriesPane) categoriesPane.classList.add('active');
    }
}

export default NotesController;