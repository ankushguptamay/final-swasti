import { capitalizeFirstLetter } from "../../Helper/formatChange.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { validateContactUs } from "../../MiddleWare/Validation/miscellaneous.js";
import { ContactUs } from "../../Model/Admin/contactUsModel.js";
import { User } from "../../Model/User/Profile/userModel.js";

async function generateCode(preFix) {
  const today = new Date();
  today.setMinutes(today.getMinutes() + 330);
  const day = today.toISOString().slice(8, 10);
  const year = today.toISOString().slice(2, 4);
  const month = today.toISOString().slice(5, 7);
  let code,
    lastDigits,
    startWith = `${preFix}${day}${month}${year}`;
  const query = new RegExp("^" + startWith);
  const isCode = await ContactUs.findOne({ contactUsCode: query }).sort({
    createdAt: -1,
  });
  if (!isCode) {
    lastDigits = 1;
  } else {
    lastDigits = parseInt(isCode.contactUsCode.substring(9)) + 1;
  }
  code = `${startWith}${lastDigits}`;
  while (await ContactUs.findOne({ contactUsCode: code })) {
    code = `${startWith}${lastDigits++}`;
  }
  return code;
}

const addContactUs = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateContactUs(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    // Body
    const { email, mobileNumber, message } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    // FindUser
    const isUser = await User.findOne({ mobileNumber })
      .select("_id mobileNumber")
      .lean();
    const contactUsCode = await generateCode("CUQ");
    //   create
    await ContactUs.create({
      name,
      message,
      mobileNumber,
      email,
      contactUsCode,
      user: isUser ? isUser._id : undefined,
    });
    return successResponse(res, 201, `Message sent to support team!`);
  } catch (err) {
    failureResponse(res);
  }
};

const contactUs = async (req, res) => {
  try {
    // Pagination
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;
    // Search
    const query = {};
    if (req.query.search) {
      const containInString = new RegExp(req.query.search, "i");
      query.$or = [
        { message: containInString },
        { email: containInString },
        { mobileNumber: containInString },
        { name: containInString },
      ];
    }
    // Get required data
    const [contactUs, totalContactUs] = await Promise.all([
      ContactUs.find(query)
        .select("_id name email mobileNumber message createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("user", "name email mobileNumber")
        .lean(),
      ContactUs.countDocuments(query),
    ]);
    const totalPages = Math.ceil(totalContactUs / resultPerPage) || 0;

    // Send final success response
    return successResponse(res, 200, "Successfully", {
      data: contactUs,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

export { addContactUs, contactUs };
