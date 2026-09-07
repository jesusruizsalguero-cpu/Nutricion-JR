/**
 * Catálogo base de alimentos usado por el generador de dietas.
 *
 * Vive en el código (no en Firestore) por dos motivos: el generador necesita
 * el catálogo completo para combinar alimentos y no tendría sentido descargarlo
 * entero en cada cálculo, y así la app funciona sin depender de que la base de
 * datos esté sembrada.
 *
 * Valores nutricionales por 100 g (o 100 ml en líquidos), aproximados a partir
 * de tablas de composición de uso común. Son estimaciones para planificar,
 * no medidas de laboratorio.
 *
 * Campos:
 *   rol        proteina | carbohidrato | verdura | fruta | grasa | lacteo
 *   origen     vegetal | lacteo | huevo | pescado | marisco | carne | cerdo
 *   contiene   alérgenos e ingredientes que se filtran (gluten, lactosa, ...)
 *   ig         índice glucémico: bajo | medio | alto
 *   purinas    relevante en hiperuricemia y gota
 *   potasio    relevante en enfermedad renal crónica
 *   fodmap     bajo | alto — relevante en síndrome de intestino irritable
 *   racion     rango razonable en gramos y paso de ajuste del generador
 *   momentos   comidas del día en las que encaja
 */

const TODAS = ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena']

