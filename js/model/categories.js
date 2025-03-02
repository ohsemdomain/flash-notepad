// js/model/categories.js
/**
 * @file js/model/categories.js
 * @description Category management functionality
 * @requires db.js
 * 
 * Provides a CategoriesManager class for creating, updating, and deleting note categories.
 * Handles default categories, category lookups, and maintaining references between
 * notes and categories.
 */

import db from '../db.js';

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
        // Validate inputs
        if (!name || !color) {
            throw new Error('Category name and color are required');
        }

        // Check if a category with the same name already exists
        const existingCategory = await db.categories
            .where('name')
            .equalsIgnoreCase(name)
            .first();

        if (existingCategory) {
            throw new Error(`A category named "${name}" already exists`);
        }

        const newCategory = {
            id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            name,
            color
        };

        try {
            // Add to database
            await db.categories.add(newCategory);
            return newCategory;
        } catch (error) {
            console.error('Error creating category:', error);
            throw new Error('Failed to create category: ' + error.message);
        }
    }

    // Update an existing category
    async updateCategory(categoryId, updates) {
        // Validate inputs
        if (!categoryId) {
            throw new Error('Category ID is required');
        }

        if (!updates || (!updates.name && !updates.color)) {
            throw new Error('At least one update field (name or color) is required');
        }

        try {
            // Check if category exists
            const category = await db.categories.get(categoryId);
            if (!category) {
                throw new Error(`Category with ID "${categoryId}" not found`);
            }

            // If name is being updated, check for duplicates
            if (updates.name && updates.name !== category.name) {
                const existingCategory = await db.categories
                    .where('name')
                    .equalsIgnoreCase(updates.name)
                    .first();

                if (existingCategory && existingCategory.id !== categoryId) {
                    throw new Error(`A category named "${updates.name}" already exists`);
                }
            }

            // Update in database
            await db.categories.update(categoryId, updates);

            // Return the updated category
            return await db.categories.get(categoryId);
        } catch (error) {
            console.error('Error updating category:', error);
            throw new Error('Failed to update category: ' + error.message);
        }
    }

    // Delete a category and remove it from all notes
    async deleteCategory(categoryId) {
        try {
            // Check if category exists
            const category = await db.categories.get(categoryId);
            if (!category) {
                throw new Error(`Category with ID "${categoryId}" not found`);
            }

            // Get all notes with this category
            const notesWithCategory = await db.notes
                .where('categories')
                .equals(categoryId)
                .toArray();

            // Start a transaction to ensure atomicity
            await db.transaction('rw', [db.categories, db.notes], async () => {
                // Delete the category
                await db.categories.delete(categoryId);

                // Remove the category from all notes
                for (const note of notesWithCategory) {
                    note.categories = note.categories.filter(cat => cat !== categoryId);
                    await db.notes.update(note.id, { categories: note.categories });
                }
            });

            return {
                success: true,
                message: `Category "${category.name}" deleted successfully`,
                affectedNotes: notesWithCategory.length
            };
        } catch (error) {
            console.error('Error deleting category:', error);
            throw new Error('Failed to delete category: ' + error.message);
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

    // Get category by name (case insensitive)
    async getCategoryByName(name) {
        try {
            return await db.categories
                .where('name')
                .equalsIgnoreCase(name)
                .first();
        } catch (error) {
            console.error('Error getting category by name:', error);
            return null;
        }
    }

    // Get notes count for a category
    async getNotesCountForCategory(categoryId) {
        try {
            return await db.notes
                .where('categories')
                .equals(categoryId)
                .count();
        } catch (error) {
            console.error('Error counting notes for category:', error);
            return 0;
        }
    }
}

export default CategoriesManager;