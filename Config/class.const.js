export const SERVICE_OFFER = 0; // Default discount (%) applied on service listings
export const PER_CLASS_PRICE_LIMIT = 1; //500 Minimum allowed price per prson per day class
export const MEET_CAN_JOIN_BEFORE = 1300; // 5 min before class start time
export const FUTURE_CLASS_CREATION = 1; // class should be 24 hours in future
export const CLASS_CANCELATION_TIME = 1; // class should be cancel before 24 hours unless charge apply
export const CLASS_BOOKING_TIME = 1; // class should be Booked before 24 hours

export const PLATFROM_FEE = 12; // Plate form fee
export const CANCELLATION_CHARGE = 20;
export const CANCELLATION_BONUS_INSTRUCTOR = 8;

export const YOGACOURSE = [
  "Yoga Volunteer Course",
  "Yoga Protocol Instructor",
  "Yoga Wellness Instructor",
  "Yoga Teacher And Evaluator",
  "Yoga Master",
  "Assistant Yoga Therapist",
  "Yoga Therapist",
  "Therapeutic Yoga Consultant",
  "Primery-Elementary School Yoga Teachers",
  "Secondary-Elementary School Yoga Teachers",
];

export const YOGACOURSETIMES = [
  { name: "Yoga Volunteer Course", expireDay: 45, batchSize: 40 },
  { name: "Yoga Wellness Instructor", expireDay: 120, batchSize: 30 },
];

// export const YOGACOURSEINSTALLMENT = [
//   { installmentType: "", },
// ];