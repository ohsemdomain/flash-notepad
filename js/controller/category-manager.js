// js/controller/category-manager.js
/**
 * @file js/controller/category-manager.js
 * @description Manages category-related operations
 * @requires categories.js
 * 
 * Controller component that handles category creation, editing, deletion, and
 * assignment to notes. Manages UI interactions for category management in both
 * the note editor and settings panels.
 */

import CategoriesManager from '../model/categories.js';

class CategoryManager {
    constructor(controller) {
        this.controller = controller;
        this.model = controller.model;
        this.view = controller.view;
        this.categoriesManager = new CategoriesManager();
        this.categoriesMap = new Map(); // For quick lookups
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

    async handleAddCategoryClick(e) {
        e.preventDefault();
        e.stopPropagation();

        // Check if a note is active
        const activeNote = this.model.getActiveNote();
        if (!activeNote) {
            this.controller.showNotification('Please select a note first', 'warning');
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
            e.preventDefault();
            e.stopPropagation();

            const categoryOption = e.target.closest('.category-option');
            const createOption = e.target.closest('.create-category-option');

            if (categoryOption) {
                const categoryId = categoryOption.dataset.id;
                const activeNote = this.model.getActiveNote();
                if (activeNote && activeNote.id) {
                    try {
                        await this.model.addCategoryToNote(activeNote.id, categoryId);
                        dropdown.remove();
                        this.controller.refreshView();
                    } catch (error) {
                        this.controller.showNotification(`Error adding category: ${error.message}`, 'error');
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
    }

    async handleRemoveCategoryClick(e) {
        e.preventDefault();

        if (e.target.classList.contains('remove-category')) {
            const badge = e.target.closest('.category-badge');
            if (badge) {
                const categoryId = badge.dataset.id;
                const activeNote = this.model.getActiveNote();
                if (activeNote && activeNote.id) {
                    try {
                        await this.model.removeCategoryFromNote(activeNote.id, categoryId);
                        this.controller.refreshView();
                    } catch (error) {
                        this.controller.showNotification(`Error removing category: ${error.message}`, 'error');
                    }
                }
            }
        }
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
                    this.controller.refreshView();
                    this.controller.showNotification(`Category "${name}" created successfully`, 'success');
                } catch (error) {
                    this.controller.showNotification(error.message, 'error');
                }
            } else {
                nameInput.focus();
                this.controller.showNotification('Category name cannot be empty', 'warning');
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
                    this.controller.showNotification(`Category "${name}" created successfully`, 'success');
                } catch (error) {
                    this.controller.showNotification(error.message, 'error');
                }
            } else {
                nameInput.focus();
                this.controller.showNotification('Category name cannot be empty', 'warning');
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
                        this.controller.refreshView();
                        await this.renderCategoriesInSettings();
                        modal.remove();
                        this.controller.showNotification(`Category updated successfully`, 'success');
                    } catch (error) {
                        this.controller.showNotification(error.message, 'error');
                    }
                } else {
                    nameInput.focus();
                    this.controller.showNotification('Category name cannot be empty', 'warning');
                }
            });
        } catch (error) {
            this.controller.showNotification(error.message, 'error');
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
                        this.controller.refreshView();
                        await this.renderCategoriesInSettings();
                        this.controller.showNotification(result.message, 'success');
                    } catch (error) {
                        this.controller.showNotification(error.message, 'error');
                    }
                }
            );
        } catch (error) {
            this.controller.showNotification(error.message, 'error');
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

    // Show the categories manager modal
    async showCategoriesManager() {
        // Open the settings panel to the categories tab
        await this.controller.uiManager.openSettings();

        // Activate the categories tab
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        const categoriesTab = document.querySelector('.settings-tab[data-tab="categories"]');
        if (categoriesTab) categoriesTab.classList.add('active');

        const categoriesPane = document.getElementById('categories-tab');
        if (categoriesPane) categoriesPane.classList.add('active');
    }
}

export default CategoryManager;