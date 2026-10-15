// Kitchen Sound Notifications
class KitchenSoundManager {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
    this.lastOrderIds = new Set();
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      // Create audio context for generating notification sounds
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  // Enable/disable sound notifications
  toggleSound(enabled = true) {
    this.isEnabled = enabled;
    if (enabled && this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Generate a notification tone
  playNotificationTone(type = 'new-order') {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Different tones for different notifications
      switch (type) {
        case 'new-order':
          // Pleasant notification for new orders
          oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
          oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.5);
          break;

        case 'urgent-order':
          // More attention-grabbing for urgent orders
          oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
          oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.15);
          oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.3);
          oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.45);
          gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.8);
          break;

        case 'beverage-alert':
          // Quick alert for beverages
          oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);
          oscillator.frequency.setValueAtTime(1400, this.audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.3);
          break;

        default:
          // Default notification
          oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.3);
      }
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }

  // Check for new orders and play notifications
  checkForNewOrders(currentOrders) {
    if (!this.isEnabled) return;

    const currentOrderIds = new Set(currentOrders.map(order => order._id));
    
    // Find new orders
    const newOrderIds = [...currentOrderIds].filter(id => !this.lastOrderIds.has(id));
    
    if (newOrderIds.length > 0) {
      // Check if any new orders are urgent (20+ minutes old)
      const newOrders = currentOrders.filter(order => newOrderIds.includes(order._id));
      const hasUrgentOrders = newOrders.some(order => {
        const orderAge = Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60));
        return orderAge >= 20;
      });

      // Check if any new orders have beverages
      const hasBeverageOrders = newOrders.some(order => 
        order.items.some(item => 
          item.category === 'Beverage' || item.category === 'Beverages'
        )
      );

      // Play appropriate notification
      if (hasUrgentOrders) {
        this.playNotificationTone('urgent-order');
      } else if (hasBeverageOrders) {
        this.playNotificationTone('beverage-alert');
      } else {
        this.playNotificationTone('new-order');
      }

      // Show browser notification if permission granted
      this.showBrowserNotification(newOrders.length, hasUrgentOrders, hasBeverageOrders);
    }

    // Update the tracked order IDs
    this.lastOrderIds = currentOrderIds;
  }

  // Show browser notification
  async showBrowserNotification(orderCount, isUrgent, hasBeverages) {
    if (!('Notification' in window)) return;

    // Request permission if not granted
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const title = isUrgent ? '🚨 Urgent Kitchen Orders!' : 
                    hasBeverages ? '🥤 New Beverage Orders!' : 
                    '🍽️ New Kitchen Orders!';
      
      const body = `${orderCount} new order${orderCount > 1 ? 's' : ''} received`;
      
      const notification = new Notification(title, {
        body,
        icon: '/Logo.png',
        badge: '/Logo.png',
        tag: 'kitchen-orders',
        requireInteraction: isUrgent,
        silent: false
      });

      // Auto-close notification after 5 seconds (unless urgent)
      if (!isUrgent) {
        setTimeout(() => notification.close(), 5000);
      }
    }
  }

  // Initialize audio context on user interaction (required by browsers)
  async enableAudioOnUserInteraction() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('Kitchen audio notifications enabled');
      } catch (error) {
        console.warn('Could not resume audio context:', error);
      }
    }
  }
}

// Create a singleton instance
const kitchenSoundManager = new KitchenSoundManager();

export default kitchenSoundManager;