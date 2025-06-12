// Grupos de tallas por tipo
const tallasPorCategoria = {
  ropa: [
    { id: 1, name: 'S' },
    { id: 2, name: 'M' },
    { id: 3, name: 'L' },
    { id: 4, name: 'XL' }
  ],
  pantalones_shorts: [
    { id: 5, name: '28' },
    { id: 6, name: '30' },
    { id: 7, name: '32' },
    { id: 8, name: '34' }
  ],
  calzado: [
    { id: 9, name: '38' },
    { id: 10, name: '39' },
    { id: 11, name: '40' },
    { id: 12, name: '41' }
  ],
  unico: [
    { id: 13, name: 'Único' }
  ]
};

// Obtiene grupo de tallas según subcategoría
function obtenerGrupoDeTallasPorSubcategoria(subcategoryId) {
  switch (parseInt(subcategoryId, 10)) {
    case 1: case 2: case 4: case 5: case 6: case 9: case 10:
      return tallasPorCategoria.ropa;
    case 3: case 7: case 8:
      return tallasPorCategoria.pantalones_shorts;
    case 11: case 12: case 13:
      return tallasPorCategoria.calzado;
    case 14: case 15: case 16: case 17: case 18:
      return tallasPorCategoria.unico;
    default:
      return [];
  }
}

// Renderiza tallas en el contenedor indicado
function renderizarTallas(containerId, categoryId = null, subcategoryId = null) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  let tallas = [];

  if (subcategoryId) {
    tallas = obtenerGrupoDeTallasPorSubcategoria(subcategoryId);
  } else if (categoryId) {
    tallas = [];
  }

  tallas.forEach(talla => {
    const label = document.createElement('label');
    label.style.marginRight = '1rem';
    label.innerHTML = `
      <input type="checkbox" name="size_checkbox" value="${talla.id}" /> ${talla.name}
      <input type="number" name="stock_${talla.id}" min="0" value="0" style="width: 60px; margin-left: 5px;" />
    `;
    container.appendChild(label);
  });
}

// Manejo dinámico de subcategorías según categoría seleccionada (formulario agregar)
const categoriaSelect = document.getElementById('category');
const subcategoriaSelect = document.getElementById('subcategory');
const todasSubcategorias = Array.from(subcategoriaSelect.querySelectorAll('option'));
const todasSubcategoriasOriginal = Array.from(document.querySelectorAll('#subcategory option'));
const todasEditSubcategoriasOriginal = Array.from(document.querySelectorAll('#editSubcategory option'));


categoriaSelect.addEventListener('change', () => {
  const categoriaSeleccionada = categoriaSelect.value;

  subcategoriaSelect.innerHTML = '<option value="" disabled selected>Selecciona una subcategoría</option>';
  const subcategoriasFiltradas = todasSubcategoriasOriginal.filter(opt => opt.dataset.category === categoriaSeleccionada);
  subcategoriasFiltradas.forEach(opt => subcategoriaSelect.appendChild(opt.cloneNode(true)));
  subcategoriaSelect.disabled = false;

  renderizarTallas('sizesContainer', null, null);
});

subcategoriaSelect.addEventListener('change', () => {
  const subcategoriaSeleccionada = subcategoriaSelect.value;
  renderizarTallas('sizesContainer', null, subcategoriaSeleccionada);
});

// Cargar productos y mostrarlos
async function fetchProductos() {
  try {
    const res = await fetch('http://localhost:3000/api/products');
    const productos = await res.json();
    renderProductos(productos);
  } catch (error) {
    console.error('Error al cargar productos:', error);
  }
}

