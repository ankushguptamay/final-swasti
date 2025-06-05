import {
  failureResponse,
  successResponse,
} from "../../../MiddleWare/responseMiddleware.js";
import { UserTransaction } from "../../../Model/User/Profile/transactionModel.js";
import { Wallet } from "../../../Model/User/Profile/walletModel.js";

const myWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({
      userId: req.user._id,
    }).select("-createdAt -updatedAt");
    // Final Response
    return successResponse(res, 200, "Fetched successfully!", {
      wallet,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const transactionHistory = async (req, res) => {
  try {
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    let query = { user: req.user._id };
    if (req.query.search) {
      const containInString = new RegExp(req.query.search, "i");
      query.$or = [
        { status: containInString },
        { paymentType: containInString },
        { reference: containInString },
        { reason: containInString },
      ];
    }
    const [transaction, totalTransaction] = await Promise.all([
      UserTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("amount reference paymentType status createdAt")
        .lean(),
      UserTransaction.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalTransaction / resultPerPage) || 0;
    return successResponse(res, 200, `Successfully!`, {
      transaction,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

export { myWallet, transactionHistory };
