// File: js/view.js - Manages UI updates for the notepad extension

class NotesView {
    constructor() {
        // DOM elements
        this.notesList = document.getElementById('notes-list');
        this.noteTitle = document.getElementById('note-title');
        this.noteContent = document.getElementById('note-content');
        this.addNoteBtn = document.getElementById('add-note-btn');
        this.settingsBtn = document.getElementById('settings-btn'); // Changed from downloadNotesBtn
        this.openTabBtn = document.getElementById('open-tab-btn');
        this.noteOptionsBtn = document.getElementById('note-options-btn');
        this.categoriesContainer = document.getElementById('categories-container');
        this.addCategoryBtn = document.getElementById('add-category-btn');
    }

    // Render the list of notes with categories
    renderNotesList(notes, activeNoteId, categoriesMap) {
        this.notesList.innerHTML = '';

        if (notes.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No notes yet. Click + to create one.';
            this.notesList.appendChild(emptyState);
            return;
        }

        notes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = `note-item ${note.id === activeNoteId ? 'active' : ''}`;
            noteItem.dataset.id = note.id;

            // Create title element
            const titleElement = document.createElement('div');
            titleElement.className = 'note-item-title';
            titleElement.textContent = note.title || 'Untitled Note';

            // Create categories container
            const categoriesElement = document.createElement('div');
            categoriesElement.className = 'note-item-categories';

            // Render each category badge
            if (note.categories && note.categories.length > 0) {
                note.categories.forEach(categoryId => {
                    const category = categoriesMap.get(categoryId);
                    if (category) {
                        const badge = document.createElement('span');
                        badge.className = 'category-badge';
                        badge.style.backgroundColor = category.color;
                        badge.textContent = category.name;
                        categoriesElement.appendChild(badge);
                    }
                });
            }

            // Append elements to note item
            noteItem.appendChild(titleElement);
            noteItem.appendChild(categoriesElement);

            this.notesList.appendChild(noteItem);
        });
    }

    // Render the active note
    renderActiveNote(note) {
        if (note) {
            this.noteTitle.value = note.title || '';
            this.noteContent.value = note.content || '';

            // Enable edit controls
            this.noteTitle.disabled = false;
            this.noteContent.disabled = false;
            this.addCategoryBtn.disabled = false;
            this.noteOptionsBtn.disabled = false;

            // Make sure options button is visible
            this.noteOptionsBtn.style.visibility = 'visible';
        } else {
            this.noteTitle.value = '';
            this.noteContent.value = '';

            // Disable edit controls when no note is selected
            this.noteTitle.disabled = true;
            this.noteContent.disabled = true;
            this.addCategoryBtn.disabled = true;
            this.noteOptionsBtn.disabled = true;

            // Hide options button
            this.noteOptionsBtn.style.visibility = 'hidden';

            // Clear categories
            if (this.categoriesContainer) {
                this.categoriesContainer.innerHTML = '';
            }
        }
    }

    // Render categories for the active note
    renderNoteCategories(noteCategories, allCategories) {
        if (!this.categoriesContainer) return;

        this.categoriesContainer.innerHTML = '';

        // Create badges for existing categories
        noteCategories.forEach(categoryId => {
            const category = allCategories.find(c => c.id === categoryId);
            if (category) {
                const badge = this.createCategoryBadge(category);
                this.categoriesContainer.appendChild(badge);
            }
        });
    }

    // Create a category badge with remove button
    createCategoryBadge(category) {
        const badge = document.createElement('div');
        badge.className = 'category-badge';
        badge.dataset.id = category.id;
        badge.style.backgroundColor = category.color;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = category.name;

        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-category';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Remove category';

        badge.appendChild(nameSpan);
        badge.appendChild(removeBtn);

        return badge;
    }

    // Show category selector dropdown
    showCategorySelector(categories, x, y) {
        // Remove any existing dropdown
        const existingDropdown = document.getElementById('category-selector-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        // Create dropdown element
        const dropdown = document.createElement('div');
        dropdown.id = 'category-selector-dropdown';
        dropdown.className = 'dropdown-menu';
        dropdown.style.top = `${y}px`;
        dropdown.style.right = `${x}px`;
        dropdown.style.maxHeight = '300px';
        dropdown.style.overflowY = 'auto';

        // Add existing categories
        if (categories.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'dropdown-item empty-state';
            emptyState.textContent = 'No categories yet';
            dropdown.appendChild(emptyState);
        } else {
            categories.forEach(category => {
                const item = document.createElement('div');
                item.className = 'dropdown-item category-option';
                item.dataset.id = category.id;

                const colorSwatch = document.createElement('span');
                colorSwatch.className = 'category-color-swatch';
                colorSwatch.style.backgroundColor = category.color;

                const nameSpan = document.createElement('span');
                nameSpan.textContent = category.name;

                item.appendChild(colorSwatch);
                item.appendChild(nameSpan);
                dropdown.appendChild(item);
            });
        }

        // Add separator
        const separator = document.createElement('div');
        separator.className = 'dropdown-separator';
        dropdown.appendChild(separator);

        // Add "Create new category" option
        const createNew = document.createElement('div');
        createNew.className = 'dropdown-item create-category-option';
        createNew.innerHTML = '<i class="fas fa-plus"></i> Create new category';
        dropdown.appendChild(createNew);

        document.body.appendChild(dropdown);

        // Close dropdown when clicking outside
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== this.addCategoryBtn) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });

        return dropdown;
    }

    // Show form for creating a new category
    showCreateCategoryForm(x, y) {
        // Remove any existing form
        const existingForm = document.getElementById('create-category-form');
        if (existingForm) {
            existingForm.remove();
        }

        // Create form element
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

        document.body.appendChild(form);

        // Focus on the input
        form.querySelector('#category-name').focus();

        // Setup event listeners
        form.querySelector('#cancel-category').addEventListener('click', () => {
            form.remove();
        });

        return form;
    }

    // Create a dropdown menu for note options
    showNoteOptions(x, y) {
        // Remove any existing dropdown
        const existingDropdown = document.getElementById('note-options-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        // Create dropdown element
        const dropdown = document.createElement('div');
        dropdown.id = 'note-options-dropdown';
        dropdown.className = 'dropdown-menu';
        dropdown.style.top = `${y}px`;
        dropdown.style.right = `${x}px`;

        // Add dropdown items
        dropdown.innerHTML = `
        <div id="manage-categories" class="dropdown-item">
          <i class="fas fa-tags"></i> Manage categories
        </div>
        <div id="delete-note" class="dropdown-item text-danger">
          <i class="fas fa-trash"></i> Delete note
        </div>
      `;

        document.body.appendChild(dropdown);

        // Close dropdown when clicking outside
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== this.noteOptionsBtn) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });

        return dropdown;
    }

    showModal(title, message, onConfirm) {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalContainer = modalOverlay.querySelector('.modal-container');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');

        // Set content
        modalTitle.textContent = title || 'Confirm Action';
        modalMessage.textContent = message || 'Are you sure you want to proceed?';

        // Show modal with animation
        modalOverlay.classList.remove('hidden');

        // Add entrance animation
        modalContainer.style.transform = 'translateY(20px)';
        setTimeout(() => {
            modalContainer.style.transform = 'translateY(0)';
        }, 10);

        // Setup event listeners
        const handleConfirm = () => {
            this.hideModal();
            onConfirm();
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        const handleCancel = () => {
            this.hideModal();
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        // Clear any existing event listeners
        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));

        // Get the new button references
        const newConfirmBtn = document.getElementById('modal-confirm-btn');
        const newCancelBtn = document.getElementById('modal-cancel-btn');

        // Add new event listeners
        newConfirmBtn.addEventListener('click', handleConfirm);
        newCancelBtn.addEventListener('click', handleCancel);

        // Close on ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    hideModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalContainer = modalOverlay.querySelector('.modal-container');

        // Add exit animation
        modalContainer.style.transform = 'translateY(20px)';

        // Wait for animation before hiding
        setTimeout(() => {
            modalOverlay.classList.add('hidden');
            modalContainer.style.transform = 'translateY(0)';
        }, 200);
    }
}

export default NotesView;