// File: js/view/category-view.js - Handles category-related UI

class CategoryView {
    constructor(categoriesContainer, addCategoryBtn) {
        this.categoriesContainer = categoriesContainer;
        this.addCategoryBtn = addCategoryBtn;
    }

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

    showCategorySelector(categories, x, y, dropdownView) {
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
}

export default CategoryView;