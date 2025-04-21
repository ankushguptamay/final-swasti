import dotenv from "dotenv";
dotenv.config();

import { google } from "googleapis";
import { JWT } from "google-auth-library";

const meetConfigBase64 = process.env.GOOLEMEET_CONFIG_BASE64;
const meetbaseConfig = JSON.parse(
  Buffer.from(meetConfigBase64, "base64").toString("utf8")
);

async function createGoogleMeet(startTime, endTime) {
  const auth = new JWT({
    email: meetbaseConfig.client_email,
    key: meetbaseConfig.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
    subject: "office@swastibharat.com", // 👈 This allows the service account to impersonate a real user
  });

  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary: "Online Class Session",
    description: "Class session on your aggregator platform.",
    start: {
      dateTime: new Date(startTime).toISOString(),
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: new Date(endTime).toISOString(),
      timeZone: "Asia/Kolkata",
    },
    // attendees: [
    //   { email: teacherEmail, additionalGuests: 0 },
    //   ...studentEmails.map((email) => ({ email, additionalGuests: 0 })),
    // ], // For sending mail
    conferenceData: {
      createRequest: {
        requestId: new Date().toISOString(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
    visibility: "public", // Ensure meeting is visible to everyone
    guestsCanInviteOthers: true, // Allow guests to invite others
    guestsCanModify: true, // Allow them to join without permission
    guestsCanSeeOtherGuests: true, // ✅ Makes the event visible
    anyoneCanAddSelf: true, // ✅ Users can add themselves without explicit invites
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: "all",
  });

  //   console.log("Google Meet Link:", response.data.hangoutLink);
  return response.data.hangoutLink;
}

export { createGoogleMeet };
