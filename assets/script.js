const url = 'https://docs.google.com/spreadsheets/d/186vGzjRzMeXLW2sQHTOR0koshxOGQ6s7SWGqF1Ph9EY/gviz/tq?tqx=out:json';

let productosGlobales = [];
let carrito = [];

function actualizarContador() {
  const contador = document.getElementById('contador-carrito');
  if (!contador) return;
  const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  contador.textContent = total;
}

function mostrarCarrito() {
  const contenedor = document.querySelector('.items-carrito');
  const totalCarrito = document.getElementById('total-carrito') || document.querySelector('.total-carrito');
  if (!contenedor || !totalCarrito) return;

  if (carrito.length === 0) {
    contenedor.innerHTML = '<p>Tu carrito está vacío.</p>';
    totalCarrito.textContent = 'Total: $0.00';
    return;
  }

  contenedor.innerHTML = '';
  let total = 0;

  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-carrito';
    itemDiv.innerHTML = `
      <strong>${item.nombre}</strong>
      <div>
        <label>Cantidad:
          <input type="number" min="1" class="cantidad" data-id="${item.id}" value="${item.cantidad}" />
        </label>
        <span style="margin-left:10px;">$${subtotal.toFixed(2)}</span>
        <button class="eliminar-item" data-id="${item.id}">X</button>
      </div>
    `;

    contenedor.appendChild(itemDiv);
  });

  totalCarrito.textContent = `Total: $${total.toFixed(2)}`;

  // Listeners para inputs cantidad
  document.querySelectorAll('.cantidad').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      let nuevaCantidad = parseInt(e.target.value);
      if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
        nuevaCantidad = 1;
        e.target.value = 1;
      }
      actualizarCantidad(id, nuevaCantidad);
    });
  });

  // Listeners para eliminar producto
  document.querySelectorAll('.eliminar-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      eliminarDelCarrito(id);
    });
  });
}

