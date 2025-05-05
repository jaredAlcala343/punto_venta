import { getConnection } from '../../configdb';
import sql from 'mssql';

export default async function handler(req, res) {
  const pool = await getConnection();

  try {
    if (req.method === 'GET') {
      const { q = '', active = 'false' } = req.query;
      
      let whereClause = `WHERE Nombre LIKE '%${q}%'`;
      if (active === 'true') whereClause += ' AND Activo = 1';

      const result = await pool.request()
        .query(`SELECT * FROM Productos ${whereClause} ORDER BY Nombre`);

      res.status(200).json(result.recordset);
    } 
    else if (req.method === 'POST') {
      const { Codigo, Nombre, Descripcion, PrecioVenta, PrecioCompra, Existencia } = req.body;

      const result = await pool.request()
        .input('Codigo', sql.VarChar, Codigo)
        .input('Nombre', sql.VarChar, Nombre)
        .input('Descripcion', sql.VarChar, Descripcion)
        .input('PrecioVenta', sql.Decimal, PrecioVenta)
        .input('PrecioCompra', sql.Decimal, PrecioCompra)
        .input('Existencia', sql.Decimal, Existencia)
        .query(`
          INSERT INTO Productos 
            (Codigo, Nombre, Descripcion, PrecioVenta, PrecioCompra, Existencia)
          VALUES 
            (@Codigo, @Nombre, @Descripcion, @PrecioVenta, @PrecioCompra, @Existencia)
          SELECT SCOPE_IDENTITY() AS ProductoID
        `);

      res.status(201).json({ 
        ProductoID: result.recordset[0].ProductoID,
        ...req.body
      });
    } 
    else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}