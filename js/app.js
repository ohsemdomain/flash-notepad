// js/app.js
/**
 * @file js/app.js
 * @description Application entry point
 * @requires model.js, view.js, controller.js, db.js
 * 
 * Initializes the application by creating instances of the model, view, and
 * controller components. Sets up error handling for database connection issues.
 */

import NotesModel from './model/model.js';
import NotesView from './view/view.js';
import NotesController from './controller/controller.js';
import db from './db.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Open database connection
        await db.open();

        const model = new NotesModel();
        const view = new NotesView();
        const controller = new NotesController(model, view);

        // No change to the controller initialization
    } catch (error) {
        console.error('Error initializing app:', error);
        // Display friendly error message to user
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h3>Unable to load Flash Notepad</h3>
                <p>There was a problem connecting to the database. Please try refreshing the page.</p>
                <p>Error details: ${error.message}</p>
                <button onclick="location.reload()">Refresh</button>
            </div>
        `;
    }
});