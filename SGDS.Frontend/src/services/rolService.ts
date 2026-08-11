import axios from "axios";
import { Aperture } from "lucide-react";

const API_URL = 'http://localhost:5158/api';

export interface RolDto {
    id: number; 
    nombre: string;
}

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}


export async function getRoles(): Promise<RolDto[]> {
  const { data } = await axios.get<RolDto[]>(`${API_URL}/Roles`, {
    headers: authHeader(),
  });
  return data;
}