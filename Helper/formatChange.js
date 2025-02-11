export const capitalizeFirstLetter = (str) => {
  const words = str.replace(/\s+/g, " ").trim().split(" ");
  return words
    .map((word) => {
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    })
    .join(" ");
};
