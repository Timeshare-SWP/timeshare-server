const asyncHandler = require("express-async-handler");
const Support = require("../models/Support");
const SupportStatus = require("../../enum/SupportStatus");
const SortTypeEnum = require("../../enum/SortTypeEnum");
const FilterByEnum = require("../../enum/FilterByEnum");
const SupportType = require("../../enum/SupportType");

const createSupport = asyncHandler(async (req, res) => {
  try {
    const support = new Support(req.body);
    support.support_status = SupportStatus.PENDING;
    const result = await support.save();
    if (!result) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi tạo yêu cầu hỗ trợ");
    }
    res.status(201).json(result);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const getAllSupport = asyncHandler(async (req, res) => {
  try {
    const supports = await Support.find();
    if (!supports) {
      res.status(500);
      throw new Error("Có lỗi xảy ra khi truy xuất tất cả yêu cầu hỗ trợ");
    }
    res.status(200).json(supports);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const changeSupportStatus = asyncHandler(async (req, res) => {
  try {
    const { support_id, support_status } = req.body;
    const support = await Support.findById(support_id);
    if (!support) {
      res.status(404);
      throw new Error("Không tìm thấy yêu cầu hỗ trợ");
    }
    switch (support_status) {
      case SupportStatus.PENDING: {
        res.status(400);
        throw new Error(
          "Không thể chuyển yêu cầu hỗ trợ về trạng thái chờ xử lý"
        );
      }
      case SupportStatus.IN_PROGRESS: {
        if (support.support_status !== SupportStatus.PENDING) {
          res.status(400);
          throw new Error(
            "Chỉ yêu cầu hỗ trợ có trạng thái Chờ xử lý có thể thực hiện chức năng này"
          );
        }
        support.support_status = support_status;
        const result = await support.save();
        if (!result) {
          res.status(500);
          throw new Error(
            "Có lỗi xảy ra khi thay đổi trạng thái yêu cầu hỗ trợ sang Đang xử lý"
          );
        }
        res.status(200).json(result);
        break;
      }
      case SupportStatus.SOLVED: {
        if (support.support_status !== SupportStatus.IN_PROGRESS) {
          res.status(400);
          throw new Error(
            "Chỉ yêu cầu hỗ trợ có trạng thái Đang xử lý có thể thực hiện chức năng này"
          );
        }
        support.support_status = support_status;
        const result = await support.save();
        if (!result) {
          res.status(500);
          throw new Error(
            "Có lỗi xảy ra khi thay đổi trạng thái yêu cầu hỗ trợ sang Đã giải quyết"
          );
        }
        res.status(200).json(result);
        break;
      }
      default: {
        res.status(400);
        throw new Error("Trạng thái của yêu cầu hỗ trợ không phù hợp");
      }
    }
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const sortSupport = asyncHandler(async (req, res) => {
  const { sortType } = req.query;
  try {
    if (sortType === SortTypeEnum.ASC) {
      await Support.find()
        .sort({ createdAt: 1 })
        .exec((err, supports) => {
          if (err) {
            res.status(500);
            throw new Error(
              "Có lỗi xảy ra khi truy xuất tất cả yêu cầu hỗ trợ theo ngày tạo"
            );
          }
          res.status(200).json(supports);
        });
    } else if (sortType === SortTypeEnum.DESC) {
      await Support.find()
        .sort({ createdAt: -1 })
        .exec((err, supports) => {
          if (err) {
            res.status(500);
            throw new Error(
              "Có lỗi xảy ra khi truy xuất tất cả yêu cầu hỗ trợ theo ngày tạo"
            );
          }
          res.status(200).json(supports);
        });
    } else {
      res.status(400);
      throw new Error("Chỉ có thể tìm kiếm tăng dần hoặc giảm dần");
    }
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

const filterSupport = asyncHandler(async (req, res) => {
  try {
    const { filterBy, filterType } = req.query;
    let supports = await Support.find();
    if (!supports) {
      res.status(400);
      throw new Error("Có lỗi xảy ra khi lọc yêu cầu hỗ trợ");
    }
    if (supports.length === 0) {
      res.status(200).json([]);
    }
    switch (filterBy) {
      case FilterByEnum.SUPPORT_STATUS: {
        switch (filterType) {
          case SupportStatus.PENDING: {
            supports = supports.filter(
              (support) => support.support_status === SupportStatus.PENDING
            );
            res.status(200).json(supports);
            break;
          }
          case SupportStatus.IN_PROGRESS: {
            supports = supports.filter(
              (support) => support.support_status === SupportStatus.IN_PROGRESS
            );
            res.status(200).json(supports);
            break;
          }
          case SupportStatus.SOLVED: {
            supports = supports.filter(
              (support) => support.support_status === SupportStatus.SOLVED
            );
            res.status(200).json(supports);
            break;
          }
          default: {
            res.status(400);
            throw new Error("Trạng thái không phù hợp để lọc");
          }
        }
        break;
      }
      case FilterByEnum.SUPPORT_TYPE: {
        switch (filterType) {
          case SupportType.ACCOUNT_SUPPORT: {
            supports = supports.filter(
              (support) => support.support_type === SupportType.ACCOUNT_SUPPORT
            );
            res.status(200).json(supports);
            break;
          }
          case SupportType.CONSULTATION_SUPPORT: {
            supports = supports.filter(
              (support) =>
                support.support_type === SupportType.CONSULTATION_SUPPORT
            );
            res.status(200).json(supports);
            break;
          }
          case SupportType.SEARCH_SUPPORT: {
            supports = supports.filter(
              (support) => support.support_type === SupportType.SEARCH_SUPPORT
            );
            res.status(200).json(supports);
            break;
          }
          case SupportType.TECHNICAL_SUPPORT: {
            supports = supports.filter(
              (support) =>
                support.support_type === SupportType.TECHNICAL_SUPPORT
            );
            res.status(200).json(supports);
            break;
          }
          case SupportType.TRANSACTION_SUPPORT: {
            supports = supports.filter(
              (support) =>
                support.support_type === SupportType.TRANSACTION_SUPPORT
            );
            res.status(200).json(supports);
            break;
          }
          default: {
            res.status(400);
            throw new Error("Loại yêu cầu hỗ trợ không phù hợp để lọc");
          }
        }
        break;
      }
      default: {
        res.status(400);
        throw new Error("Chỉ lọc theo trạng thái và loại yêu cầu hỗ trợ");
      }
    }
  } catch (error) {
    res
      .status(res.statusCode || 500)
      .send(error.message || "Internal Server Error");
  }
});

module.exports = {
  createSupport,
  getAllSupport,
  changeSupportStatus,
  sortSupport,
  filterSupport,
};
