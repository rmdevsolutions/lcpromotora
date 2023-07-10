import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../database/index";

export interface IUsersTickets {
  ID: number;
  SYS_ID: string;
  SYS_STATUS: string;
  SYS_SERVICE: string;
  SYS_CREATE_AT: string;
  SYS_CLIENT: string;
  SYS_IDENTITY: string;
  SYS_CREATED_BY: string;
  SYS_INFORMATION: string;
  SYS_DATE_BORN: string;
  STATUS: string;
  USERNAME: string;
  PASSWORD: string;
  INFORMATIONS: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface IUsersTicketsInput
  extends Optional<IUsersTickets, "ID" | "SYS_ID"> {}
export interface IUsersTicketsOutput extends Required<IUsersTickets> {}

class UsersTickets
  extends Model<IUsersTickets, IUsersTicketsInput>
  implements IUsersTickets
{
  public ID!: number;
  public SYS_ID!: string;
  public SYS_STATUS!: string;
  public SYS_SERVICE!: string;
  public SYS_CREATE_AT!: string;
  public SYS_CLIENT!: string;
  public SYS_IDENTITY!: string;
  public SYS_CREATED_BY!: string;
  public SYS_INFORMATION!: string;
  public SYS_DATE_BORN!: string;
  public STATUS!: string;
  public USERNAME!: string;
  public PASSWORD!: string;
  public INFORMATIONS!: string;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

UsersTickets.init(
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    SYS_ID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    SYS_STATUS: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    SYS_SERVICE: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    SYS_CREATE_AT: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    SYS_CLIENT: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    SYS_IDENTITY: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    SYS_CREATED_BY: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    SYS_INFORMATION: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    STATUS: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    USERNAME: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PASSWORD: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    INFORMATIONS: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    SYS_DATE_BORN: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    sequelize: sequelizeConnection,
    paranoid: true,
  }
);

export default UsersTickets;
