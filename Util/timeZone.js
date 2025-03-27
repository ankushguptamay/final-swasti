import moment from "moment-timezone";

async function convertUTCToGivenTimeZone(utcTime, timeZone) {
  return moment.utc(utcTime).tz(timeZone).format("YYYY-MM-DD HH:mm:ss");
}

async function convertGivenTimeZoneToUTC(dateTime, timeZone) {
  return moment.tz(dateTime, timeZone).utc().format("YYYY-MM-DD HH:mm:ss");
}

const allTimeZone = moment.tz.names();

export{convertGivenTimeZoneToUTC,convertUTCToGivenTimeZone,allTimeZone}