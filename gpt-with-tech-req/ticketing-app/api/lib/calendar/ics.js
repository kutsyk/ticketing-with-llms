// lib/calendar/ics.js
// Utility for generating iCalendar (.ics) files for events/tickets

import ics from 'ics';

/**
 * Generate ICS file content for an event.
 *
 * @param {Object} event - Event details
 * @param {string} event.title - Event title
 * @param {string} event.description - Event description
 * @param {string} event.location - Event location
 * @param {Date} event.start - Event start date/time
 * @param {Date} event.end - Event end date/time
 * @param {string} [event.url] - Optional URL for the event
 * @param {string[]} [event.attendees] - Optional list of attendee emails
 * @returns {Promise<string>} - Promise resolving to ICS file content as string
 */
export function generateIcsEvent(event) {
  return new Promise((resolve, reject) => {
    if (!event || !event.title || !event.start || !event.end) {
      return reject(new Error('Invalid event data'));
    }

    const startArray = [
      event.start.getFullYear(),
      event.start.getMonth() + 1,
      event.start.getDate(),
      event.start.getHours(),
      event.start.getMinutes()
    ];

    const endArray = [
      event.end.getFullYear(),
      event.end.getMonth() + 1,
      event.end.getDate(),
      event.end.getHours(),
      event.end.getMinutes()
    ];

    const icsEvent = {
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      start: startArray,
      end: endArray,
      url: event.url || undefined,
      attendees: (event.attendees || []).map(email => ({ email }))
    };

    ics.createEvent(icsEvent, (error, value) => {
      if (error) return reject(error);
      resolve(value);
    });
  });
}

/**
 * Send ICS file as HTTP download.
 * @param {Object} res - Express/Next.js response object
 * @param {string} filename - Filename for download
 * @param {string} icsData - The generated ICS file content
 */
export function sendIcsResponse(res, filename, icsData) {
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(icsData);
}
