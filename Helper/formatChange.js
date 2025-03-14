const capitalizeFirstLetter = (str) => {
  const words = str.replace(/\s+/g, " ").trim().split(" ");
  return words
    .map((word) => {
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    })
    .join(" ");
};

function getOldValues(existing, newValue) {
  const oldValues = {};

  Object.keys(newValue).forEach((field) => {
    if (existing[field] !== newValue[field]) {
      oldValues[field] = existing[field]; // Store only the old value
    }
  });

  return oldValues;
}

async function compareArrays(a, b) {
  return (
    a.length === b.length && a.every((element, index) => element === b[index])
  );
}

export { capitalizeFirstLetter, getOldValues, compareArrays };
