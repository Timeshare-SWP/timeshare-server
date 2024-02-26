const express = require("express");
const feedbackRouter = express.Router();
const {
  createFeedback,
  getFeedbacksForAdmin,
  getFeedbacksOfStaff,
  updateFeedback,
  deleteFeedback,
} = require("../app/controllers/FeedbackController");

const { validateToken } = require("../app/middleware/validateTokenHandler");

feedbackRouter.use(validateToken);

feedbackRouter
  .route("/")
  .post(createFeedback)
  .get(getFeedbacksOfStaff)
  .put(updateFeedback)
  .delete(deleteFeedback);

feedbackRouter.route("/admin").get(getFeedbacksForAdmin);

module.exports = feedbackRouter;
