// SQLite guarda las fechas en UTC con formato "YYYY-MM-DD HH:MM:SS" (sin indicar zona horaria).
// El navegador, si recibe ese texto tal cual, lo interpreta como si YA fuera la hora local,
// lo que provoca que se muestre desfasado (adelantado) respecto a la hora real de Costa Rica.
// Esta función fuerza a que se interprete correctamente como UTC y luego JavaScript
// la convierte automáticamente a la hora local del usuario al mostrarla.
export const parseServerDate = (dateStr) => {
    if (!dateStr) return null;
    let iso = dateStr.replace(' ', 'T');
    if (!iso.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(iso)) {
        iso += 'Z';
    }
    return new Date(iso);
};