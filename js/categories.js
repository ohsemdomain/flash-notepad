// File: js/categories.js - Utility for managing note categories

class CategoriesManager {
    constructor() {
        this.defaultCategories = [
            { id: 'work', name: 'Work', color: '#4285F4' },
            { id: 'personal', name: 'Personal', color: '#EA4335' },
            { id: 'ideas', name: 'Ideas', color: '#FBBC05' },
            { id: 'tasks', name: 'Tasks', color: '#34A853' }
        ];
    }

    async loadCategories() {
        return new Promise((resolve) => {
            chrome.storage.local.get('categories', (result) => {
                // If no categories exist, use the defaults
                const categories = result.categories || this.defaultCategories;
                resolve(categories);
            });
        });
    }

    async saveCategories(categories) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ categories }, resolve);
        });
    }

    // Create a new category
    async createCategory(name, color) {
        const categories = await this.loadCategories();
        const newCategory = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            color
        };
        
        categories.push(newCategory);
        await this.saveCategories(categories);
        return newCategory;
    }

    // Delete a category
    async deleteCategory(categoryId) {
        let categories = await this.loadCategories();
        categories = categories.filter(cat => cat.id !== categoryId);
        await this.saveCategories(categories);
    }

    // Get all categories
    async getAllCategories() {
        return await this.loadCategories();
    }

    // Get a category by ID
    async getCategoryById(categoryId) {
        const categories = await this.loadCategories();
        return categories.find(cat => cat.id === categoryId) || null;
    }
}

export default CategoriesManager;