function agregarAlCarrito(producto) {
  const index = carrito.findIndex(item => item.id === producto.id);
  if (index !== -1) {
    carrito[index].cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  actualizarContador();
  mostrarCarrito();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(item => item.id !== id);
  actualizarContador();
  mostrarCarrito();
}

function actualizarCantidad(id, cantidad) {
  const index = carrito.findIndex(item => item.id === id);
  if (index !== -1) {
    carrito[index].cantidad = cantidad;
    actualizarContador();
    mostrarCarrito();
  }
}

function mostrarProductos(data) {
  const contenedor = document.querySelector('.grid-productos');
  contenedor.innerHTML = "";

  data.forEach(item => {
    const producto = document.createElement("div");
    producto.className = "producto";
    producto.setAttribute("data-id", item.id);

    producto.innerHTML = `
      <img src="${item.imagen}" alt="${item.nombre}">
      <h3>${item.nombre}</h3>
      <span class="precio-producto">$${item.precio}</span>
      <p>${item.descripcion}</p>
      <button class="agregar-carrito">Agregar al carrito</button>
    `;

    contenedor.appendChild(producto);
  });

  // Agregar o quitar clase para un solo producto
  if (data.length === 1) {
    contenedor.classList.add('un-producto');
  } else {
    contenedor.classList.remove('un-producto');
  }

  // Después de renderizar productos, agregamos eventos a botones
  document.querySelectorAll('.agregar-carrito').forEach(btn => {
    btn.addEventListener('click', () => {
      const productoDiv = btn.closest('.producto');
      const producto = {
        id: productoDiv.getAttribute('data-id'),
        nombre: productoDiv.querySelector('h3').textContent,
        precio: parseFloat(productoDiv.querySelector('.precio-producto').textContent.replace('$', '')),
      };
      agregarAlCarrito(producto);
    });
  });
}


function crearFiltros() {
  const marcas = [...new Set(productosGlobales.map(p => p.marca).filter(m => m))].sort();
  const tipos = [...new Set(productosGlobales.map(p => p.tipo).filter(t => t))].sort();

  const filtroMarca = document.getElementById('filtro-marca');
  const filtroTipo = document.getElementById('filtro-tipo');

  marcas.forEach(marca => {
    const option = document.createElement('option');
    option.value = marca.toLowerCase();
    option.textContent = marca;
    filtroMarca.appendChild(option);
  });

  tipos.forEach(tipo => {
    const option = document.createElement('option');
    option.value = tipo.toLowerCase();
    option.textContent = tipo;
    filtroTipo.appendChild(option);
  });
}

function aplicarFiltros() {
  const filtroMarca = document.getElementById('filtro-marca').value.toLowerCase();
  const filtroTipo = document.getElementById('filtro-tipo').value.toLowerCase();
  const texto = document.getElementById('buscador').value.toLowerCase();

  const filtrados = productosGlobales.filter(p => {
    const nombre = p.nombre.toLowerCase();
    const descripcion = p.descripcion.toLowerCase();
    const marca = p.marca.toLowerCase();
    const tipo = p.tipo.toLowerCase();

    const coincideMarca = !filtroMarca || marca === filtroMarca;
    const coincideTipo = !filtroTipo || tipo === filtroTipo;
    const coincideTexto = nombre.includes(texto) || descripcion.includes(texto) || marca.includes(texto) || tipo.includes(texto);

    return coincideMarca && coincideTipo && coincideTexto;
  });

  mostrarProductos(filtrados);
}

document.addEventListener('DOMContentLoaded', () => {
  // Cargar productos desde Google Sheets
  fetch(url)
    .then(res => res.text())
    .then(text => {
      const jsonText = text.substring(47, text.length - 2);
      const data = JSON.parse(jsonText);
      const rows = data.table.rows;

      productosGlobales = rows.map(row => ({
        id: row.c[0]?.v || '',
        nombre: row.c[1]?.v || '',
        precio: row.c[2]?.v || '',
        imagen: row.c[3]?.v || '',
        descripcion: row.c[4]?.v || '',
        marca: row.c[5]?.v || '',
        tipo: row.c[6]?.v || ''
      }));

      crearFiltros();
      aplicarFiltros();
    })
    .catch(err => console.error('Error cargando productos:', err));

  // Listeners filtros
  const filtroMarca = document.getElementById('filtro-marca');
  const filtroTipo = document.getElementById('filtro-tipo');
  const buscador = document.getElementById('buscador');
  const btnLimpiar = document.getElementById('btn-limpiar');

  filtroMarca.addEventListener('change', aplicarFiltros);
  filtroTipo.addEventListener('change', aplicarFiltros);
  buscador.addEventListener('input', aplicarFiltros);

  btnLimpiar.addEventListener('click', () => {
    filtroMarca.value = '';
    filtroTipo.value = '';
    buscador.value = '';
    aplicarFiltros();
  });

  // Botón vaciar carrito
  const btnVaciar = document.getElementById('vaciar-carrito');
  if (btnVaciar) {
    btnVaciar.addEventListener('click', () => {
      carrito = [];
      actualizarContador();
      mostrarCarrito();
    });
  }

  // Botón WhatsApp
  const btnEnviarWhatsapp = document.getElementById('enviar-whatsapp');
  if (btnEnviarWhatsapp) {
    btnEnviarWhatsapp.addEventListener('click', (e) => {
      if (carrito.length === 0) {
        e.preventDefault();
        alert('Tu carrito está vacío.');
        return;
      }
      const mensaje = carrito.map(item => `${item.nombre} x${item.cantidad} - $${(item.precio * item.cantidad).toFixed(2)}`).join('\n');
      const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0).toFixed(2);
      const texto = encodeURIComponent(`Hola! Quiero hacer el siguiente pedido:\n\n${mensaje}\n\nTotal: $${total}`);
      const numeroWhatsapp = '5493518052252'; // Cambiar por tu número
      btnEnviarWhatsapp.href = `https://wa.me/${numeroWhatsapp}?text=${texto}`;
    });
  }

  mostrarCarrito();
  actualizarContador();
});
