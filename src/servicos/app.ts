import {
  getAllUsersTickets,
  insertInformationThowTech,
} from "../controllers/UsersControllers";
import {
  resetUserC6Bank,
  createUserC6Bank,
} from "../controllers/CreateUsersControllers";
async function executeInCicle() {
  await getAllUsersTickets();
  await createUserC6Bank();
  await resetUserC6Bank();
  await insertInformationThowTech();

  // setTimeout(executeInCicle, 10 * 60 * 1000);
}

executeInCicle();
