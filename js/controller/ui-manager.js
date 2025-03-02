// js/controller/ui-manager.js
/**
 * @file js/controller/ui-manager.js
 * @description Manages UI-related operations
 * 
 * Provides UI utilities like notifications and settings panel management.
 * Handles general UI operations not specifically tied to notes or categories.
 */

class UIManager {
    constructor(controller) {
        this.controller = controller;
        this.model = controller.model;
        this.view = controller.view;
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
        await this.controller.categoryManager.renderCategoriesInSettings();

        // Show settings modal
        document.getElementById('settings-modal').classList.remove('hidden');
    }
}

export default UIManager;