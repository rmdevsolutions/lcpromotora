import dotenv from "dotenv";
dotenv.config();

const PORT = parseInt(`${process.env.PORT || 3000}`);
import app from "./app";
const server = app.listen(PORT, () =>
  console.log(`Server is running at ${PORT}.`)
);
server.timeout = 30000000;
