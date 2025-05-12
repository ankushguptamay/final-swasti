import otpGenerator from "otp-generator";

export const generateFixedLengthRandomNumber = async (numberOfDigits) => {
  return otpGenerator.generate(numberOfDigits, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
};

export const generateReceiptNumber = async (pre) => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${pre}_${timestamp}_${random}`;
};
