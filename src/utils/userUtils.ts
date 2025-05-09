import { IUser } from "../types/user";
import { countries } from "@constants/country";

export const getUserFlag = (user: IUser | null) => {
  return `https://flagcdn.com/${countries.find((country) => country.label === user?.nationality)?.value.toLowerCase()}.svg`
};

export const getUser = (users: IUser[] | undefined, userId: string): IUser | undefined => {
  if (!Array.isArray(users)) {
    return undefined;
  }
  return users.find((user) => user.id === userId);
};