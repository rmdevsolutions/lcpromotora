import { Op, FindOptions } from "sequelize";
import { UsersTickets } from "../../models";
import {
  IUsersTicketsInput,
  IUsersTicketsOutput,
} from "../../models/UsersTickets";

UsersTickets.sync({ alter: true });

export const create = async (
  payload: IUsersTicketsInput
): Promise<IUsersTicketsOutput> => {
  const userTicket = await UsersTickets.create(payload);
  return userTicket;
};

export const getAll = async (): Promise<IUsersTicketsOutput[]> => {
  return UsersTickets.findAll();
};

export const getAllStatusZero = async (
  bank: string,
  status: string
): Promise<IUsersTicketsOutput[]> => {
  return UsersTickets.findAll({
    where: { STATUS: "0", SYS_STATUS: status, SYS_SERVICE: bank },
  });
};

export const getAllStatusEnded = async (): Promise<IUsersTicketsOutput[]> => {
  return UsersTickets.findAll({
    where: {
      STATUS: { [Op.not]: ["0", "1"] },
    },
  });
};

export const getNotSended = async (
  statusNumber: string
): Promise<IUsersTicketsOutput[]> => {
  const usersTicket = await UsersTickets.findAll({
    where: { STATUS: statusNumber },
  });
  if (!usersTicket) {
    // @todo throw custom error
    throw new Error("not found");
  }
  return usersTicket;
};

export const Upsert = async (
  payload: IUsersTicketsInput,
  SYSID: string
): Promise<void> => {
  const retorno: any = await UsersTickets.findOne({
    where: {
      SYS_ID: SYSID,
    },
  }).then((response) => {
    if (response) return response.update(payload);
    UsersTickets.create(payload);
  });
};

export const update = async (
  id: string,
  payload: Partial<IUsersTicketsInput>
): Promise<IUsersTicketsOutput> => {
  const userTicket = await UsersTickets.findOne({ where: { SYS_ID: id } });
  if (!userTicket) {
    const userTicket = await UsersTickets.create(payload);
    return userTicket;
  }
  const updatedUsersTicket = await (userTicket as UsersTickets).update(payload);
  return updatedUsersTicket;
};

export const getById = async (id: string): Promise<IUsersTicketsOutput> => {
  const usersTicket = await UsersTickets.findByPk(id);
  if (!usersTicket) {
    // @todo throw custom error
    throw new Error("not found");
  }
  return usersTicket;
};
