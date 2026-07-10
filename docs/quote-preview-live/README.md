# Quote Preview real en GitHub Pages

Esta carpeta contiene una prueba de navegador del flujo existente:

```text
paquete generado por el extractor real
→ createQuotePreviewPdfFlowPopupInvocation
→ pop-up real
→ Editar o Aceptar
→ store oficial en memoria
```

## Privacidad

El PDF, el paquete extraído y los valores de la cotización no se guardan en el repositorio.

La página solicita al usuario seleccionar el archivo local:

```text
forge-quote-preview-real-packet.json
```

El paquete se genera fuera del repositorio con el lector existente y queda en el almacenamiento local del dispositivo.

## Sin hardcode

`index.html`, `app.js` y el bundle no contienen nombre, asegurado, producto, prima, suma asegurada ni plazo de una cotización específica.

El bundle se genera desde los módulos CommonJS existentes de Forge. No incluye una copia manual del pop-up.
