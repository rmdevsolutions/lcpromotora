import * as UsersTicketDal from "../database/dal/UsersTickets";
import {
  IUsersTicketsInput,
  IUsersTicketsOutput,
} from "../models/UsersTickets";

export const create = (
  payload: IUsersTicketsInput
): Promise<IUsersTicketsOutput> => {
  return UsersTicketDal.create(payload);
};

export const getById = (id: string): Promise<IUsersTicketsOutput> => {
  return UsersTicketDal.getById(id);
};

export const getAllStatusZero = (
  bank: string,
  status: string
): Promise<IUsersTicketsOutput[]> => {
  return UsersTicketDal.getAllStatusZero(bank, status);
};

export const getAllStatusEnded = (): Promise<IUsersTicketsOutput[]> => {
  return UsersTicketDal.getAllStatusEnded();
};

export const getNotSended = (
  statusNumber: string
): Promise<IUsersTicketsOutput[]> => {
  return UsersTicketDal.getNotSended(statusNumber);
};

export const update = (
  id: string,
  payload: Partial<IUsersTicketsInput>
): Promise<IUsersTicketsOutput> => {
  return UsersTicketDal.update(id, payload);
};
