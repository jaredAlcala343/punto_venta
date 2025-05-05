'use client';
import { useState, useEffect } from 'react';
import './caja.css'; // Importa el archivo CSS normal

export default function CajaPage() {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [amountReceived, setAmountReceived] = useState(0);

  // Calcular totales
  const subtotal = cart.reduce((sum, item) => sum + (item.PrecioVenta * item.Cantidad), 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;
  const change = amountReceived - total;

  // Buscar productos
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`/api/productos?q=${searchTerm}&active=true`);
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error('Error al buscar productos:', error);
      }
    }

    if (searchTerm.length > 1 || searchTerm === '') {
      fetchProducts();
    }
  }, [searchTerm]);

  // Agregar producto al carrito
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.ProductoID === product.ProductoID);
      if (existingItem) {
        return prevCart.map(item =>
          item.ProductoID === product.ProductoID
            ? { ...item, Cantidad: item.Cantidad + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, Cantidad: 1 }];
      }
    });
  };

  // Finalizar venta
  const completeSale = async () => {
    try {
      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productos: cart,
          metodoPago: paymentMethod,
          recibido: amountReceived,
          total
        })
      });

      if (response.ok) {
        setCart([]);
        setAmountReceived(0);
        alert('Venta registrada correctamente');
      } else {
        throw new Error('Error al registrar la venta');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  return (
    <div className="container">
      <h1>Caja Registradora</h1>

      <div className="searchSection">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="productList">
          {products.map(product => (
            <div key={product.ProductoID} onClick={() => addToCart(product)}>
              {product.Nombre} - ${product.PrecioVenta}
            </div>
          ))}
        </div>
      </div>

      <div className="cartSection">
        <h2>Ticket de Venta</h2>
        <ul>
          {cart.map(item => (
            <li key={item.ProductoID}>
              {item.Nombre} x{item.Cantidad} = ${(item.PrecioVenta * item.Cantidad).toFixed(2)}
            </li>
          ))}
        </ul>
        <div className="totals">
          <p>Subtotal: ${subtotal.toFixed(2)}</p>
          <p>IVA (16%): ${iva.toFixed(2)}</p>
          <p>Total: ${total.toFixed(2)}</p>
        </div>

        <div className="paymentSection">
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="EFECTIVO">Efectivo</option>
            <option value="TARJETA">Tarjeta</option>
          </select>

          {paymentMethod === 'EFECTIVO' && (
            <div>
              <input
                type="number"
                placeholder="Cantidad recibida"
                value={amountReceived}
                onChange={(e) => setAmountReceived(parseFloat(e.target.value))}
              />
              <p>Cambio: ${change > 0 ? change.toFixed(2) : '0.00'}</p>
            </div>
          )}

          <button
            onClick={completeSale}
            disabled={cart.length === 0 || (paymentMethod === 'EFECTIVO' && amountReceived < total)}
          >
            Finalizar Venta
          </button>
        </div>
      </div>
    </div>
  );
}