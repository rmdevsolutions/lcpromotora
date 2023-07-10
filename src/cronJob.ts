const cron = require("node-cron");
import UsersController from "./controllers/UsersControllers";
import CreateUsersController from "./controllers/CreateUsersControllers";

async function initCronFunction() {
  try {
    console.log("Iniciando Tarefa de Execução");
    await UsersController.getAllUsersTickets();

    await CreateUsersController.createUserC6Bank();
    await CreateUsersController.resetUserC6Bank();
  } catch (error) {
    console.log("Algo Aconteceu: ", error);
  }
}

const task = cron.schedule(
  "*/30 * * * *",
  async () => {
    console.log("Running a job at 00:30min at America/Sao_Paulo timezone");
    await initCronFunction();
  },
  {
    scheduled: true,
    timezone: "America/Sao_Paulo",
  }
);

export default task;
