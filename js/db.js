// File: js/db.js - Dexie database setup for Flash Notepad

class NotepadDatabase extends Dexie {
    constructor() {
        super('FlashNotepad');
        
        // Define tables and indexes
        this.version(1).stores({
            notes: 'id, title, createdAt, *categories', // * means array index
            categories: 'id, name'
        });
        
        // Define methods for notes table
        this.notes = this.table('notes');
        this.categories = this.table('categories');
    }
    
    // Default categories to populate on first run
    async initializeDefaultCategories() {
        const count = await this.categories.count();
        
        if (count === 0) {
            const defaultCategories = [
                { id: 'work', name: 'Work', color: '#4285F4' },
                { id: 'personal', name: 'Personal', color: '#EA4335' },
                { id: 'ideas', name: 'Ideas', color: '#FBBC05' },
                { id: 'tasks', name: 'Tasks', color: '#34A853' }
            ];
            
            await this.categories.bulkAdd(defaultCategories);
        }
    }
}

// Create and export a single database instance
const db = new NotepadDatabase();

// Initialize default data
db.on('ready', async () => {
    await db.initializeDefaultCategories();
});

export default db;