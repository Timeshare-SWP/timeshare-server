const asyncHandler = require("express-async-handler");
const RoleEnum = require("../../enum/RoleEnum");
const Transaction = require("../models/Transaction");
const TransactionStatus = require("../../enum/TransactionStatus");
const Contract = require("../models/Contract");
const ContractImage = require("../models/ContractImage");
const ContractStatus = require("../models/ContractStatus");

//@desc Investor create contract image
//@route POST /api/contracts/contractImage
//@access private
const createContractImage = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.INVESTOR) {
      res.status(403);
      throw new Error("Chỉ có chủ đầu tư có quyền thêm hình ảnh hợp đồng");
    }
    const contract_image = new ContractImage(req.body);
    await contract_image.save();
    res.status(200).json(contract_image);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Investor create contract
//@route POST /api/contracts
//@access private
const createContract = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.INVESTOR) {
      res.status(403);
      throw new Error("Chỉ có chủ đầu tư có quyền tạo hợp đồng");
    }
    const { transaction_id, contract_image, contract_related_link } = req.body;
    if (!transaction_id || !contract_image || !contract_related_link) {
      res.status(400);
      throw new Error("Không được bỏ trống những thông tin bắt buôc");
    }
    const transaction = await Transaction.findById(transaction_id)
      .populate("customers")
      .populate("timeshare_id")
      .exec();
    if (!transaction) {
      res.status(404);
      throw new Error("Không tìm thấy giao dịch");
    }
    if (
      transaction.timeshare_id.investor_id.toString() !== req.user.id.toString()
    ) {
      res.status(403);
      throw new Error(
        "Chỉ có chủ đầu tư sở hữu timeshare có quyền tạo hợp đồng"
      );
    }
    if (transaction.transaction_status !== TransactionStatus.SELECTED) {
      res.status(400);
      throw new Error("Chỉ có giao dịch được chọn mới có thể tạo hợp đồng");
    }
    const contract = new Contract(req.body);
    contract.is_all_confirm = false;
    const contract_result = await contract.save();
    if (!contract_result) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi tạo hợp đồng");
    }
    transaction.customers.forEach(async (customer) => {
      const contract_status = new ContractStatus({
        customer_id: customer._id,
        contract_id: contract._id,
        is_confirm: false,
      });
      await contract_status.save();
    });
    res.status(201).json(contract_result);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Investor create contract
//@route PUT /api/contracts
//@access private
const updateContract = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.INVESTOR) {
      res.status(403);
      throw new Error("Chỉ có chủ đầu tư có quyền chỉnh sửa hợp đồng");
    }
    const { contract_id, contract_image, contract_related_link } = req.body;
    if (!contract_id || !contract_image || !contract_related_link) {
      res.status(400);
      throw new Error("Không được bỏ trống những thông tin bắt buôc");
    }
    const contract = await Contract.findById(contract_id)
      .populate({
        path: "transaction_id",
        populate: "timeshare_id",
      })
      .exec();
    if (!contract) {
      res.status(404);
      throw new Error("Không tìm thấy hợp đồng");
    }
    if (
      contract.transaction_id.timeshare_id.investor_id.toString() !==
      req.user.id.toString()
    ) {
      res.status(403);
      throw new Error(
        "Chỉ có chủ đầu tư sở hữu timeshare có quyền sửa đổi hợp đồng"
      );
    }
    contract.contract_image = contract_image;
    contract.contract_related_link = contract_related_link;
    const result = await contract.save();
    if (!result) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi sửa đổi hợp đồng");
    }
    res.status(200).json(result);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

//@desc Investor create contract
//@route PATCH /api/contracts/confirmContract
//@access private
const confirmContract = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.CUSTOMER) {
      res.status(403);
      throw new Error("Chỉ có khách hàng có quyền xác nhận hợp đồng");
    }
    const { contract_id } = req.query;
    const contract = await Contract.findById(contract_id);
    if (!contract) {
      res.status(404);
      throw new Error("Không tìm thấy hợp đồng");
    }
    const contractStatuses = await ContractStatus.find({
      contract_id,
    });
    if (!contractStatuses) {
      res.status(404);
      throw new Error("Hợp đồng chưa tạo yêu cầu xác nhận cho khách hàng");
    }
    let is_have_contract_status = false;
    let is_all_confirmed = true;
    contractStatuses.forEach(async (contractStatus) => {
      try {
        if (contractStatus.customer_id.toString() === req.user.id.toString()) {
          if (contractStatus.is_confirm) {
            res.status(400);
            throw new Error("Khách hàng đã xác nhận hợp đồng");
          }
          is_have_contract_status = true;
          contractStatus.is_confirm = true;
          const result = await contractStatus.save();
          if (!result) {
            res.status(500);
            throw new Error("Có lỗi xảy ra khi xác nhận hợp đồng");
          }
        } else if (!contractStatus.is_confirm) {
          is_all_confirmed = false;
        }
      } catch (error) {
        res
          .status(res.statusCode || 500)
          .send(error.message || "Internal Server Error");
      }
    });
    if (!is_have_contract_status) {
      res.status(404);
      throw new Error("Không tìm thấy lời mời xác nhận hợp đồng");
    }
    if (is_all_confirmed) {
      contract.is_all_confirm = true;
      await contract.save();
    }

    const result = await ContractStatus.findOne({
      contract_id,
      customer_id: req.user.id,
    })
      .populate("customer_id")
      .populate("contract_id");
    res.status(200).json(result);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const getContractByTransactionId = asyncHandler(async (req, res) => {
  try {
    const { transaction_id } = req.params;
    const transaction = await Transaction.findById(transaction_id);
    if (!transaction) {
      res.status(404);
      throw new Error("Không tìm thấy giao dịch");
    }
    const contract = await Contract.findOne({
      transaction_id: transaction._id,
    })
      .populate("transaction_id")
      .populate("contract_image");
    if (!contract) {
      res.status(404);
      throw new Error("Không tìm thấy hợp đồng");
    }
    res.status(200).json(contract);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const getAllContractStatusByContractId = asyncHandler(async (req, res) => {
  try {
    const { contract_id } = req.params;
    const contract = await Contract.findById(contract_id);
    if (!contract) {
      res.status(404);
      throw new Error("Không tìm thấy hợp đồng");
    }
    const contractStatuses = await ContractStatus.find({
      contract_id,
    }).populate("customer_id");
    if (!contractStatuses) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi truy xuất tất cả trạng thái hợp đồng");
    }
    res.status(200).json(contractStatuses);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const checkTimeshareHaveContract = asyncHandler(async (req, res) => {
  try {
    const { timeshare_id } = req.query;
    const contracts = await Contract.find().populate("transaction_id");
    if (!contracts || contracts.length === 0) {
      res.status(200).send(false);
      return;
    }
    contracts.forEach((contract) => {
      if (contract.transaction_id.timeshare_id === timeshare_id) {
        res.status(200).send(true);
        return;
      }
    });
    res.status(200).send(false);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

module.exports = {
  createContractImage,
  createContract,
  getContractByTransactionId,
  updateContract,
  confirmContract,
  getAllContractStatusByContractId,
  checkTimeshareHaveContract,
};
