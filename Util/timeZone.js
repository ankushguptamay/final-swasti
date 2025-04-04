import moment from "moment-timezone";

async function convertUTCToGivenTimeZone(utcTime, timeZone) {
  return moment.utc(utcTime).tz(timeZone).format("YYYY-MM-DD HH:mm:ss");
}

async function convertGivenTimeZoneToUTC(dateTime, timeZone) {
  return moment.tz(dateTime, timeZone).utc().format("YYYY-MM-DD HH:mm:ss");
}

async function getDatesDay(dateInUTC) {
  const date = new Date(dateInUTC);
  // Get day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayIndex = date.getUTCDay();
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayIndex];
}

const allTimeZone = moment.tz.names();

export {
  convertGivenTimeZoneToUTC,
  convertUTCToGivenTimeZone,
  allTimeZone,
  getDatesDay,
};
