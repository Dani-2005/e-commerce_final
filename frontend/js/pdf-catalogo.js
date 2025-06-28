const { jsPDF } = window.jspdf;

// Utilidad para convertir imagen URL a base64
function getImageBase64(url) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = function () {
      resolve(null);
    };
    img.src = url;
  });
}

// Agrupa productos por categoría y subcategoría
function agruparProductos(productos) {
  const agrupados = {};
  productos.forEach(prod => {
    const cat = prod.category_name || prod.category_id;
    const subcat = prod.subcategory_name || prod.subcategory_id;
    if (!agrupados[cat]) agrupados[cat] = {};
    if (!agrupados[cat][subcat]) agrupados[cat][subcat] = [];
    agrupados[cat][subcat].push(prod);
  });
  return agrupados;
}

async function generarCatalogoFlyer() {
  // 1. Obtén los productos
  const response = await fetch('http://localhost:3000/api/products');
  const productos = await response.json();
  const agrupados = agruparProductos(productos);

  // 2. Configura el PDF y los tamaños de tarjeta
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const cardW = 62;
  const cardH = 80;
  const marginX = 10;
  const marginY = 10;
  const imgH = cardH * 0.8;
  const infoH = cardH * 0.2;
  const cardsPerRow = 3;
  const bottomMargin = 12;
  const topStartY = 38; // Después del header

  // 3. Header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(0, 0, pageWidth, 34, 'F');
  // Logo (si tienes, descomenta y pon la ruta)
  // const logoData = await getImageBase64('/ruta/a/logo.png');
  // if (logoData) pdf.addImage(logoData, 'PNG', 10, 8, 18, 12);
  pdf.setFontSize(22);
  pdf.setTextColor(40, 40, 40);
  pdf.setFont(undefined, 'bold');
  pdf.text('No te quedes sin tu compra,', 40, 17);
  pdf.text("Rapido antes de que se agote!", 40, 27);

  let y = topStartY;

  // 4. Recorre categorías y subcategorías
  for (const [cat, subs] of Object.entries(agrupados)) {
    pdf.setFontSize(15);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Categoría: ${cat}`, 12, y);
    y += 8;
    for (const [sub, productosSub] of Object.entries(subs)) {
      pdf.setFontSize(12);
      pdf.setTextColor(60, 60, 60);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Subcategoría: ${sub}`, 17, y);
      y += 6;

      let col = 0;
      let rowY = y;
      for (let i = 0; i < productosSub.length; i++) {
        let cardY = rowY;
        let x = marginX + col * (cardW + 4);

        // --- VERIFICACIÓN DE ESPACIO ANTES DE DIBUJAR LA TARJETA ---
        if (cardY + cardH + bottomMargin > pageHeight) {
          pdf.addPage();
          // Header en cada página
          pdf.setFillColor(240, 240, 240);
          pdf.rect(0, 0, pageWidth, 34, 'F');
          pdf.setFontSize(22);
          pdf.setTextColor(40, 40, 40);
          pdf.setFont(undefined, 'bold');
          pdf.text('No te quedes sin tu compra,', 40, 17);
          pdf.text("Rapido antes de que se agote!", 40, 27);
          cardY = topStartY;
          rowY = cardY;
        }

        // --- Dibuja recuadro tarjeta ---
        pdf.setDrawColor(200);
        pdf.setLineWidth(0.3);
        pdf.rect(x, cardY, cardW, cardH);

        // --- Imagen (80% superior) ---
        let imgY = cardY + 2;
        let imgX = x + 2;
        let imgW = cardW - 4;
        if (productosSub[i].image) {
          const imgUrl = `/uploads/${productosSub[i].image}`;
          const imgData = await getImageBase64(imgUrl);
          if (imgData) {
            pdf.addImage(imgData, 'JPEG', imgX, imgY, imgW, imgH - 4, undefined, 'FAST');
          }
        }

        // --- Info (20% inferior) ---
        let infoY = cardY + imgH + 4;
        pdf.setFontSize(11);
        pdf.setTextColor(30, 30, 30);
        pdf.setFont(undefined, 'bold');
        pdf.text(productosSub[i].name, x + 4, infoY + 2, { maxWidth: cardW - 8 });

        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(200, 0, 0);
        // Solo un precio, el final (con descuento aplicado si existe)
        const descuento = productosSub[i].discount ? parseFloat(productosSub[i].discount) : 0;
        const precioFinal = descuento > 0 ? productosSub[i].price * (1 - descuento / 100) : productosSub[i].price;
        pdf.text(`$${precioFinal.toFixed(2)}`, x + 4, infoY + 10);

        // Si quieres mostrar el precio original tachado y el descuento, descomenta:
        /*
        if (descuento > 0) {
          pdf.setFontSize(9);
          pdf.setTextColor(150, 150, 150);
          const precioOriginal = `$${productosSub[i].price.toFixed(2)}`;
          pdf.text(precioOriginal, x + 30, infoY + 10);
          const textWidth = pdf.getTextWidth(precioOriginal);
          pdf.setDrawColor(180, 0, 0);
          pdf.line(x + 30, infoY + 8, x + 30 + textWidth, infoY + 8);
          pdf.setFontSize(8);
          pdf.setTextColor(220, 0, 0);
          pdf.text(`${descuento}% OFF`, x + 4, infoY + 15);
        }
        */

        // --- Descripción (opcional, si quieres agregarla debajo del precio) ---
        /*
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(80, 80, 80);
        let desc = productosSub[i].description ? productosSub[i].description : '';
        pdf.text(desc, x + 4, infoY + 17, { maxWidth: cardW - 8 });
        */

        // --- Siguiente columna/fila ---
        col++;
        if (col === cardsPerRow || i === productosSub.length - 1) {
          col = 0;
          rowY += cardH + marginY;
        }
      }
      y = rowY + 5;
      if (y > pageHeight - bottomMargin) {
        pdf.addPage();
        // Header en cada página
        pdf.setFillColor(240, 240, 240);
        pdf.rect(0, 0, pageWidth, 34, 'F');
        pdf.setFontSize(22);
        pdf.setTextColor(40, 40, 40);
        pdf.setFont(undefined, 'bold');
        pdf.text('No te quedes sin tu compra,', 40, 17);
        pdf.text("Rapido antes de que se agote!", 40, 27);
        y = topStartY;
      }
    }
    y += 5;
    if (y > pageHeight - bottomMargin) {
      pdf.addPage();
      // Header en cada página
      pdf.setFillColor(240, 240, 240);
      pdf.rect(0, 0, pageWidth, 34, 'F');
      pdf.setFontSize(22);
      pdf.setTextColor(40, 40, 40);
      pdf.setFont(undefined, 'bold');
      pdf.text('No te quedes sin tu compra,', 40, 17);
      pdf.text("Rapido antes de que se agote!", 40, 27);
      y = topStartY;
    }
  }

  pdf.save('catalogo_flyer.pdf');
}

// Botón para generar el catálogo tipo flyer
document.addEventListener('DOMContentLoaded', function() {
  let boton = document.getElementById('generarCatalogoFlyer');
  if (!boton) {
    boton = document.createElement('button');
    boton.id = 'generarCatalogoFlyer';
    boton.textContent = 'Generar Catálogo Flyer PDF';
    boton.style.margin = '20px';
    document.body.insertBefore(boton, document.body.firstChild);
  }
  boton.addEventListener('click', generarCatalogoFlyer);
});
