// Valida req[origen] con un esquema zod y guarda el resultado en req.datos.
function validate(schema, origen = 'body') {
    return (req, res, next) => {
        const resultado = schema.safeParse(req[origen] ?? {});
        if (!resultado.success) {
            const primero = resultado.error.issues[0];
            return res.status(400).json({ message: primero?.message || 'Datos inválidos.' });
        }
        req.datos = resultado.data;
        next();
    };
}

module.exports = validate;
