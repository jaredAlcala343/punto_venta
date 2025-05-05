import { getPool } from "../../configdb";
import sql from "mssql";

export async function POST(request) {
  try {
    const pool = await getConnection();
    const { productos, metodoPago, recibido, total } = await request.json();
    
    // Iniciar transacción
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Crear la venta
      const ventaResult = await transaction.request()
        .input('MetodoPago', sql.VarChar, metodoPago)
        .input('Recibido', sql.Decimal, recibido)
        .input('Total', sql.Decimal, total)
        .query(`
          INSERT INTO Ventas 
            (MetodoPago, Recibido, Total, Subtotal, IVA)
          VALUES 
            (@MetodoPago, @Recibido, @Total, @Total/1.16, @Total*0.16/1.16)
          SELECT SCOPE_IDENTITY() AS VentaID
        `);
      
      const ventaID = ventaResult.recordset[0].VentaID;

      // 2. Agregar detalles de venta y actualizar inventario
      for (const producto of productos) {
        // Insertar detalle
        await transaction.request()
          .input('VentaID', sql.Int, ventaID)
          .input('ProductoID', sql.Int, producto.ProductoID)
          .input('Cantidad', sql.Decimal, producto.Cantidad)
          .input('PrecioUnitario', sql.Decimal, producto.PrecioVenta)
          .query(`
            INSERT INTO DetalleVenta 
              (VentaID, ProductoID, Cantidad, PrecioUnitario, Subtotal)
            VALUES 
              (@VentaID, @ProductoID, @Cantidad, @PrecioUnitario, @Cantidad*@PrecioUnitario)
          `);

        // Actualizar inventario
        await transaction.request()
          .input('ProductoID', sql.Int, producto.ProductoID)
          .input('Cantidad', sql.Decimal, producto.Cantidad)
          .query(`
            UPDATE Productos 
            SET Existencia = Existencia - @Cantidad 
            WHERE ProductoID = @ProductoID
          `);
      }

      // Commit si todo sale bien
      await transaction.commit();
      return Response.json({ success: true, ventaID }, { status: 201 });

    } catch (error) {
      // Rollback en caso de error
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}