const dotenv = require("dotenv");
dotenv.config();
const PORT = parseInt(`${process.env.NODE_ENV || 3000}`);

console.log(process.env.PAN_PROPOSTA_ID);
