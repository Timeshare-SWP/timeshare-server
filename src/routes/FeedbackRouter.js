const express = require("express");
const feedbackRouter = express.Router();
const {
  createFeedback,
  getFeedbacks,
  getFeedbacksOfStaff,
  updateFeedback,
  deleteFeedback,
} = require("../app/controllers/FeedbackController");

const { validateToken } = require("../app/middleware/validateTokenHandler");

feedbackRouter.route("/all").get(getFeedbacks);

feedbackRouter.use(validateToken);

feedbackRouter
  .route("/")
  .post(createFeedback)
  .get(getFeedbacksOfStaff)
  .put(updateFeedback)
  .delete(deleteFeedback);

module.exports = feedbackRouter;
