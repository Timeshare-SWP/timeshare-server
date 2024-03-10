const asyncHandler = require("express-async-handler");
const RoleEnum = require("../../enum/RoleEnum");
const Contract = require("../models/Contract");
const Phase = require("../models/Phase");
const moment = require("moment/moment");

const createPhase = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.INVESTOR) {
      res.status(403);
      throw new Error("Chỉ có chủ đầu tư có quyền tạo giai đoạn thanh toán");
    }
    const { contract_id } = req.body;
    const contract = await Contract.findById(contract_id).populate({
      path: "transaction_id",
      populate: {
        path: "timeshare_id",
      },
    });
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
        "Chỉ có chủ đầu tư sở hữu timeshare có quyền tạo giai đoạn thanh toán"
      );
    }
    if (contract.is_all_confirm) {
      res.status(400);
      throw new Error(
        "Không thế tạo giai đoạn thanh toán. Hợp đồng đã được xác nhận bởi khách hàng"
      );
    }
    const phases_of_contract = await Phase.find({ contract_id });
    if (!phases_of_contract) {
      res.status(400);
      throw new Error(
        "Có lỗi xảy ra khi truy xuất tất cả giai đoạn thanh toán của hợp đồng"
      );
    }
    if (phases_of_contract.length === 0) {
      const { remittance_deadline } = req.body;
      const currentDate = moment(new Date());
      const remittance_deadline_date = moment(remittance_deadline);
      if (currentDate.isAfter(remittance_deadline_date)) {
        res.status(400);
        throw new Error("Ngày hết hạn chuyển tiền phải sau ngày hiện tại");
      }
      const phase = new Phase(req.body);
      phase.phase_price =
        (req.body.phase_price_percent / 100) * contract.final_price;
      phase.phase_no = 1;
      phase.is_payment = false;
      const result = await phase.save();
      if (!result) {
        res.status(500);
        throw new Error("Có lỗi xảy ra khi tạo giai đoạn thanh toán");
      }
      res.status(201).json(result);
    } else {
      const total_phase = phases_of_contract.length;
      if (total_phase === 5) {
        res.status(400);
        throw new Error("Chỉ có thể tạo tối đa 5 giai đoạn thanh toán");
      }
      const current_phase = await Phase.findOne({
        contract_id,
        phase_no: total_phase,
      });
      if (!current_phase) {
        res.status(400);
        throw new Error(
          "Có lỗi xảy ra khi truy xuất thông tin giai đoạn trước đó"
        );
      }
      const { remittance_deadline } = req.body;
      const remittance_deadline_date = moment(new Date(remittance_deadline));
      const current_phase_remittance_deadline_date = moment(
        current_phase.remittance_deadline
      );
      if (
        remittance_deadline_date.isBefore(
          current_phase_remittance_deadline_date
        )
      ) {
        res.status(400);
        throw new Error(
          "Ngày hết hạn chuyển tiền của giai đoạn sau phải sau Ngày hết hạn chuyển tiền của giai đoạn trước đó"
        );
      }
      const phase = new Phase(req.body);
      phase.phase_price =
        (req.body.phase_price_percent / 100) * contract.final_price;
      phase.phase_no = total_phase + 1;
      phase.remittance_deadline = remittance_deadline_date;
      phase.is_payment = false;
      const result = await phase.save();
      if (!result) {
        res.status(500);
        throw new Error("Có lỗi xảy ra khi tạo giai đoạn thanh toán");
      }
      res.status(201).json(result);
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const updatePhase = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.INVESTOR) {
      res.status(403);
      throw new Error(
        "Chỉ có chủ đầu tư có quyền chỉnh sửa thông tin giai đoạn thanh toán"
      );
    }
    const { phase_id, phase_price, remittance_deadline } = req.body;
    const phase = await Phase.findById(phase_id).populate("contract_id");
    if (!phase) {
      res.status(404);
      throw new Error("Không tìm thấy giai đoạn thanh toán");
    }
    const contract = await Contract.findById(phase.contract_id._id).populate({
      path: "transaction_id",
      populate: {
        path: "timeshare_id",
      },
    });
    if (
      contract.transaction_id.timeshare_id.investor_id.toString() !==
      req.user.id.toString()
    ) {
      res.status(403);
      throw new Error(
        "Chỉ có chủ đầu tư sở hữu timeshare có quyền chỉnh sửa giai đoạn thanh toán"
      );
    }
    if (contract.is_all_confirm) {
      res.status(400);
      throw new Error(
        "Không thế chỉnh sửa giai đoạn thanh toán. Hợp đồng đã được xác nhận bởi khách hàng"
      );
    }
    // Khi phase bằng 1 thì ktra với ngày hiện tại và với phase sau đó nếu có
    if (phase.phase_no === 1) {
      const next_phase = await Phase.findOne({
        contract_id: contract._id,
        phase_no: phase.phase_no + 1,
      });
      if (!next_phase) {
        const currentDate = moment(new Date());
        const remittance_deadline_date = moment(new Date(remittance_deadline));
        if (currentDate.isAfter(remittance_deadline_date)) {
          res.status(400);
          throw new Error("Ngày hết hạn chuyển tiền phải sau ngày hiện tại");
        }
        phase.phase_price = phase_price;
        phase.remittance_deadline = remittance_deadline_date;
        const result = await phase.save();
        if (!result) {
          res.status(500);
          throw new Error(
            "Có lỗi xảy ra khi sửa đổi thông tin giai đoạn thanh toán"
          );
        }
        res.status(200).json(result);
      }
      const next_phase_remittance_deadline_date = moment(
        next_phase.remittance_deadline
      );
      const currentDate = moment(new Date());
      const remittance_deadline_date = moment(new Date(remittance_deadline));
      if (
        currentDate.isAfter(remittance_deadline_date) ||
        next_phase_remittance_deadline_date.isSameOrBefore(
          remittance_deadline_date
        )
      ) {
        res.status(400);
        throw new Error(
          "Ngày hết hạn chuyển tiền phải lớn hơn ngày hiện tại và bé hơn giai đoạn sau"
        );
      }
      phase.phase_price = phase_price;
      phase.remittance_deadline = remittance_deadline_date;
      const result = await phase.save();
      if (!result) {
        res.status(500);
        throw new Error(
          "Có lỗi xảy ra khi sửa đổi thông tin giai đoạn thanh toán"
        );
      }
      res.status(200).json(result);
      // Khi phase bằng 5 thì ktra với phase trước đó (4)
    } else if (phase.phase_no === 5) {
      const previous_phase = await Phase.findOne({
        contract_id: contract._id,
        phase_no: phase.phase_no - 1,
      });
      if (!previous_phase) {
        res.status(400);
        throw new Error(
          "Có lỗi xảy ra khi truy xuất thông tin giai đoạn thanh toán trước đó"
        );
      }
      const previous_phase_remittance_deadline_date = moment(
        previous_phase.remittance_deadline
      );
      const remittance_deadline_date = moment(new Date(remittance_deadline));
      if (
        previous_phase_remittance_deadline_date.isSameOrAfter(
          remittance_deadline_date
        )
      ) {
        res.status(400);
        throw new Error(
          "Ngày hết hạn chuyển tiền phải sau Ngày hết hạn chuyển tiền giai đoạn thanh toán trước"
        );
      }
      phase.phase_price = phase_price;
      phase.remittance_deadline = remittance_deadline_date;
      const result = await phase.save();
      if (!result) {
        res.status(500);
        throw new Error(
          "Có lỗi xảy ra khi sửa đổi thông tin giai đoạn thanh toán"
        );
      }
      res.status(200).json(result);
      // Khi phase bằng 2-4 thì ktra với phase trước và sau
    } else {
      const previous_phase = await Phase.findOne({
        contract_id: contract._id,
        phase_no: phase.phase_no - 1,
      });
      if (!previous_phase) {
        res.status(400);
        throw new Error(
          "Có lỗi xảy ra khi truy xuất thông tin giai đoạn thanh toán trước đó"
        );
      }
      const previous_phase_remittance_deadline_date = moment(
        previous_phase.remittance_deadline
      );
      const next_phase = await Phase.findOne({
        contract_id: contract._id,
        phase_no: phase.phase_no + 1,
      });
      if (!next_phase) {
        res.status(400);
        throw new Error(
          "Có lỗi xảy ra khi truy xuất thông tin giai đoạn thanh toán sau đó"
        );
      }
      const next_phase_remittance_deadline_date = moment(
        next_phase.remittance_deadline
      );
      const remittance_deadline_date = moment(new Date(remittance_deadline));
      if (
        previous_phase_remittance_deadline_date.isSameOrAfter(
          remittance_deadline_date
        ) ||
        next_phase_remittance_deadline_date.isSameOrBefore(
          remittance_deadline_date
        )
      ) {
        res.status(400);
        throw new Error(
          "Ngày hết hạn chuyển tiền phải lớn hơn giai đoạn trước và bé hơn giai đoạn sau"
        );
      }
      phase.phase_price = phase_price;
      phase.remittance_deadline = remittance_deadline_date;
      const result = await phase.save();
      if (!result) {
        res.status(500);
        throw new Error(
          "Có lỗi xảy ra khi sửa đổi thông tin giai đoạn thanh toán"
        );
      }
      res.status(200).json(result);
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const getPhasesByContractId = asyncHandler(async (req, res) => {
  try {
    const { contract_id } = req.params;
    const contract = await Contract.findById(contract_id);
    if (!contract) {
      res.status(404);
      throw new Error("Không tìm thấy hợp đồng");
    }
    const phases = await Phase.find({
      contract_id: contract._id,
    }).populate("contract_id");
    if (!phases) {
      res.status(500);
      throw new Error(
        "Có lỗi xảy ra khi truy xuất tất cả giai đoạn thanh toán"
      );
    }
    res.status(200).json(phases);
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const deletePhase = asyncHandler(async (req, res) => {
  try {
    if (req.user.roleName !== RoleEnum.INVESTOR) {
      res.status(403);
      throw new Error(
        "Chỉ có chủ đầu tư có quyền chỉnh sửa thông tin giai đoạn thanh toán"
      );
    }
    const { phase_id } = req.params;
    const phase = await Phase.findById(phase_id).populate("contract_id");
    if (!phase) {
      res.status(404);
      throw new Error("Không tìm thấy giai đoạn thanh toán");
    }
    const contract = await Contract.findById(phase.contract_id._id).populate({
      path: "transaction_id",
      populate: {
        path: "timeshare_id",
      },
    });
    if (
      contract.transaction_id.timeshare_id.investor_id.toString() !==
      req.user.id.toString()
    ) {
      res.status(403);
      throw new Error(
        "Chỉ có chủ đầu tư sở hữu timeshare có quyền xóa giai đoạn thanh toán"
      );
    }
    if (contract.is_all_confirm) {
      res.status(400);
      throw new Error(
        "Không thế xóa giai đoạn thanh toán. Hợp đồng đã được xác nhận bởi khách hàng"
      );
    }
    const phases = await Phase.find({ contract_id: contract._id });
    if (phases.length === 1 && phase.phase_no === 1) {
      const result = await phase.remove();
      if (!result) {
        result.status(500);
        throw new Error("Có lỗi xảy ra khi xóa giai đoạn thanh toán");
      }
      res.status(200).send("Xóa giai đoạn thanh toán thành công");
    } else {
      phases.forEach(async (item) => {
        if (phase.phase_no === item.phase_no) {
          const result = await phase.remove();
          if (!result) {
            result.status(500);
            throw new Error("Có lỗi xảy ra khi xóa giai đoạn thanh toán");
          }
        } else if (item.phase_no > phase.phase_no) {
          item.phase_no -= 1;
          await item.save();
        }
      });
      res.status(200).send("Xóa giai đoạn thanh toán thành công");
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

module.exports = {
  createPhase,
  getPhasesByContractId,
  updatePhase,
  deletePhase,
};
