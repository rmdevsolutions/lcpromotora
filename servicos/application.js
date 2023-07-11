const axios = require("axios"); // node

async function ProcessC6Bank() {
  console.log("Iniciando Processo de Captura C6 Bank");
  axios
    .get("http://149.100.154.155:3001/api/app")
    .then((resp) => {
      console.log("Iniciando Processo de Criação C6 Bank");
      axios
        .get("http://149.100.154.155:3001/api/create-user/c6bank")
        .then(() => {
          console.log("Iniciando Processo de Reset C6 Bank");
          axios
            .get("http://149.100.154.155:3001/api/reset-user/c6bank")
            .then(() => {
              console.log("Iniciando Processo de Atualização C6 Bank");
              axios
                .get("http://149.100.154.155:3001/api/update-2tech")
                .then(() => {
                  console.log(
                    "Processo de Criação e Reinicialização Finalizado"
                  );
                })
                .catch((e) => {
                  throw Error(e);
                });
            })
            .catch((e) => {
              throw Error(e);
            });
        })
        .catch((e) => {
          throw Error(e);
        });
    })
    .catch((e) => {
      throw Error(e);
    });
}

const interval = 30 * 60 * 1000;

await ProcessC6Bank();
const intervalVariable = setInterval(ProcessC6Bank, interval);
