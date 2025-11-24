import { jwtDecode } from 'jwt-decode';
export const decription = (data: string) : any => jwtDecode(data);
