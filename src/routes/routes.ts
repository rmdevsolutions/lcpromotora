import express from "express";
import * as UsersController from "../controllers/UsersControllers";
import * as CreateUsersController from "../controllers/CreateUsersControllers";

import {
  initPan,
  insertTokenRequest,
  createUserPanRequest,
  getContractClickSign,
  getScreen,
} from "../components/Pan";

const router = express.Router();

router.get("/", UsersController.postCustomer);
router.get("/app", UsersController.getAllTicketsForNewUsers);
router.get("/usersicket/find/:id", UsersController.getById);
router.get("/emails", UsersController.getEmails);
router.get("/enviaremail", UsersController.sendMail);

//Criação de Usuários

router.get(
  "/create-user/c6bank",
  CreateUsersController.createUserC6BankRequest
);

router.get("/reset-user/c6bank", CreateUsersController.resetUserC6BankRequest);

//atualização de Usuários
router.get("/update-2tech", UsersController.insertInformationThowTechRequest);

//Criações PAN
router.get("/pan/initializer", initPan);
router.get("/pan/insert-token/:token?", insertTokenRequest);
router.get("/pan/create-user", createUserPanRequest);
router.get("/pan/screen", getScreen);

//ClickSign
router.get("/click/get/:name?", getContractClickSign);
export default router;
