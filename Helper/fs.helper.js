import fs from "fs";

const deleteSingleFile = (filePath) => {
  if (filePath) {
    // console.log(fs.existsSync(filePath));
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          throw err;
        }
      });
    }
  }
};

const deleteMultiFile = (filePath) => {
  filePath.map((path) => {
    if (path) {
      if (fs.existsSync(path)) {
        fs.unlink(path, (err) => {
          if (err) {
            throw err;
          }
        });
      }
    }
  });
};

export { deleteSingleFile, deleteMultiFile };
