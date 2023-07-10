import express from "express";
import UsersController from "../controllers/UsersControllers";
import CreateUsersController from "../controllers/CreateUsersControllers";

const router = express.Router();

router.get("/", UsersController.postCustomer);
router.get("/app", UsersController.getAllTicketsForNewUsers);
router.get("/usersticket/find/:id", UsersController.getById);
router.get("/emails", UsersController.getEmails);
router.get("/enviaremail", UsersController.sendMail);

//Criação de Usuários

router.get(
  "/create-user/c6bank",
  CreateUsersController.createUserC6BankRequest
);
router.get("/reset-user/c6bank", CreateUsersController.resetUserC6BankRequest);

export default router;
