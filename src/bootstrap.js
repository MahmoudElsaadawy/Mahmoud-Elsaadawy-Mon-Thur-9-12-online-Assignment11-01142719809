import { connectDB } from "./DB/db.connection.js";
import userModel from "./DB/models/user.model.js";
import userRouter from "./modules/user/user.controller.js";
import { globalErrorHandler } from ".//utils/responses/error.response.js";
import cors from "cors"

export const bootstrap = async (express, app) => {
  app.use(express.json());
  app.use(cors())
  await connectDB();

  app.use(express.json());

  app.use("/users", userRouter);

  app.all("/*all", (req, res) => {
    return res
      .status(404)
      .json({ success: false, message: "this route does not exist" });
  });

  app.use(globalErrorHandler);
};
