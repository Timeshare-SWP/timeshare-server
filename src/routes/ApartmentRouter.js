const express = require("express");
const apartmentRouter = express.Router();
const {
  createApartment,
  getAllApartmentOfTimeshare,
  getApartmentById,
  updateApartment,
  deleteApartment,
} = require("../app/controllers/ApartmentController");
const {
  validateTokenInvestor,
} = require("../app/middleware/validateTokenHandler");

apartmentRouter
  .route("/")
  .post(validateTokenInvestor, createApartment)
  .patch(validateTokenInvestor, updateApartment);

apartmentRouter
  .route("/:apartment_id")
  .get(getApartmentById)
  .delete(validateTokenInvestor, deleteApartment);

apartmentRouter
  .route("/timeshare/:timeshare_id")
  .get(getAllApartmentOfTimeshare);

module.exports = apartmentRouter;
