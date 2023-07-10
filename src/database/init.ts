import { UsersTickets } from "../models";
const isDev = process.env.NODE_ENV === "desenvolvimento";

const dbInit = () => {
  UsersTickets.sync({ alter: isDev });
};

export default dbInit;
