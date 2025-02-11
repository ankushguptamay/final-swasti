import otpGenerator from "otp-generator";

export const generateFixedLengthRandomNumber = (numberOfDigits) => {
  return otpGenerator.generate(numberOfDigits, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
};
