/** Respuesta paginada del backend (`app/core/pagination.py`). */
export interface Pagina<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
