const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv").config({ path: "./config.env" });
const path = require("path");
const errorHandler = require("./src/app/middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Socket Config
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "*",
  },
});

// Socket.io event handlers
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
global._io = io;

app.use(cors());

app.set("view engine", "ejs");

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

//connect to DB
const db = require("./src/config/dbConnection");
db.connect();

//Json
app.use(bodyParser.json());

// cookies Parser
app.use(cookieParser());

const userRouter = require("./src/routes/UserRouter");
const authRouter = require("./src/routes/AuthRouter");
const timeshareRouter = require("./src/routes/TimeshareRouter");
const reservePlaceRouter = require("./src/routes/ReservePlaceRouter");
const transactionRouter = require("./src/routes/TransactionRouter");
const contractRouter = require("./src/routes/ContractRouter");
const phaseRouter = require("./src/routes/PhaseRouter");
const notificationRouter = require("./src/routes/NotificationRouter");
const feedbackRouter = require("./src/routes/FeedbackRouter");
const supportRouter = require("./src/routes/SupportRouter");
const vnPayRouter = require("./src/routes/VNPayRouter");
const chatRouter = require("./src/routes/ChatRouter");
const apartmentRouter = require("./src/routes/ApartmentRouter");

//static folder path
app.use(express.static(path.resolve(__dirname, "public")));

// routers
app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/timeshares", timeshareRouter);
app.use("/api/reservePlaces", reservePlaceRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/contracts", contractRouter);
app.use("/api/phases", phaseRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/feedbacks", feedbackRouter);
app.use("/api/supports", supportRouter);
app.use("/api/supports", supportRouter);
app.use("/api/vnpays", vnPayRouter);
app.use("/api/chats", chatRouter);
app.use("/api/apartments", apartmentRouter);

// Global error handler
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port: http://localhost:${PORT}`);
});
