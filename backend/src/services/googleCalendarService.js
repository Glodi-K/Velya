const { google } = require('googleapis');
const path = require('path');

class GoogleCalendarService {
  constructor() {
    this.calendar = null;
    this.initializeCalendar();
  }

  async initializeCalendar() {
    try {
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.warn('⚠️ GOOGLE_APPLICATION_CREDENTIALS non configuré - Google Calendar désactivé');
        return;
      }

      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/calendar']
      });

      this.calendar = google.calendar({ version: 'v3', auth });
      console.log('✅ Google Calendar initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur initialisation Google Calendar:', error.message);
      console.warn('⚠️ Google Calendar désactivé - Continuez sans intégration calendrier');
    }
  }

  async createEvent(reservation, prestataireEmail) {
    if (!this.calendar) {
      console.warn('⚠️ Google Calendar non disponible - Événement non créé');
      return null;
    }

    try {
      const startDateTime = new Date(`${reservation.date}T${reservation.heure}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // +2h

      const event = {
        summary: `Velya - ${reservation.service}`,
        description: `
Mission Velya
Service: ${reservation.service}
Adresse: ${reservation.adresse}
Surface: ${reservation.surface || 'Non spécifiée'} m²
Prix: ${reservation.prixTotal}€
PIN de validation: ${reservation.validationPin}
        `.trim(),
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Toronto'
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Toronto'
        },
        location: reservation.adresse,
        attendees: [
          { email: prestataireEmail }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24h avant
            { method: 'popup', minutes: 30 }       // 30min avant
          ]
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      console.log('✅ Événement Google Calendar créé:', response.data.id);
      return { ...response.data, htmlLink: response.data.htmlLink };
    } catch (error) {
      console.error('❌ Erreur création événement Google Calendar:', error);
      return null;
    }
  }

  generateCalendarLink(reservation) {
    const startDateTime = new Date(`${reservation.date}T${reservation.heure}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);
    
    const formatDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Velya - ${reservation.service}`,
      dates: `${formatDate(startDateTime)}/${formatDate(endDateTime)}`,
      details: `Mission Velya\nService: ${reservation.service}\nAdresse: ${reservation.adresse}\nPrix: ${reservation.prixTotal}€`,
      location: reservation.adresse
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  async updateEvent(eventId, reservation) {
    if (!this.calendar || !eventId) return null;

    try {
      const startDateTime = new Date(`${reservation.date}T${reservation.heure}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

      const event = {
        summary: `Velya - ${reservation.service}`,
        description: `
Mission Velya
Service: ${reservation.service}
Adresse: ${reservation.adresse}
Surface: ${reservation.surface || 'Non spécifiée'} m²
Prix: ${reservation.prixTotal}€
PIN de validation: ${reservation.validationPin}
        `.trim(),
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Toronto'
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Toronto'
        },
        location: reservation.adresse
      };

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erreur mise à jour événement:', error);
      return null;
    }
  }

  async deleteEvent(eventId) {
    if (!this.calendar || !eventId) return false;

    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });
      return true;
    } catch (error) {
      console.error('❌ Erreur suppression événement:', error);
      return false;
    }
  }
}

module.exports = new GoogleCalendarService();