export const ALIMENTOS = [
  // ---------------------------------------------------------------- Proteínas
  crear('pechuga-pollo', 'Pechuga de pollo', 'proteina', 'carne', {
    kcal: 165, prot: 31, carb: 0, gras: 3.6, sat: 1, fibra: 0, sodio: 74,
    purinas: 'medio', racion: [90, 220, 10], momentos: ['almuerzo', 'cena'],
  }),
  crear('muslo-pollo', 'Muslo de pollo sin piel', 'proteina', 'carne', {
    kcal: 177, prot: 24, carb: 0, gras: 8.6, sat: 2.4, fibra: 0, sodio: 86,
    purinas: 'medio', racion: [90, 200, 10], momentos: ['almuerzo', 'cena'],
  }),
  crear('pavo', 'Pechuga de pavo', 'proteina', 'carne', {
    kcal: 135, prot: 29, carb: 0, gras: 1.7, sat: 0.5, fibra: 0, sodio: 63,
    purinas: 'medio', racion: [90, 220, 10], momentos: ['almuerzo', 'cena'],
  }),
  crear('ternera-magra', 'Ternera magra', 'proteina', 'carne', {
    kcal: 158, prot: 27, carb: 0, gras: 5.4, sat: 2.2, fibra: 0, sodio: 66,
    purinas: 'alto', potasio: 'alto', racion: [90, 200, 10], momentos: ['almuerzo', 'cena'],
  }),
  crear('solomillo-cerdo', 'Solomillo de cerdo', 'proteina', 'cerdo', {
    kcal: 143, prot: 26, carb: 0, gras: 4.1, sat: 1.4, fibra: 0, sodio: 57,
    purinas: 'alto', racion: [90, 200, 10], momentos: ['almuerzo', 'cena'],
  }),
  crear('conejo', 'Conejo', 'proteina', 'carne', {
    kcal: 136, prot: 25, carb: 0, gras: 3.5, sat: 1.1, fibra: 0, sodio: 49,
    purinas: 'medio', racion: [100, 200, 10], momentos: ['almuerzo', 'cena'],
  }),
  crear('huevo', 'Huevo entero', 'proteina', 'huevo', {
    kcal: 143, prot: 12.6, carb: 0.7, gras: 9.5, sat: 3.1, fibra: 0, sodio: 142,
    contiene: ['huevo'], racion: [50, 180, 10], momentos: ['desayuno', 'almuerzo', 'cena'],
  }),
  crear('claras-huevo', 'Claras de huevo', 'proteina', 'huevo', {
    kcal: 52, prot: 11, carb: 0.7, gras: 0.2, sat: 0, fibra: 0, sodio: 166,
    contiene: ['huevo'], racion: [60, 250, 20], momentos: ['desayuno', 'cena'],
  }),
  crear('atun-natural', 'Atún al natural', 'proteina', 'pescado', {
    kcal: 116, prot: 26, carb: 0, gras: 1, sat: 0.3, fibra: 0, sodio: 320,
    contiene: ['pescado'], purinas: 'alto', racion: [70, 180, 10],
    momentos: ['almuerzo', 'cena'],
  }),
  crear('salmon', 'Salmón', 'proteina', 'pescado', {
    kcal: 208, prot: 20, carb: 0, gras: 13, sat: 3.1, fibra: 0, sodio: 59,
    contiene: ['pescado'], purinas: 'alto', racion: [90, 200, 10],
    momentos: ['almuerzo', 'cena'],
  }),
  crear('merluza', 'Merluza', 'proteina', 'pescado', {
    kcal: 86, prot: 17, carb: 0, gras: 1.8, sat: 0.4, fibra: 0, sodio: 101,
    contiene: ['pescado'], purinas: 'medio', racion: [120, 250, 10],
    momentos: ['almuerzo', 'cena'],
  }),
  crear('bacalao', 'Bacalao fresco', 'proteina', 'pescado', {
    kcal: 82, prot: 18, carb: 0, gras: 0.7, sat: 0.1, fibra: 0, sodio: 89,
    contiene: ['pescado'], purinas: 'medio', racion: [120, 250, 10],
    momentos: ['almuerzo', 'cena'],
  }),
  crear('sardinas', 'Sardinas', 'proteina', 'pescado', {
    kcal: 208, prot: 25, carb: 0, gras: 11.5, sat: 3, fibra: 0, sodio: 307,
    contiene: ['pescado'], purinas: 'alto', racion: [80, 160, 10],
    momentos: ['almuerzo', 'cena'],
  }),
  crear('gambas', 'Gambas', 'proteina', 'marisco', {
    kcal: 99, prot: 21, carb: 0.2, gras: 1.4, sat: 0.3, fibra: 0, sodio: 566,
    contiene: ['marisco'], purinas: 'alto', racion: [100, 200, 10],
    momentos: ['almuerzo', 'cena'],
  }),
  crear('fiambre-pavo', 'Fiambre de pavo', 'proteina', 'carne', {
    kcal: 110, prot: 20, carb: 1.5, gras: 2.5, sat: 0.8, fibra: 0, sodio: 950,
    purinas: 'medio', racion: [40, 120, 10], momentos: ['desayuno', 'merienda', 'cena'],
  }),
  crear('jamon-serrano', 'Jamón serrano', 'proteina', 'cerdo', {
    kcal: 241, prot: 31, carb: 0, gras: 13, sat: 4.5, fibra: 0, sodio: 1100,
    purinas: 'alto', racion: [30, 80, 10], momentos: ['desayuno', 'media_manana', 'cena'],
  }),
  crear('tofu', 'Tofu firme', 'proteina', 'vegetal', {
    kcal: 144, prot: 15.8, carb: 2.8, gras: 8.7, sat: 1.3, fibra: 1.9, sodio: 14,
    contiene: ['soja'], racion: [100, 250, 10], momentos: ['almuerzo', 'cena'],
  }),
  crear('tempeh', 'Tempeh', 'proteina', 'vegetal', {
    kcal: 192, prot: 20, carb: 7.6, gras: 11, sat: 2.2, fibra: 4.5, sodio: 9,
    contiene: ['soja'], racion: [90, 180, 10], momentos: ['almuerzo', 'cena'],
  }),
  crear('seitan', 'Seitán', 'proteina', 'vegetal', {
    kcal: 141, prot: 24, carb: 4, gras: 1.9, sat: 0.3, fibra: 1.2, sodio: 320,
    contiene: ['gluten'], racion: [100, 200, 10], momentos: ['almuerzo', 'cena'],
  }),
  crear('soja-texturizada', 'Soja texturizada hidratada', 'proteina', 'vegetal', {
    kcal: 105, prot: 17, carb: 5, gras: 1.5, sat: 0.2, fibra: 4, sodio: 12,
    contiene: ['soja'], fodmap: 'alto', racion: [90, 200, 10], momentos: ['almuerzo', 'cena'],
  }),
  crear('lentejas', 'Lentejas cocidas', 'proteina', 'vegetal', {
    kcal: 116, prot: 9, carb: 20, gras: 0.4, sat: 0.1, fibra: 7.9, sodio: 6,
    ig: 'bajo', purinas: 'medio', potasio: 'alto', fodmap: 'alto',
    racion: [120, 300, 20], momentos: ['almuerzo', 'cena'],
  }),
  crear('garbanzos', 'Garbanzos cocidos', 'proteina', 'vegetal', {
    kcal: 139, prot: 8.9, carb: 22.5, gras: 2.6, sat: 0.3, fibra: 7.6, sodio: 7,
    ig: 'bajo', purinas: 'medio', potasio: 'alto', fodmap: 'alto',
    racion: [120, 280, 20], momentos: ['almuerzo', 'cena'],
  }),
  crear('alubias', 'Alubias blancas cocidas', 'proteina', 'vegetal', {
    kcal: 127, prot: 8.7, carb: 22.8, gras: 0.5, sat: 0.1, fibra: 6.3, sodio: 6,
    ig: 'bajo', potasio: 'alto', fodmap: 'alto', racion: [120, 280, 20],
    momentos: ['almuerzo', 'cena'],
  }),
  crear('edamame', 'Edamame', 'proteina', 'vegetal', {
    kcal: 121, prot: 12, carb: 8.9, gras: 5.2, sat: 0.6, fibra: 5.2, sodio: 6,
    contiene: ['soja'], ig: 'bajo', potasio: 'alto', racion: [80, 180, 10],
    momentos: ['almuerzo', 'cena', 'media_manana'],
  }),

  // ------------------------------------------------------------------ Lácteos
  crear('leche-semi', 'Leche semidesnatada', 'lacteo', 'lacteo', {
    kcal: 46, prot: 3.2, carb: 4.8, gras: 1.6, sat: 1, fibra: 0, sodio: 44,
    contiene: ['lactosa'], ig: 'bajo', fodmap: 'alto', racion: [150, 350, 25],
    momentos: ['desayuno', 'merienda'],
  }),
  crear('leche-sin-lactosa', 'Leche sin lactosa', 'lacteo', 'lacteo', {
    kcal: 42, prot: 3.4, carb: 4.7, gras: 1.5, sat: 0.9, fibra: 0, sodio: 44,
    ig: 'bajo', racion: [150, 350, 25], momentos: ['desayuno', 'merienda'],
  }),
  crear('yogur-natural', 'Yogur natural', 'lacteo', 'lacteo', {
    kcal: 61, prot: 3.5, carb: 4.7, gras: 3.3, sat: 2.1, fibra: 0, sodio: 46,
    contiene: ['lactosa'], ig: 'bajo', racion: [125, 300, 25],
    momentos: ['desayuno', 'merienda', 'media_manana'],
  }),
  crear('yogur-griego', 'Yogur griego natural', 'lacteo', 'lacteo', {
    kcal: 97, prot: 9, carb: 3.6, gras: 5, sat: 3.2, fibra: 0, sodio: 36,
    contiene: ['lactosa'], ig: 'bajo', racion: [125, 300, 25],
    momentos: ['desayuno', 'merienda', 'media_manana'],
  }),
  crear('queso-batido', 'Queso batido 0%', 'lacteo', 'lacteo', {
    kcal: 47, prot: 8, carb: 4, gras: 0.2, sat: 0.1, fibra: 0, sodio: 40,
    contiene: ['lactosa'], ig: 'bajo', racion: [125, 300, 25],
    momentos: ['desayuno', 'merienda', 'cena'],
  }),
  crear('requeson', 'Requesón', 'lacteo', 'lacteo', {
    kcal: 98, prot: 11, carb: 3.4, gras: 4.3, sat: 2.7, fibra: 0, sodio: 364,
    contiene: ['lactosa'], ig: 'bajo', racion: [80, 200, 10],
    momentos: ['desayuno', 'merienda', 'cena'],
  }),
  crear('queso-fresco', 'Queso fresco', 'lacteo', 'lacteo', {
    kcal: 174, prot: 12, carb: 4, gras: 12, sat: 8, fibra: 0, sodio: 350,
    contiene: ['lactosa'], racion: [60, 150, 10], momentos: ['desayuno', 'merienda', 'cena'],
  }),
  crear('queso-curado', 'Queso curado', 'lacteo', 'lacteo', {
    kcal: 389, prot: 26, carb: 1.4, gras: 31, sat: 20, fibra: 0, sodio: 1200,
    contiene: ['lactosa'], racion: [20, 50, 5], momentos: ['desayuno', 'media_manana', 'cena'],
  }),
  crear('bebida-soja', 'Bebida de soja sin azúcar', 'lacteo', 'vegetal', {
    kcal: 33, prot: 3.3, carb: 0.6, gras: 1.8, sat: 0.3, fibra: 0.6, sodio: 40,
    contiene: ['soja'], ig: 'bajo', racion: [150, 350, 25],
    momentos: ['desayuno', 'merienda'],
  }),
  crear('yogur-soja', 'Yogur de soja', 'lacteo', 'vegetal', {
    kcal: 55, prot: 4, carb: 3.5, gras: 2.3, sat: 0.4, fibra: 0.8, sodio: 30,
    contiene: ['soja'], ig: 'bajo', racion: [125, 250, 25],
    momentos: ['desayuno', 'merienda', 'media_manana'],
  }),

  // ------------------------------------------------------------ Carbohidratos
  crear('arroz-blanco', 'Arroz blanco cocido', 'carbohidrato', 'vegetal', {
    kcal: 130, prot: 2.7, carb: 28, gras: 0.3, sat: 0.1, fibra: 0.4, sodio: 1,
    ig: 'alto', racion: [120, 350, 20], momentos: ['almuerzo', 'cena'],
  }),
  crear('arroz-integral', 'Arroz integral cocido', 'carbohidrato', 'vegetal', {
    kcal: 123, prot: 2.6, carb: 25.6, gras: 1, sat: 0.2, fibra: 1.8, sodio: 4,
    ig: 'medio', racion: [120, 350, 20], momentos: ['almuerzo', 'cena'],
  }),
  crear('pasta-integral', 'Pasta integral cocida', 'carbohidrato', 'vegetal', {
    kcal: 124, prot: 5, carb: 24, gras: 0.9, sat: 0.2, fibra: 3.9, sodio: 3,
    contiene: ['gluten'], ig: 'medio', racion: [120, 320, 20], momentos: ['almuerzo', 'cena'],
  }),
  crear('pasta', 'Pasta cocida', 'carbohidrato', 'vegetal', {
    kcal: 131, prot: 5, carb: 25, gras: 1.1, sat: 0.2, fibra: 1.8, sodio: 2,
    contiene: ['gluten'], ig: 'medio', racion: [120, 320, 20], momentos: ['almuerzo', 'cena'],
  }),
  crear('patata', 'Patata cocida', 'carbohidrato', 'vegetal', {
    kcal: 86, prot: 1.7, carb: 20, gras: 0.1, sat: 0, fibra: 1.8, sodio: 5,
    ig: 'alto', potasio: 'alto', racion: [150, 400, 25], momentos: ['almuerzo', 'cena'],
  }),
  crear('boniato', 'Boniato asado', 'carbohidrato', 'vegetal', {
    kcal: 90, prot: 2, carb: 20.7, gras: 0.2, sat: 0, fibra: 3.3, sodio: 36,
    ig: 'medio', potasio: 'alto', racion: [150, 350, 25], momentos: ['almuerzo', 'cena'],
  }),
  crear('quinoa', 'Quinoa cocida', 'carbohidrato', 'vegetal', {
    kcal: 120, prot: 4.4, carb: 21.3, gras: 1.9, sat: 0.2, fibra: 2.8, sodio: 7,
    ig: 'bajo', racion: [120, 300, 20], momentos: ['almuerzo', 'cena'],
  }),
  crear('cuscus', 'Cuscús cocido', 'carbohidrato', 'vegetal', {
    kcal: 112, prot: 3.8, carb: 23.2, gras: 0.2, sat: 0, fibra: 1.4, sodio: 5,
    contiene: ['gluten'], ig: 'medio', racion: [120, 300, 20], momentos: ['almuerzo', 'cena'],
  }),
  crear('avena', 'Copos de avena', 'carbohidrato', 'vegetal', {
    kcal: 375, prot: 13, carb: 59, gras: 7, sat: 1.2, fibra: 10, sodio: 4,
    contiene: ['gluten'], ig: 'bajo', fodmap: 'alto', racion: [30, 100, 5],
    momentos: ['desayuno', 'merienda'],
  }),
  crear('pan-integral', 'Pan integral', 'carbohidrato', 'vegetal', {
    kcal: 247, prot: 9, carb: 41, gras: 3.4, sat: 0.7, fibra: 6.8, sodio: 450,
    contiene: ['gluten'], ig: 'medio', racion: [30, 120, 10],
    momentos: ['desayuno', 'media_manana', 'merienda', 'cena'],
  }),
  crear('pan-sin-gluten', 'Pan sin gluten', 'carbohidrato', 'vegetal', {
    kcal: 248, prot: 4.5, carb: 46, gras: 4.5, sat: 0.8, fibra: 4.5, sodio: 420,
    ig: 'alto', racion: [30, 120, 10],
    momentos: ['desayuno', 'media_manana', 'merienda', 'cena'],
  }),
  crear('pan-centeno', 'Pan de centeno', 'carbohidrato', 'vegetal', {
    kcal: 259, prot: 8.5, carb: 48, gras: 3.3, sat: 0.6, fibra: 5.8, sodio: 603,
    contiene: ['gluten'], ig: 'bajo', fodmap: 'alto', racion: [30, 100, 10],
    momentos: ['desayuno', 'merienda', 'cena'],
  }),
  crear('tortitas-maiz', 'Tortitas de maíz', 'carbohidrato', 'vegetal', {
    kcal: 387, prot: 8, carb: 78, gras: 3, sat: 0.5, fibra: 3, sodio: 30,
    ig: 'alto', racion: [15, 60, 5], momentos: ['media_manana', 'merienda'],
  }),

  // ----------------------------------------------------------------- Verduras
  crear('brocoli', 'Brócoli', 'verdura', 'vegetal', {
    kcal: 34, prot: 2.8, carb: 3.5, gras: 0.4, sat: 0.1, fibra: 2.6, sodio: 33,
    ig: 'bajo', potasio: 'alto', racion: [100, 300, 25], momentos: ['almuerzo', 'cena'],
  }),
  crear('espinacas', 'Espinacas', 'verdura', 'vegetal', {
    kcal: 23, prot: 2.9, carb: 1.4, gras: 0.4, sat: 0.1, fibra: 2.2, sodio: 79,
    ig: 'bajo', potasio: 'alto', racion: [100, 250, 25], momentos: ['almuerzo', 'cena'],
  }),
  crear('calabacin', 'Calabacín', 'verdura', 'vegetal', {
    kcal: 17, prot: 1.2, carb: 2.1, gras: 0.3, sat: 0.1, fibra: 1, sodio: 8,
    ig: 'bajo', racion: [100, 300, 25], momentos: ['almuerzo', 'cena'],
  }),
  crear('berenjena', 'Berenjena', 'verdura', 'vegetal', {
    kcal: 25, prot: 1, carb: 3.5, gras: 0.2, sat: 0, fibra: 3, sodio: 2,
    ig: 'bajo', racion: [100, 250, 25], momentos: ['almuerzo', 'cena'],
  }),
  crear('pimiento', 'Pimiento', 'verdura', 'vegetal', {
    kcal: 31, prot: 1, carb: 4.6, gras: 0.3, sat: 0.1, fibra: 2.1, sodio: 4,
    ig: 'bajo', racion: [100, 250, 25], momentos: ['almuerzo', 'cena'],
  }),
  crear('tomate', 'Tomate', 'verdura', 'vegetal', {
    kcal: 18, prot: 0.9, carb: 2.6, gras: 0.2, sat: 0, fibra: 1.2, sodio: 5,
    ig: 'bajo', racion: [100, 300, 25], momentos: ['desayuno', 'almuerzo', 'cena'],
  }),
  crear('lechuga', 'Lechuga y canónigos', 'verdura', 'vegetal', {
    kcal: 15, prot: 1.4, carb: 1.2, gras: 0.2, sat: 0, fibra: 1.3, sodio: 28,
    ig: 'bajo', racion: [60, 200, 20], momentos: ['almuerzo', 'cena'],
  }),
  crear('zanahoria', 'Zanahoria', 'verdura', 'vegetal', {
    kcal: 41, prot: 0.9, carb: 6.8, gras: 0.2, sat: 0, fibra: 2.8, sodio: 69,
    ig: 'bajo', racion: [80, 200, 20], momentos: ['almuerzo', 'cena', 'media_manana'],
  }),
  crear('judias-verdes', 'Judías verdes', 'verdura', 'vegetal', {
    kcal: 31, prot: 1.8, carb: 3.6, gras: 0.2, sat: 0, fibra: 2.7, sodio: 6,
    ig: 'bajo', racion: [100, 300, 25], momentos: ['almuerzo', 'cena'],
  }),
  crear('coliflor', 'Coliflor', 'verdura', 'vegetal', {
    kcal: 25, prot: 1.9, carb: 3, gras: 0.3, sat: 0.1, fibra: 2, sodio: 30,
    ig: 'bajo', fodmap: 'alto', racion: [100, 300, 25], momentos: ['almuerzo', 'cena'],
  }),
  crear('champinones', 'Champiñones', 'verdura', 'vegetal', {
    kcal: 22, prot: 3.1, carb: 1, gras: 0.3, sat: 0, fibra: 1, sodio: 5,
    ig: 'bajo', purinas: 'alto', fodmap: 'alto', racion: [80, 250, 25],
    momentos: ['almuerzo', 'cena'],
  }),
  crear('pepino', 'Pepino', 'verdura', 'vegetal', {
    kcal: 15, prot: 0.7, carb: 2, gras: 0.1, sat: 0, fibra: 0.7, sodio: 2,
    ig: 'bajo', racion: [80, 250, 25], momentos: ['almuerzo', 'cena'],
  }),
  crear('esparragos', 'Espárragos verdes', 'verdura', 'vegetal', {
    kcal: 20, prot: 2.2, carb: 2, gras: 0.1, sat: 0, fibra: 2.1, sodio: 2,
    ig: 'bajo', purinas: 'alto', fodmap: 'alto', racion: [100, 250, 25],
    momentos: ['almuerzo', 'cena'],
  }),
  crear('calabaza', 'Calabaza', 'verdura', 'vegetal', {
    kcal: 26, prot: 1, carb: 4.9, gras: 0.1, sat: 0, fibra: 0.5, sodio: 1,
    ig: 'medio', racion: [100, 300, 25], momentos: ['almuerzo', 'cena'],
  }),

  // ------------------------------------------------------------------- Frutas
  crear('platano', 'Plátano', 'fruta', 'vegetal', {
    kcal: 89, prot: 1.1, carb: 20.2, gras: 0.3, sat: 0.1, fibra: 2.6, sodio: 1,
    ig: 'medio', potasio: 'alto', racion: [80, 200, 20],
    momentos: ['desayuno', 'media_manana', 'merienda'],
  }),
  crear('manzana', 'Manzana', 'fruta', 'vegetal', {
    kcal: 52, prot: 0.3, carb: 12, gras: 0.2, sat: 0, fibra: 2.4, sodio: 1,
    ig: 'bajo', fodmap: 'alto', racion: [100, 250, 25],
    momentos: ['desayuno', 'media_manana', 'merienda'],
  }),
  crear('pera', 'Pera', 'fruta', 'vegetal', {
    kcal: 57, prot: 0.4, carb: 12.7, gras: 0.1, sat: 0, fibra: 3.1, sodio: 1,
    ig: 'bajo', fodmap: 'alto', racion: [100, 250, 25],
    momentos: ['desayuno', 'media_manana', 'merienda'],
  }),
  crear('naranja', 'Naranja', 'fruta', 'vegetal', {
    kcal: 47, prot: 0.9, carb: 9.4, gras: 0.1, sat: 0, fibra: 2.4, sodio: 0,
    ig: 'bajo', racion: [120, 300, 25], momentos: ['desayuno', 'media_manana', 'merienda'],
  }),
  crear('mandarina', 'Mandarina', 'fruta', 'vegetal', {
    kcal: 53, prot: 0.8, carb: 11.5, gras: 0.3, sat: 0, fibra: 1.8, sodio: 2,
    ig: 'bajo', racion: [100, 250, 25], momentos: ['media_manana', 'merienda'],
  }),
  crear('fresas', 'Fresas', 'fruta', 'vegetal', {
    kcal: 32, prot: 0.7, carb: 5.5, gras: 0.3, sat: 0, fibra: 2, sodio: 1,
    ig: 'bajo', racion: [100, 300, 25], momentos: ['desayuno', 'merienda'],
  }),
  crear('arandanos', 'Arándanos', 'fruta', 'vegetal', {
    kcal: 57, prot: 0.7, carb: 12.1, gras: 0.3, sat: 0, fibra: 2.4, sodio: 1,
    ig: 'bajo', racion: [60, 150, 10], momentos: ['desayuno', 'merienda'],
  }),
  crear('kiwi', 'Kiwi', 'fruta', 'vegetal', {
    kcal: 61, prot: 1.1, carb: 10.5, gras: 0.5, sat: 0, fibra: 3, sodio: 3,
    ig: 'bajo', racion: [100, 250, 25], momentos: ['desayuno', 'media_manana', 'merienda'],
  }),
  crear('pina', 'Piña', 'fruta', 'vegetal', {
    kcal: 50, prot: 0.5, carb: 11.5, gras: 0.1, sat: 0, fibra: 1.4, sodio: 1,
    ig: 'medio', racion: [100, 250, 25], momentos: ['media_manana', 'merienda'],
  }),
  crear('melon', 'Melón', 'fruta', 'vegetal', {
    kcal: 34, prot: 0.8, carb: 7.9, gras: 0.2, sat: 0, fibra: 0.9, sodio: 16,
    ig: 'alto', racion: [150, 350, 25], momentos: ['media_manana', 'merienda'],
  }),
  crear('uvas', 'Uvas', 'fruta', 'vegetal', {
    kcal: 69, prot: 0.7, carb: 16, gras: 0.2, sat: 0, fibra: 0.9, sodio: 2,
    ig: 'medio', racion: [80, 200, 20], momentos: ['media_manana', 'merienda'],
  }),

  // ------------------------------------------------------------------- Grasas
  crear('aceite-oliva', 'Aceite de oliva virgen extra', 'grasa', 'vegetal', {
    kcal: 884, prot: 0, carb: 0, gras: 100, sat: 14, fibra: 0, sodio: 2,
    ig: 'bajo', racion: [5, 30, 5], momentos: TODAS,
  }),
  crear('aguacate', 'Aguacate', 'grasa', 'vegetal', {
    kcal: 160, prot: 2, carb: 1.8, gras: 14.7, sat: 2.1, fibra: 6.7, sodio: 7,
    ig: 'bajo', potasio: 'alto', fodmap: 'alto', racion: [40, 150, 10],
    momentos: ['desayuno', 'almuerzo', 'cena'],
  }),
  crear('aceitunas', 'Aceitunas', 'grasa', 'vegetal', {
    kcal: 145, prot: 1, carb: 3.8, gras: 15, sat: 2, fibra: 3.3, sodio: 1550,
    ig: 'bajo', racion: [20, 40, 5], momentos: ['media_manana', 'almuerzo', 'cena'],
  }),
  crear('nueces', 'Nueces', 'grasa', 'vegetal', {
    kcal: 654, prot: 15, carb: 7, gras: 65, sat: 6.1, fibra: 6.7, sodio: 2,
    contiene: ['frutosSecos'], ig: 'bajo', racion: [10, 40, 5],
    momentos: ['desayuno', 'media_manana', 'merienda'],
  }),
  crear('almendras', 'Almendras', 'grasa', 'vegetal', {
    kcal: 579, prot: 21, carb: 9.6, gras: 50, sat: 3.8, fibra: 12.5, sodio: 1,
    contiene: ['frutosSecos'], ig: 'bajo', fodmap: 'alto', racion: [10, 40, 5],
    momentos: ['desayuno', 'media_manana', 'merienda'],
  }),
  crear('pistachos', 'Pistachos', 'grasa', 'vegetal', {
    kcal: 562, prot: 20, carb: 17, gras: 45, sat: 5.6, fibra: 10.3, sodio: 6,
    contiene: ['frutosSecos'], ig: 'bajo', fodmap: 'alto', racion: [10, 40, 5],
    momentos: ['media_manana', 'merienda'],
  }),
  crear('crema-cacahuete', 'Crema de cacahuete', 'grasa', 'vegetal', {
    kcal: 588, prot: 25, carb: 20, gras: 50, sat: 10, fibra: 6, sodio: 17,
    contiene: ['frutosSecos'], ig: 'bajo', racion: [10, 35, 5],
    momentos: ['desayuno', 'merienda'],
  }),
  crear('semillas-chia', 'Semillas de chía', 'grasa', 'vegetal', {
    kcal: 486, prot: 17, carb: 7.7, gras: 31, sat: 3.3, fibra: 34, sodio: 16,
    ig: 'bajo', racion: [5, 25, 5], momentos: ['desayuno', 'merienda'],
  }),
  crear('semillas-calabaza', 'Semillas de calabaza', 'grasa', 'vegetal', {
    kcal: 559, prot: 30, carb: 10.7, gras: 49, sat: 8.7, fibra: 6, sodio: 7,
    ig: 'bajo', racion: [10, 30, 5], momentos: ['media_manana', 'merienda', 'almuerzo'],
  }),
  crear('chocolate-negro', 'Chocolate negro 85%', 'grasa', 'vegetal', {
    kcal: 592, prot: 10, carb: 19, gras: 50, sat: 30, fibra: 11, sodio: 20,
    ig: 'bajo', racion: [10, 30, 5], momentos: ['merienda'],
  }),
]

/** Índice por id para resolver los alimentos guardados dentro de un plan. */
export const ALIMENTOS_POR_ID = Object.fromEntries(ALIMENTOS.map((x) => [x.id, x]))

export function obtenerAlimentoBase(id) {
  return ALIMENTOS_POR_ID[id] ?? null
}

/**
 * Rellena los valores por defecto para no repetirlos en cada entrada.
 * `racion` llega como [minimo, maximo, paso] en gramos.
 */
function crear(id, nombre, rol, origen, datos) {
  const [min, max, paso] = datos.racion
  return {
    id,
    nombre,
    rol,
    origen,
    kcal: datos.kcal,
    proteinas: datos.prot,
    carbohidratos: datos.carb,
    grasas: datos.gras,
    saturadas: datos.sat ?? 0,
    fibra: datos.fibra ?? 0,
    sodio: datos.sodio ?? 0,
    contiene: datos.contiene ?? [],
    ig: datos.ig ?? 'medio',
    purinas: datos.purinas ?? 'bajo',
    potasio: datos.potasio ?? 'medio',
    fodmap: datos.fodmap ?? 'bajo',
    racion: { min, max, paso },
    momentos: datos.momentos ?? TODAS,
  }
}
