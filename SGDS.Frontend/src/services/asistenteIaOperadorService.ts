import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

export interface MensajeChatDto {
  rol: 'usuario' | 'asistente';
  texto: string;
}

export interface RespuestaAsistenteOperadorDto {
  texto: string;
}

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export async function preguntarAsistenteOperador(
  pregunta: string,
  historial: MensajeChatDto[],
): Promise<RespuestaAsistenteOperadorDto> {
  const { data } = await axios.post<RespuestaAsistenteOperadorDto>(
    `${API_URL}/AsistenteIa/operador/preguntar`,
    { pregunta, historial },
    { headers: authHeader() },
  );
  return data;
}