function renderProductos(productos) {
  const tbody = document.querySelector('#productosTable tbody');
  tbody.innerHTML = '';
  productos.forEach(prod => {
    const tallasTexto = prod.sizes && prod.sizes.length
      ? prod.sizes.map(s => `${s.name} (${s.stock})`).join(', ')
      : 'Sin tallas';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${prod.product_id}</td>
      <td>${prod.name}</td>
      <td>${prod.price.toFixed(2)}</td>
      <td>-</td>
      <td>${prod.category_name || prod.category_id}</td>
      <td>${prod.subcategory_name || prod.subcategory_id}</td>
      <td>${prod.image ? `<img src="/uploads/${prod.image}" alt="${prod.name}" />` : ''}</td>
      <td>${tallasTexto}</td>
      <td>
        <button onclick="borrarProducto(${prod.product_id})">Borrar</button>
        <button onclick="abrirEditar(${prod.product_id})">Editar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Agregar producto
document.getElementById('productForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = new FormData(this);

  const sizes = [];
  document.querySelectorAll('input[name="size_checkbox"]:checked').forEach(checkbox => {
    const sizeId = checkbox.value;
    const stockInput = document.querySelector(`input[name="stock_${sizeId}"]`);
    const stock = stockInput ? parseInt(stockInput.value, 10) || 0 : 0;
    sizes.push({ size_id: parseInt(sizeId, 10), stock });
  });

  formData.append('sizes', JSON.stringify(sizes));

  try {
    const res = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    document.getElementById('resultado').textContent =
      res.ok ? 'Producto agregado correctamente' : 'Error: ' + (data.error || 'Error desconocido');

    if (res.ok) {
      this.reset();
      fetchProductos();
      renderizarTallas('sizesContainer', null, null);
    }
  } catch (err) {
    document.getElementById('resultado').textContent = 'Error de conexión';
    console.error(err);
  }
});

// Borrar producto
async function borrarProducto(id) {
  if (!confirm('¿Seguro que deseas borrar este producto?')) return;
  try {
    const res = await fetch(`http://localhost:3000/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchProductos();
      document.getElementById('resultado').textContent = 'Producto borrado';
    } else {
      document.getElementById('resultado').textContent = 'Error al borrar';
    }
  } catch {
    document.getElementById('resultado').textContent = 'Error de conexión';
  }
}

// Abrir modal editar producto y cargar datos
async function abrirEditar(id) {
  try {
    const res = await fetch(`http://localhost:3000/api/products/${id}`);
    const producto = await res.json();

    document.getElementById('editId').value = producto.product_id;
    document.getElementById('editName').value = producto.name;
    document.getElementById('editPrice').value = producto.price;

    document.getElementById('editCategory').value = producto.category_id;
    filtrarSubcategoriasEdicion(producto.category_id, producto.subcategory_id);
    renderizarTallas('editSizesContainer', null, producto.subcategory_id);

    document.querySelectorAll('#editSizesContainer input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('#editSizesContainer input[type="number"]').forEach(input => input.value = 0);

    if (producto.sizes && producto.sizes.length) {
      producto.sizes.forEach(({ size_id, stock }) => {
        const checkbox = document.querySelector(`#editSizesContainer input[type="checkbox"][value="${size_id}"]`);
        const stockInput = document.querySelector(`#editSizesContainer input[name="stock_${size_id}"]`);
        if (checkbox) checkbox.checked = true;
        if (stockInput) stockInput.value = stock;
      });
    }

    document.getElementById('editModal').style.display = 'flex';
  } catch (error) {
    console.error('Error al cargar producto:', error);
  }
}

// Filtrar subcategorías y actualizar tallas en edición
function filtrarSubcategoriasEdicion(categoryId, subcategoryId = null) {
  const editSubcategory = document.getElementById('editSubcategory');

  editSubcategory.innerHTML = '<option value="" disabled selected>Selecciona una subcategoría</option>';

  // Usar el array original para evitar que se queden sin opciones
  const filtradas = todasEditSubcategoriasOriginal.filter(opt => opt.dataset.category === String(categoryId));

  if (filtradas.length > 0) {
    filtradas.forEach(opt => editSubcategory.appendChild(opt.cloneNode(true)));
    editSubcategory.disabled = false;

    // Asigna el valor solo después de agregar las opciones
    if (subcategoryId) {
      editSubcategory.value = subcategoryId;
    }
  } else {
    editSubcategory.disabled = true;
    editSubcategory.value = '';
    renderizarTallas('editSizesContainer', null, null);
  }
}


document.getElementById('editCategory').addEventListener('change', (e) => {
  filtrarSubcategoriasEdicion(e.target.value);
  document.getElementById('editSubcategory').value = '';
  renderizarTallas('editSizesContainer', null, null);
});

document.getElementById('editSubcategory').addEventListener('change', (e) => {
  renderizarTallas('editSizesContainer', null, e.target.value);
});

document.getElementById('editForm').onsubmit = async function(e) {
  e.preventDefault();

  const formData = new FormData(this);

  const sizes = [];
  document.querySelectorAll('#editSizesContainer input[type="checkbox"]').forEach(checkbox => {
    const sizeId = checkbox.value;
    if (checkbox.checked) {
      const stockInput = document.querySelector(`#editSizesContainer input[name="stock_${sizeId}"]`);
      const stock = stockInput ? parseInt(stockInput.value, 10) || 0 : 0;
      sizes.push({ size_id: parseInt(sizeId, 10), stock });
    }
  });

  formData.append('sizes', JSON.stringify(sizes));

  const id = document.getElementById('editId').value;

  try {
    const res = await fetch(`http://localhost:3000/api/products/${id}`, {
      method: 'PUT',
      body: formData
    });
    const data = await res.json();

    if (res.ok) {
      document.getElementById('editModal').style.display = 'none';
      fetchProductos();
      document.getElementById('resultado').textContent = 'Producto actualizado';
    } else {
      document.getElementById('resultado').textContent = 'Error al actualizar: ' + (data.error || 'Error desconocido');
    }
  } catch (error) {
    document.getElementById('resultado').textContent = 'Error de conexión';
  }
};

document.getElementById('closeEdit').onclick = () => {
  document.getElementById('editModal').style.display = 'none';
};

document.addEventListener('DOMContentLoaded', () => {
  fetchProductos();

  if (subcategoriaSelect.value) {
    renderizarTallas('sizesContainer', null, subcategoriaSelect.value);
  }
});
