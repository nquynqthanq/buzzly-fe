import { IToken } from "./token";
import { IUser } from "./user";

export interface IAuthResponse {
    result: IUser;
    tokens: IToken;
}

export interface IForgotPasswordResponse {
    message: string;
    token: string;
}