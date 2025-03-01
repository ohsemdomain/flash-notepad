// File: js/categories.js - Utility for managing note categories

import db from './db.js';

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
        try {
            // Get all categories from database
            const categories = await db.categories.toArray();

            // If no categories exist, use the defaults (this shouldn't happen due to initialization)
            if (categories.length === 0) {
                await this.initializeDefaultCategories();
                return this.defaultCategories;
            }

            return categories;
        } catch (error) {
            console.error('Error loading categories:', error);
            return this.defaultCategories;
        }
    }

    async initializeDefaultCategories() {
        try {
            // Add default categories if none exist
            await db.categories.bulkAdd(this.defaultCategories);
        } catch (error) {
            console.error('Error initializing default categories:', error);
        }
    }

    // Create a new category
    async createCategory(name, color) {
        const newCategory = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            color
        };

        try {
            // Add to database
            await db.categories.add(newCategory);
            return newCategory;
        } catch (error) {
            console.error('Error creating category:', error);
            return null;
        }
    }

    // Delete a category
    async deleteCategory(categoryId) {
        try {
            // Delete from database
            await db.categories.delete(categoryId);

            // Also update all notes that have this category
            const notesWithCategory = await db.notes
                .where('categories')
                .equals(categoryId)
                .toArray();

            // Remove the category from each note
            for (const note of notesWithCategory) {
                note.categories = note.categories.filter(cat => cat !== categoryId);
                await db.notes.update(note.id, { categories: note.categories });
            }
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    }

    // Get all categories
    async getAllCategories() {
        return await this.loadCategories();
    }

    // Get a category by ID
    async getCategoryById(categoryId) {
        try {
            return await db.categories.get(categoryId);
        } catch (error) {
            console.error('Error getting category by ID:', error);
            return null;
        }
    }

    // Update a category
    async updateCategory(categoryId, updates) {
        try {
            await db.categories.update(categoryId, updates);
        } catch (error) {
            console.error('Error updating category:', error);
        }
    }
}

export default CategoriesManager;